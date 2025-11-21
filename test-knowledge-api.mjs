#!/usr/bin/env node

// 测试知识库 API 端点
// 使用方法: node test-knowledge-api.mjs <agentName>

const API_BASE = 'https://atlas.matrix-net.tech/atlas/api';
const agentName = process.argv[2] || 'test';

// 从环境变量或本地存储读取 token（你需要先登录获取）
const token = process.env.ATLAS_TOKEN || 'YOUR_TOKEN_HERE';

const testEndpoints = [
  `/agents/${agentName}/knowledge`,
  `/agents/${agentName}/knowledge/files`,
  `/agents/${agentName}/documents`,
  `/knowledge/${agentName}`,
  `/knowledge/agents/${agentName}`,
  `/documents/${agentName}`,
];

console.log(`测试智能体: ${agentName}\n`);

async function testEndpoint(path) {
  const url = `${API_BASE}${path}`;
  console.log(`测试: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log(`  状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ 成功!`);
      console.log(`  响应数据结构:`, Object.keys(data));
      return { path, success: true, data };
    } else {
      console.log(`  ❌ 失败`);
    }
  } catch (error) {
    console.log(`  ❌ 错误:`, error.message);
  }
  console.log('');
  return { path, success: false };
}

async function main() {
  console.log('开始测试所有可能的端点...\n');
  
  const results = [];
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('\n========== 测试总结 ==========');
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    console.log('\n✅ 成功的端点:');
    successful.forEach(r => console.log(`  - ${r.path}`));
  } else {
    console.log('\n❌ 没有找到可用的端点');
    console.log('\n建议:');
    console.log('1. 检查后端 API 文档');
    console.log('2. 确认 token 是否有效');
    console.log('3. 确认智能体名称是否正确');
  }
}

main();
