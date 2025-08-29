import PocketBase from 'pocketbase';

async function checkAdminPermissions() {
  console.log('🔍 检查管理员权限...\n');
  
  try {
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090');
    
    // 1. 测试基本连接
    console.log('📡 测试基本连接...');
    const healthResponse = await fetch('http://pjpc.tplinkdns.com:8090/api/health');
    if (healthResponse.ok) {
      console.log('✅ 基本连接成功');
    } else {
      console.log('❌ 基本连接失败');
      return;
    }
    
    // 2. 管理员认证
    console.log('\n🔐 管理员认证...');
    try {
      const authResult = await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
      console.log('✅ 管理员认证成功');
      console.log('👤 认证响应:', authResult);
      
      if (authResult && authResult.admin) {
        console.log('👤 管理员信息:', {
          id: authResult.admin.id,
          email: authResult.admin.email,
          name: authResult.admin.name,
          avatar: authResult.admin.avatar,
          created: authResult.admin.created,
          updated: authResult.admin.updated
        });
      } else {
        console.log('⚠️ 认证响应中没有admin对象');
      }
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError.message);
      return;
    }
    
    // 3. 检查认证状态
    console.log('\n🔍 检查认证状态...');
    if (pb.authStore.isValid) {
      console.log('✅ 认证状态有效');
      console.log('🔑 认证令牌:', pb.authStore.token ? '存在' : '不存在');
      console.log('👤 当前用户:', pb.authStore.model ? '已登录' : '未登录');
    } else {
      console.log('❌ 认证状态无效');
    }
    
    // 4. 测试集合访问权限
    console.log('\n📚 测试集合访问权限...');
    
    // 测试 student_attendance 集合
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
    
    // 测试 teacher_attendance 集合
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
checkAdminPermissions().then(() => {
  console.log('\n🏁 权限检查完成');
}).catch(error => {
  console.error('💥 权限检查失败:', error);
});
