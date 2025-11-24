#!/usr/bin/env node

/**
 * Atlas Assistant API 测试工具
 * 主入口文件
 */

import APIClient from './lib/api-client.js';
import Logger from './lib/logger.js';
import Reporter from './lib/reporter.js';
import { testAuth } from './tests/01-auth.test.js';
import { testAgents } from './tests/02-agents.test.js';
import { testKnowledge } from './tests/03-knowledge.test.js';
import { testConversations } from './tests/04-conversations.test.js';
import { testChat, testStreamChat } from './tests/05-chat.test.js';

const logger = new Logger();

// 环境配置
const ENVIRONMENTS = {
  prod: 'https://atlas.matrix-net.tech/atlas/api',
  local: 'http://localhost:8000/atlas/api'
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    env: 'prod',
    module: 'all'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--env=')) {
      options.env = args[i].split('=')[1];
    } else if (args[i].startsWith('--module=')) {
      options.module = args[i].split('=')[1];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const baseURL = ENVIRONMENTS[options.env] || ENVIRONMENTS.prod;

  console.log('\n' + '🚀 Atlas Assistant API 测试工具'.padEnd(60, ' '));
  console.log('═'.repeat(60));
  logger.info(`测试环境: ${options.env.toUpperCase()}`);
  logger.info(`API地址: ${baseURL}`);
  logger.info(`测试模块: ${options.module.toUpperCase()}`);
  console.log('═'.repeat(60));

  const client = new APIClient(baseURL);
  const reporter = new Reporter();

  let token = null;
  let username = null;
  let agentName = null;
  let conversationName = null;

  try {
    // 模块 1: 认证
    if (options.module === 'all' || options.module === 'auth') {
      const authResult = await testAuth(client, reporter);
      token = authResult.token;
      username = authResult.username;
    }

    // 如果没有 token，尝试使用测试账号登录
    if (!token && options.module !== 'auth') {
      logger.info('尝试使用测试账号登录...');
      const loginResponse = await client.post('/auth/login', {
        username: 'admin',
        password: 'admin123'
      });

      if (loginResponse.ok && loginResponse.data.access_token) {
        token = loginResponse.data.access_token;
        client.setToken(token);
        logger.success('使用测试账号登录成功');
      } else {
        logger.error('无法获取有效 token，后续测试可能失败');
      }
    }

    // 模块 2: 智能体
    if (token && (options.module === 'all' || options.module === 'agents')) {
      const agentResult = await testAgents(client, reporter);
      agentName = agentResult.agentName;
    }

    // 模块 3: 知识库
    if (token && agentName && (options.module === 'all' || options.module === 'knowledge')) {
      await testKnowledge(client, reporter, agentName);
    }

    // 模块 4: 客服
    if (token && agentName && (options.module === 'all' || options.module === 'conversations')) {
      const convResult = await testConversations(client, reporter, agentName);
      conversationName = convResult.conversationName;
    }

    // 模块 5: 对话
    if (token && conversationName && (options.module === 'all' || options.module === 'chat')) {
      await testChat(client, reporter, conversationName);
    }

    // 模块 6: 流式对话
    if (token && conversationName && (options.module === 'all' || options.module === 'stream')) {
      await testStreamChat(client, reporter, conversationName);
    }

  } catch (error) {
    logger.error('测试执行异常', error);
  }

  // 生成报告
  reporter.printSummary();
  await reporter.saveToFile();

  // 退出码
  const report = reporter.generate();
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// 错误处理
process.on('unhandledRejection', (error) => {
  logger.error('未处理的 Promise 错误', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error);
  process.exit(1);
});

// 运行测试
main();
