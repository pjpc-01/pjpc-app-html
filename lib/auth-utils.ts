import { getPocketBase } from './pocketbase'

/**
 * 安全的管理员认证函数
 * 使用fetch直接调用PB admin API（绕过SDK版本兼容问题）
 */
export async function authenticateAdmin(pb: any): Promise<void> {
  const adminEmail = 'final_admin@test.com'
  const adminPassword = 'final_pass'
  
  console.log('🔐 使用fetch直接进行管理员认证')
  
  try {
    // 直接使用fetch调用admin auth API，避免SDK版本兼容问题
    const baseUrl = pb.baseUrl || 'http://127.0.0.1:8090'
    const response = await fetch(`${baseUrl}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword })
    })
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || `认证失败: HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    // 手动设置PB实例的auth store
    pb.authStore.save(data.token || data.token, data.admin)
    console.log('✅ 管理员认证成功')
  } catch (error) {
    console.error('❌ 管理员认证失败:', error)
    throw new Error('管理员认证失败，请检查凭据是否正确')
  }
}

/**
 * 确保管理员认证（用于API路由）
 */
export async function ensureAdminAuth(pb: any): Promise<void> {
  if (!pb.authStore?.isValid) {
    return await authenticateAdmin(pb)
  }
}

/**
 * 获取管理员凭据（用于调试）
 */
export function getAdminCredentials() {
  return {
    email: process.env.POCKETBASE_ADMIN_EMAIL || 'final_admin@test.com',
    hasPassword: !!process.env.POCKETBASE_ADMIN_PASSWORD
  }
}
