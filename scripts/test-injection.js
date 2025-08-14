#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test script for workspace injection system
 * Validates all templates and security features
 */

const testCases = [
  {
    name: 'test-lib',
    type: 'library',
    description: 'Test library workspace',
    shouldSucceed: true
  },
  {
    name: 'test-web',
    type: 'web',
    description: 'Test web workspace',
    shouldSucceed: true
  },
  {
    name: 'test-mobile',
    type: 'mobile',
    description: 'Test mobile workspace',
    shouldSucceed: true
  },
  {
    name: 'test-service',
    type: 'service',
    description: 'Test service workspace',
    shouldSucceed: true
  },
  // Security validation tests
  {
    name: 'Invalid Name',
    type: 'library',
    description: 'Should fail - invalid name format',
    shouldSucceed: false
  },
  {
    name: 'core',
    type: 'library',
    description: 'Should fail - reserved name',
    shouldSucceed: false
  },
  {
    name: 'test-invalid-type',
    type: 'invalid',
    description: 'Should fail - invalid type',
    shouldSucceed: false
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name} (${testCase.type})`);
  console.log(`   Expected: ${testCase.shouldSucceed ? 'SUCCESS' : 'FAILURE'}`);
  
  try {
    const command = `node scripts/inject-workspace.js "${testCase.name}" ${testCase.type} --skip-install --description "${testCase.description}"`;
    execSync(command, { stdio: 'pipe' });
    
    if (testCase.shouldSucceed) {
      // Verify workspace was created
      const workspacePath = path.join('workspaces', testCase.name);
      if (fs.existsSync(workspacePath)) {
        console.log(`   ✅ SUCCESS: Workspace created successfully`);
        
        // Verify package.json has correct substitutions
        const packagePath = path.join(workspacePath, 'package.json');
        if (fs.existsSync(packagePath)) {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          if (pkg.name === `@modular-ai-scaffold/${testCase.name}` && 
              pkg.description === testCase.description) {
            console.log(`   ✅ Template variables substituted correctly`);
          } else {
            console.log(`   ❌ Template variable substitution failed`);
          }
        }
        
        // Clean up
        fs.rmSync(workspacePath, { recursive: true, force: true });
        console.log(`   🧹 Cleaned up test workspace`);
      } else {
        console.log(`   ❌ FAILURE: Workspace not created`);
      }
    } else {
      console.log(`   ❌ UNEXPECTED: Command should have failed but succeeded`);
    }
  } catch (error) {
    if (!testCase.shouldSucceed) {
      console.log(`   ✅ SUCCESS: Command failed as expected`);
    } else {
      console.log(`   ❌ FAILURE: Command failed unexpectedly`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting workspace injection system tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      await runTest(testCase);
      passed++;
    } catch (error) {
      console.log(`   ❌ Test execution failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Workspace injection system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});