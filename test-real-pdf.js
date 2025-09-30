// 测试真正的PDF生成
const http = require('http');
const fs = require('fs');

async function testRealPDF() {
  console.log('🔧 测试真正的PDF生成...\n');
  
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
    
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        // 保存PDF文件
        fs.writeFileSync('real-pdf-test.pdf', data);
        console.log('✅ PDF生成成功！');
        console.log('📁 文件已保存为: real-pdf-test.pdf');
        console.log('📊 文件大小:', data.length, 'bytes');
        
        // 检查PDF文件头
        const pdfHeader = data.toString('hex', 0, 8);
        console.log('🔍 PDF文件头:', pdfHeader);
        
        if (pdfHeader.startsWith('25504446')) {
          console.log('🎉 这是真正的PDF文件！');
        } else {
          console.log('⚠️ 这可能不是有效的PDF文件');
        }
      } else {
        console.log('❌ PDF生成失败:', res.statusCode);
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

testRealPDF();
