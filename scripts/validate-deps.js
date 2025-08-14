#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DependencyValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.workspacesDir = path.join(process.cwd(), 'workspaces');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async validateWorkspace(workspaceName) {
    const workspacePath = path.join(this.workspacesDir, workspaceName);
    const packageJsonPath = path.join(workspacePath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      this.warnings.push(`No package.json found in ${workspaceName}`);
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Validate required scripts
      await this.validateScripts(workspaceName, packageJson);
      
      // Validate dependencies
      await this.validateDependencies(workspaceName, packageJson);
      
      // Validate peer dependencies
      await this.validatePeerDependencies(workspaceName, packageJson);
      
      // Validate workspace-specific requirements
      await this.validateWorkspaceSpecific(workspaceName, packageJson, workspacePath);
      
    } catch (error) {
      this.errors.push(`Failed to validate ${workspaceName}: ${error.message}`);
    }
  }

  async validateScripts(workspaceName, packageJson) {
    const requiredScripts = ['build', 'test'];
    const recommendedScripts = ['dev', 'lint', 'type-check'];
    
    const scripts = packageJson.scripts || {};
    
    for (const script of requiredScripts) {
      if (!scripts[script]) {
        this.errors.push(`${workspaceName}: Missing required script '${script}'`);
      }
    }
    
    for (const script of recommendedScripts) {
      if (!scripts[script]) {
        this.warnings.push(`${workspaceName}: Missing recommended script '${script}'`);
      }
    }
  }

  async validateDependencies(workspaceName, packageJson) {
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    const peerDeps = packageJson.peerDependencies || {};
    
    // Check for common issues
    const allDeps = { ...deps, ...devDeps, ...peerDeps };
    
    // Validate TypeScript setup
    if (allDeps.typescript && !allDeps['@types/node']) {
      this.warnings.push(`${workspaceName}: Has TypeScript but missing @types/node`);
    }
    
    // Validate test setup
    if (allDeps.vitest && !devDeps['@vitejs/plugin-react'] && (workspaceName === 'web' || workspaceName === 'mobile')) {
      this.warnings.push(`${workspaceName}: React workspace with Vitest but missing @vitejs/plugin-react`);
    }
    
    // Check for conflicting test frameworks
    if (allDeps.vitest && allDeps.jest) {
      this.warnings.push(`${workspaceName}: Has both Vitest and Jest - consider standardizing`);
    }
  }

  async validatePeerDependencies(workspaceName, packageJson) {
    const peerDeps = packageJson.peerDependencies || {};
    const peerDepsMeta = packageJson.peerDependenciesMeta || {};
    
    // Validate that optional peer deps are marked as optional
    for (const [dep, version] of Object.entries(peerDeps)) {
      if (dep.includes('supabase') || dep.includes('prisma')) {
        if (!peerDepsMeta[dep]?.optional) {
          this.warnings.push(`${workspaceName}: ${dep} should be marked as optional peer dependency`);
        }
      }
    }
  }

  async validateWorkspaceSpecific(workspaceName, packageJson, workspacePath) {
    // Validate test configuration exists
    const testConfigs = ['vitest.config.ts', 'vitest.config.js', 'jest.config.js', 'jest.config.ts'];
    const hasTestConfig = testConfigs.some(config => 
      fs.existsSync(path.join(workspacePath, config))
    );
    
    if (!hasTestConfig && packageJson.scripts?.test) {
      this.warnings.push(`${workspaceName}: Has test script but no test configuration file`);
    }
    
    // Validate TypeScript configuration
    if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
      if (!fs.existsSync(path.join(workspacePath, 'tsconfig.json'))) {
        this.errors.push(`${workspaceName}: Has TypeScript dependency but no tsconfig.json`);
      }
    }
    
    // Validate workspace-specific requirements
    switch (workspaceName) {
      case 'web':
        await this.validateWebWorkspace(workspaceName, packageJson, workspacePath);
        break;
      case 'mobile':
        await this.validateMobileWorkspace(workspaceName, packageJson, workspacePath);
        break;
      case 'backend':
        await this.validateBackendWorkspace(workspaceName, packageJson, workspacePath);
        break;
    }
  }

  async validateWebWorkspace(workspaceName, packageJson, workspacePath) {
    // Check for Next.js specific requirements
    if (packageJson.dependencies?.next) {
      if (!fs.existsSync(path.join(workspacePath, 'next.config.js'))) {
        this.warnings.push(`${workspaceName}: Next.js app without next.config.js`);
      }
    }
    
    // Check for Tailwind setup
    if (packageJson.devDependencies?.tailwindcss) {
      if (!fs.existsSync(path.join(workspacePath, 'tailwind.config.js'))) {
        this.warnings.push(`${workspaceName}: Has Tailwind but no tailwind.config.js`);
      }
    }
  }

  async validateMobileWorkspace(workspaceName, packageJson, workspacePath) {
    // Check for Expo specific requirements
    if (packageJson.dependencies?.expo) {
      if (!fs.existsSync(path.join(workspacePath, 'app.json'))) {
        this.errors.push(`${workspaceName}: Expo app without app.json`);
      }
    }
  }

  async validateBackendWorkspace(workspaceName, packageJson, workspacePath) {
    // Check for Python requirements
    if (!fs.existsSync(path.join(workspacePath, 'requirements.txt'))) {
      this.warnings.push(`${workspaceName}: Python workspace without requirements.txt`);
    }
    
    // Check for Prisma setup
    if (packageJson.dependencies?.prisma || packageJson.optionalDependencies?.['@prisma/client']) {
      if (!fs.existsSync(path.join(workspacePath, 'prisma'))) {
        this.warnings.push(`${workspaceName}: Has Prisma dependency but no prisma directory`);
      }
    }
  }

  async validateCrossWorkspaceDependencies() {
    this.log('Validating cross-workspace dependencies...');
    
    const workspaces = fs.readdirSync(this.workspacesDir)
      .filter(name => fs.statSync(path.join(this.workspacesDir, name)).isDirectory());
    
    const workspacePackages = new Map();
    
    // Collect all workspace packages
    for (const workspace of workspaces) {
      const packageJsonPath = path.join(this.workspacesDir, workspace, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        workspacePackages.set(packageJson.name, workspace);
      }
    }
    
    // Check for proper workspace dependencies
    for (const workspace of workspaces) {
      const packageJsonPath = path.join(this.workspacesDir, workspace, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies
        };
        
        for (const [depName, version] of Object.entries(allDeps)) {
          if (workspacePackages.has(depName)) {
            if (!version.startsWith('workspace:')) {
              this.warnings.push(`${workspace}: Should use 'workspace:*' for internal dependency ${depName}`);
            }
          }
        }
      }
    }
  }

  async run() {
    this.log('Starting dependency validation...');
    
    const workspaces = fs.readdirSync(this.workspacesDir)
      .filter(name => fs.statSync(path.join(this.workspacesDir, name)).isDirectory());
    
    for (const workspace of workspaces) {
      this.log(`Validating workspace: ${workspace}`);
      await this.validateWorkspace(workspace);
    }
    
    await this.validateCrossWorkspaceDependencies();
    
    // Report results
    this.log(`\n📊 Validation Summary:`);
    this.log(`   Workspaces checked: ${workspaces.length}`);
    this.log(`   Warnings: ${this.warnings.length}`);
    this.log(`   Errors: ${this.errors.length}`);
    
    if (this.warnings.length > 0) {
      this.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => this.log(`   ${warning}`, 'warning'));
    }
    
    if (this.errors.length > 0) {
      this.log('\n❌ Errors:');
      this.errors.forEach(error => this.log(`   ${error}`, 'error'));
      process.exit(1);
    }
    
    this.log('\n✅ Dependency validation completed successfully!');
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new DependencyValidator();
  validator.run().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = DependencyValidator;