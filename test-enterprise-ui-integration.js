// 测试企业级报告UI集成
const http = require('http');

// 模拟前端UI测试
async function testUIIntegration() {
  console.log('🎨 开始UI集成测试...\n');
  
  // 测试1: 验证考勤记录页面可以访问
  console.log('📄 测试1: 考勤记录页面可访问性');
  try {
    const response = await fetchPage('http://localhost:3000/attendance-reports');
    if (response.includes('考勤记录查询与导出')) {
      console.log('✅ 考勤记录页面加载成功');
    } else {
      console.log('❌ 考勤记录页面内容不正确');
    }
  } catch (error) {
    console.log('❌ 考勤记录页面无法访问:', error.message);
  }
  
  // 测试2: 验证企业级报告API响应
  console.log('\n🔧 测试2: 企业级报告API响应');
  const apiTest = await testEnterpriseAPI();
  if (apiTest.success) {
    console.log('✅ 企业级报告API正常工作');
  } else {
    console.log('❌ 企业级报告API有问题:', apiTest.error);
  }
  
  // 测试3: 验证不同配置的响应
  console.log('\n⚙️ 测试3: 不同配置的响应');
  const configTests = [
    { name: '默认配置', config: {} },
    { name: 'CSV格式', config: { format: 'csv' } },
    { name: 'PDF格式', config: { format: 'pdf' } },
    { name: 'Excel格式', config: { format: 'excel' } }
  ];
  
  for (const test of configTests) {
    const result = await testConfig(test.config);
    console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.status}`);
  }
  
  console.log('\n🎉 UI集成测试完成！');
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testEnterpriseAPI() {
  return new Promise((resolve) => {
    const config = {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    };
    
    const postData = JSON.stringify(config);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/attendance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      resolve({
        success: res.statusCode === 200,
        status: res.statusCode,
        error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : null
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        status: 'ERROR',
        error: error.message
      });
    });
    
    req.write(postData);
    req.end();
  });
}

async function testConfig(config) {
  return new Promise((resolve) => {
    const defaultConfig = {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    const postData = JSON.stringify(finalConfig);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/attendance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      resolve({
        success: res.statusCode === 200,
        status: res.statusCode
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        status: 'ERROR'
      });
    });
    
    req.write(postData);
    req.end();
  });
}

testUIIntegration();
