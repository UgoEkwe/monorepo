/**
 * Environment variable handling for payments workspace
 * Provides validation and fallbacks for workspace-specific configuration
 */

import { featureFlags } from '@modular-ai-scaffold/core/utils/optional-deps';

export interface PaymentsEnvConfig {
  stripe: {
    enabled: boolean;
    secretKey?: string;
    publishableKey?: string;
    webhookSecret?: string;
  };
  database: {
    enabled: boolean;
  };
  server: {
    port: number;
    cors: boolean;
  };
}

/**
 * Get environment configuration for payments workspace
 */
export function getPaymentsEnvConfig(): PaymentsEnvConfig {
  const stripeEnabled = featureFlags.isEnabled('payments') && 
    Boolean(process.env.STRIPE_SECRET_KEY);

  return {
    stripe: {
      enabled: stripeEnabled,
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    database: {
      enabled: featureFlags.isEnabled('database') && Boolean(process.env.DATABASE_URL),
    },
    server: {
      port: parseInt(process.env.PAYMENTS_PORT || '3004', 10),
      cors: process.env.NODE_ENV === 'development',
    },
  };
}

/**
 * Validate required environment variables for enabled features
 */
export function validatePaymentsEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getPaymentsEnvConfig();

  if (config.stripe.enabled) {
    if (!config.stripe.secretKey) {
      errors.push('STRIPE_SECRET_KEY is required when payments are enabled');
    }
    if (!config.stripe.publishableKey) {
      errors.push('STRIPE_PUBLISHABLE_KEY is required when payments are enabled');
    }
  }

  if (config.database.enabled && !process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required when database is enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log environment configuration status
 */
export function logPaymentsEnvStatus() {
  const config = getPaymentsEnvConfig();
  const validation = validatePaymentsEnv();

  console.info('[Payments Workspace] Environment Configuration:');
  console.info('  Stripe:', config.stripe.enabled ? '✓ enabled' : '✗ disabled');
  console.info('  Database:', config.database.enabled ? '✓ enabled' : '✗ disabled');
  console.info('  Server Port:', config.server.port);
  console.info('  CORS:', config.server.cors ? '✓ enabled' : '✗ disabled');

  if (!validation.valid) {
    console.warn('[Payments Workspace] Environment validation errors:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  }
}