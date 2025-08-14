#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Secure workspace injection system with templates and rollback mechanism
 * Implements requirements 4.2, 4.3, 4.4 from the modular monorepo architecture spec
 */
class SecureWorkspaceInjector {
  constructor() {
    this.rootDir = process.cwd();
    this.rootPackagePath = path.join(this.rootDir, 'package.json');
    this.turboConfigPath = path.join(this.rootDir, 'turbo.json');
    this.templatesDir = path.join(this.rootDir, 'scripts', 'templates');
    this.backupDir = path.join(this.rootDir, '.workspace-injection-backup');
    
    // Reserved workspace names that cannot be used
    this.reservedNames = [
      'core', 'scripts', 'node_modules', 'dist', 'build', 
      '.git', '.turbo', '.next', 'coverage', 'public'
    ];
    
    // Valid workspace types with their templates
    this.validTypes = ['web', 'mobile', 'service', 'library'];
  }

  /**
   * Main injection method
   */
  async injectWorkspace(workspaceName, workspaceType = 'library', options = {}) {
    try {
      console.log(`🚀 Starting workspace injection: ${workspaceName} (${workspaceType})`);
      
      // Validation phase
      await this.validateWorkspaceName(workspaceName);
      await this.validateWorkspaceType(workspaceType);
      await this.validateExistingWorkspace(workspaceName);
      
      // Create backup before making changes
      await this.createBackup();
      
      // Create workspace directory and files
      const workspacePath = path.join(this.rootDir, 'workspaces', workspaceName);
      await this.createWorkspaceFromTemplate(workspacePath, workspaceName, workspaceType, options);
      
      // Update root configuration files
      await this.updateRootPackageJson(workspaceName);
      await this.updateTurboConfig(workspaceName, workspaceType);
      
      // Install dependencies
      if (!options.skipInstall) {
        await this.installDependencies(workspaceName);
      }
      
      // Clean up backup on success
      await this.cleanupBackup();
      
      console.log(`✅ Successfully injected workspace: ${workspaceName}`);
      console.log(`📁 Workspace created at: workspaces/${workspaceName}`);
      console.log(`🔧 Run 'npm run dev:${workspaceName}' to start development`);
      
    } catch (error) {
      console.error(`❌ Error injecting workspace: ${error.message}`);
      await this.rollback();
      process.exit(1);
    }
  }

  /**
   * Validate workspace name format and security
   */
  async validateWorkspaceName(name) {
    // Check format: lowercase letters, numbers, hyphens only, must start with letter
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      throw new Error(
        "Invalid workspace name format. Must start with a letter and contain only lowercase letters, numbers, and hyphens."
      );
    }
    
    // Check length
    if (name.length < 2 || name.length > 50) {
      throw new Error("Workspace name must be between 2 and 50 characters long.");
    }
    
    // Check for reserved names
    if (this.reservedNames.includes(name)) {
      throw new Error(`"${name}" is a reserved workspace name and cannot be used.`);
    }
    
