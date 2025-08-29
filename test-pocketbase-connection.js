import PocketBase from 'pocketbase';

// 测试 PocketBase 连接和集合
async function testPocketBase() {
  console.log('🔍 开始测试 PocketBase 连接...\n');
  
  // 测试不同的 URL
  const testUrls = [
    'http://pjpc.tplinkdns.com:8090',
    'http://192.168.0.59:8090',
    'http://localhost:8090'
  ];
  
  for (const url of testUrls) {
    console.log(`📡 测试 URL: ${url}`);
    
    try {
      const pb = new PocketBase(url);
      
      // 测试基本连接
      console.log('  - 测试基本连接...');
      const healthResponse = await fetch(`${url}/api/health`);
      if (healthResponse.ok) {
        console.log('  ✅ 基本连接成功');
      } else {
        console.log(`  ❌ 基本连接失败: ${healthResponse.status}`);
        continue;
      }
      
      // 测试管理员认证
      console.log('  - 测试管理员认证...');
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
        console.log('  ✅ 管理员认证成功');
      } catch (authError) {
        console.log(`  ❌ 管理员认证失败: ${authError.message}`);
        continue;
      }
      
      // 测试集合访问
      console.log('  - 测试集合访问...');
      try {
        // 测试 student_attendance 集合
        const studentAttendance = await pb.collection('student_attendance').getList(1, 1);
        console.log(`  ✅ student_attendance 集合访问成功 (${studentAttendance.totalItems} 条记录)`);
      } catch (collectionError) {
        console.log(`  ❌ student_attendance 集合访问失败: ${collectionError.message}`);
        
        // 尝试列出所有集合
        try {
          console.log('  - 列出可用集合...');
          const collections = await pb.collections.getFullList();
          console.log('  📋 可用集合:');
          collections.forEach(col => {
            console.log(`    - ${col.name} (${col.type})`);
          });
        } catch (listError) {
          console.log(`  ❌ 无法列出集合: ${listError.message}`);
        }
      }
      
      // 测试 teacher_attendance 集合
      try {
        const teacherAttendance = await pb.collection('teacher_attendance').getList(1, 1);
        console.log(`  ✅ teacher_attendance 集合访问成功 (${teacherAttendance.totalItems} 条记录)`);
      } catch (collectionError) {
        console.log(`  ❌ teacher_attendance 集合访问失败: ${collectionError.message}`);
      }
      
      console.log(`\n🎯 ${url} 测试完成\n`);
      return url; // 返回第一个成功的 URL
      
    } catch (error) {
      console.log(`  ❌ 连接失败: ${error.message}\n`);
    }
  }
  
  console.log('❌ 所有 URL 测试都失败了');
  return null;
}

// 运行测试
testPocketBase().then(successfulUrl => {
  if (successfulUrl) {
    console.log(`\n✅ 测试完成！建议使用: ${successfulUrl}`);
  } else {
    console.log('\n❌ 没有可用的 PocketBase 连接');
  }
}).catch(error => {
  console.error('测试过程中发生错误:', error);
});
