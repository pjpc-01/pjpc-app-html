// 测试 API 端点
async function testAPIEndpoints() {
  console.log('🔍 开始测试 API 端点...\n');
  
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    '/api/student-attendance',
    '/api/teacher-attendance',
    '/api/students/list'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`📡 测试端点: ${endpoint}`);
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      console.log(`  - 状态码: ${response.status}`);
      console.log(`  - 状态文本: ${response.statusText}`);
      
      const contentType = response.headers.get('content-type');
      console.log(`  - 内容类型: ${contentType}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`  ✅ 成功 - 数据:`, data);
        } catch (jsonError) {
          console.log(`  ⚠️ 响应不是有效JSON: ${jsonError.message}`);
          const text = await response.text();
          console.log(`  - 响应内容: ${text.substring(0, 200)}...`);
        }
      } else {
        console.log(`  ❌ 失败`);
        try {
          const errorText = await response.text();
          console.log(`  - 错误内容: ${errorText.substring(0, 200)}...`);
        } catch (e) {
          console.log(`  - 无法读取错误内容`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ 请求失败: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 API 端点测试完成');
}

// 运行测试
testAPIEndpoints().catch(error => {
  console.error('测试过程中发生错误:', error);
});
