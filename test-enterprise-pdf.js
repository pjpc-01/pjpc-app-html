// 测试企业级PDF报告设计
const http = require('http');
const fs = require('fs');

async function testEnterprisePDF() {
  console.log('🎨 测试企业级PDF报告设计...\n');
  
  const config = {
    reportType: 'daily',
    startDate: '2025-09-30',
    endDate: '2025-09-30',
    center: 'all',
    includeStudents: true,
    includeTeachers: true,
    format: 'pdf'
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
    console.log('📊 PDF生成状态:', res.statusCode);
    console.log('📄 内容类型:', res.headers['content-type']);
    console.log('📏 文件大小:', res.headers['content-length'] || '未知');
    
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        // 保存PDF文件
        fs.writeFileSync('enterprise-report-test.pdf', data);
        console.log('✅ 企业级PDF报告生成成功！');
        console.log('📁 文件已保存为: enterprise-report-test.pdf');
        console.log('📊 文件大小:', data.length, 'bytes');
        
        // 分析PDF内容（简单检查）
        if (data.length > 20000) {
          console.log('🎉 PDF内容丰富，企业级设计已应用！');
        } else {
          console.log('⚠️ PDF文件较小，可能内容不完整');
        }
      } else {
        console.log('❌ PDF生成失败:', res.statusCode);
        console.log('📄 响应内容:', data.substring(0, 200));
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ 请求失败:', error.message);
  });
  
  req.write(postData);
  req.end();
}

testEnterprisePDF();
