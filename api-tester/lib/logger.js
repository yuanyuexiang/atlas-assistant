/**
 * 彩色日志工具
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

class Logger {
  constructor(module = '') {
    this.module = module;
  }

  _format(level, emoji, color, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    const moduleStr = this.module ? `[${this.module}]` : '';
    const msgStr = `${emoji} ${colors.dim}${timestamp}${colors.reset} ${color}${moduleStr}${colors.reset} ${message}`;
    
    console.log(msgStr);
    if (data) {
      console.log(colors.dim + JSON.stringify(data, null, 2) + colors.reset);
    }
  }

  info(message, data = null) {
    this._format('INFO', '📌', colors.blue, message, data);
  }

  success(message, data = null) {
    this._format('SUCCESS', '✅', colors.green, message, data);
  }

  error(message, error = null) {
    this._format('ERROR', '❌', colors.red, message);
    if (error) {
      console.error(colors.red + (error.stack || error.message || error) + colors.reset);
    }
  }

  warn(message, data = null) {
    this._format('WARN', '⚠️ ', colors.yellow, message, data);
  }

  debug(message, data = null) {
    this._format('DEBUG', '🔍', colors.dim, message, data);
  }

  header(title) {
    console.log('\n' + colors.bright + colors.cyan + '━'.repeat(60) + colors.reset);
    console.log(colors.bright + colors.cyan + `📦 ${title}` + colors.reset);
    console.log(colors.bright + colors.cyan + '━'.repeat(60) + colors.reset);
  }

  section(title) {
    console.log('\n' + colors.yellow + `▶ ${title}` + colors.reset);
  }

  metric(label, value, unit = '') {
    console.log(`  ${colors.dim}${label}:${colors.reset} ${colors.bright}${value}${unit}${colors.reset}`);
  }
}

export default Logger;
