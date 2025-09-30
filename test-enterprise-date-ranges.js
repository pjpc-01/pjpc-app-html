// 测试企业级报告不同日期范围
const http = require('http');

const dateRangeTests = [
  {
    name: '单日报告',
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
    name: '本周报告',
    config: {
      reportType: 'weekly',
      startDate: '2025-09-30',
      endDate: '2025-10-06',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  },
  {
    name: '本月报告',
    config: {
      reportType: 'monthly',
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  },
  {
    name: '自定义日期范围',
    config: {
      reportType: 'custom',
      startDate: '2025-09-25',
      endDate: '2025-10-05',
      center: 'all',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    }
  }
];

async function testDateRange(config) {
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
        if (res.statusCode === 200) {
          // 分析CSV内容
          const csvContent = data.toString('utf-8');
          const lines = csvContent.split('\n');
          
          // 提取统计信息
          const summaryLine = lines.find(line => line.includes('Total Records'));
          const totalRecords = summaryLine ? summaryLine.split(',')[1] : '0';
          
          const studentLine = lines.find(line => line.includes('Student Records'));
          const studentRecords = studentLine ? studentLine.split(',')[1] : '0';
          
          const teacherLine = lines.find(line => line.includes('Teacher Records'));
          const teacherRecords = teacherLine ? studentLine.split(',')[1] : '0';
          
          resolve({
            name: config.name,
            success: true,
            totalRecords: parseInt(totalRecords),
            studentRecords: parseInt(studentRecords),
            teacherRecords: parseInt(teacherRecords),
            fileSize: data.length,
            period: `${config.config.startDate} to ${config.config.endDate}`
          });
        } else {
          resolve({
            name: config.name,
            success: false,
            error: `HTTP ${res.statusCode}`
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: config.name,
        success: false,
        error: error.message
      });
    });
    
    req.write(postData);
    req.end();
  });
}

async function runDateRangeTests() {
  console.log('📅 开始日期范围测试...\n');
  
  const results = [];
  
  for (const test of dateRangeTests) {
    console.log(`🗓️ 测试: ${test.name}`);
    const result = await testDateRange(test);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ 成功生成报告`);
      console.log(`📊 期间: ${result.period}`);
      console.log(`📈 总记录: ${result.totalRecords}`);
      console.log(`👨‍🎓 学生记录: ${result.studentRecords}`);
      console.log(`👨‍🏫 教师记录: ${result.teacherRecords}`);
      console.log(`📏 文件大小: ${result.fileSize} bytes`);
    } else {
      console.log(`❌ 生成失败: ${result.error}`);
    }
    console.log('---\n');
  }
  
  // 分析结果
  console.log('📈 日期范围测试总结:');
  const successfulTests = results.filter(r => r.success);
  const totalRecords = successfulTests.reduce((sum, r) => sum + r.totalRecords, 0);
  const avgRecords = successfulTests.length > 0 ? Math.round(totalRecords / successfulTests.length) : 0;
  
  console.log(`✅ 成功测试: ${successfulTests.length}/${results.length}`);
  console.log(`📊 平均记录数: ${avgRecords}`);
  console.log(`📈 总记录数: ${totalRecords}`);
  
  // 检查数据一致性
  const studentRecords = successfulTests.reduce((sum, r) => sum + r.studentRecords, 0);
  const teacherRecords = successfulTests.reduce((sum, r) => sum + r.teacherRecords, 0);
  
  console.log(`👨‍🎓 学生记录总数: ${studentRecords}`);
  console.log(`👨‍🏫 教师记录总数: ${teacherRecords}`);
  
  if (successfulTests.length === results.length) {
    console.log('🎉 所有日期范围测试通过！');
  } else {
    console.log('⚠️ 部分日期范围测试失败');
  }
}

runDateRangeTests();
