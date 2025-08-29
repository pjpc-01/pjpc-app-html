import PocketBase from 'pocketbase';

async function checkCollectionPermissions() {
  console.log('🔍 检查集合权限配置...\n');
  
  try {
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090');
    
    // 1. 管理员认证
    console.log('🔐 管理员认证...');
    try {
      const authResult = await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
      console.log('✅ 管理员认证成功');
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError.message);
      return;
    }
    
    // 2. 获取所有集合
    console.log('\n📚 获取集合列表...');
    try {
      const collections = await pb.collections.getFullList();
      console.log(`✅ 获取到 ${collections.length} 个集合`);
      
      // 3. 检查关键集合的权限
      const targetCollections = ['student_attendance', 'teacher_attendance', 'students'];
      
      targetCollections.forEach(collectionName => {
        const collection = collections.find(col => col.name === collectionName);
        if (collection) {
          console.log(`\n📖 集合: ${collection.name}`);
          console.log(`   类型: ${collection.type}`);
          console.log(`   ID: ${collection.id}`);
          
          if (collection.options) {
            console.log(`   选项:`, JSON.stringify(collection.options, null, 2));
          }
          
          // 检查权限设置
          if (collection.options && collection.options.allowAdmin) {
            console.log(`   ✅ 允许管理员访问`);
          } else {
            console.log(`   ❌ 不允许管理员访问`);
          }
          
          if (collection.options && collection.options.allowPublic) {
            console.log(`   ✅ 允许公开访问`);
          } else {
            console.log(`   ❌ 不允许公开访问`);
          }
        } else {
          console.log(`\n❌ 集合 ${collectionName} 不存在`);
        }
      });
      
    } catch (error) {
      console.error('❌ 获取集合列表失败:', error.message);
    }
    
    // 4. 测试直接访问集合
    console.log('\n🧪 测试直接访问集合...');
    
    // 测试 student_attendance
    try {
      console.log('📖 测试 student_attendance 集合...');
      const studentRecords = await pb.collection('student_attendance').getList(1, 1);
      console.log('✅ student_attendance 集合访问成功');
      console.log('📊 记录数量:', studentRecords.totalItems);
    } catch (error) {
      console.error('❌ student_attendance 集合访问失败:', error.message);
      console.error('🔍 错误详情:', {
        status: error.status,
        code: error.code,
        response: error.response
      });
    }
    
    // 测试 teacher_attendance
    try {
      console.log('📖 测试 teacher_attendance 集合...');
      const teacherRecords = await pb.collection('teacher_attendance').getList(1, 1);
      console.log('✅ teacher_attendance 集合访问成功');
      console.log('📊 记录数量:', teacherRecords.totalItems);
    } catch (error) {
      console.error('❌ teacher_attendance 集合访问失败:', error.message);
      console.error('🔍 错误详情:', {
        status: error.status,
        code: error.code,
        response: error.response
      });
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

// 运行检查
checkCollectionPermissions().then(() => {
  console.log('\n🏁 权限检查完成');
}).catch(error => {
  console.error('💥 权限检查失败:', error);
});
