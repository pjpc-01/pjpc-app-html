// 调试报告数据问题
const http = require('http');

async function debugReportData() {
  console.log('🔍 调试报告数据问题...\n');
  
  // 1. 检查学生考勤API
  console.log('📚 检查学生考勤API...');
  const studentParams = new URLSearchParams();
  studentParams.append('startDate', '2025-09-30');
  studentParams.append('endDate', '2025-09-30');
  studentParams.append('center', 'WX 01');
  
  const studentOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/student-attendance?${studentParams.toString()}`,
    method: 'GET'
  };
  
  const studentReq = http.request(studentOptions, (res) => {
    console.log('学生API状态:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('学生数据:', {
          success: result.success,
          total: result.total,
          records: result.records?.length || 0,
          firstRecord: result.records?.[0] || '无记录'
        });
      } catch (e) {
        console.log('学生API响应解析失败:', data.substring(0, 200));
      }
    });
  });
  
  studentReq.on('error', (error) => {
    console.log('学生API请求失败:', error.message);
  });
  
  studentReq.end();
  
  // 等待一下再检查教师API
  setTimeout(() => {
    console.log('\n👨‍🏫 检查教师考勤API...');
    const teacherParams = new URLSearchParams();
    teacherParams.append('startDate', '2025-09-30');
    teacherParams.append('endDate', '2025-09-30');
    teacherParams.append('center', 'WX 01');
    teacherParams.append('type', 'teacher');
    
    const teacherOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/teacher-attendance?${teacherParams.toString()}`,
      method: 'GET'
    };
    
    const teacherReq = http.request(teacherOptions, (res) => {
      console.log('教师API状态:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('教师数据:', {
            success: result.success,
            total: result.total,
            records: result.records?.length || 0,
            firstRecord: result.records?.[0] || '无记录'
          });
        } catch (e) {
          console.log('教师API响应解析失败:', data.substring(0, 200));
        }
      });
    });
    
    teacherReq.on('error', (error) => {
      console.log('教师API请求失败:', error.message);
    });
    
    teacherReq.end();
  }, 1000);
  
  // 等待一下再检查报告API
  setTimeout(() => {
    console.log('\n📊 检查报告API...');
    const reportConfig = {
      reportType: 'daily',
      startDate: '2025-09-30',
      endDate: '2025-09-30',
      center: 'WX 01',
      includeStudents: true,
      includeTeachers: true,
      format: 'csv'
    };
    
    const postData = JSON.stringify(reportConfig);
    
    const reportOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/attendance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const reportReq = http.request(reportOptions, (res) => {
      console.log('报告API状态:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('报告生成成功，内容预览:');
          console.log(data.substring(0, 500));
        } else {
          console.log('报告生成失败:', data.substring(0, 200));
        }
      });
    });
    
    reportReq.on('error', (error) => {
      console.log('报告API请求失败:', error.message);
    });
    
    reportReq.write(postData);
    reportReq.end();
  }, 2000);
}

debugReportData();
