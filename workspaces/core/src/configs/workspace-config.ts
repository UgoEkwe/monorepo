import type { WorkspaceConfig, SharedConfig } from '../types';

/**
 * Default workspace configuration
 */
export const defaultWorkspaceConfig: Partial<WorkspaceConfig> = {
  enabled: true,
  dependencies: [],
  optionalDependencies: [],
  buildOutputs: ['dist/**'],
  devCommand: 'npm run dev',
  buildCommand: 'npm run build',
};

/**
 * Shared configuration with environment-based feature flags
 */
export function getSharedConfig(): SharedConfig {
  return {
    database: {
      enabled: process.env.ENABLE_DATABASE === 'true',
      url: process.env.DATABASE_URL,
    },
    supabase: {
      enabled: process.env.ENABLE_SUPABASE === 'true',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    },
    features: {
      web: process.env.ENABLE_WEB !== 'false',
      mobile: process.env.ENABLE_MOBILE === 'true',
      backend: process.env.ENABLE_BACKEND !== 'false',
      ai: process.env.ENABLE_AI === 'true',
      payments: process.env.ENABLE_PAYMENTS === 'true',
      cli: process.env.ENABLE_CLI === 'true',
    },
  };
}

/**
 * Get workspace-specific environment variables
 */
export function getWorkspaceEnv(workspace: string): Record<string, string> {
  const env: Record<string, string> = {};
  const config = getSharedConfig();

  // Add workspace-specific environment variables
  if (workspace === 'web' && config.supabase?.enabled) {
    if (config.supabase.url) env.NEXT_PUBLIC_SUPABASE_URL = config.supabase.url;
    if (config.supabase.key) env.NEXT_PUBLIC_SUPABASE_ANON_KEY = config.supabase.key;
  }

  if (['web', 'backend'].includes(workspace) && config.database?.enabled) {
    if (config.database.url) env.DATABASE_URL = config.database.url;
  }

  return env;
}

/**
 * Check if workspace is enabled
 */
export function isWorkspaceEnabled(workspace: string): boolean {
  const config = getSharedConfig();
  return config.features[workspace] ?? false;
}