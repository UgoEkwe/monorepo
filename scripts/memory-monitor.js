#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const os = require('os');

class MemoryMonitor {
  constructor() {
    this.resultsDir = path.join(process.cwd(), 'benchmark-results');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.monitoringData = [];
    this.isMonitoring = false;
    this.monitorInterval = null;
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

  getSystemMemoryInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedPercent: (usedMem / totalMem) * 100,
      totalGB: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
      usedGB: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100,
      freeGB: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100
    };
  }

  getProcessMemoryInfo() {
    const memUsage = process.memoryUsage();
    
    return {
      rss: memUsage.rss, // Resident Set Size
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rssMB: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      externalMB: Math.round(memUsage.external / 1024 / 1024 * 100) / 100
    };
  }

  async getNodeProcesses() {
    try {
      let processes = [];
      
      if (process.platform === 'darwin' || process.platform === 'linux') {
        // Use ps command on Unix-like systems
        const psOutput = execSync('ps aux | grep node | grep -v grep', { encoding: 'utf8' });
        const lines = psOutput.trim().split('\n').filter(line => line.trim());
        
        processes = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            pid: parseInt(parts[1]),
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]),
            command: parts.slice(10).join(' ')
          };
        });
      } else if (process.platform === 'win32') {
        // Use tasklist on Windows
        const tasklistOutput = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
        const lines = tasklistOutput.trim().split('\n').slice(1); // Skip header
        
        processes = lines.map(line => {
          const parts = line.split(',').map(part => part.replace(/"/g, ''));
          return {
            pid: parseInt(parts[1]),
            memory: parseInt(parts[4].replace(/[^\d]/g, '')) * 1024, // Convert KB to bytes
            command: parts[0]
          };
        });
      }
      
      return processes;
    } catch (error) {
      this.log(`Warning: Could not get Node processes: ${error.message}`, 'warning');
      return [];
    }
  }

  async collectMemorySnapshot() {
    const timestamp = Date.now();
    const systemMem = this.getSystemMemoryInfo();
    const processMem = this.getProcessMemoryInfo();
    const nodeProcesses = await this.getNodeProcesses();
    
    const snapshot = {
      timestamp,
      datetime: new Date(timestamp).toISOString(),
      system: systemMem,
      process: processMem,
      nodeProcesses,
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    };
    
    return snapshot;
  }

  startMonitoring(intervalMs = 1000) {
    if (this.isMonitoring) {
      this.log('Memory monitoring is already running', 'warning');
      return;
    }

    this.log(`Starting memory monitoring (interval: ${intervalMs}ms)`);
    this.isMonitoring = true;
    this.monitoringData = [];

    this.monitorInterval = setInterval(async () => {
      try {
        const snapshot = await this.collectMemorySnapshot();
        this.monitoringData.push(snapshot);
        
        // Log periodic updates
        if (this.monitoringData.length % 10 === 0) {
          this.log(`Memory snapshot ${this.monitoringData.length}: ${snapshot.system.usedGB}GB used (${snapshot.system.usedPercent.toFixed(1)}%)`);
        }
      } catch (error) {
        this.log(`Error collecting memory snapshot: ${error.message}`, 'error');
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      this.log('Memory monitoring is not running', 'warning');
      return;
    }

    this.log('Stopping memory monitoring');
    this.isMonitoring = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  async monitorCommand(command, options = {}) {
    const { intervalMs = 1000, timeout = 300000 } = options; // 5 minute default timeout
    
    this.log(`Monitoring memory usage for command: ${command}`);
    
    // Start monitoring
    this.startMonitoring(intervalMs);
    
    const startTime = Date.now();
    let commandProcess;
    
    try {
      // Execute the command
      commandProcess = spawn('sh', ['-c', command], {
        stdio: 'inherit',
        detached: false
      });
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (commandProcess && !commandProcess.killed) {
          this.log('Command timed out, killing process', 'warning');
          commandProcess.kill('SIGTERM');
        }
      }, timeout);
      
      // Wait for command to complete
      await new Promise((resolve, reject) => {
        commandProcess.on('close', (code) => {
          clearTimeout(timeoutId);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Command exited with code ${code}`));
          }
        });
        
        commandProcess.on('error', (error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });
      
    } catch (error) {
      this.log(`Command failed: ${error.message}`, 'error');
      throw error;
    } finally {
      // Stop monitoring
      this.stopMonitoring();
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    this.log(`Command completed in ${(duration / 1000).toFixed(2)}s`);
    
    return {
      command,
      duration,
      startTime,
      endTime,
      monitoringData: [...this.monitoringData]
    };
  }

  analyzeMemoryData(data) {
    if (!data || data.length === 0) {
      return null;
    }

    const systemMemory = data.map(d => d.system.usedGB);
    const processMemory = data.map(d => d.process.rssMB);
    const heapMemory = data.map(d => d.process.heapUsedMB);
    
    const analysis = {
      duration: data[data.length - 1].timestamp - data[0].timestamp,
      samples: data.length,
      system: {
        peak: Math.max(...systemMemory),
        average: systemMemory.reduce((a, b) => a + b, 0) / systemMemory.length,
        min: Math.min(...systemMemory)
      },
      process: {
        peak: Math.max(...processMemory),
        average: processMemory.reduce((a, b) => a + b, 0) / processMemory.length,
        min: Math.min(...processMemory)
      },
      heap: {
        peak: Math.max(...heapMemory),
        average: heapMemory.reduce((a, b) => a + b, 0) / heapMemory.length,
        min: Math.min(...heapMemory)
      },
      nodeProcesses: {
        peak: Math.max(...data.map(d => d.nodeProcesses.length)),
        average: data.reduce((sum, d) => sum + d.nodeProcesses.length, 0) / data.length
      }
    };

    return analysis;
  }

  generateMemoryReport(monitoringResult) {
    const analysis = this.analyzeMemoryData(monitoringResult.monitoringData);
    
    const report = {
      timestamp: new Date().toISOString(),
      command: monitoringResult.command,
      duration: monitoringResult.duration,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB'
      },
      analysis,
      rawData: monitoringResult.monitoringData
    };

    const reportPath = path.join(this.resultsDir, `memory-report-${this.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownMemoryReport(report);
    const markdownPath = path.join(this.resultsDir, `memory-report-${this.timestamp}.md`);
    fs.writeFileSync(markdownPath, markdownReport);

    this.log(`Memory reports generated:`);
    this.log(`  JSON: ${reportPath}`);
    this.log(`  Markdown: ${markdownPath}`);

    return report;
  }

  generateMarkdownMemoryReport(report) {
    let markdown = `# Memory Usage Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n`;
    markdown += `**Command:** \`${report.command}\`\n`;
    markdown += `**Duration:** ${(report.duration / 1000).toFixed(2)}s\n\n`;
    
    markdown += `## System Information\n\n`;
    markdown += `- **Platform:** ${report.system.platform} ${report.system.arch}\n`;
    markdown += `- **CPUs:** ${report.system.cpus}\n`;
    markdown += `- **Total Memory:** ${report.system.totalMemory}\n\n`;

    if (report.analysis) {
      markdown += `## Memory Analysis\n\n`;
      markdown += `### System Memory Usage\n`;
      markdown += `- **Peak:** ${report.analysis.system.peak.toFixed(2)}GB\n`;
      markdown += `- **Average:** ${report.analysis.system.average.toFixed(2)}GB\n`;
      markdown += `- **Minimum:** ${report.analysis.system.min.toFixed(2)}GB\n\n`;
      
      markdown += `### Process Memory Usage\n`;
      markdown += `- **Peak RSS:** ${report.analysis.process.peak.toFixed(2)}MB\n`;
      markdown += `- **Average RSS:** ${report.analysis.process.average.toFixed(2)}MB\n`;
      markdown += `- **Minimum RSS:** ${report.analysis.process.min.toFixed(2)}MB\n\n`;
      
      markdown += `### Heap Memory Usage\n`;
      markdown += `- **Peak Heap:** ${report.analysis.heap.peak.toFixed(2)}MB\n`;
      markdown += `- **Average Heap:** ${report.analysis.heap.average.toFixed(2)}MB\n`;
      markdown += `- **Minimum Heap:** ${report.analysis.heap.min.toFixed(2)}MB\n\n`;
      
      markdown += `### Node.js Processes\n`;
      markdown += `- **Peak Count:** ${report.analysis.nodeProcesses.peak}\n`;
      markdown += `- **Average Count:** ${report.analysis.nodeProcesses.average.toFixed(1)}\n\n`;
      
      markdown += `### Summary\n`;
      markdown += `- **Total Samples:** ${report.analysis.samples}\n`;
      markdown += `- **Monitoring Duration:** ${(report.analysis.duration / 1000).toFixed(2)}s\n`;
    }

    return markdown;
  }

  async benchmarkMemoryUsage() {
    this.log('Starting memory usage benchmarks...');
    
    const commands = [
      'npm run build',
      'turbo run build --filter=core',
      'turbo run build --filter=web',
      'npm run test',
      'turbo run test --filter=core'
    ];

    const results = [];
    
    for (const command of commands) {
      this.log(`Benchmarking memory usage for: ${command}`);
      try {
        const result = await this.monitorCommand(command, { intervalMs: 500 });
        const report = this.generateMemoryReport(result);
        results.push(report);
        
        // Brief summary
        if (report.analysis) {
          this.log(`Peak memory: ${report.analysis.system.peak.toFixed(2)}GB system, ${report.analysis.process.peak.toFixed(2)}MB process`);
        }
      } catch (error) {
        this.log(`Failed to benchmark ${command}: ${error.message}`, 'error');
      }
    }

    return results;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node memory-monitor.js <command>  - Monitor memory usage for a command');
    console.log('  node memory-monitor.js --benchmark - Run memory benchmarks for common commands');
    process.exit(1);
  }

  const monitor = new MemoryMonitor();
  
  if (args[0] === '--benchmark') {
    monitor.benchmarkMemoryUsage().catch(error => {
      console.error('❌ Memory benchmark failed:', error);
      process.exit(1);
    });
  } else {
    const command = args.join(' ');
    monitor.monitorCommand(command).then(result => {
      const report = monitor.generateMemoryReport(result);
      console.log('✅ Memory monitoring completed');
    }).catch(error => {
      console.error('❌ Memory monitoring failed:', error);
      process.exit(1);
    });
  }
}

module.exports = MemoryMonitor;