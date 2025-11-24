/**
 * 测试报告生成器
 */

import fs from 'fs';
import path from 'path';

class Reporter {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.moduleStats = {};
  }

  add(module, test, passed, duration, error = null, details = {}) {
    this.results.push({
      module,
      test,
      passed,
      duration,
      error: error ? (error.message || error.toString()) : null,
      details,
      timestamp: new Date().toISOString()
    });

    // 统计模块数据
    if (!this.moduleStats[module]) {
      this.moduleStats[module] = { total: 0, passed: 0, failed: 0, duration: 0 };
    }
    this.moduleStats[module].total++;
    this.moduleStats[module].duration += duration;
    if (passed) {
      this.moduleStats[module].passed++;
    } else {
      this.moduleStats[module].failed++;
    }
  }

  generate() {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = totalTests - passed;
    const totalDuration = Date.now() - this.startTime;
    const avgDuration = totalTests > 0 ? (totalDuration / totalTests).toFixed(2) : 0;

    const summary = {
      totalTests,
      passed,
      failed,
      passRate: totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0,
      totalDuration,
      avgDuration,
      timestamp: new Date().toISOString()
    };

    return {
      summary,
      moduleStats: this.moduleStats,
      details: this.results
    };
  }

  printSummary() {
    const report = this.generate();
    const { summary, moduleStats } = report;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 测试报告');
    console.log('═'.repeat(60));
    console.log(`总测试数: ${summary.totalTests}`);
    console.log(`✅ 通过: ${summary.passed} (${summary.passRate}%)`);
    console.log(`❌ 失败: ${summary.failed} (${(100 - summary.passRate).toFixed(1)}%)`);
    console.log(`⏱️  总耗时: ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 平均耗时: ${summary.avgDuration}ms`);

    // 模块统计
    console.log('\n📦 模块统计:');
    Object.entries(moduleStats).forEach(([module, stats]) => {
      const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
      const status = stats.failed === 0 ? '✅' : '❌';
      console.log(`  ${status} ${module}: ${stats.passed}/${stats.total} (${passRate}%) - ${(stats.duration / 1000).toFixed(2)}s`);
    });

    // 失败详情
    if (summary.failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  • [${r.module}] ${r.test}`);
          console.log(`    ${r.error}`);
        });
    }

    console.log('═'.repeat(60));
  }

  async saveToFile(filename = null) {
    const report = this.generate();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const defaultFilename = `test-results-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'results', filename || defaultFilename);

    // 确保目录存在
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n💾 报告已保存: ${filepath}`);

    // 同时保存一份最新的
    const latestPath = path.join(dir, 'latest-test-results.json');
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2), 'utf-8');

    return filepath;
  }
}

export default Reporter;
