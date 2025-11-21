// 测试文件上传的脚本
// 在浏览器控制台运行

async function testFileUpload() {
  console.log('=== 开始测试文件上传 ===');
  
  // 创建一个测试文件
  const testContent = 'This is a test file for knowledge base upload.';
  const blob = new Blob([testContent], { type: 'text/plain' });
  const testFile = new File([blob], 'test.txt', { type: 'text/plain' });
  
  console.log('测试文件:', {
    name: testFile.name,
    size: testFile.size,
    type: testFile.type
  });
  
  // 构建 FormData
  const formData = new FormData();
  formData.append('files', testFile);
  
  console.log('FormData entries:');
  for (let pair of formData.entries()) {
    console.log('  -', pair[0], ':', pair[1]);
  }
  
  // 获取 token
  const token = localStorage.getItem('atlas_token');
  if (!token) {
    console.error('❌ 未找到 token，请先登录');
    return;
  }
  
  // 发送请求
  const agentName = 'test'; // 替换为实际的智能体名称
  const url = `https://atlas.matrix-net.tech/atlas/api/knowledge-base/${agentName}/documents`;
  
  console.log('请求 URL:', url);
  console.log('请求方法: POST');
  console.log('Authorization:', `Bearer ${token.substring(0, 20)}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // 不要设置 Content-Type，让浏览器自动设置
      },
      body: formData
    });
    
    console.log('响应状态:', response.status, response.statusText);
    console.log('响应头:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const data = await response.json();
    console.log('响应数据:', data);
    
    if (response.ok) {
      console.log('✅ 上传成功!');
    } else {
      console.error('❌ 上传失败:', data);
    }
  } catch (error) {
    console.error('❌ 请求错误:', error);
  }
}

// 测试不同的字段名
async function testDifferentFieldNames() {
  const testContent = 'Test content';
  const blob = new Blob([testContent], { type: 'text/plain' });
  const testFile = new File([blob], 'test.txt', { type: 'text/plain' });
  
  const token = localStorage.getItem('atlas_token');
  const agentName = 'test';
  const url = `https://atlas.matrix-net.tech/atlas/api/knowledge-base/${agentName}/documents`;
  
  const fieldNames = ['files', 'file', 'documents', 'document', 'upload'];
  
  for (const fieldName of fieldNames) {
    console.log(`\n=== 测试字段名: ${fieldName} ===`);
    
    const formData = new FormData();
    formData.append(fieldName, testFile);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      console.log(`${fieldName}:`, response.status, response.statusText);
      
      if (response.ok) {
        console.log(`✅ 字段名 "${fieldName}" 可用!`);
        const data = await response.json();
        console.log('响应:', data);
        return fieldName;
      }
    } catch (error) {
      console.error(`❌ ${fieldName} 失败:`, error);
    }
  }
  
  console.log('❌ 所有字段名都失败了');
}

console.log('测试函数已加载！');
console.log('运行 testFileUpload() 测试上传');
console.log('运行 testDifferentFieldNames() 测试不同字段名');
