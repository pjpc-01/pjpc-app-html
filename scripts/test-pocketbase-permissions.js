const PocketBase = require('pocketbase')

// 支持DDNS配置
const getPocketBaseUrl = () => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL
  }
  
  // 开发环境默认使用本地IP
  if (process.env.NODE_ENV === 'development') {
    return 'http://192.168.0.59:8090'
  }
  
  // 生产环境使用DDNS
  return 'http://pjpc.tplinkdns.com:8090'
}

const baseUrl = getPocketBaseUrl();
const pb = new PocketBase(baseUrl);

async function testPermissions() {
  try {
    console.log('=== PocketBase 权限测试 ===')
    console.log('服务器地址:', baseUrl)
    
    // 1. 测试未认证状态下的权限
    console.log('1. 测试未认证状态...')
    pb.authStore.clear()
    console.log('认证状态:', pb.authStore.isValid)
    
    try {
      const records = await pb.collection('students').getList(1, 5)
      console.log('❌ 未认证状态下应该无法访问数据')
    } catch (error) {
      console.log('✅ 未认证状态下正确拒绝访问:', error.message)
    }
    
    // 2. 测试管理员认证
    console.log('2. 测试管理员认证...')
    const adminEmail = 'admin@example.com' // 替换为实际的管理员邮箱
    const adminPassword = 'admin123' // 替换为实际的密码
    
    const authData = await pb.collection('users').authWithPassword(adminEmail, adminPassword)
    console.log('管理员认证成功:', authData.record.email)
    console.log('用户角色:', authData.record.role)
    
    // 3. 测试管理员权限
    console.log('3. 测试管理员权限...')
    const students = await pb.collection('students').getList(1, 5)
    console.log('✅ 管理员可以访问学生数据:', students.items.length, '个记录')
    
    const users = await pb.collection('users').getList(1, 5)
    console.log('✅ 管理员可以访问用户数据:', users.items.length, '个记录')
    
    // 4. 测试其他角色认证
    console.log('4. 测试其他角色认证...')
    pb.authStore.clear()
    
    const teacherEmail = 'teacher@example.com' // 替换为实际的教师邮箱
    const teacherPassword = 'teacher123' // 替换为实际的密码
    
    try {
      const teacherAuth = await pb.collection('users').authWithPassword(teacherEmail, teacherPassword)
      console.log('教师认证成功:', teacherAuth.record.email)
      console.log('教师角色:', teacherAuth.record.role)
      
      // 测试教师权限
      const teacherStudents = await pb.collection('students').getList(1, 5)
      console.log('✅ 教师可以访问学生数据:', teacherStudents.items.length, '个记录')
      
      // 测试教师是否无法访问用户数据
      try {
        const teacherUsers = await pb.collection('users').getList(1, 5)
        console.log('❌ 教师不应该能访问用户数据')
      } catch (error) {
        console.log('✅ 教师正确被拒绝访问用户数据:', error.message)
      }
      
    } catch (error) {
      console.log('教师认证失败:', error.message)
    }
    
    console.log('=== 权限测试完成 ===')
    
  } catch (error) {
    console.error('权限测试失败:', error)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      status: error.status,
      data: error.data
    })
  }
}

testPermissions()
