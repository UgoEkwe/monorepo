/**
 * Tests for EnvironmentValidator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnvironmentValidator } from '../env-validator';

describe('EnvironmentValidator', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateWorkspace', () => {
    it('should validate web workspace with required variables', () => {
      const testEnv = {
        NODE_ENV: 'development',
        ENABLE_SUPABASE: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
      };

      const result = EnvironmentValidator.validateWorkspace('web', testEnv);

      expect(result.isValid).toBe(true);
      expect(result.missingRequired).toHaveLength(0);
      expect(result.enabledFeatures).toContain('ENABLE_SUPABASE');
      expect(result.sanitizedEnv).toHaveProperty('NODE_ENV');
      expect(result.sanitizedEnv).toHaveProperty('NEXT_PUBLIC_SUPABASE_URL');
    });

    it('should report missing required variables', () => {
      const testEnv = {}; // Missing NODE_ENV

      const result = EnvironmentValidator.validateWorkspace('web', testEnv);

      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('NODE_ENV');
    });

    it('should warn about missing conditional variables', () => {
      const testEnv = {
        NODE_ENV: 'development',
        ENABLE_SUPABASE: 'true'
        // Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
      };

      const result = EnvironmentValidator.validateWorkspace('web', testEnv);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('ENABLE_SUPABASE'))).toBe(true);
    });

    it('should handle unknown workspace', () => {
      const testEnv = { NODE_ENV: 'development' };

      const result = EnvironmentValidator.validateWorkspace('unknown', testEnv);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Unknown workspace: unknown');
    });
  });

  describe('validateMultipleWorkspaces', () => {
    it('should validate multiple workspaces', () => {
      const testEnv = {
        NODE_ENV: 'development',
        ENABLE_DATABASE: 'true',
        DATABASE_URL: 'postgresql://test'
      };

      const results = EnvironmentValidator.validateMultipleWorkspaces(['web', 'backend'], testEnv);

      expect(results).toHaveProperty('web');
      expect(results).toHaveProperty('backend');
      expect(results.web.isValid).toBe(true);
      expect(results.backend.isValid).toBe(true);
    });
  });

  describe('getSafeEnvForCache', () => {
    it('should remove sensitive variables', () => {
      const testEnv = {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://secret',
        API_KEY: 'secret-key',
        PUBLIC_URL: 'https://example.com'
      };

      const safeEnv = EnvironmentValidator.getSafeEnvForCache(testEnv);

      expect(safeEnv).toHaveProperty('NODE_ENV');
      expect(safeEnv).toHaveProperty('PUBLIC_URL');
      expect(safeEnv).not.toHaveProperty('DATABASE_URL');
      expect(safeEnv).not.toHaveProperty('API_KEY');
      expect(safeEnv).toHaveProperty('DATABASE_URL_HASH');
      expect(safeEnv).toHaveProperty('API_KEY_HASH');
    });
  });

  describe('generateEnvCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const testEnv = {
        NODE_ENV: 'development',
        ENABLE_SUPABASE: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co'
      };

      const key1 = EnvironmentValidator.generateEnvCacheKey('web', testEnv);
      const key2 = EnvironmentValidator.generateEnvCacheKey('web', testEnv);

      expect(key1).toBe(key2);
      expect(key1).toContain('ws-web');
      expect(key1).toContain('features-ENABLE_SUPABASE');
    });

    it('should generate different keys for different environments', () => {
      const env1 = { NODE_ENV: 'development' };
      const env2 = { NODE_ENV: 'production' };

      const key1 = EnvironmentValidator.generateEnvCacheKey('web', env1);
      const key2 = EnvironmentValidator.generateEnvCacheKey('web', env2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('validateForPreview', () => {
    it('should be more lenient in preview mode', () => {
      const testEnv = {}; // Missing NODE_ENV

      const result = EnvironmentValidator.validateForPreview('web', testEnv);

      expect(result.isValid).toBe(true); // Should be valid in preview mode
      expect(result.sanitizedEnv.NODE_ENV).toBe('development'); // Should set default
    });
  });

  describe('generateEnvFile', () => {
    it('should generate valid environment file content', () => {
      const testEnv = {
        NODE_ENV: 'development',
        ENABLE_SUPABASE: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co'
      };

      const envFileContent = EnvironmentValidator.generateEnvFile('web', testEnv);

      expect(envFileContent).toContain('NODE_ENV=development');
      expect(envFileContent).toContain('# Environment variables for web workspace');
      expect(envFileContent).toContain('# Enabled features:');
      expect(envFileContent).toContain('# - ENABLE_SUPABASE');
    });
  });
});