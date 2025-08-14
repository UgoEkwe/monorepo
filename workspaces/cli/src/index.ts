#!/usr/bin/env node

import { safeImport, featureFlags } from '@modular-ai-scaffold/core/utils/optional-deps';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Conditional imports for CLI dependencies
const commander = safeImport('commander');
const inquirer = safeImport('inquirer');
const dotenv = safeImport('dotenv');
const chalk = safeImport('chalk');

// Load environment variables if dotenv is available
if (dotenv.available && dotenv.module) {
  dotenv.module.config();
}

// Fallback implementations for missing dependencies
const createFallbackChalk = () => ({
  blue: (text: string) => text,
  green: (text: string) => text,
  red: (text: string) => text,
  yellow: (text: string) => text,
  gray: (text: string) => text,
});

const createFallbackInquirer = () => ({
  prompt: async (questions: any[]) => {
    console.warn('Interactive prompts not available - using defaults');
    const answers: any = {};
    for (const question of questions) {
      if (question.default !== undefined) {
        answers[question.name] = question.default;
      } else if (question.type === 'list') {
        answers[question.name] = question.choices?.[0];
      } else if (question.type === 'checkbox') {
        answers[question.name] = [];
      } else {
        answers[question.name] = '';
      }
    }
    return answers;
  }
});

// Get safe instances
const chalkInstance = chalk.available ? chalk.module : createFallbackChalk();
const inquirerInstance = inquirer.available ? inquirer.module : createFallbackInquirer();

// Load environment variables
config();

// Create program instance with fallback
const createProgram = () => {
  if (commander.available && commander.module) {
    const { Command } = commander.module;
    return new Command();
  }
  
  // Fallback program implementation
  return {
    name: (n: string) => ({ description: (d: string) => ({ version: (v: string) => ({}) }) }),
    command: (cmd: string) => ({
      description: (desc: string) => ({
        option: (opt: string, desc: string) => ({
          action: (fn: Function) => {}
        }),
        action: (fn: Function) => {}
      })
    }),
    parse: () => {
      console.warn('Commander.js not available - CLI functionality limited');
    }
  };
};

const program = createProgram();

if (commander.available) {
  program
    .name('modular-ai')
    .description('CLI for Modular AI Scaffold management')
    .version('1.0.0');
}

// Only set up commands if commander is available
if (commander.available && commander.module) {
  // Secrets management command
  program
    .command('secrets')
    .description('Manage environment secrets and configuration')
    .option('--validate', 'Validate current secrets configuration')
    .option('--setup', 'Interactive setup for all secrets')
    .option('--export <file>', 'Export secrets to file with placeholders')
    .action(async (options) => {
      if (options.validate) {
        await validateSecrets();
      } else if (options.setup) {
        await interactiveSetup();
      } else if (options.export) {
        await exportSecrets(options.export);
      } else {
        console.log(chalkInstance.blue('Available secret management commands:'));
        console.log('  modular-ai secrets --validate    Validate current secrets');
        console.log('  modular-ai secrets --setup       Interactive secrets setup');
        console.log('  modular-ai secrets --export      Export secrets with placeholders');
      }
    });

  // New command
  program
    .command('new')
    .description('Scaffold a new project from this monorepo template (safe defaults)')
    .action(async () => {
      const presets: Record<string, string[]> = { basic: ['web', 'backend'], blog: ['web', 'database', 'ai'], full: ['all'] };
    const answers = await inquirerInstance.prompt([
      { name: 'name', message: 'Project name:', validate: (input: string) => (typeof input === 'string' && input.trim().length >= 3) ? true : 'Enter at least 3 characters' },
      { name: 'preset', type: 'list', message: 'Select preset (or custom):', choices: Object.keys(presets).concat('custom') },
      { name: 'workspaces', type: 'checkbox', message: 'Select workspaces:', choices: ['web', 'mobile', 'backend', 'database', 'ai', 'payments'], when: (a: any) => a.preset === 'custom' },
    ]);
    const selected = answers.preset !== 'custom' ? (answers.preset === 'full' ? ['all'] : presets[answers.preset as keyof typeof presets]) : answers.workspaces;

    // Create directory and copy current scaffold as a starting point
    fs.mkdirSync(answers.name, { recursive: true });
    fs.writeFileSync(path.join(answers.name, 'config.json'), JSON.stringify({ enabled: selected, preset: answers.preset }, null, 2));

    // Create env samples only; do not inject secrets
    fs.writeFileSync(path.join(answers.name, '.env.local.example'), '# Add your env variables here');

    console.log(chalkInstance.green(`Project ${answers.name} initialized.`));
    console.log(chalkInstance.yellow('Note: Secrets are not fetched or injected. Configure env files manually.'));
    console.log('Next steps:');
    console.log(`  cd ${answers.name}`);
    console.log('  npm install');
    console.log('  npm run dev');
  });

// Validate current secrets configuration
async function validateSecrets(): Promise<void> {
  console.log(chalkInstance.blue('Validating secrets configuration...'));
  
  const requiredSecrets = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENROUTER_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY'
  ];

  const missingSecrets: string[] = [];
  
  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      missingSecrets.push(secret);
    }
  }

  if (missingSecrets.length === 0) {
    console.log(chalkInstance.green('✓ All required secrets are configured'));
  } else {
    console.log(chalkInstance.red('✗ Missing required secrets:'));
    missingSecrets.forEach(secret => {
      console.log(`  - ${secret}`);
    });
  }

  // Check development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(chalkInstance.yellow('⚠ Development mode enabled - using mock data where available'));
  }
}

