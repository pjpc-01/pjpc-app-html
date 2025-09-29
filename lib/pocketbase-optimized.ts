import PocketBase from 'pocketbase'

// 环境变量检查
console.log("🔍 环境变量检查:")
console.log("PocketBase URL:", process.env.POCKETBASE_URL)
console.log("Admin Email:", process.env.POCKETBASE_ADMIN_EMAIL)
console.log("Admin Password Exists:", !!process.env.POCKETBASE_ADMIN_PASSWORD)

// 全局PocketBase实例缓存
let pb: PocketBase | null = null

/**
 * 获取PocketBase实例（带缓存 + 自动认证）
 * 避免每次请求都401错误
 */
export async function getPocketBase(): Promise<PocketBase> {
  // 创建实例（如果不存在）
  if (!pb) {
    const url = process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090'
    pb = new PocketBase(url)
    console.log('✅ PocketBase实例已创建:', url)
  }

  // 确保 admin 已认证
  if (!pb.authStore.isValid) {
    console.log('🔑 认证已过期，重新进行管理员认证...')
    
    let adminEmail = process.env.POCKETBASE_ADMIN_EMAIL
    let adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD
    
    // 如果环境变量有问题，使用硬编码凭据作为fallback
    if (!adminEmail || !adminPassword || adminEmail.includes('') || adminPassword.includes('')) {
      console.log('⚠️ 环境变量有问题，使用硬编码凭据')
      adminEmail = 'pjpcemerlang@gmail.com'
      adminPassword = '0122270775Sw!'
    }
    
    if (!adminEmail || !adminPassword) {
      throw new Error('管理员凭据未配置，请检查环境变量')
    }
    
    try {
      await pb.admins.authWithPassword(adminEmail, adminPassword)
      console.log("✅ PocketBase 管理员已认证")
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      throw new Error(`PocketBase认证失败: ${authError instanceof Error ? authError.message : '未知认证错误'}`)
    }
  } else {
    console.log("🔑 PocketBase 管理员认证仍然有效")
  }

  return pb
}

/**
 * 重新初始化PocketBase实例
 * 用于网络环境变化或认证失败时
 */
export async function reinitializePocketBase(): Promise<PocketBase> {
  console.log('🔄 重新初始化PocketBase实例...')
  pb = null
  return await getPocketBase()
}

/**
 * 检查PocketBase连接状态
 */
export async function checkPocketBaseConnection() {
  try {
    const pb = await getPocketBase()
    
    // 测试连接
    const response = await fetch(`${pb.baseUrl}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    return {
      connected: response.ok || response.status === 404, // 404也算连接成功
      url: pb.baseUrl,
      status: response.status,
      error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (error) {
    return {
      connected: false,
      url: 'unknown',
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default getPocketBase

