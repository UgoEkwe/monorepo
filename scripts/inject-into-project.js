#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(msg) { console.log(msg); }
function warn(msg) { console.warn(msg); }
function error(msg) { console.error(msg); }

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      if (['.git', 'node_modules', '.turbo', 'dist', 'build', 'coverage'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { mode: 'single', workspaces: [], skipInstall: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--target=')) opts.target = a.split('=')[1];
    else if (a.startsWith('--mode=')) opts.mode = a.split('=')[1];
    else if (a.startsWith('--workspaces=')) opts.workspaces = a.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--skip-install') opts.skipInstall = true;
    else if (!opts.target && !a.startsWith('--')) opts.target = a; // first positional as target
  }
  return opts;
}

function getAllMonorepoWorkspaces(monoRoot) {
  const wsDir = path.join(monoRoot, 'workspaces');
  if (!fs.existsSync(wsDir)) return [];
  return fs.readdirSync(wsDir)
    .filter(name => !name.startsWith('test-'))
    .filter(name => fs.existsSync(path.join(wsDir, name, 'package.json')));
}

function ensureRootScaffold(targetRoot) {
  const pkgPath = path.join(targetRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: path.basename(targetRoot),
      private: true,
      version: '0.1.0',
      workspaces: [],
      scripts: {
        dev: 'turbo run dev',
        build: 'turbo run build',
        test: 'turbo run test'
      },
      devDependencies: {
        turbo: '^1.10.0',
        typescript: '^5.0.0'
      }
    };
    writeJSON(pkgPath, pkg);
    log(`🆕 Created ${pkgPath}`);
  }
  // Create turbo.json if missing
  const turboPath = path.join(targetRoot, 'turbo.json');
  if (!fs.existsSync(turboPath)) {
    writeJSON(turboPath, {
      $schema: 'https://turbo.build/schema.json',
      pipeline: {
        dev: { cache: false, persistent: true },
        build: { dependsOn: ['^build'], outputs: ['dist/**', '.next/**', 'build/**', 'out/**'] },
        test: { dependsOn: ['^build'], outputs: ['coverage/**'] }
      }
    });
    log(`🆕 Created ${turboPath}`);
  }
}

function upsertRootWorkspaces(targetRoot, workspaceNames) {
  const pkgPath = path.join(targetRoot, 'package.json');
  const pkg = readJSON(pkgPath);
  pkg.workspaces = Array.from(new Set([...(pkg.workspaces || []), ...workspaceNames.map(n => `workspaces/${n}`)])).sort();
  // Ensure turbo present
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies.turbo = pkg.devDependencies.turbo || '^1.10.0';
  pkg.devDependencies.typescript = pkg.devDependencies.typescript || '^5.0.0';
  writeJSON(pkgPath, pkg);
  log('📝 Updated root package.json workspaces');
}

function main() {
  const opts = parseArgs();
  const monorepoRoot = path.resolve(__dirname, '..');
  if (!opts.target) {
    console.log(`\nInject workspaces into an external project\n\nUsage:\n  node scripts/inject-into-project.js --target=/path/to/project --mode=single --workspaces=ai [--skip-install]\n  node scripts/inject-into-project.js /path/to/project --mode=full\n\nModes:\n  single     Inject first workspace from --workspaces (default ai)\n  selective  Inject comma-separated list from --workspaces\n  full       Inject all workspaces from this monorepo (excluding test-*)\n  fresh      Create a fresh monorepo scaffold at target and inject selected\n`);
    process.exit(1);
  }
  const targetRoot = path.resolve(opts.target);
  ensureDir(targetRoot);

  const allWs = getAllMonorepoWorkspaces(monorepoRoot);
  let selected = [];
  if (opts.mode === 'full') selected = allWs;
  else if (opts.mode === 'selective') selected = opts.workspaces.length ? opts.workspaces : ['ai'];
  else if (opts.mode === 'fresh') selected = opts.workspaces.length ? opts.workspaces : ['ai'];
  else selected = opts.workspaces.length ? [opts.workspaces[0]] : ['ai'];

  // Validate selection
  const missing = selected.filter(n => !allWs.includes(n));
  if (missing.length) {
    error(`Unknown workspace(s): ${missing.join(', ')}. Available: ${allWs.join(', ')}`);
    process.exit(1);
  }

  if (opts.mode === 'fresh') {
    log('🧱 Creating fresh scaffold at target');
  }
  ensureRootScaffold(targetRoot);

  // Copy workspaces
  const targetWsDir = path.join(targetRoot, 'workspaces');
  ensureDir(targetWsDir);
  for (const name of selected) {
    const src = path.join(monorepoRoot, 'workspaces', name);
    const dest = path.join(targetWsDir, name);
    if (fs.existsSync(dest)) {
      warn(`⚠️  Skipping ${name}; already exists in target`);
      continue;
    }
    log(`📦 Injecting workspace: ${name}`);
    copyRecursive(src, dest);
  }

  // Update root workspace list
  upsertRootWorkspaces(targetRoot, selected);

  // Install deps unless skipped
  if (!opts.skipInstall) {
    try {
      log('📦 Installing dependencies in target root...');
      execSync('npm install --prefer-offline --no-audit --no-fund --legacy-peer-deps', { stdio: 'inherit', cwd: targetRoot });
    } catch (e) {
      warn('⚠️  npm install failed; please run it manually');
    }
  }

  log('✅ Injection complete');
  log(`📁 Target: ${targetRoot}`);
  log(`🧩 Workspaces: ${selected.join(', ')}`);
}

if (require.main === module) {
  main();
}


