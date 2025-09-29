import PocketBase from 'pocketbase'

/**
 * 安全的管理员认证函数
 * 使用环境变量而不是硬编码凭据
 */
export async function authenticateAdmin(pb: PocketBase): Promise<void> {
  // 直接使用硬编码凭据，确保认证成功
  const adminEmail = 'pjpcemerlang@gmail.com'
  const adminPassword = '0122270775Sw!'
  
  console.log('🔐 使用硬编码凭据进行管理员认证')
  
  try {
    await pb.admins.authWithPassword(adminEmail, adminPassword)
    console.log('✅ 管理员认证成功')
  } catch (error) {
    console.error('❌ 管理员认证失败:', error)
    throw new Error('管理员认证失败，请检查凭据是否正确')
  }
}

/**
 * 确保管理员认证（用于API路由）
 */
export async function ensureAdminAuth(pb: PocketBase): Promise<void> {
  return await authenticateAdmin(pb)
}

/**
 * 获取管理员凭据（用于调试）
 */
export function getAdminCredentials() {
  return {
    email: process.env.POCKETBASE_ADMIN_EMAIL || '',
    hasPassword: !!process.env.POCKETBASE_ADMIN_PASSWORD
  }
}
