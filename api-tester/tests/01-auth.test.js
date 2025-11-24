/**
 * 认证模块测试
 */

import Logger from '../lib/logger.js';

const logger = new Logger('认证模块');

export async function testAuth(client, reporter) {
  logger.header('模块 1/6: 认证模块');

  const timestamp = Date.now();
  const testUsername = `test_user_${timestamp}`;
  const testEmail = `test_${timestamp}@example.com`;
  const testPassword = 'Test123456';

  // 测试 1: 健康检查
  await testHealthCheck(client, reporter);

  // 测试 2: 用户注册
  const registerSuccess = await testRegister(client, reporter, testUsername, testEmail, testPassword);
  if (!registerSuccess) {
    logger.warn('注册失败,跳过后续认证测试');
    return { token: null, username: null };
  }

  // 测试 3: 用户登录
  const { token, success: loginSuccess } = await testLogin(client, reporter, testUsername, testPassword);
  if (!loginSuccess) {
    logger.warn('登录失败,跳过后续测试');
    return { token: null, username: null };
  }

  // 测试 4: 获取当前用户
  await testGetCurrentUser(client, reporter);

  // 测试 5: 更新用户信息
  await testUpdateUser(client, reporter);

  // 测试 6: 错误处理 - 错误密码
  await testLoginWithWrongPassword(client, reporter, testUsername);

  return { token, username: testUsername };
}

async function testHealthCheck(client, reporter) {
  logger.section('测试: 健康检查');
  const startTime = Date.now();

  try {
    const response = await client.get('/health');
    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`健康检查通过 (${duration}ms)`, response.data);
      reporter.add('认证模块', '健康检查', true, duration, null, response.data);
    } else {
      logger.error(`健康检查失败 [${response.status}]`);
      if (response.error) {
        console.error('  错误详情:', response.error);
        console.error('  错误信息:', response.errorDetails);
      } else {
        console.error('  响应:', response.data);
      }
      reporter.add('认证模块', '健康检查', false, duration, response.error || response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('健康检查异常', error);
    reporter.add('认证模块', '健康检查', false, duration, error);
  }
}

async function testRegister(client, reporter, username, email, password) {
  logger.section('测试: 用户注册');
  const startTime = Date.now();

  try {
    const response = await client.post('/auth/register', {
      username,
      email,
      password,
      full_name: '测试用户'
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`用户注册成功 (${duration}ms)`);
      logger.metric('用户名', username);
      logger.metric('邮箱', email);
      reporter.add('认证模块', '用户注册', true, duration, null, { username, email });
      return true;
    } else {
      logger.error(`用户注册失败 [${response.status}]`, response.data);
      reporter.add('认证模块', '用户注册', false, duration, response.data);
      return false;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('用户注册异常', error);
    reporter.add('认证模块', '用户注册', false, duration, error);
    return false;
  }
}

async function testLogin(client, reporter, username, password) {
  logger.section('测试: 用户登录');
  const startTime = Date.now();

  try {
    const response = await client.post('/auth/login', {
      username,
      password
    });

    const duration = Date.now() - startTime;

    if (response.ok && response.data.access_token) {
      const token = response.data.access_token;
      client.setToken(token);
      
      logger.success(`用户登录成功 (${duration}ms)`);
      logger.metric('Token', token.substring(0, 20) + '...');
      logger.metric('过期时间', response.data.expires_in + 's');
      
      reporter.add('认证模块', '用户登录', true, duration, null, {
        token_type: response.data.token_type,
        expires_in: response.data.expires_in
      });
      
      return { token, success: true };
    } else {
      logger.error(`用户登录失败 [${response.status}]`, response.data);
      reporter.add('认证模块', '用户登录', false, duration, response.data);
      return { token: null, success: false };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('用户登录异常', error);
    reporter.add('认证模块', '用户登录', false, duration, error);
    return { token: null, success: false };
  }
}

async function testGetCurrentUser(client, reporter) {
  logger.section('测试: 获取当前用户');
  const startTime = Date.now();

  try {
    const response = await client.get('/auth/me');
    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`获取当前用户成功 (${duration}ms)`);
      logger.metric('用户名', response.data.username);
      logger.metric('邮箱', response.data.email);
      reporter.add('认证模块', '获取当前用户', true, duration, null, response.data);
    } else {
      logger.error(`获取当前用户失败 [${response.status}]`, response.data);
      reporter.add('认证模块', '获取当前用户', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取当前用户异常', error);
    reporter.add('认证模块', '获取当前用户', false, duration, error);
  }
}

async function testUpdateUser(client, reporter) {
  logger.section('测试: 更新用户信息');
  const startTime = Date.now();

  try {
    const newFullName = '更新后的测试用户';
    const response = await client.put('/auth/me', {
      full_name: newFullName
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`更新用户信息成功 (${duration}ms)`);
      logger.metric('新名称', newFullName);
      reporter.add('认证模块', '更新用户信息', true, duration, null, { full_name: newFullName });
    } else {
      logger.error(`更新用户信息失败 [${response.status}]`, response.data);
      reporter.add('认证模块', '更新用户信息', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('更新用户信息异常', error);
    reporter.add('认证模块', '更新用户信息', false, duration, error);
  }
}

async function testLoginWithWrongPassword(client, reporter, username) {
  logger.section('测试: 错误密码登录');
  const startTime = Date.now();

  try {
    const response = await client.post('/auth/login', {
      username,
      password: 'WrongPassword123'
    });

    const duration = Date.now() - startTime;

    // 期望登录失败
    if (!response.ok && response.status === 401) {
      logger.success(`错误密码正确被拒绝 (${duration}ms)`);
      reporter.add('认证模块', '错误密码登录', true, duration);
    } else {
      logger.error(`错误密码未被拒绝 [${response.status}]`);
      reporter.add('认证模块', '错误密码登录', false, duration, '应该返回 401');
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('错误密码登录测试异常', error);
    reporter.add('认证模块', '错误密码登录', false, duration, error);
  }
}
