// 企业级报告功能全面测试
const http = require('http');

// 测试配置
const testConfigs = [
  {
    name: 'CSV格式 - 今日报告',
    config: {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  },
  {
    name: 'PDF格式 - 本周报告',
    config: {
      reportType: 'weekly',
      startDate: '2025-09-30',
      endDate: '2025-10-06',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'pdf'
    }
  },
  {
    name: 'Excel格式 - 本月报告',
    config: {
      reportType: 'monthly',
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'excel'
    }
  },
  {
    name: '仅学生数据',
    config: {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: false,
      format: 'csv'
    }
  },
  {
    name: '仅教师数据',
    config: {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: false,
      includeTeachers: true,
      format: 'csv'
    }
  }
];

async function testAPI(config) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(config.config);
    
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
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          name: config.name,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          contentLength: data.length,
          success: res.statusCode === 200,
          data: data.substring(0, 200) // 只显示前200个字符
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: config.name,
        status: 'ERROR',
        error: error.message,
        success: false
      });
    });
    
    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 开始企业级报告功能全面测试...\n');
  
  const results = [];
  
  for (const config of testConfigs) {
    console.log(`📊 测试: ${config.name}`);
    const result = await testAPI(config);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ 成功 - 状态: ${result.status}, 大小: ${result.contentLength} bytes`);
      console.log(`📄 内容类型: ${result.contentType}`);
    } else {
      console.log(`❌ 失败 - 状态: ${result.status}`);
      if (result.error) {
        console.log(`❌ 错误: ${result.error}`);
      } else {
        console.log(`❌ 响应: ${result.data}`);
      }
    }
    console.log('---\n');
  }
  
  // 总结
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('📈 测试总结:');
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有测试通过！企业级报告功能完善！');
  } else {
    console.log('⚠️ 部分测试失败，需要修复问题');
  }
}

runAllTests();