// Interactive setup for all secrets
async function interactiveSetup(): Promise<void> {
  console.log(chalkInstance.blue('Interactive Secrets Setup'));
  console.log(chalkInstance.gray('Press Ctrl+C to exit at any time\n'));

  const answers: any = await inquirerInstance.prompt([
    {
      type: 'input',
      name: 'databaseUrl',
      message: 'Database URL:',
      default: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/modular_ai_scaffold'
    },
    {
      type: 'input',
      name: 'supabaseUrl',
      message: 'Supabase URL:',
      default: process.env.SUPABASE_URL || 'https://your-project.supabase.co'
    },
    {
      type: 'input',
      name: 'supabaseAnonKey',
      message: 'Supabase Anonymous Key:',
      default: process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key'
    },
    {
      type: 'input',
      name: 'supabaseServiceRoleKey',
      message: 'Supabase Service Role Key:',
      default: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key'
    },
    {
      type: 'input',
      name: 'openrouterApiKey',
      message: 'OpenRouter API Key:',
      default: process.env.OPENROUTER_API_KEY || 'your-openrouter-api-key'
    },
    {
      type: 'input',
      name: 'stripeSecretKey',
      message: 'Stripe Secret Key:',
      default: process.env.STRIPE_SECRET_KEY || 'sk_test_your-stripe-secret-key'
    },
    {
      type: 'input',
      name: 'stripePublishableKey',
      message: 'Stripe Publishable Key:',
      default: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your-stripe-publishable-key'
    }
  ]);

  // Update .env file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add environment variables
  const envVars = {
    'DATABASE_URL': answers.databaseUrl,
    'SUPABASE_URL': answers.supabaseUrl,
    'SUPABASE_ANON_KEY': answers.supabaseAnonKey,
    'SUPABASE_SERVICE_ROLE_KEY': answers.supabaseServiceRoleKey,
    'OPENROUTER_API_KEY': answers.openrouterApiKey,
    'STRIPE_SECRET_KEY': answers.stripeSecretKey,
    'STRIPE_PUBLISHABLE_KEY': answers.stripePublishableKey
  };

  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      envContent += `\n${key}="${value}"`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log(chalkInstance.green('✓ Secrets updated successfully'));
}

// Export secrets with placeholders
async function exportSecrets(filePath: string): Promise<void> {
  console.log(chalkInstance.blue(`Exporting secrets to ${filePath}...`));
  
  const placeholderSecrets = {
    'DATABASE_URL': 'postgresql://username:password@localhost:5432/modular_ai_scaffold',
    'SUPABASE_URL': 'https://your-project.supabase.co',
    'SUPABASE_ANON_KEY': 'your-supabase-anon-key',
    'SUPABASE_SERVICE_ROLE_KEY': 'your-supabase-service-role-key',
    'SUPABASE_JWT_SECRET': 'your-supabase-jwt-secret',
    'OPENROUTER_API_KEY': 'your-openrouter-api-key',
    'OPENROUTER_MODEL': 'anthropic/claude-3-haiku',
    'STRIPE_SECRET_KEY': 'sk_test_your-stripe-secret-key',
    'STRIPE_PUBLISHABLE_KEY': 'pk_test_your-stripe-publishable-key',
    'STRIPE_WEBHOOK_SECRET': 'whsec_your-webhook-secret',
    'MODAL_TOKEN_ID': 'your-modal-token-id',
    'MODAL_TOKEN_SECRET': 'your-modal-token-secret',
    'NODE_ENV': 'development',
    'PORT': '3000',
    'API_PORT': '8000',
    'PAYMENTS_PORT': '3004',
    'NEXT_PUBLIC_SUPABASE_URL': 'https://your-project.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'your-supabase-anon-key',
    'NEXTAUTH_URL': 'http://localhost:3000',
    'NEXTAUTH_SECRET': 'your-nextauth-secret',
    'EXPO_PUBLIC_SUPABASE_URL': 'https://your-project.supabase.co',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': 'your-supabase-anon-key',
    'DEBUG': 'true',
    'LOG_LEVEL': 'info'
  };

  let exportContent = '# Modular AI Scaffold Environment Configuration\n\n';
  
  for (const [key, value] of Object.entries(placeholderSecrets)) {
    exportContent += `${key}="${value}"\n`;
  }

  fs.writeFileSync(filePath, exportContent);
  console.log(chalkInstance.green(`✓ Secrets exported to ${filePath}`));
}

  });
}

// Initialize program
if (commander.available) {
  program.parse();
} else {
  console.log('CLI functionality limited - commander.js not available');
  console.log('Available functions can be called directly from the module');
}
