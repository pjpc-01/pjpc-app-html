const PocketBase = require('pocketbase').default;

async function testStudentsAccess() {
  console.log('🔍 测试Students集合访问...');
  
  const url = 'http://pjpc.tplinkdns.com:8090';
  
  try {
    console.log(`\n📡 连接PocketBase: ${url}`);
    const pb = new PocketBase(url);
    
    // 测试健康检查
    try {
      const healthResponse = await fetch(`${url}/api/health`);
      console.log(`✅ 健康检查: ${healthResponse.status} ${healthResponse.statusText}`);
    } catch (fetchError) {
      console.log(`❌ 健康检查失败: ${fetchError.message}`);
      return;
    }
    
    // 尝试直接访问students集合（不需要认证）
    console.log('\n📚 尝试访问students集合...');
    try {
      const students = await pb.collection('students').getList(1, 5);
      console.log(`✅ Students集合访问成功: 找到 ${students.totalItems} 个学生`);
      if (students.items.length > 0) {
        console.log('📖 第一个学生:', students.items[0]);
      } else {
        console.log('⚠️  Students集合中没有数据');
      }
    } catch (error) {
      console.log(`❌ Students集合访问失败: ${error.message}`);
      
      // 如果是认证错误，尝试匿名访问
      if (error.message.includes('auth') || error.message.includes('authorization')) {
        console.log('\n🔐 检测到需要认证，尝试匿名访问...');
        
        // 检查集合的API规则
        try {
          const collections = await pb.collections.getFullList();
          const studentsCollection = collections.find(c => c.name === 'students');
          
          if (studentsCollection) {
            console.log(`\n📋 Students集合信息:`);
            console.log(`- 名称: ${studentsCollection.name}`);
            console.log(`- 类型: ${studentsCollection.type}`);
            console.log(`- 系统: ${studentsCollection.system}`);
            
            // 检查API规则
            if (studentsCollection.options && studentsCollection.options.allowGuestAuth) {
              console.log('✅ 允许访客认证');
            } else {
              console.log('❌ 需要用户认证');
            }
          }
        } catch (collectionError) {
          console.log(`❌ 无法获取集合信息: ${collectionError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ 连接失败: ${error.message}`);
  }
}

testStudentsAccess().catch(console.error);
