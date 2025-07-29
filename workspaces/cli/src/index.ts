#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { z } from 'zod';

// Load environment variables
config();

const program = new Command();

program
  .name('modular-ai')
  .description('CLI for Modular AI Scaffold management')
  .version('1.0.0');

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
      console.log(chalk.blue('Available secret management commands:'));
      console.log('  modular-ai secrets --validate    Validate current secrets');
      console.log('  modular-ai secrets --setup       Interactive secrets setup');
      console.log('  modular-ai secrets --export      Export secrets with placeholders');
    }
  });

// New command
program
  .command('new')
  .action(async () => {
    const presets = { basic: ['web', 'backend'], blog: ['web', 'database', 'ai'], full: ['all'] };
    const answers = await inquirer.prompt([
      { name: 'name', message: 'Project name:', validate: (input) => zod.string().min(3).safeParse(input).success || 'Invalid' },
      { name: 'preset', type: 'list', message: 'Select preset (or custom):', choices: Object.keys(presets).concat('custom') },
      { name: 'workspaces', type: 'checkbox', message: 'Select workspaces:', choices: ['auth', 'web', 'mobile', 'backend', 'database', 'ai', 'payments'], when: (a) => a.preset === 'custom' },
    ]);
    const workspaces = answers.preset !== 'custom' ? (answers.preset === 'full' ? ['all'] : presets[answers.preset]) : answers.workspaces;

    // Clone template (assuming pr0to-starter is the template repo)
    execSync(`git clone https://github.com/your-org/pr0to-starter ${answers.name}`);

    // Set config.json
    fs.writeFileSync(`${answers.name}/config.json`, JSON.stringify({ enabled: workspaces, preset: answers.preset }));

    // Fetch secrets from Supabase (prompt for SUPABASE_URL and KEY if needed)
    const supabaseUrl = process.env.SUPABASE_URL || await inquirer.prompt({ name: 'value', message: 'Supabase URL:' }).then(a => a.value);
    const supabaseKey = process.env.SUPABASE_KEY || await inquirer.prompt({ name: 'value', message: 'Supabase Key:', type: 'password' }).then(a => a.value);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: secrets } = await supabase.from('secrets').select('*').eq('project', answers.name);
    let envContent = '';
    secrets.forEach(s => envContent += `${s.key}=${s.value}\n`);
    fs.writeFileSync(`${answers.name}/.env.local`, envContent);

    // Prisma if database selected
    if (workspaces.includes('database') || workspaces[0] === 'all') execSync(`cd ${answers.name} && npx prisma generate && prisma migrate deploy && prisma db seed`);

    // Build/demo with stubs
    execSync(`cd ${answers.name} && turbo build`);
    console.log(`Scaffold ${answers.name} ready (workspaces: ${workspaces.join(', ')})! cd ${answers.name} && turbo dev`);
  });

// Validate current secrets configuration
async function validateSecrets(): Promise<void> {
  console.log(chalk.blue('Validating secrets configuration...'));
  
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
    console.log(chalk.green('✓ All required secrets are configured'));
  } else {
    console.log(chalk.red('✗ Missing required secrets:'));
    missingSecrets.forEach(secret => {
      console.log(`  - ${secret}`);
    });
  }

  // Check development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(chalk.yellow('⚠ Development mode enabled - using mock data where available'));
  }
}

// Interactive setup for all secrets
async function interactiveSetup(): Promise<void> {
  console.log(chalk.blue('Interactive Secrets Setup'));
  console.log(chalk.gray('Press Ctrl+C to exit at any time\n'));

  const answers: any = await inquirer.prompt([
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
  console.log(chalk.green('✓ Secrets updated successfully'));
}

// Export secrets with placeholders
async function exportSecrets(filePath: string): Promise<void> {
  console.log(chalk.blue(`Exporting secrets to ${filePath}...`));
  
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
  console.log(chalk.green(`✓ Secrets exported to ${filePath}`));
}

// Initialize program
program.parse();
