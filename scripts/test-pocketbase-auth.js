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

async function testAuth() {
  try {
    console.log('=== PocketBase 认证测试 ===')
    console.log('服务器地址:', baseUrl)
    
    // 1. 测试连接
    console.log('1. 测试服务器连接...')
    const health = await fetch(`${baseUrl}/api/health`)
    console.log('健康检查状态:', health.status, health.statusText)
    
    if (!health.ok) {
      throw new Error(`服务器连接失败: ${health.status} ${health.statusText}`)
    }
    
    // 2. 测试用户认证
    console.log('2. 测试用户认证...')
    const email = 'admin@example.com' // 替换为实际的管理员邮箱
    const password = 'admin123' // 替换为实际的密码
    
    const authData = await pb.collection('users').authWithPassword(email, password)
    console.log('认证成功:', authData.record.email)
    console.log('用户角色:', authData.record.role)
    console.log('认证状态:', pb.authStore.isValid)
    
    // 3. 测试获取用户资料
    console.log('3. 测试获取用户资料...')
    const userProfile = await pb.collection('users').getOne(authData.record.id)
    console.log('用户资料获取成功:', userProfile.name)
    
    // 4. 测试登出
    console.log('4. 测试登出...')
    pb.authStore.clear()
    console.log('登出成功，认证状态:', pb.authStore.isValid)
    
    console.log('=== 认证测试完成 ===')
    
  } catch (error) {
    console.error('认证测试失败:', error)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      status: error.status,
      data: error.data
    })
  }
}

testAuth()
