#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutomatedReporter {
  constructor() {
    this.resultsDir = path.join(process.cwd(), 'benchmark-results');
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.resultsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runFullBenchmarkSuite() {
    this.log('Starting full benchmark suite...');
    
    const results = {
      timestamp: new Date().toISOString(),
      benchmarks: {},
      memory: {},
      validation: {},
      errors: []
    };

    try {
      // Run performance benchmarks
      this.log('Running performance benchmarks...');
      const BenchmarkRunner = require('./benchmark.js');
      const benchmarkRunner = new BenchmarkRunner();
      results.benchmarks = await benchmarkRunner.run();
    } catch (error) {
      this.log(`Benchmark suite failed: ${error.message}`, 'error');
      results.errors.push(`Benchmark: ${error.message}`);
    }

    try {
      // Run memory monitoring
      this.log('Running memory benchmarks...');
      const MemoryMonitor = require('./memory-monitor.js');
      const memoryMonitor = new MemoryMonitor();
      results.memory = await memoryMonitor.benchmarkMemoryUsage();
    } catch (error) {
      this.log(`Memory monitoring failed: ${error.message}`, 'error');
      results.errors.push(`Memory: ${error.message}`);
    }

    try {
      // Run validation
      this.log('Running dependency validation...');
      const validationOutput = execSync('npm run validate:deps', { encoding: 'utf8' });
      results.validation = {
        success: true,
        output: validationOutput
      };
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      results.validation = {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
      results.errors.push(`Validation: ${error.message}`);
    }

    return results;
  }

  generateComprehensiveReport(results) {
    const report = {
      ...results,
      summary: this.generateSummary(results),
      recommendations: this.generateRecommendations(results),
      trends: this.analyzeTrends()
    };

    // Save JSON report
    const jsonPath = path.join(this.reportsDir, `comprehensive-report-${this.timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdown = this.generateMarkdownReport(report);
    const markdownPath = path.join(this.reportsDir, `comprehensive-report-${this.timestamp}.md`);
    fs.writeFileSync(markdownPath, markdown);

    // Generate HTML report
    const html = this.generateHtmlReport(report);
    const htmlPath = path.join(this.reportsDir, `comprehensive-report-${this.timestamp}.html`);
    fs.writeFileSync(htmlPath, html);

    this.log('Comprehensive reports generated:');
    this.log(`  JSON: ${jsonPath}`);
    this.log(`  Markdown: ${markdownPath}`);
    this.log(`  HTML: ${htmlPath}`);

    return report;
  }

  generateSummary(results) {
    const summary = {
      overallHealth: 'unknown',
      totalIssues: results.errors.length,
      benchmarkStatus: results.benchmarks ? 'completed' : 'failed',
      memoryStatus: results.memory ? 'completed' : 'failed',
      validationStatus: results.validation?.success ? 'passed' : 'failed',
      keyMetrics: {}
    };

    // Determine overall health
    if (results.errors.length === 0) {
      summary.overallHealth = 'excellent';
    } else if (results.errors.length <= 2) {
      summary.overallHealth = 'good';
    } else if (results.errors.length <= 5) {
      summary.overallHealth = 'fair';
    } else {
      summary.overallHealth = 'poor';
    }

    // Extract key metrics
    if (results.benchmarks?.cacheEffectiveness) {
      summary.keyMetrics.cacheHitRate = results.benchmarks.cacheEffectiveness.cacheHitRate;
      summary.keyMetrics.cacheSpeedup = results.benchmarks.cacheEffectiveness.speedupRatio;
    }

    if (results.benchmarks?.summary) {
      summary.keyMetrics.averageBuildTime = results.benchmarks.summary.averageBuildTime;
    }

    if (results.memory && Array.isArray(results.memory) && results.memory.length > 0) {
      const buildMemory = results.memory.find(m => m.command === 'npm run build');
      if (buildMemory?.analysis) {
        summary.keyMetrics.peakMemoryUsage = buildMemory.analysis.system.peak;
      }
    }

    return summary;
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Cache effectiveness recommendations
    if (results.benchmarks?.cacheEffectiveness) {
      const cacheHitRate = results.benchmarks.cacheEffectiveness.cacheHitRate;
      if (cacheHitRate < 50) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          title: 'Low Cache Hit Rate',
          description: `Cache hit rate is ${cacheHitRate.toFixed(1)}%. Consider reviewing cache configuration and dependencies.`,
          action: 'Review turbo.json cache settings and ensure proper dependency declarations'
        });
      } else if (cacheHitRate < 80) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          title: 'Moderate Cache Hit Rate',
          description: `Cache hit rate is ${cacheHitRate.toFixed(1)}%. There's room for improvement.`,
          action: 'Optimize build outputs and cache keys for better cache effectiveness'
        });
      }
    }

    // Memory usage recommendations
    if (results.memory && Array.isArray(results.memory)) {
      const buildMemory = results.memory.find(m => m.command === 'npm run build');
      if (buildMemory?.analysis?.system?.peak > 8) {
        recommendations.push({
          type: 'memory',
          priority: 'medium',
          title: 'High Memory Usage',
          description: `Peak memory usage during build is ${buildMemory.analysis.system.peak.toFixed(2)}GB.`,
          action: 'Consider optimizing build processes or increasing available memory'
        });
      }
    }

    // Validation recommendations
    if (!results.validation?.success) {
      recommendations.push({
        type: 'validation',
        priority: 'high',
        title: 'Validation Failures',
        description: 'Dependency validation failed. This may indicate configuration issues.',
        action: 'Review and fix dependency validation errors'
      });
    }

    // Build time recommendations
    if (results.benchmarks?.summary?.averageBuildTime > 60) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Slow Build Times',
        description: `Average build time is ${results.benchmarks.summary.averageBuildTime.toFixed(1)}s.`,
        action: 'Consider optimizing build processes, enabling more caching, or parallelizing builds'
      });
    }

    return recommendations;
  }

  analyzeTrends() {
    // Look for previous reports to analyze trends
    const trends = {
      available: false,
      buildTimeChange: null,
      memoryUsageChange: null,
      cacheEffectivenessChange: null
    };

    try {
      const reportFiles = fs.readdirSync(this.reportsDir)
        .filter(file => file.startsWith('comprehensive-report-') && file.endsWith('.json'))
        .sort()
        .slice(-5); // Get last 5 reports

      if (reportFiles.length >= 2) {
        trends.available = true;
        // Simple trend analysis could be implemented here
        // For now, just indicate that trend data is available
      }
    } catch (error) {
      // Trends not available
    }

    return trends;
  }

  generateMarkdownReport(report) {
    let markdown = `# Comprehensive Performance Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n`;
    markdown += `**Overall Health:** ${report.summary.overallHealth.toUpperCase()}\n`;
    markdown += `**Total Issues:** ${report.summary.totalIssues}\n\n`;

    // Summary section
    markdown += `## Summary\n\n`;
    markdown += `| Metric | Status | Value |\n`;
    markdown += `|--------|--------|---------|\n`;
    markdown += `| Benchmarks | ${report.summary.benchmarkStatus} | - |\n`;
    markdown += `| Memory Monitoring | ${report.summary.memoryStatus} | - |\n`;
    markdown += `| Validation | ${report.summary.validationStatus} | - |\n`;

    if (Object.keys(report.summary.keyMetrics).length > 0) {
      markdown += `\n### Key Metrics\n\n`;
      for (const [metric, value] of Object.entries(report.summary.keyMetrics)) {
        const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
        markdown += `- **${metric}:** ${formattedValue}\n`;
      }
    }

    // Recommendations section
    if (report.recommendations.length > 0) {
      markdown += `\n## Recommendations\n\n`;
      const priorityOrder = ['high', 'medium', 'low'];
      
      for (const priority of priorityOrder) {
        const recs = report.recommendations.filter(r => r.priority === priority);
        if (recs.length > 0) {
          markdown += `### ${priority.toUpperCase()} Priority\n\n`;
          for (const rec of recs) {
            markdown += `#### ${rec.title}\n`;
            markdown += `**Type:** ${rec.type}\n\n`;
            markdown += `${rec.description}\n\n`;
            markdown += `**Recommended Action:** ${rec.action}\n\n`;
          }
        }
      }
    }

    // Errors section
    if (report.errors.length > 0) {
      markdown += `## Errors\n\n`;
      for (const error of report.errors) {
        markdown += `- ${error}\n`;
      }
      markdown += `\n`;
    }

    // Benchmark details
    if (report.benchmarks) {
      markdown += `## Benchmark Results\n\n`;
      if (report.benchmarks.cacheEffectiveness) {
        markdown += `### Cache Effectiveness\n`;
        markdown += `- **Hit Rate:** ${report.benchmarks.cacheEffectiveness.cacheHitRate.toFixed(1)}%\n`;
        markdown += `- **Speedup:** ${report.benchmarks.cacheEffectiveness.speedupRatio.toFixed(2)}x\n`;
        markdown += `- **Time Saved:** ${report.benchmarks.cacheEffectiveness.timeSaved.toFixed(1)}s\n\n`;
      }
    }

    return markdown;
  }

  generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report - ${report.timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .health-excellent { color: #28a745; }
        .health-good { color: #17a2b8; }
        .health-fair { color: #ffc107; }
        .health-poor { color: #dc3545; }
        .metric-card { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation { border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; background: #f8f9fa; }
        .recommendation.high { border-color: #dc3545; }
        .recommendation.medium { border-color: #ffc107; }
        .recommendation.low { border-color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Performance Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        <p><strong>Overall Health:</strong> <span class="health-${report.summary.overallHealth}">${report.summary.overallHealth.toUpperCase()}</span></p>
        <p><strong>Total Issues:</strong> ${report.summary.totalIssues}</p>
    </div>

    <h2>Summary</h2>
    <table>
        <tr><th>Component</th><th>Status</th></tr>
        <tr><td>Benchmarks</td><td>${report.summary.benchmarkStatus}</td></tr>
        <tr><td>Memory Monitoring</td><td>${report.summary.memoryStatus}</td></tr>
        <tr><td>Validation</td><td>${report.summary.validationStatus}</td></tr>
    </table>

    ${Object.keys(report.summary.keyMetrics).length > 0 ? `
    <h3>Key Metrics</h3>
    ${Object.entries(report.summary.keyMetrics).map(([metric, value]) => `
    <div class="metric-card">
        <strong>${metric}:</strong> ${typeof value === 'number' ? value.toFixed(2) : value}
    </div>
    `).join('')}
    ` : ''}

    ${report.recommendations.length > 0 ? `
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
    <div class="recommendation ${rec.priority}">
        <h4>${rec.title}</h4>
        <p><strong>Type:</strong> ${rec.type} | <strong>Priority:</strong> ${rec.priority}</p>
        <p>${rec.description}</p>
        <p><strong>Recommended Action:</strong> ${rec.action}</p>
    </div>
    `).join('')}
    ` : ''}

    ${report.errors.length > 0 ? `
    <h2>Errors</h2>
    ${report.errors.map(error => `<div class="error">${error}</div>`).join('')}
    ` : ''}

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
        <p>Report generated by Modular AI Scaffold automated reporting system</p>
    </footer>
</body>
</html>`;

    return html;
  }

  async run() {
    this.log('Starting automated reporting...');
    
    const results = await this.runFullBenchmarkSuite();
    const report = this.generateComprehensiveReport(results);
    
    this.log(`Automated reporting completed. Overall health: ${report.summary.overallHealth}`, 'success');
    
    return report;
  }
}

// CLI interface
if (require.main === module) {
  const reporter = new AutomatedReporter();
  reporter.run().catch(error => {
    console.error('❌ Automated reporting failed:', error);
    process.exit(1);
  });
}

module.exports = AutomatedReporter;