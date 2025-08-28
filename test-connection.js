const PocketBase = require('pocketbase').default;

async function testConnection() {
  console.log('🔍 测试PocketBase连接...');
  
  const url = 'http://pjpc.tplinkdns.com:8090';
  
  try {
    console.log(`\n📡 测试连接: ${url}`);
    const pb = new PocketBase(url);
    
    // 测试健康检查
    try {
      const healthResponse = await fetch(`${url}/api/health`);
      console.log(`✅ 健康检查: ${healthResponse.status} ${healthResponse.statusText}`);
    } catch (fetchError) {
      console.log(`❌ 健康检查失败: ${fetchError.message}`);
      return;
    }
    
    // 列出所有集合
    try {
      const collections = await pb.collections.getFullList();
      console.log(`\n📚 可用的集合 (${collections.length}):`);
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name} (${collection.type})`);
      });
      
      // 检查是否有 students 相关的集合
      const studentsCollections = collections.filter(c => 
        c.name.toLowerCase().includes('student') || 
        c.name.toLowerCase().includes('学生')
      );
      
      if (studentsCollections.length > 0) {
        console.log(`\n🎯 找到学生相关集合:`);
        studentsCollections.forEach(collection => {
          console.log(`- ${collection.name} (${collection.type})`);
        });
        
        // 测试第一个学生集合
        const firstStudentCollection = studentsCollections[0];
        try {
          const records = await pb.collection(firstStudentCollection.name).getList(1, 5);
          console.log(`\n✅ ${firstStudentCollection.name} 集合访问成功: 找到 ${records.totalItems} 条记录`);
          if (records.items.length > 0) {
            console.log('📖 第一条记录:', records.items[0]);
          }
        } catch (error) {
          console.log(`❌ ${firstStudentCollection.name} 集合访问失败:`, error.message);
        }
      } else {
        console.log(`\n❌ 没有找到学生相关的集合`);
      }
      
    } catch (error) {
      console.log(`❌ 获取集合列表失败:`, error.message);
    }
    
  } catch (error) {
    console.log(`❌ 连接失败: ${error.message}`);
  }
}

testConnection().catch(console.error);
