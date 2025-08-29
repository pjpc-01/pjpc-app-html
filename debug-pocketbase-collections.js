// 诊断 PocketBase 集合问题
async function debugPocketBaseCollections() {
  console.log('🔍 开始诊断 PocketBase 集合问题...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // 测试 PocketBase 健康状态
    console.log('📡 测试 PocketBase 健康状态...');
    const healthResponse = await fetch(`${baseUrl}/api/student-attendance`);
    if (healthResponse.ok) {
      console.log('✅ student-attendance API 工作正常');
    } else {
      console.log(`❌ student-attendance API 失败: ${healthResponse.status}`);
    }
    
    // 测试 students/list API 并获取详细错误信息
    console.log('\n📡 测试 students/list API...');
    const studentsResponse = await fetch(`${baseUrl}/api/students/list`);
    console.log(`状态码: ${studentsResponse.status}`);
    
    if (studentsResponse.ok) {
      const data = await studentsResponse.json();
      console.log('✅ students/list API 成功:', data);
    } else {
      const errorData = await studentsResponse.json();
      console.log('❌ students/list API 失败:');
      console.log('错误信息:', errorData.error);
      console.log('详细信息:', errorData.details);
      
      if (errorData.availableCollections) {
        console.log('\n📋 可用的集合:');
        errorData.availableCollections.forEach((col, index) => {
          console.log(`  ${index + 1}. ${col}`);
        });
        
        // 查找可能的 students 相关集合
        const studentsCollections = errorData.availableCollections.filter(col => 
          col.toLowerCase().includes('student') || 
          col.toLowerCase().includes('pupil') || 
          col.toLowerCase().includes('child')
        );
        
        if (studentsCollections.length > 0) {
          console.log('\n🎯 可能的 students 相关集合:');
          studentsCollections.forEach(col => console.log(`  - ${col}`));
        }
      }
    }
    
    // 测试其他可能的 API 端点
    console.log('\n📡 测试其他可能的端点...');
    const possibleEndpoints = [
      '/api/students',
      '/api/student',
      '/api/pupils',
      '/api/children'
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`);
        console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`${endpoint}: 请求失败 - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  }
  
  console.log('\n🎯 诊断完成');
}

// 运行诊断
debugPocketBaseCollections().catch(error => {
  console.error('诊断失败:', error);
});
