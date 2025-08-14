#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

class BenchmarkRunner {
  constructor() {
    this.resultsDir = path.join(process.cwd(), 'benchmark-results');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.ensureResultsDir();
  }

  ensureResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkHyperfine() {
    try {
      execSync('hyperfine --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      this.log('hyperfine not found. Installing...', 'warning');
      try {
        // Try to install hyperfine
        if (process.platform === 'darwin') {
          execSync('brew install hyperfine', { stdio: 'inherit' });
        } else if (process.platform === 'linux') {
          execSync('curl -LO https://github.com/sharkdp/hyperfine/releases/download/v1.18.0/hyperfine_1.18.0_amd64.deb && sudo dpkg -i hyperfine_1.18.0_amd64.deb', { stdio: 'inherit' });
        } else {
          this.log('Please install hyperfine manually: https://github.com/sharkdp/hyperfine', 'error');
          return false;
        }
        return true;
      } catch (installError) {
        this.log('Failed to install hyperfine automatically', 'error');
        return false;
      }
    }
  }

  async clearCache() {
    this.log('Clearing Turbo cache...');
    try {
      execSync('rm -rf .turbo/cache', { stdio: 'pipe' });
      execSync('rm -rf node_modules/.cache', { stdio: 'pipe' });
      // Clear workspace-specific caches
      const workspaces = ['web', 'mobile', 'core', 'payments', 'ai', 'database', 'cli', 'backend'];
      for (const workspace of workspaces) {
        const workspacePath = path.join('workspaces', workspace);
        if (fs.existsSync(workspacePath)) {
          execSync(`rm -rf ${workspacePath}/.next ${workspacePath}/dist ${workspacePath}/build`, { stdio: 'pipe' });
        }
      }
    } catch (error) {
      this.log(`Warning: Could not clear all caches: ${error.message}`, 'warning');
    }
  }

  async warmupCache(command) {
    this.log(`Warming up cache for: ${command}`);
    try {
      execSync(command, { stdio: 'pipe', timeout: 300000 }); // 5 minute timeout
    } catch (error) {
      this.log(`Warning: Cache warmup failed: ${error.message}`, 'warning');
    }
  }

  async runBenchmark(name, command, options = {}) {
    const {
      warmup = 1,
      runs = 5,
      prepare = null,
      cleanup = null,
      exportJson = true
    } = options;

    this.log(`Running benchmark: ${name}`);
    
    const outputFile = path.join(this.resultsDir, `${name}-${this.timestamp}.json`);
    
    let hyperfineCmd = [
      'hyperfine',
      '--warmup', warmup.toString(),
      '--runs', runs.toString(),
      '--show-output'
    ];

    if (prepare) {
      hyperfineCmd.push('--prepare', prepare);
    }

    if (cleanup) {
      hyperfineCmd.push('--cleanup', cleanup);
    }

    if (exportJson) {
      hyperfineCmd.push('--export-json', outputFile);
    }

    hyperfineCmd.push(command);

    try {
      const result = execSync(hyperfineCmd.join(' '), { 
        stdio: 'inherit',
        timeout: 600000 // 10 minute timeout
      });
      
      if (exportJson && fs.existsSync(outputFile)) {
        const benchmarkData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        return benchmarkData;
      }
      
      return null;
    } catch (error) {
      this.log(`Benchmark failed: ${error.message}`, 'error');
      return null;
    }
  }

  async benchmarkBuildTimes() {
    this.log('Starting build time benchmarks...');
    
    const benchmarks = [
      {
        name: 'full-build-cold',
        command: 'npm run build',
        prepare: 'rm -rf .turbo/cache && rm -rf workspaces/*/dist workspaces/*/.next workspaces/*/build',
        description: 'Full monorepo build with cold cache'
      },
      {
        name: 'full-build-warm',
        command: 'npm run build',
        description: 'Full monorepo build with warm cache'
      },
      {
        name: 'core-build-cold',
        command: 'turbo run build --filter=core',
        prepare: 'rm -rf .turbo/cache && rm -rf workspaces/core/dist',
        description: 'Core workspace build with cold cache'
      },
      {
        name: 'core-build-warm',
        command: 'turbo run build --filter=core',
        description: 'Core workspace build with warm cache'
      },
      {
        name: 'web-build-cold',
        command: 'turbo run build --filter=web',
        prepare: 'rm -rf .turbo/cache && rm -rf workspaces/web/.next',
        description: 'Web workspace build with cold cache'
      },
      {
        name: 'web-build-warm',
        command: 'turbo run build --filter=web',
        description: 'Web workspace build with warm cache'
      }
    ];

    const results = {};
    
    for (const benchmark of benchmarks) {
      const result = await this.runBenchmark(
        benchmark.name,
        benchmark.command,
        {
          warmup: 1,
          runs: 3,
          prepare: benchmark.prepare
        }
      );
      
      if (result) {
        results[benchmark.name] = {
          ...result,
          description: benchmark.description
        };
      }
    }

    return results;
  }

  async benchmarkTestTimes() {
    this.log('Starting test time benchmarks...');
    
    const benchmarks = [
      {
        name: 'full-test',
        command: 'npm run test',
        description: 'Full monorepo test suite'
      },
      {
        name: 'core-test',
        command: 'turbo run test --filter=core',
        description: 'Core workspace tests'
      },
      {
        name: 'web-test',
        command: 'turbo run test --filter=web',
        description: 'Web workspace tests'
      },
      {
        name: 'payments-test',
        command: 'turbo run test --filter=payments',
        description: 'Payments workspace tests'
      }
    ];

    const results = {};
    
    for (const benchmark of benchmarks) {
      const result = await this.runBenchmark(
        benchmark.name,
        benchmark.command,
        {
          warmup: 1,
          runs: 3
        }
      );
      
      if (result) {
        results[benchmark.name] = {
          ...result,
          description: benchmark.description
        };
      }
    }

    return results;
  }

  async measureCacheEffectiveness() {
    this.log('Measuring cache effectiveness...');
    
    // Measure cold vs warm build times
    const coldBuildStart = Date.now();
    await this.clearCache();
    try {
      execSync('npm run build', { stdio: 'pipe', timeout: 600000 });
    } catch (error) {
      this.log('Cold build failed', 'error');
      return null;
    }
    const coldBuildTime = Date.now() - coldBuildStart;

    const warmBuildStart = Date.now();
    try {
      execSync('npm run build', { stdio: 'pipe', timeout: 600000 });
    } catch (error) {
      this.log('Warm build failed', 'error');
      return null;
    }
    const warmBuildTime = Date.now() - warmBuildStart;

    const cacheEffectiveness = {
      coldBuildTime: coldBuildTime / 1000, // Convert to seconds
      warmBuildTime: warmBuildTime / 1000,
      speedupRatio: coldBuildTime / warmBuildTime,
      timeSaved: (coldBuildTime - warmBuildTime) / 1000,
      cacheHitRate: Math.max(0, (1 - warmBuildTime / coldBuildTime) * 100)
    };

    this.log(`Cache effectiveness: ${cacheEffectiveness.cacheHitRate.toFixed(1)}% hit rate`);
    this.log(`Speed improvement: ${cacheEffectiveness.speedupRatio.toFixed(2)}x faster`);
    this.log(`Time saved: ${cacheEffectiveness.timeSaved.toFixed(1)}s`);

    return cacheEffectiveness;
  }

  async generateReport(buildResults, testResults, cacheEffectiveness) {
    const report = {
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
        node: process.version
      },
      buildBenchmarks: buildResults,
      testBenchmarks: testResults,
      cacheEffectiveness,
      summary: this.generateSummary(buildResults, testResults, cacheEffectiveness)
    };

    const reportPath = path.join(this.resultsDir, `benchmark-report-${this.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(this.resultsDir, `benchmark-report-${this.timestamp}.md`);
    fs.writeFileSync(markdownPath, markdownReport);

    this.log(`Reports generated:`);
    this.log(`  JSON: ${reportPath}`);
    this.log(`  Markdown: ${markdownPath}`);

    return report;
  }

  generateSummary(buildResults, testResults, cacheEffectiveness) {
    const summary = {
      totalBenchmarks: Object.keys(buildResults).length + Object.keys(testResults).length,
      fastestBuild: null,
      slowestBuild: null,
      averageBuildTime: 0,
      cacheSpeedup: cacheEffectiveness?.speedupRatio || 0
    };

    // Find fastest and slowest builds
    let fastestTime = Infinity;
    let slowestTime = 0;
    let totalTime = 0;
    let buildCount = 0;

    for (const [name, result] of Object.entries(buildResults)) {
      if (result.results && result.results.length > 0) {
        const meanTime = result.results[0].mean;
        totalTime += meanTime;
        buildCount++;

        if (meanTime < fastestTime) {
          fastestTime = meanTime;
          summary.fastestBuild = { name, time: meanTime };
        }

        if (meanTime > slowestTime) {
          slowestTime = meanTime;
          summary.slowestBuild = { name, time: meanTime };
        }
      }
    }

    if (buildCount > 0) {
      summary.averageBuildTime = totalTime / buildCount;
    }

    return summary;
  }

  generateMarkdownReport(report) {
    let markdown = `# Benchmark Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n\n`;
    
    markdown += `## System Information\n\n`;
    markdown += `- **Platform:** ${report.system.platform} ${report.system.arch}\n`;
    markdown += `- **CPUs:** ${report.system.cpus}\n`;
    markdown += `- **Memory:** ${report.system.memory}\n`;
    markdown += `- **Node.js:** ${report.system.node}\n\n`;

    if (report.cacheEffectiveness) {
      markdown += `## Cache Effectiveness\n\n`;
      markdown += `- **Cache Hit Rate:** ${report.cacheEffectiveness.cacheHitRate.toFixed(1)}%\n`;
      markdown += `- **Speed Improvement:** ${report.cacheEffectiveness.speedupRatio.toFixed(2)}x\n`;
      markdown += `- **Time Saved:** ${report.cacheEffectiveness.timeSaved.toFixed(1)}s\n`;
      markdown += `- **Cold Build Time:** ${report.cacheEffectiveness.coldBuildTime.toFixed(1)}s\n`;
      markdown += `- **Warm Build Time:** ${report.cacheEffectiveness.warmBuildTime.toFixed(1)}s\n\n`;
    }

    markdown += `## Build Benchmarks\n\n`;
    markdown += `| Benchmark | Mean Time | Min Time | Max Time | Description |\n`;
    markdown += `|-----------|-----------|----------|----------|--------------|\n`;
    
    for (const [name, result] of Object.entries(report.buildBenchmarks)) {
      if (result.results && result.results.length > 0) {
        const r = result.results[0];
        markdown += `| ${name} | ${r.mean.toFixed(2)}s | ${r.min.toFixed(2)}s | ${r.max.toFixed(2)}s | ${result.description || ''} |\n`;
      }
    }

    markdown += `\n## Test Benchmarks\n\n`;
    markdown += `| Benchmark | Mean Time | Min Time | Max Time | Description |\n`;
    markdown += `|-----------|-----------|----------|----------|--------------|\n`;
    
    for (const [name, result] of Object.entries(report.testBenchmarks)) {
      if (result.results && result.results.length > 0) {
        const r = result.results[0];
        markdown += `| ${name} | ${r.mean.toFixed(2)}s | ${r.min.toFixed(2)}s | ${r.max.toFixed(2)}s | ${result.description || ''} |\n`;
      }
    }

    if (report.summary) {
      markdown += `\n## Summary\n\n`;
      markdown += `- **Total Benchmarks:** ${report.summary.totalBenchmarks}\n`;
      if (report.summary.fastestBuild) {
        markdown += `- **Fastest Build:** ${report.summary.fastestBuild.name} (${report.summary.fastestBuild.time.toFixed(2)}s)\n`;
      }
      if (report.summary.slowestBuild) {
        markdown += `- **Slowest Build:** ${report.summary.slowestBuild.name} (${report.summary.slowestBuild.time.toFixed(2)}s)\n`;
      }
      markdown += `- **Average Build Time:** ${report.summary.averageBuildTime.toFixed(2)}s\n`;
      markdown += `- **Cache Speedup:** ${report.summary.cacheSpeedup.toFixed(2)}x\n`;
    }

    return markdown;
  }

  async run(options = {}) {
    const { 
      skipBuild = false, 
      skipTest = false, 
      skipCache = false 
    } = options;

    this.log('Starting comprehensive benchmark suite...');

    if (!(await this.checkHyperfine())) {
      this.log('Cannot run benchmarks without hyperfine', 'error');
      return;
    }

    let buildResults = {};
    let testResults = {};
    let cacheEffectiveness = null;

    if (!skipBuild) {
      buildResults = await this.benchmarkBuildTimes();
    }

    if (!skipTest) {
      testResults = await this.benchmarkTestTimes();
    }

    if (!skipCache) {
      cacheEffectiveness = await this.measureCacheEffectiveness();
    }

    const report = await this.generateReport(buildResults, testResults, cacheEffectiveness);
    
    this.log('Benchmark suite completed successfully!', 'success');
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    skipBuild: args.includes('--skip-build'),
    skipTest: args.includes('--skip-test'),
    skipCache: args.includes('--skip-cache')
  };

  const runner = new BenchmarkRunner();
  runner.run(options).catch(error => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  });
}

module.exports = BenchmarkRunner;