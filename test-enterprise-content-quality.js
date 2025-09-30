// 测试企业级报告内容质量
const http = require('http');
const fs = require('fs');

async function testReportContent(config, filename) {
  return new Promise((resolve) => {
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
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          // 保存文件用于检查
          fs.writeFileSync(`test-${filename}`, data);
          
          // 分析内容
          const analysis = analyzeContent(data, res.headers['content-type']);
          resolve({
            success: true,
            filename: `test-${filename}`,
            analysis: analysis
          });
        } else {
          resolve({
            success: false,
            error: `HTTP ${res.statusCode}: ${data}`
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.write(postData);
    req.end();
  });
}

function analyzeContent(data, contentType) {
  const analysis = {
    contentType: contentType,
    size: data.length,
    hasData: false,
    hasHeaders: false,
    hasSummary: false,
    recordCount: 0,
    issues: []
  };
  
  if (contentType.includes('csv')) {
    const csvContent = data.toString('utf-8');
    const lines = csvContent.split('\n');
    
    // 检查是否有数据
    analysis.hasData = lines.length > 1;
    
    // 计算实际数据记录数（排除报告头部和摘要部分）
    const detailedRecordsIndex = lines.findIndex(line => line.includes('Detailed Records'));
    if (detailedRecordsIndex >= 0) {
      analysis.recordCount = lines.length - detailedRecordsIndex - 2; // 减去标题行和Detailed Records行
      
      // 检查标题
      if (lines[detailedRecordsIndex + 1]) {
        analysis.hasHeaders = lines[detailedRecordsIndex + 1].includes('Type') && lines[detailedRecordsIndex + 1].includes('Name');
      }
    } else {
      analysis.recordCount = 0;
    }
    
    // 检查摘要部分
    analysis.hasSummary = csvContent.includes('Summary') || csvContent.includes('Total Records');
    
    // 检查数据质量
    if (analysis.recordCount === 0) {
      analysis.issues.push('没有数据记录');
    }
    
    if (!analysis.hasHeaders) {
      analysis.issues.push('缺少CSV标题行');
    }
    
    if (!analysis.hasSummary) {
      analysis.issues.push('缺少摘要信息');
    }
    
  } else if (contentType.includes('pdf')) {
    // PDF文件分析
    analysis.hasData = data.length > 1000; // PDF文件应该有一定大小
    analysis.recordCount = 'N/A (PDF)';
    
    if (data.length < 1000) {
      analysis.issues.push('PDF文件过小，可能内容不完整');
    }
    
  } else if (contentType.includes('excel')) {
    // Excel文件分析
    analysis.hasData = data.length > 1000;
    analysis.recordCount = 'N/A (Excel)';
    
    if (data.length < 1000) {
      analysis.issues.push('Excel文件过小，可能内容不完整');
    }
  }
  
  return analysis;
}

async function runContentQualityTests() {
  console.log('📊 开始报告内容质量测试...\n');
  
  const testConfigs = [
    {
      name: 'CSV报告内容',
      config: {
        reportType: 'daily',
        startDate: '2025-09-30',
        endDate: '2025-09-30',
        center: 'all',
        includeStudents: true,
        includeTeachers: true,
        format: 'csv'
      },
      filename: 'enterprise-report.csv'
    },
    {
      name: 'PDF报告内容',
      config: {
        reportType: 'daily',
        startDate: '2025-09-30',
        endDate: '2025-09-30',
        center: 'all',
        includeStudents: true,
        includeTeachers: true,
        format: 'pdf'
      },
      filename: 'enterprise-report.pdf'
    }
  ];
  
  for (const test of testConfigs) {
    console.log(`🔍 测试: ${test.name}`);
    const result = await testReportContent(test.config, test.filename);
    
    if (result.success) {
      console.log(`✅ 生成成功: ${result.filename}`);
      console.log(`📄 内容类型: ${result.analysis.contentType}`);
      console.log(`📏 文件大小: ${result.analysis.size} bytes`);
      console.log(`📊 记录数量: ${result.analysis.recordCount}`);
      console.log(`📋 有标题: ${result.analysis.hasHeaders ? '✅' : '❌'}`);
      console.log(`📈 有摘要: ${result.analysis.hasSummary ? '✅' : '❌'}`);
      console.log(`📝 有数据: ${result.analysis.hasData ? '✅' : '❌'}`);
      
      if (result.analysis.issues.length > 0) {
        console.log(`⚠️ 问题:`);
        result.analysis.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      } else {
        console.log(`🎉 内容质量良好！`);
      }
    } else {
      console.log(`❌ 生成失败: ${result.error}`);
    }
    console.log('---\n');
  }
  
  // 清理测试文件
  try {
    fs.unlinkSync('test-enterprise-report.csv');
    fs.unlinkSync('test-enterprise-report.pdf');
    console.log('🧹 清理测试文件完成');
  } catch (error) {
    // 忽略文件不存在错误
  }
}

runContentQualityTests();
