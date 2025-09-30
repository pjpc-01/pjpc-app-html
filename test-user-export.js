// 测试用户之前的导出配置
const http = require('http');

async function testUserExport() {
  console.log('🔍 测试用户之前的导出配置...\n');
  
  // 模拟用户之前的导出配置
  const config = {
    reportType: 'monthly', // 可能是月度报告
    startDate: '2025-08-30',
    endDate: '2025-09-30',
    center: 'WX 01',
    includeStudents: true,
    includeTeachers: true,
    format: 'csv'
  };
  
  console.log('📊 导出配置:', config);
  
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
    console.log('📊 报告API状态:', res.statusCode);
    
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ 报告生成成功！');
        console.log('📄 报告内容:');
        console.log(data);
      } else {
        console.log('❌ 报告生成失败:', res.statusCode);
        console.log('📄 错误响应:', data.substring(0, 200));
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ 请求失败:', error.message);
  });
  
  req.write(postData);
  req.end();
}

testUserExport();