    // Check for path traversal attempts
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new Error("Workspace name cannot contain path traversal characters.");
    }
  }

  /**
   * Validate workspace type
   */
  async validateWorkspaceType(type) {
    if (!this.validTypes.includes(type)) {
      throw new Error(
        `Invalid workspace type "${type}". Valid types are: ${this.validTypes.join(', ')}`
      );
    }
  }

  /**
   * Check if workspace already exists
   */
  async validateExistingWorkspace(name) {
    const workspacePath = path.join(this.rootDir, 'workspaces', name);
    if (fs.existsSync(workspacePath)) {
      throw new Error(`Workspace "${name}" already exists at ${workspacePath}`);
    }
    
    // Check if name conflicts with existing package.json workspaces
    const rootPackage = JSON.parse(fs.readFileSync(this.rootPackagePath, 'utf8'));
    const existingWorkspaces = rootPackage.workspaces || [];
    
    if (existingWorkspaces.some(ws => ws.includes(name))) {
      throw new Error(`Workspace name "${name}" conflicts with existing workspace configuration`);
    }
  }

  /**
   * Create backup of configuration files
   */
  async createBackup() {
    if (fs.existsSync(this.backupDir)) {
      fs.rmSync(this.backupDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(this.backupDir, { recursive: true });
    
    // Backup package.json
    fs.copyFileSync(this.rootPackagePath, path.join(this.backupDir, 'package.json'));
    
    // Backup turbo.json
    fs.copyFileSync(this.turboConfigPath, path.join(this.backupDir, 'turbo.json'));
    
    console.log('📦 Created configuration backup');
  }

  /**
   * Create workspace from template
   */
  async createWorkspaceFromTemplate(workspacePath, workspaceName, workspaceType, options) {
    const templatePath = path.join(this.templatesDir, workspaceType);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template for workspace type "${workspaceType}" not found at ${templatePath}`);
    }
    
    // Create workspace directory
    fs.mkdirSync(workspacePath, { recursive: true });
    
    // Copy template files
    await this.copyTemplateFiles(templatePath, workspacePath, workspaceName, workspaceType, options);
    
    console.log(`📁 Created workspace from ${workspaceType} template`);
  }

  /**
   * Recursively copy template files with variable substitution
   */
  async copyTemplateFiles(templatePath, workspacePath, workspaceName, workspaceType, options) {
    const templateFiles = fs.readdirSync(templatePath, { withFileTypes: true });
    
    for (const file of templateFiles) {
      const srcPath = path.join(templatePath, file.name);
      const destPath = path.join(workspacePath, file.name);
      
      if (file.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await this.copyTemplateFiles(srcPath, destPath, workspaceName, workspaceType, options);
      } else {
        let content = fs.readFileSync(srcPath, 'utf8');
        
        // Perform variable substitution
        content = this.substituteTemplateVariables(content, workspaceName, workspaceType, options);
        
        fs.writeFileSync(destPath, content);
      }
    }
  }

  /**
   * Substitute template variables in file content
   */
  substituteTemplateVariables(content, workspaceName, workspaceType, options) {
    const variables = {
      '{{WORKSPACE_NAME}}': workspaceName,
      '{{WORKSPACE_TYPE}}': workspaceType,
      '{{PACKAGE_NAME}}': `@modular-ai-scaffold/${workspaceName}`,
      '{{DESCRIPTION}}': options.description || `${workspaceType} workspace for ${workspaceName}`,
      '{{AUTHOR}}': options.author || 'Your Name',
      '{{VERSION}}': options.version || '0.1.0'
    };
    
    let result = content;
    for (const [placeholder, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  }

  /**
   * Update root package.json with new workspace
   */
  async updateRootPackageJson(workspaceName) {
    const pkg = JSON.parse(fs.readFileSync(this.rootPackagePath, 'utf8'));
    
    // Add to workspaces array if not already present
    if (!pkg.workspaces.includes(`workspaces/${workspaceName}`)) {
      pkg.workspaces.push(`workspaces/${workspaceName}`);
      pkg.workspaces.sort(); // Keep workspaces sorted
    }
    
    // Add scoped scripts
    pkg.scripts[`dev:${workspaceName}`] = `turbo run dev --filter=${workspaceName}`;
    pkg.scripts[`build:${workspaceName}`] = `turbo run build --filter=${workspaceName}`;
    pkg.scripts[`test:${workspaceName}`] = `turbo run test --filter=${workspaceName}`;
    
    fs.writeFileSync(this.rootPackagePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('📝 Updated root package.json');
  }

  /**
   * Update turbo.json with workspace-specific pipeline tasks
   */
  async updateTurboConfig(workspaceName, workspaceType) {
    const turbo = JSON.parse(fs.readFileSync(this.turboConfigPath, 'utf8'));
    
    // Get template-specific turbo configuration
    const pipelineConfig = this.getTurboPipelineConfig(workspaceType);
    
    // Add workspace-specific pipeline tasks
    turbo.pipeline[`dev:${workspaceName}`] = {
      cache: true,
      persistent: true,
      dependsOn: ["^build:core"],
      ...pipelineConfig.dev
    };
    
    turbo.pipeline[`build:${workspaceName}`] = {
      dependsOn: ["^build"],
      ...pipelineConfig.build
    };
    
    turbo.pipeline[`test:${workspaceName}`] = {
      dependsOn: [],
      cache: true,
      outputs: ["coverage/**"],
      ...pipelineConfig.test
    };
    
    fs.writeFileSync(this.turboConfigPath, JSON.stringify(turbo, null, 2) + '\n');
    console.log('⚡ Updated turbo.json configuration');
  }

  /**
   * Get turbo pipeline configuration based on workspace type
   */
  getTurboPipelineConfig(workspaceType) {
    const configs = {
      web: {
        dev: {
          outputs: [".next/**"],
          env: ["ENABLE_SUPABASE", "ENABLE_DATABASE", "NEXT_PUBLIC_*"]
        },
        build: {
          outputs: [".next/**", "out/**"]
        },
        test: {
          outputs: ["coverage/**", ".next/**"]
        }
      },
      mobile: {
        dev: {
          outputs: ["dist/**", ".expo/**"],
          env: ["ENABLE_SUPABASE", "EXPO_*"]
        },
        build: {
          outputs: ["dist/**", ".expo/**", "build/**"]
        },
        test: {
          outputs: ["coverage/**"]
        }
      },
      service: {
        dev: {
          outputs: ["__pycache__/**", "dist/**"],
          env: ["DATABASE_URL", "ENABLE_*"]
        },
        build: {
          outputs: ["__pycache__/**", "dist/**"]
        },
        test: {
          outputs: ["coverage/**", "__pycache__/**"]
        }
      },
      library: {
        dev: {
          outputs: ["dist/**"]
        },
        build: {
          outputs: ["dist/**"]
        },
        test: {
          outputs: ["coverage/**"]
        }
      }
    };
    
    return configs[workspaceType] || configs.library;
  }

  /**
   * Install dependencies for the new workspace
   */
  async installDependencies(workspaceName) {
    try {
      console.log('📦 Installing dependencies...');
      execSync(`npm install --workspace=workspaces/${workspaceName}`, {
        stdio: 'inherit',
        cwd: this.rootDir
      });
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.warn('⚠️  Warning: Failed to install dependencies automatically');
      console.log(`Run 'npm install --workspace=workspaces/${workspaceName}' manually`);
    }
  }

  /**
   * Clean up backup files after successful injection
   */
  async cleanupBackup() {
    if (fs.existsSync(this.backupDir)) {
      fs.rmSync(this.backupDir, { recursive: true, force: true });
    }
  }

  /**
   * Rollback changes if injection fails
   */
  async rollback() {
    console.log('🔄 Rolling back changes...');
    
    try {
      if (fs.existsSync(this.backupDir)) {
        // Restore package.json
        const backupPackagePath = path.join(this.backupDir, 'package.json');
        if (fs.existsSync(backupPackagePath)) {
          fs.copyFileSync(backupPackagePath, this.rootPackagePath);
        }
        
        // Restore turbo.json
        const backupTurboPath = path.join(this.backupDir, 'turbo.json');
        if (fs.existsSync(backupTurboPath)) {
          fs.copyFileSync(backupTurboPath, this.turboConfigPath);
        }
        
        // Clean up backup
        fs.rmSync(this.backupDir, { recursive: true, force: true });
        
        console.log('✅ Successfully rolled back configuration changes');
      }
    } catch (rollbackError) {
      console.error('❌ Failed to rollback changes:', rollbackError.message);
      console.log('💡 Manual cleanup may be required');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Workspace Injection Tool

Usage: npm run inject-workspace <name> [type] [options]

Arguments:
  name        Workspace name (required) - lowercase letters, numbers, hyphens only
  type        Workspace type (optional) - web, mobile, service, library (default: library)

Options:
  --skip-install    Skip automatic dependency installation
  --description     Custom description for the workspace
  --author          Author name for package.json
  --version         Initial version (default: 0.1.0)

Examples:
  npm run inject-workspace my-api service
  npm run inject-workspace my-dashboard web --description "Admin dashboard"
  npm run inject-workspace my-lib library --skip-install

Valid workspace types:
  web       - Next.js web application
  mobile    - React Native/Expo mobile app  
  service   - Backend service (Python/Node.js)
  library   - Shared library/utilities
`);
    return;
  }
  
  const workspaceName = args[0];
  const workspaceType = args[1] || 'library';
  
  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--skip-install') {
      options.skipInstall = true;
    } else if (arg === '--description' && args[i + 1]) {
      options.description = args[++i];
    } else if (arg === '--author' && args[i + 1]) {
      options.author = args[++i];
    } else if (arg === '--version' && args[i + 1]) {
      options.version = args[++i];
    }
  }
  
  const injector = new SecureWorkspaceInjector();
  await injector.injectWorkspace(workspaceName, workspaceType, options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { SecureWorkspaceInjector };