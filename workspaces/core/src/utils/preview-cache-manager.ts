/**
 * PreviewCacheManager - Enhanced caching system for preview and MCP servers
 * 
 * Provides workspace-specific cache keys, git diff-based change detection,
 * and environment variable validation for modular monorepo architecture.
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

import type { WorkspaceConfig, CacheEntry } from '../types';

export interface ChangeDetectionResult {
  changedWorkspaces: string[];
  changedFiles: string[];
  requiresFullRebuild: boolean;
}

export class PreviewCacheManager {
  private cacheDir: string;
  private workspaceRoot: string;
  private ttlDays: number;

  constructor(cacheDir: string = '/mnt/preview_cache', workspaceRoot: string = process.cwd(), ttlDays: number = 14) {
    this.cacheDir = resolve(cacheDir);
    this.workspaceRoot = resolve(workspaceRoot);
    this.ttlDays = ttlDays;
    
    // Ensure cache directory exists
    this.ensureDirectory(this.cacheDir);
  }

  /**
   * Generate workspace-specific cache key based on dependencies and configuration
   */
  getWorkspaceCacheKey(workspacePath: string): string {
    const keyComponents: string[] = [];
    const workspaceDir = resolve(this.workspaceRoot, workspacePath);

    // Package manager lockfiles (highest priority)
    const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
    for (const lockfile of lockfiles) {
      const lockfilePath = join(workspaceDir, lockfile);
      if (existsSync(lockfilePath)) {
        const content = readFileSync(lockfilePath);
        const hash = createHash('sha1').update(content).digest('hex').substring(0, 8);
        keyComponents.push(hash);
        break; // Use first found lockfile
      }
    }

    // Node version from .nvmrc or package.json engines
    const nvmrcPath = join(workspaceDir, '.nvmrc');
    if (existsSync(nvmrcPath)) {
      const nodeVersion = readFileSync(nvmrcPath, 'utf8').trim();
      keyComponents.push(nodeVersion);
    } else {
      // Check package.json engines
      const packageJsonPath = join(workspaceDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
          const nodeVersion = pkg.engines?.node;
          if (nodeVersion) {
            keyComponents.push(nodeVersion);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      }
    }

    // Workspace-specific dependencies hash
    const packageJsonPath = join(workspaceDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const depsHash = createHash('sha1')
          .update(JSON.stringify(deps, Object.keys(deps).sort()))
          .digest('hex')
          .substring(0, 8);
        keyComponents.push(depsHash);
      } catch (error) {
        // Fallback to file hash if parsing fails
        const content = readFileSync(packageJsonPath);
        const hash = createHash('sha1').update(content).digest('hex').substring(0, 8);
        keyComponents.push(hash);
      }
    }

    // Environment-specific configurations
    const configFiles = ['next.config.js', 'vite.config.ts', 'tsconfig.json'];
    for (const configFile of configFiles) {
      const configPath = join(workspaceDir, configFile);
      if (existsSync(configPath)) {
        const content = readFileSync(configPath);
        const hash = createHash('sha1').update(content).digest('hex').substring(0, 4);
        keyComponents.push(hash);
      }
    }

    return keyComponents.join('-') || 'default';
  }

  /**
   * Detect changes using git diff for incremental builds
   */
  detectChanges(baseRef: string = 'HEAD~1'): ChangeDetectionResult {
    const result: ChangeDetectionResult = {
      changedWorkspaces: [],
      changedFiles: [],
      requiresFullRebuild: false
    };

    try {
      // Get changed files using git diff
      const gitDiffOutput = execSync(
        `git diff --name-only ${baseRef} HEAD`,
        { cwd: this.workspaceRoot, encoding: 'utf8' }
      ).trim();

      if (!gitDiffOutput) {
        return result; // No changes detected
      }

      result.changedFiles = gitDiffOutput.split('\n').filter(Boolean);

      // Detect changed workspaces
      const changedWorkspaces = new Set<string>();
      const rootConfigFiles = ['package.json', 'turbo.json', '.env', '.env.example'];

      for (const file of result.changedFiles) {
        // Check if root configuration files changed (requires full rebuild)
        if (rootConfigFiles.some(config => file === config)) {
          result.requiresFullRebuild = true;
        }

        // Detect workspace changes
        if (file.startsWith('workspaces/')) {
          const pathParts = file.split('/');
          if (pathParts.length >= 2) {
            const workspace = pathParts[1];
            changedWorkspaces.add(workspace);
          }
        }

        // Check for shared dependency changes
        if (file.includes('package-lock.json') || file.includes('yarn.lock') || file.includes('pnpm-lock.yaml')) {
          result.requiresFullRebuild = true;
        }
      }

      result.changedWorkspaces = Array.from(changedWorkspaces);

    } catch (error) {
      console.warn('Git diff failed, assuming full rebuild required:', error);
      result.requiresFullRebuild = true;
    }

    return result;
  }

  /**
   * Restore cached artifacts for a specific workspace
   */
  restoreWorkspaceCache(workspacePath: string): boolean {
    const cacheKey = this.getWorkspaceCacheKey(workspacePath);
    const cachePath = join(this.cacheDir, cacheKey);
    const workspaceDir = resolve(this.workspaceRoot, workspacePath);

    if (!existsSync(cachePath)) {
      console.log(`No cache found for workspace ${workspacePath} (key: ${cacheKey})`);
      return false;
    }

    console.log(`Restoring cache for workspace ${workspacePath} from ${cachePath}`);

    let restored = false;
    const artifacts = ['node_modules', '.next', 'dist', 'build', '.turbo'];

    for (const artifact of artifacts) {
      const srcPath = join(cachePath, artifact);
      const destPath = join(workspaceDir, artifact);

      if (existsSync(srcPath)) {
        try {
          // Remove existing artifact
          if (existsSync(destPath)) {
            rmSync(destPath, { recursive: true, force: true });
          }

          // Copy from cache using rsync if available, fallback to cp
          try {
            execSync(`rsync -a "${srcPath}/" "${destPath}/"`, { stdio: 'pipe' });
          } catch {
            // Fallback to cp
            execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'pipe' });
          }

          console.log(`Restored ${artifact} from cache`);
          restored = true;
        } catch (error) {
          console.warn(`Failed to restore ${artifact}:`, error);
        }
      }
    }

    // Verify integrity of restored node_modules
    if (restored) {
      const nodeModulesPath = join(workspaceDir, 'node_modules');
      if (existsSync(nodeModulesPath)) {
        try {
          // Quick integrity check - ensure directory is not empty
          const files = execSync(`ls -1 "${nodeModulesPath}" | head -1`, { encoding: 'utf8' }).trim();
          if (!files) {
            console.warn('Restored node_modules appears empty, cache may be corrupted');
            rmSync(nodeModulesPath, { recursive: true, force: true });
            restored = false;
          }
        } catch (error) {
          console.warn('Cache integrity check failed:', error);
          restored = false;
        }
      }
    }

    return restored;
  }

  /**
   * Save workspace artifacts to cache
   */
  saveWorkspaceCache(workspacePath: string): void {
    const cacheKey = this.getWorkspaceCacheKey(workspacePath);
    const cachePath = join(this.cacheDir, cacheKey);
    const tmpPath = `${cachePath}.tmp`;
    const lockPath = `${cachePath}.lock`;
    const workspaceDir = resolve(this.workspaceRoot, workspacePath);

    // Acquire simple lock
    try {
      mkdirSync(lockPath);
    } catch (error) {
      console.warn(`Cache save lock busy for ${workspacePath}, skipping save`);
      return;
    }

    try {
      console.log(`Saving cache for workspace ${workspacePath} to ${cachePath}`);

      // Create temporary directory
      this.ensureDirectory(tmpPath);

      const artifacts = ['node_modules', '.next', 'dist', 'build', '.turbo'];
      let savedAny = false;

      for (const artifact of artifacts) {
        const srcPath = join(workspaceDir, artifact);
        const destPath = join(tmpPath, artifact);

        if (existsSync(srcPath)) {
          try {
            // Use rsync for better performance and correctness
            try {
              execSync(`rsync -a "${srcPath}/" "${destPath}/"`, { stdio: 'pipe' });
            } catch {
              // Fallback to cp
              execSync(`cp -r "${srcPath}" "${destPath}"`, { stdio: 'pipe' });
            }

            console.log(`Cached ${artifact}`);
            savedAny = true;
          } catch (error) {
            console.warn(`Failed to cache ${artifact}:`, error);
          }
        }
      }

      if (savedAny) {
        // Atomic replace
        if (existsSync(cachePath)) {
          rmSync(cachePath, { recursive: true, force: true });
        }
        execSync(`mv "${tmpPath}" "${cachePath}"`);
        console.log(`Cache saved for workspace ${workspacePath}`);

        // Save cache metadata
        this.saveCacheMetadata(workspacePath, cacheKey);
      } else {
        // Clean up empty temp directory
        rmSync(tmpPath, { recursive: true, force: true });
      }

    } finally {
      // Release lock
      try {
        rmSync(lockPath, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }

      // Clean up temp directory if it still exists
      if (existsSync(tmpPath)) {
        rmSync(tmpPath, { recursive: true, force: true });
      }
    }
  }

  /**
   * Validate environment variables for workspace-specific features
   */
  validateWorkspaceEnvironment(workspace: string): Record<string, string> {
    const envVars: Record<string, string> = {};

    // Workspace-specific environment validation
    switch (workspace) {
      case 'web':
        if (process.env.ENABLE_SUPABASE === 'true') {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseKey) {
            envVars.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
            envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseKey;
          } else {
            console.warn('Supabase enabled but credentials missing for web workspace');
          }
        }

        if (process.env.ENABLE_DATABASE === 'true') {
          const databaseUrl = process.env.DATABASE_URL;
          if (databaseUrl) {
            envVars.DATABASE_URL = databaseUrl;
          } else {
            console.warn('Database enabled but DATABASE_URL missing for web workspace');
          }
        }
        break;

      case 'backend':
        if (process.env.ENABLE_DATABASE === 'true') {
          const databaseUrl = process.env.DATABASE_URL;
          if (databaseUrl) {
            envVars.DATABASE_URL = databaseUrl;
          } else {
            console.warn('Database enabled but DATABASE_URL missing for backend workspace');
          }
        }

        // Python-specific environment validation
        const pythonPath = process.env.PYTHONPATH;
        if (pythonPath) {
          envVars.PYTHONPATH = pythonPath;
        }
        break;

      case 'mobile':
        if (process.env.ENABLE_SUPABASE === 'true') {
          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
          const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseKey) {
            envVars.EXPO_PUBLIC_SUPABASE_URL = supabaseUrl;
            envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY = supabaseKey;
          }
        }
        break;

      case 'ai':
        // AI workspace specific environment variables
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
          envVars.OPENAI_API_KEY = openaiKey;
        }
        break;

      case 'payments':
        // Payments workspace specific environment variables
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
          envVars.STRIPE_SECRET_KEY = stripeKey;
        }
        break;
    }

    // Common environment variables for all workspaces
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv) {
      envVars.NODE_ENV = nodeEnv;
    }

    return envVars;
  }

  /**
   * Get scoped install command for workspace
   */
  getScopedInstallCommand(workspace: string): string[] {
    const workspaceDir = resolve(this.workspaceRoot, `workspaces/${workspace}`);
    const packageJsonPath = join(workspaceDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
      throw new Error(`Package.json not found for workspace: ${workspace}`);
    }

    // Determine package manager
    let packageManager = 'npm';
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      const pmField = pkg.packageManager;
      if (pmField) {
        if (pmField.startsWith('yarn')) packageManager = 'yarn';
        else if (pmField.startsWith('pnpm')) packageManager = 'pnpm';
      }
    } catch (error) {
      // Use default npm
    }

    // Check for lockfiles to determine package manager
    if (existsSync(join(workspaceDir, 'pnpm-lock.yaml'))) {
      packageManager = 'pnpm';
    } else if (existsSync(join(workspaceDir, 'yarn.lock'))) {
      packageManager = 'yarn';
    }

    // Return scoped install command
    switch (packageManager) {
      case 'yarn':
        return ['yarn', 'install', '--cwd', workspaceDir];
      case 'pnpm':
        return ['pnpm', 'install', '--filter', workspace];
      default:
        return ['npm', 'ci', '--workspace', workspace];
    }
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredCache(): void {
    if (!existsSync(this.cacheDir)) {
      return;
    }

    const now = Date.now();
    const ttlMs = this.ttlDays * 24 * 60 * 60 * 1000;

    try {
      const entries = execSync(`ls -1 "${this.cacheDir}"`, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean);

      for (const entry of entries) {
        const entryPath = join(this.cacheDir, entry);
        
        // Skip lock and temp files
        if (entry.endsWith('.lock') || entry.endsWith('.tmp')) {
          continue;
        }

        try {
          const stats = statSync(entryPath);
          const age = now - stats.mtime.getTime();

          if (age > ttlMs) {
            console.log(`Cleaning up expired cache entry: ${entry}`);
            rmSync(entryPath, { recursive: true, force: true });
          }
        } catch (error) {
          console.warn(`Failed to check cache entry ${entry}:`, error);
        }
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  private ensureDirectory(path: string): void {
    try {
      mkdirSync(path, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private saveCacheMetadata(workspacePath: string, cacheKey: string): void {
    const workspaceDir = resolve(this.workspaceRoot, workspacePath);
    const packageJsonPath = join(workspaceDir, 'package.json');
    
    const metadata: CacheEntry = {
      key: cacheKey,
      workspace: workspacePath,
      timestamp: Date.now(),
      size: 0, // Could be calculated if needed
      artifacts: ['node_modules', '.next', 'dist', 'build', '.turbo'],
      dependencies: {},
      packageManager: 'npm'
    };

    // Extract dependencies and package manager info
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        metadata.dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (pkg.packageManager) {
          if (pkg.packageManager.startsWith('yarn')) metadata.packageManager = 'yarn';
          else if (pkg.packageManager.startsWith('pnpm')) metadata.packageManager = 'pnpm';
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Save metadata
    const metadataPath = join(this.cacheDir, `${cacheKey}.meta.json`);
    try {
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.warn('Failed to save cache metadata:', error);
    }
  }
}

export default PreviewCacheManager;