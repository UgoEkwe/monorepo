/**
 * Tests for PreviewCacheManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PreviewCacheManager } from '../preview-cache-manager';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('PreviewCacheManager', () => {
  let cacheManager: PreviewCacheManager;
  let testCacheDir: string;
  let testWorkspaceRoot: string;

  beforeEach(() => {
    // Create temporary directories for testing
    testCacheDir = join(tmpdir(), `preview-cache-test-${Date.now()}`);
    testWorkspaceRoot = join(tmpdir(), `workspace-test-${Date.now()}`);
    
    mkdirSync(testCacheDir, { recursive: true });
    mkdirSync(testWorkspaceRoot, { recursive: true });
    
    cacheManager = new PreviewCacheManager(testCacheDir, testWorkspaceRoot);
  });

  afterEach(() => {
    // Clean up test directories
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
    if (existsSync(testWorkspaceRoot)) {
      rmSync(testWorkspaceRoot, { recursive: true, force: true });
    }
  });

  describe('getWorkspaceCacheKey', () => {
    it('should generate cache key based on package.json', () => {
      const workspacePath = 'workspaces/web';
      const workspaceDir = join(testWorkspaceRoot, workspacePath);
      
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({
        name: 'web',
        dependencies: {
          'next': '^13.0.0',
          'react': '^18.0.0'
        }
      }));

      const cacheKey = cacheManager.getWorkspaceCacheKey(workspacePath);
      
      expect(cacheKey).toBeTruthy();
      expect(cacheKey).toContain('web');
    });

    it('should include lockfile hash in cache key', () => {
      const workspacePath = 'workspaces/web';
      const workspaceDir = join(testWorkspaceRoot, workspacePath);
      
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({ name: 'web' }));
      writeFileSync(join(workspaceDir, 'package-lock.json'), 'lockfile content');

      const cacheKey = cacheManager.getWorkspaceCacheKey(workspacePath);
      
      expect(cacheKey).toBeTruthy();
      expect(cacheKey.split('-').length).toBeGreaterThan(1);
    });
  });

  describe('detectChanges', () => {
    it('should handle git command failure gracefully', () => {
      // This test will fail git command since we're not in a git repo
      const changes = cacheManager.detectChanges();
      
      expect(changes).toHaveProperty('changedWorkspaces');
      expect(changes).toHaveProperty('requiresFullRebuild');
      expect(changes.requiresFullRebuild).toBe(true); // Should default to full rebuild on error
    });
  });

  describe('validateWorkspaceEnvironment', () => {
    it('should validate web workspace environment', () => {
      // Set test environment variables
      process.env.ENABLE_SUPABASE = 'true';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const envVars = cacheManager.validateWorkspaceEnvironment('web');
      
      expect(envVars).toHaveProperty('NEXT_PUBLIC_SUPABASE_URL');
      expect(envVars).toHaveProperty('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      expect(envVars.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');

      // Clean up
      delete process.env.ENABLE_SUPABASE;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    });

    it('should validate backend workspace environment', () => {
      process.env.ENABLE_DATABASE = 'true';
      process.env.DATABASE_URL = 'postgresql://test';

      const envVars = cacheManager.validateWorkspaceEnvironment('backend');
      
      expect(envVars).toHaveProperty('DATABASE_URL');
      expect(envVars.DATABASE_URL).toBe('postgresql://test');

      // Clean up
      delete process.env.ENABLE_DATABASE;
      delete process.env.DATABASE_URL;
    });

    it('should return empty object for unknown workspace', () => {
      const envVars = cacheManager.validateWorkspaceEnvironment('unknown');
      
      // Should still include NODE_ENV if set
      if (process.env.NODE_ENV) {
        expect(envVars).toHaveProperty('NODE_ENV');
      }
    });
  });

  describe('getScopedInstallCommand', () => {
    it('should return npm command for npm workspace', () => {
      const workspacePath = 'workspaces/web';
      const workspaceDir = join(testWorkspaceRoot, workspacePath);
      
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({ name: 'web' }));

      const command = cacheManager.getScopedInstallCommand('web');
      
      expect(command).toEqual(['npm', 'ci', '--workspace', 'web']);
    });

    it('should return yarn command for yarn workspace', () => {
      const workspacePath = 'workspaces/web';
      const workspaceDir = join(testWorkspaceRoot, workspacePath);
      
      mkdirSync(workspaceDir, { recursive: true });
      writeFileSync(join(workspaceDir, 'package.json'), JSON.stringify({
        name: 'web',
        packageManager: 'yarn@3.0.0'
      }));

      const command = cacheManager.getScopedInstallCommand('web');
      
      expect(command[0]).toBe('yarn');
      expect(command).toContain('install');
    });

    it('should throw error for non-existent workspace', () => {
      expect(() => {
        cacheManager.getScopedInstallCommand('nonexistent');
      }).toThrow('Package.json not found for workspace: nonexistent');
    });
  });
});