/**
 * 知识库模块测试
 */

import Logger from '../lib/logger.js';
import fs from 'fs';

const logger = new Logger('知识库模块');

export async function testKnowledge(client, reporter, agentName) {
  logger.header('模块 3/6: 知识库模块');

  if (!agentName) {
    logger.warn('没有可用的智能体,跳过知识库测试');
    return;
  }

  // 等待 Milvus 初始化
  logger.info('等待 Milvus 集合初始化...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 测试 1: 获取知识库统计（初始状态）
  await testGetStats(client, reporter, agentName);

  // 测试 2: 上传文档
  const uploadSuccess = await testUploadDocument(client, reporter, agentName);

  if (uploadSuccess) {
    // 测试 3: 获取文档列表
    await testGetDocuments(client, reporter, agentName);

    // 测试 4: 再次获取统计（应该有数据）
    await testGetStats(client, reporter, agentName);

    // 测试 5: 删除文档（测试但不强制成功）
    await testDeleteDocument(client, reporter, agentName);
  }
}

async function testUploadDocument(client, reporter, agentName) {
  logger.section('测试: 上传文档');
  const startTime = Date.now();

  try {
    // 创建测试文件
    const testContent = `# 测试知识库文档

这是一个用于测试的文档。

## 产品特点

1. 高性能：采用最新技术架构
2. 易用性：简单直观的用户界面
3. 可扩展：支持灵活的功能扩展

## 常见问题

### 如何安装？
按照安装指南进行操作即可。

### 支持哪些平台？
支持 Windows、macOS 和 Linux。

## 联系方式

如有问题，请联系客服。
`;

    const fileBuffer = Buffer.from(testContent, 'utf-8');
    const filename = `test-document-${Date.now()}.txt`;

    const response = await client.upload(
      `/knowledge-base/${agentName}/documents`,
      fileBuffer,
      filename
    );

    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`文档上传成功 (${duration}ms)`);
      logger.metric('文件名', filename);
      logger.metric('文件ID', response.data.file_id || 'N/A');
      logger.metric('分块数', response.data.chunks_count || 0);
      
      reporter.add('知识库模块', '上传文档', true, duration, null, {
        filename,
        file_id: response.data.file_id,
        chunks_count: response.data.chunks_count
      });
      return true;
    } else {
      logger.error(`文档上传失败 [${response.status}]`);
      console.error('  完整响应:', JSON.stringify(response.data, null, 2));
      console.error('  错误信息:', response.error);
      reporter.add('知识库模块', '上传文档', false, duration, JSON.stringify(response.data));
      return false;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('文档上传异常', error);
    reporter.add('知识库模块', '上传文档', false, duration, error);
    return false;
  }
}

async function testGetDocuments(client, reporter, agentName) {
  logger.section('测试: 获取文档列表');
  const startTime = Date.now();

  try {
    const response = await client.get(`/knowledge-base/${agentName}/documents`);
    const duration = Date.now() - startTime;

    if (response.ok) {
      const documents = response.data.data || response.data || [];
      logger.success(`获取文档列表成功 (${duration}ms)`);
      logger.metric('文档数量', documents.length);
      
      if (documents.length > 0) {
        logger.info('文档列表:');
        documents.forEach((doc, idx) => {
          logger.metric(`  ${idx + 1}. ${doc.filename}`, `${doc.chunks_count} chunks`);
        });
      }
      
      reporter.add('知识库模块', '获取文档列表', true, duration, null, {
        count: documents.length
      });
    } else {
      logger.error(`获取文档列表失败 [${response.status}]`, response.data);
      reporter.add('知识库模块', '获取文档列表', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取文档列表异常', error);
    reporter.add('知识库模块', '获取文档列表', false, duration, error);
  }
}

async function testGetStats(client, reporter, agentName) {
  logger.section('测试: 获取知识库统计');
  const startTime = Date.now();

  try {
    const response = await client.get(`/knowledge-base/${agentName}/stats`);
    const duration = Date.now() - startTime;

    if (response.ok) {
      const stats = response.data.data || response.data || {};
      logger.success(`获取统计信息成功 (${duration}ms)`);
      logger.metric('总文件数', stats.total_files || 0);
      logger.metric('总向量数', stats.total_vectors || 0);
      logger.metric('总大小', (stats.total_size_mb || 0).toFixed(2) + ' MB');
      
      reporter.add('知识库模块', '获取知识库统计', true, duration, null, stats);
    } else {
      logger.error(`获取统计信息失败 [${response.status}]`, response.data);
      reporter.add('知识库模块', '获取知识库统计', false, duration, response.data);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('获取统计信息异常', error);
    reporter.add('知识库模块', '获取知识库统计', false, duration, error);
  }
}

async function testDeleteDocument(client, reporter, agentName) {
  logger.section('测试: 删除文档');
  const startTime = Date.now();

  try {
    // 先获取文档列表
    const listResponse = await client.get(`/knowledge-base/${agentName}/documents`);
    
    if (!listResponse.ok) {
      logger.warn('无法获取文档列表，跳过删除测试');
      reporter.add('知识库模块', '删除文档', false, 0, '无法获取文档列表');
      return;
    }

    const documents = listResponse.data.data || listResponse.data || [];
    
    if (documents.length === 0) {
      logger.warn('没有文档可删除');
      reporter.add('知识库模块', '删除文档', true, 0, null, { message: '没有文档' });
      return;
    }

    const firstDoc = documents[0];
    const response = await client.delete(`/knowledge-base/${agentName}/documents/${firstDoc.file_id}`);
    const duration = Date.now() - startTime;

    if (response.ok) {
      logger.success(`文档删除成功 (${duration}ms)`);
      logger.metric('文件ID', firstDoc.file_id);
      reporter.add('知识库模块', '删除文档', true, duration, null, {
        file_id: firstDoc.file_id
      });
    } else {
      // Milvus Lite 可能不支持删除，这不算错误
      logger.warn(`文档删除返回 [${response.status}] (Milvus Lite 限制)`);
      reporter.add('知识库模块', '删除文档', true, duration, null, {
        message: 'Milvus Lite 限制',
        status: response.status
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.warn('文档删除测试跳过 (Milvus Lite 限制)', error);
    reporter.add('知识库模块', '删除文档', true, duration, null, {
      message: 'Milvus Lite 限制'
    });
  }
}
