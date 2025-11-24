/**
 * 智能体模块测试
 */

import Logger from '../lib/logger.js';

const logger = new Logger('智能体模块');

export async function testAgents(client, reporter) {
  logger.header('模块 2/6: 智能体模块');

  const timestamp = Date.now();
  const testAgentName = `test_agent_${timestamp}`;
  const testAgentName2 = `test_agent_legal_${timestamp}`;

  // 测试 1: 创建智能体
  const createSuccess = await testCreateAgent(client, reporter, testAgentName);
  if (!createSuccess) {
    logger.warn('创建智能体失败,跳过后续测试');
    return { agentName: null };
  }

  // 测试 2: 创建第二个智能体（不同类型）
  await testCreateAgent(client, reporter, testAgentName2, 'legal');

  // 测试 3: 获取智能体列表
  await testGetAgentList(client, reporter);

  // 测试 4: 获取智能体详情
  await testGetAgentDetail(client, reporter, testAgentName);

  // 测试 5: 更新智能体
  await testUpdateAgent(client, reporter, testAgentName);

  // 测试 6: 获取智能体列表（筛选）
  await testGetAgentListFiltered(client, reporter);

  return { agentName: testAgentName };
}

async function testCreateAgent(client, reporter, agentName, agentType = 'general') {
  logger.section(`测试: 创建智能体 (${agentType})`);
  const startTime = Date.now();

  try {
    const response = await client.post('/agents', {
      name: agentName,
      display_name: `测试智能体-${agentType}`,
      agent_type: agentType,
      system_prompt: `你是一个专业的${agentType === 'legal' ? '法律' : ''}客服助手`,
      description: `这是一个用于测试的${agentType}类型智能体`
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`创建智能体成功 (${duration}ms)`);
      logger.metric('名称', agentName);
      logger.metric('类型', agentType);
      logger.metric('状态', response.data.status);
      reporter.add('智能体模块', `创建智能体 (${agentType})`, true, duration, null, {
        name: agentName,
        type: agentType
      });
      return true;
    } else {
      logger.error(`创建智能体失败 [${response.status}]`, response.data);
      reporter.add('智能体模块', `创建智能体 (${agentType})`, false, duration, response.data);
      return false;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('创建智能体异常', error);
    reporter.add('智能体模块', `创建智能体 (${agentType})`, false, duration, error);
    return false;
  }
}

async function testGetAgentList(client, reporter) {
  logger.section('测试: 获取智能体列表');
  const startTime = Date.now();

  try {
    const response = await client.get('/agents');
    const duration = Date.now() - startTime;

    if (response.ok && Array.isArray(response.data)) {
      logger.success(`获取智能体列表成功 (${duration}ms)`);
      logger.metric('智能体数量', response.data.length);
      
      if (response.data.length > 0) {
        logger.info('前3个智能体:');
        response.data.slice(0, 3).forEach((agent, idx) => {
          logger.metric(`  ${idx + 1}. ${agent.name}`, `${agent.display_name} (${agent.agent_type})`);
        });
      }
      
      reporter.add('智能体模块', '获取智能体列表', true, duration, null, {
        count: response.data.length
      });
    } else {
      logger.error(`获取智能体列表失败 [${response.status}]`, response.data);
      reporter.add('智能体模块', '获取智能体列表', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取智能体列表异常', error);
    reporter.add('智能体模块', '获取智能体列表', false, duration, error);
  }
}

async function testGetAgentDetail(client, reporter, agentName) {
  logger.section('测试: 获取智能体详情');
  const startTime = Date.now();

  try {
    const response = await client.get(`/agents/${agentName}`);
    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`获取智能体详情成功 (${duration}ms)`);
      logger.metric('名称', response.data.name);
      logger.metric('显示名', response.data.display_name);
      logger.metric('类型', response.data.agent_type);
      logger.metric('状态', response.data.status);
      
      if (response.data.knowledge_base) {
        logger.metric('知识库文件数', response.data.knowledge_base.total_files);
        logger.metric('向量数', response.data.knowledge_base.total_vectors);
      }
      
      reporter.add('智能体模块', '获取智能体详情', true, duration, null, {
        name: response.data.name,
        type: response.data.agent_type
      });
    } else {
      logger.error(`获取智能体详情失败 [${response.status}]`, response.data);
      reporter.add('智能体模块', '获取智能体详情', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取智能体详情异常', error);
    reporter.add('智能体模块', '获取智能体详情', false, duration, error);
  }
}

async function testUpdateAgent(client, reporter, agentName) {
  logger.section('测试: 更新智能体');
  const startTime = Date.now();

  try {
    const newDisplayName = '更新后的智能体名称';
    const response = await client.put(`/agents/${agentName}`, {
      display_name: newDisplayName,
      description: '这是更新后的描述'
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`更新智能体成功 (${duration}ms)`);
      logger.metric('新显示名', newDisplayName);
      reporter.add('智能体模块', '更新智能体', true, duration, null, {
        name: agentName,
        new_display_name: newDisplayName
      });
    } else {
      logger.error(`更新智能体失败 [${response.status}]`, response.data);
      reporter.add('智能体模块', '更新智能体', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('更新智能体异常', error);
    reporter.add('智能体模块', '更新智能体', false, duration, error);
  }
}

async function testGetAgentListFiltered(client, reporter) {
  logger.section('测试: 获取智能体列表（筛选active）');
  const startTime = Date.now();

  try {
    const response = await client.get('/agents?status=active&limit=10');
    const duration = Date.now() - startTime;

    if (response.ok && Array.isArray(response.data)) {
      logger.success(`获取筛选列表成功 (${duration}ms)`);
      logger.metric('active智能体数量', response.data.length);
      reporter.add('智能体模块', '获取智能体列表（筛选）', true, duration, null, {
        count: response.data.length
      });
    } else {
      logger.error(`获取筛选列表失败 [${response.status}]`, response.data);
      reporter.add('智能体模块', '获取智能体列表（筛选）', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取筛选列表异常', error);
    reporter.add('智能体模块', '获取智能体列表（筛选）', false, duration, error);
  }
}
