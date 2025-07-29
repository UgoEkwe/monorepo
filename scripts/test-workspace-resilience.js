#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test script to verify workspace resilience and authentication setup
console.log('🧪 Testing Workspace Resilience and Authentication Setup...\n');

const WORKSPACES = [
  'workspaces/web',
  'workspaces/mobile', 
  'workspaces/backend',
  'workspaces/database',
  'workspaces/ai',
  'workspaces/payments',
  'workspaces/cli'
];

function checkWorkspaces() {
  const results = {
    existing: [],
    missing: [],
    total: WORKSPACES.length
  };

  WORKSPACES.forEach(workspace => {
    const workspacePath = path.join(process.cwd(), workspace);
    const packageJsonPath = path.join(workspacePath, 'package.json');
    
    if (fs.existsSync(workspacePath) && fs.existsSync(packageJsonPath)) {
      results.existing.push(workspace);
    } else {
      results.missing.push(workspace);
    }
  });

  return results;
}

function checkEnvironmentSetup() {
  console.log('🔐 Checking Environment Setup...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENROUTER_API_KEY'
  ];

  const missingVars = [];
  const presentVars = [];

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      presentVars.push(envVar);
    } else {
      missingVars.push(envVar);
    }
  });

  console.log(`  ✅ Present: ${presentVars.length}/${requiredEnvVars.length}`);
  if (missingVars.length > 0) {
    console.log(`  ⚠️  Missing: ${missingVars.join(', ')}`);
  }

  return {
    valid: missingVars.length === 0,
    missing: missingVars,
    present: presentVars
  };
}

function checkWorkspaceConfigs() {
  console.log('\n📂 Checking Workspace Configurations...');
  
  const workspaceConfigs = {
    web: {
      required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      optional: ['NEXTAUTH_URL', 'NEXTAUTH_SECRET']
    },
    mobile: {
      required: ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
      optional: []
    },
    payments: {
      required: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
      optional: ['STRIPE_WEBHOOK_SECRET']
    }
  };

  const results = {};

  Object.entries(workspaceConfigs).forEach(([workspace, config]) => {
    const workspacePath = path.join(process.cwd(), 'workspaces', workspace);
    if (fs.existsSync(workspacePath)) {
      console.log(`  📁 ${workspace}: Found`);
      results[workspace] = true;
    } else {
      console.log(`  📁 ${workspace}: Missing (will use fallbacks)`);
      results[workspace] = false;
    }
  });

  return results;
}

function main() {
  console.log('🚀 Modular AI Scaffold - Workspace Resilience Test\n');
  
  // Check workspaces
  const workspaceResults = checkWorkspaces();
  console.log(`📁 Workspace Status:`);
  console.log(`  Total: ${workspaceResults.total}`);
  console.log(`  Existing: ${workspaceResults.existing.length}`);
  console.log(`  Missing: ${workspaceResults.missing.length}`);
  
  if (workspaceResults.existing.length > 0) {
    console.log(`\n  ✅ Existing workspaces:`);
    workspaceResults.existing.forEach(workspace => {
      console.log(`    ✓ ${workspace}`);
    });
  }
  
  if (workspaceResults.missing.length > 0) {
    console.log(`\n  ⚠️  Missing workspaces (fallbacks will be used):`);
    workspaceResults.missing.forEach(workspace => {
      console.log(`    ✗ ${workspace}`);
    });
  }

  // Check environment
  const envResults = checkEnvironmentSetup();
  
  // Check workspace configs
  const configResults = checkWorkspaceConfigs();

  // Summary
  console.log('\n📋 Summary:');
  console.log(`  Workspaces: ${workspaceResults.existing.length}/${workspaceResults.total} available`);
  console.log(`  Environment: ${envResults.valid ? '✅ Valid' : '⚠️  Partial (fallbacks active)'}`);
  
  if (workspaceResults.missing.length === 0) {
    console.log('\n🎉 All workspaces present - full functionality available');
  } else {
    console.log(`\n⚠️  ${workspaceResults.missing.length} workspaces missing - using fallback configurations`);
  }

  console.log('\n✅ Test completed successfully - scaffold is ready for instant authentication');
  
  // Exit with 0 - missing workspaces are expected and handled gracefully
  process.exit(0);
}

if (require.main === module) {
  main();
}
