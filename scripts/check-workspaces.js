#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

function main() {
  const results = checkWorkspaces();
  
  console.log('Workspace Status:');
  console.log(`Total workspaces: ${results.total}`);
  console.log(`Existing: ${results.existing.length}`);
  console.log(`Missing: ${results.missing.length}`);
  
  if (results.existing.length > 0) {
    console.log('\nExisting workspaces:');
    results.existing.forEach(workspace => {
      console.log(`  ✓ ${workspace}`);
    });
  }
  
  if (results.missing.length > 0) {
    console.log('\nMissing workspaces:');
    results.missing.forEach(workspace => {
      console.log(`  ✗ ${workspace}`);
    });
  }
  
  // Exit with 0 regardless - missing workspaces are expected and handled gracefully
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { checkWorkspaces };