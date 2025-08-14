/**
 * Cross-workspace environment variable validation
 * Provides consistent validation and reporting across all workspaces
 */

import { featureFlags } from './optional-deps';

export interface EnvValidationRule {
  name: string;
  required: boolean;
  feature?: string;
  description?: string;
  validator?: (value: string) => boolean;
}

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    total: number;
    valid: number;
    missing: number;
    invalid: number;
  };
}

/**
 * Validate environment variables based on rules
 */
export function validateEnvironment(rules: EnvValidationRule[]): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validCount = 0;
  let missingCount = 0;
  let invalidCount = 0;

  for (const rule of rules) {
    const value = process.env[rule.name];
    
    // Check if feature is enabled (if specified)
    if (rule.feature && !featureFlags.isEnabled(rule.feature)) {
      continue; // Skip validation for disabled features
    }

    // Check if variable exists
    if (!value) {
      if (rule.required) {
        errors.push(`${rule.name} is required${rule.description ? ` (${rule.description})` : ''}`);
        missingCount++;
      } else {
        warnings.push(`${rule.name} is not set${rule.description ? ` (${rule.description})` : ''}`);
      }
      continue;
    }

    // Validate value if validator is provided
    if (rule.validator && !rule.validator(value)) {
      errors.push(`${rule.name} has invalid value${rule.description ? ` (${rule.description})` : ''}`);
      invalidCount++;
      continue;
    }

    validCount++;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      total: rules.length,
      valid: validCount,
      missing: missingCount,
      invalid: invalidCount,
    },
  };
}

/**
 * Common validation rules for different workspace types
 */
export const commonRules = {
  database: [
    {
      name: 'DATABASE_URL',
      required: true,
      feature: 'database',
      description: 'PostgreSQL connection string',
      validator: (value: string) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    },
  ],

  supabase: [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      required: true,
      feature: 'supabase',
      description: 'Supabase project URL',
      validator: (value: string) => value.startsWith('https://') && value.includes('.supabase.co'),
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      required: true,
      feature: 'supabase',
      description: 'Supabase anonymous key',
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      required: false,
      feature: 'supabase',
      description: 'Supabase service role key (for server-side operations)',
    },
  ],

  ai: [
    {
      name: 'OPENROUTER_API_KEY',
      required: true,
      feature: 'ai',
      description: 'OpenRouter API key for AI model access',
    },
  ],

  payments: [
    {
      name: 'STRIPE_SECRET_KEY',
      required: true,
      feature: 'payments',
      description: 'Stripe secret key',
      validator: (value: string) => value.startsWith('sk_'),
    },
    {
      name: 'STRIPE_PUBLISHABLE_KEY',
      required: true,
      feature: 'payments',
      description: 'Stripe publishable key',
      validator: (value: string) => value.startsWith('pk_'),
    },
    {
      name: 'STRIPE_WEBHOOK_SECRET',
      required: false,
      feature: 'payments',
      description: 'Stripe webhook endpoint secret',
      validator: (value: string) => value.startsWith('whsec_'),
    },
  ],

  mobile: [
    {
      name: 'EXPO_PUBLIC_SUPABASE_URL',
      required: true,
      feature: 'supabase',
      description: 'Supabase project URL for Expo',
      validator: (value: string) => value.startsWith('https://') && value.includes('.supabase.co'),
    },
    {
      name: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      required: true,
      feature: 'supabase',
      description: 'Supabase anonymous key for Expo',
    },
  ],
};

/**
 * Get validation rules for a specific workspace
 */
export function getWorkspaceRules(workspace: string): EnvValidationRule[] {
  const rules: EnvValidationRule[] = [];

  switch (workspace) {
    case 'web':
      rules.push(...commonRules.database, ...commonRules.supabase);
      break;
    case 'mobile':
      rules.push(...commonRules.mobile);
      break;
    case 'backend':
      rules.push(...commonRules.database, ...commonRules.supabase);
      break;
    case 'ai':
      rules.push(...commonRules.database, ...commonRules.ai);
      break;
    case 'payments':
      rules.push(...commonRules.database, ...commonRules.payments);
      break;
    case 'database':
      rules.push(...commonRules.database);
      break;
    default:
      console.warn(`Unknown workspace: ${workspace}`);
  }

  return rules;
}

/**
 * Validate environment for a specific workspace
 */
export function validateWorkspaceEnvironment(workspace: string): EnvValidationResult {
  const rules = getWorkspaceRules(workspace);
  return validateEnvironment(rules);
}

/**
 * Log validation results in a formatted way
 */
export function logValidationResults(workspace: string, result: EnvValidationResult) {
  console.info(`[${workspace.toUpperCase()} Workspace] Environment Validation:`);
  
  if (result.valid) {
    console.info(`  ✓ All required environment variables are configured`);
  } else {
    console.error(`  ✗ Environment validation failed`);
  }

  console.info(`  Summary: ${result.summary.valid}/${result.summary.total} valid`);

  if (result.errors.length > 0) {
    console.error('  Errors:');
    result.errors.forEach(error => console.error(`    - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('  Warnings:');
    result.warnings.forEach(warning => console.warn(`    - ${warning}`));
  }

  // Show feature flag status
  const enabledFeatures = Object.entries(featureFlags.getAllFlags())
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
  
  if (enabledFeatures.length > 0) {
    console.info(`  Enabled features: ${enabledFeatures.join(', ')}`);
  }
}