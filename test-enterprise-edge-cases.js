// 测试企业级报告边界情况和错误处理
const http = require('http');

// 边界情况测试配置
const edgeCaseConfigs = [
  {
    name: '无效日期格式',
    config: {
      reportType: 'daily',
      startDate: 'invalid-date',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  },
  {
    name: '空配置对象',
    config: {}
  },
  {
    name: '无效格式类型',
    config: {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'invalid-format'
    }
  },
  {
    name: '未来日期范围',
    config: {
      reportType: 'daily',
      startDate: '2030-01-01',
      endDate: '2030-01-31',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  },
  {
    name: '不存在的中心',
    config: {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'non-existent-center',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  },
  {
    name: '超大日期范围',
    config: {
      reportType: 'yearly',
      startDate: '2020-01-01',
      endDate: '2030-12-31',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  }
];

async function testEdgeCase(config) {
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
          success: res.statusCode === 200,
          data: data.substring(0, 300)
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

async function runEdgeCaseTests() {
  console.log('🔍 开始边界情况和错误处理测试...\n');
  
  const results = [];
  
  for (const config of edgeCaseConfigs) {
    console.log(`🧪 测试: ${config.name}`);
    const result = await testEdgeCase(config);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ 成功处理 - 状态: ${result.status}`);
      console.log(`📄 内容类型: ${result.contentType}`);
    } else {
      console.log(`⚠️ 预期错误 - 状态: ${result.status}`);
      if (result.error) {
        console.log(`❌ 错误: ${result.error}`);
      } else {
        console.log(`📄 响应: ${result.data}`);
      }
    }
    console.log('---\n');
  }
  
  console.log('📈 边界情况测试总结:');
  results.forEach(result => {
    const status = result.success ? '✅' : '⚠️';
    console.log(`${status} ${result.name}: ${result.status}`);
  });
}

runEdgeCaseTests();
