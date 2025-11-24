/**
 * 对话模块测试
 */

import Logger from '../lib/logger.js';

const logger = new Logger('对话模块');

export async function testChat(client, reporter, conversationName) {
  logger.header('模块 5/6: 对话模块（同步）');

  if (!conversationName) {
    logger.warn('没有可用的客服,跳过对话测试');
    return;
  }

  // 测试 1: 发送简单问题
  await testSendMessage(client, reporter, conversationName, '你好');

  // 测试 2: 发送知识库相关问题
  await testSendMessage(client, reporter, conversationName, '介绍一下你们的产品特点');

  // 测试 3: 测试多轮对话
  await testMultiRoundChat(client, reporter, conversationName);
}

async function testSendMessage(client, reporter, conversationName, message) {
  logger.section(`测试: 发送消息 "${message}"`);
  const startTime = Date.now();

  try {
    const response = await client.post(`/chat/${conversationName}/message`, {
      content: message,
      session_id: `test_session_${Date.now()}`
    });

    const duration = Date.now() - startTime;

    if (response.ok && response.data.content) {
      logger.success(`对话成功 (${duration}ms)`);
      logger.metric('响应长度', response.data.content.length + ' 字符');
      logger.metric('使用知识库', response.data.knowledge_base_used ? '是' : '否');
      logger.info('AI 回复:');
      console.log('  ' + response.data.content.substring(0, 100) + (response.data.content.length > 100 ? '...' : ''));
      
      reporter.add('对话模块', `发送消息: ${message}`, true, duration, null, {
        message_length: response.data.content.length,
        knowledge_base_used: response.data.knowledge_base_used
      });
    } else {
      logger.error(`对话失败 [${response.status}]`, response.data);
      reporter.add('对话模块', `发送消息: ${message}`, false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('对话异常', error);
    reporter.add('对话模块', `发送消息: ${message}`, false, duration, error);
  }
}

async function testMultiRoundChat(client, reporter, conversationName) {
  logger.section('测试: 多轮对话');
  const startTime = Date.now();
  const sessionId = `test_session_${Date.now()}`;

  const messages = [
    '你们的产品有什么特点？',
    '价格如何？',
    '支持哪些平台？'
  ];

  let allSuccess = true;
  const results = [];

  for (const message of messages) {
    try {
      const response = await client.post(`/chat/${conversationName}/message`, {
        content: message,
        session_id: sessionId
      });

      if (response.ok && response.data.content) {
        results.push({
          question: message,
          answer: response.data.content.substring(0, 50) + '...',
          duration: response.duration
        });
      } else {
        allSuccess = false;
        break;
      }

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      allSuccess = false;
      break;
    }
  }

  const duration = Date.now() - startTime;

  if (allSuccess) {
    logger.success(`多轮对话成功 (${duration}ms, ${messages.length} 轮)`);
    results.forEach((r, idx) => {
      logger.metric(`  ${idx + 1}. ${r.question}`, `${r.duration}ms`);
    });
    
    reporter.add('对话模块', '多轮对话', true, duration, null, {
      rounds: messages.length,
      session_id: sessionId
    });
  } else {
    logger.error(`多轮对话失败 (${duration}ms)`);
    reporter.add('对话模块', '多轮对话', false, duration, '部分对话失败');
  }
}

export async function testStreamChat(client, reporter, conversationName) {
  logger.header('模块 6/6: 流式对话');

  if (!conversationName) {
    logger.warn('没有可用的客服,跳过流式对话测试');
    return;
  }

  await testStreamMessage(client, reporter, conversationName);
}

async function testStreamMessage(client, reporter, conversationName) {
  logger.section('测试: 流式对话');
  logger.info('发送问题: "请详细介绍一下你们的产品特点和优势"');
  
  const startTime = Date.now();

  try {
    const result = await client.stream(`/chat/${conversationName}/message/stream`, {
      content: '请详细介绍一下你们的产品特点和优势',
      session_id: `stream_test_${Date.now()}`
    });

    if (result.ok) {
      logger.success(`流式对话完成 (${result.totalTime}ms)`);
      logger.metric('首字节时间 (TTFB)', result.ttfb + 'ms');
      logger.metric('总响应时间', result.totalTime + 'ms');
      logger.metric('数据块数量', result.chunkCount);
      logger.metric('响应长度', result.contentLength + ' 字符');
      logger.metric('平均速度', Math.round(result.contentLength / (result.totalTime / 1000)) + ' 字符/秒');
      
      logger.info('AI 回复（前100字符）:');
      console.log('  ' + result.content.substring(0, 100) + '...');
      
      reporter.add('流式对话', '流式消息', true, result.totalTime, null, {
        ttfb: result.ttfb,
        chunk_count: result.chunkCount,
        content_length: result.contentLength,
        chars_per_second: Math.round(result.contentLength / (result.totalTime / 1000))
      });
    } else {
      logger.error(`流式对话失败 [${result.status}]`, result.error);
      reporter.add('流式对话', '流式消息', false, result.duration || 0, result.error);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('流式对话异常', error);
    reporter.add('流式对话', '流式消息', false, duration, error);
  }
}
