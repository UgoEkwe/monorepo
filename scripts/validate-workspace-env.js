#!/usr/bin/env node

/**
 * Workspace environment validation script
 * Usage: node scripts/validate-workspace-env.js <workspace-name>
 */

const { validateWorkspaceEnvironment, logValidationResults } = require('../workspaces/core/dist/utils/env-validator');

const workspace = process.argv[2];

if (!workspace) {
  console.error('Usage: node scripts/validate-workspace-env.js <workspace-name>');
  console.error('Available workspaces: web, mobile, backend, ai, payments, database');
  process.exit(1);
}

try {
  const result = validateWorkspaceEnvironment(workspace);
  logValidationResults(workspace, result);
  
  if (!result.valid) {
    process.exit(1);
  }
} catch (error) {
  console.error(`Error validating ${workspace} workspace:`, error.message);
  process.exit(1);
}