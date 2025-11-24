/**
 * 客服模块测试
 */

import Logger from '../lib/logger.js';

const logger = new Logger('客服模块');

export async function testConversations(client, reporter, agentName) {
  logger.header('模块 4/6: 客服模块');

  if (!agentName) {
    logger.warn('没有可用的智能体,跳过客服测试');
    return { conversationName: null };
  }

  const timestamp = Date.now();
  const testConvName = `test_conv_${timestamp}`;

  // 测试 1: 创建客服
  const createSuccess = await testCreateConversation(client, reporter, testConvName, agentName);
  if (!createSuccess) {
    logger.warn('创建客服失败,跳过后续测试');
    return { conversationName: null };
  }

  // 测试 2: 获取客服列表
  await testGetConversationList(client, reporter);

  // 测试 3: 获取客服详情
  await testGetConversationDetail(client, reporter, testConvName);

  // 测试 4: 更新客服
  await testUpdateConversation(client, reporter, testConvName);

  // 测试 5: 获取客服列表（筛选online）
  await testGetConversationListFiltered(client, reporter);

  return { conversationName: testConvName };
}

async function testCreateConversation(client, reporter, conversationName, agentName) {
  logger.section('测试: 创建客服');
  const startTime = Date.now();

  try {
    const response = await client.post('/conversations', {
      name: conversationName,
      display_name: '测试客服小李',
      agent_name: agentName,
      avatar: '👩‍💼',
      welcome_message: '您好，我是测试客服小李，有什么可以帮您？',
      description: '这是一个测试客服'
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`创建客服成功 (${duration}ms)`);
      logger.metric('名称', conversationName);
      logger.metric('显示名', response.data.display_name);
      logger.metric('关联智能体', agentName);
      logger.metric('状态', response.data.status);
      
      reporter.add('客服模块', '创建客服', true, duration, null, {
        name: conversationName,
        agent_name: agentName
      });
      return true;
    } else {
      logger.error(`创建客服失败 [${response.status}]`, response.data);
      reporter.add('客服模块', '创建客服', false, duration, response.data);
      return false;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('创建客服异常', error);
    reporter.add('客服模块', '创建客服', false, duration, error);
    return false;
  }
}

async function testGetConversationList(client, reporter) {
  logger.section('测试: 获取客服列表');
  const startTime = Date.now();

  try {
    const response = await client.get('/conversations');
    const duration = Date.now() - startTime;

    if (response.ok && Array.isArray(response.data)) {
      logger.success(`获取客服列表成功 (${duration}ms)`);
      logger.metric('客服数量', response.data.length);
      
      if (response.data.length > 0) {
        logger.info('前3个客服:');
        response.data.slice(0, 3).forEach((conv, idx) => {
          const agentInfo = conv.agent ? ` -> ${conv.agent.name}` : '';
          logger.metric(`  ${idx + 1}. ${conv.name}`, `${conv.display_name}${agentInfo}`);
        });
      }
      
      reporter.add('客服模块', '获取客服列表', true, duration, null, {
        count: response.data.length
      });
    } else {
      logger.error(`获取客服列表失败 [${response.status}]`, response.data);
      reporter.add('客服模块', '获取客服列表', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取客服列表异常', error);
    reporter.add('客服模块', '获取客服列表', false, duration, error);
  }
}

async function testGetConversationDetail(client, reporter, conversationName) {
  logger.section('测试: 获取客服详情');
  const startTime = Date.now();

  try {
    const response = await client.get(`/conversations/${conversationName}`);
    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`获取客服详情成功 (${duration}ms)`);
      logger.metric('名称', response.data.name);
      logger.metric('显示名', response.data.display_name);
      logger.metric('状态', response.data.status);
      logger.metric('消息数', response.data.message_count || 0);
      
      if (response.data.agent) {
        logger.metric('关联智能体', response.data.agent.name);
      }
      
      reporter.add('客服模块', '获取客服详情', true, duration, null, {
        name: response.data.name,
        status: response.data.status
      });
    } else {
      logger.error(`获取客服详情失败 [${response.status}]`, response.data);
      reporter.add('客服模块', '获取客服详情', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取客服详情异常', error);
    reporter.add('客服模块', '获取客服详情', false, duration, error);
  }
}

async function testUpdateConversation(client, reporter, conversationName) {
  logger.section('测试: 更新客服');
  const startTime = Date.now();

  try {
    const newDisplayName = '更新后的客服名称';
    const response = await client.put(`/conversations/${conversationName}`, {
      display_name: newDisplayName,
      status: 'online',
      description: '这是更新后的描述'
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`更新客服成功 (${duration}ms)`);
      logger.metric('新显示名', newDisplayName);
      reporter.add('客服模块', '更新客服', true, duration, null, {
        name: conversationName,
        new_display_name: newDisplayName
      });
    } else {
      logger.error(`更新客服失败 [${response.status}]`, response.data);
      reporter.add('客服模块', '更新客服', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('更新客服异常', error);
    reporter.add('客服模块', '更新客服', false, duration, error);
  }
}

async function testGetConversationListFiltered(client, reporter) {
  logger.section('测试: 获取客服列表（筛选online）');
  const startTime = Date.now();

  try {
    const response = await client.get('/conversations?status=online');
    const duration = Date.now() - startTime;

    if (response.ok && Array.isArray(response.data)) {
      logger.success(`获取筛选列表成功 (${duration}ms)`);
      logger.metric('online客服数量', response.data.length);
      reporter.add('客服模块', '获取客服列表（筛选）', true, duration, null, {
        count: response.data.length
      });
    } else {
      logger.error(`获取筛选列表失败 [${response.status}]`, response.data);
      reporter.add('客服模块', '获取客服列表（筛选）', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取筛选列表异常', error);
    reporter.add('客服模块', '获取客服列表（筛选）', false, duration, error);
  }
}
