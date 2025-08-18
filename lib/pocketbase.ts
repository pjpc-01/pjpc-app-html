import PocketBase from 'pocketbase'

// PocketBase URL配置（智能检测网络环境）
const getPocketBaseUrl = () => {
  // 优先使用环境变量
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL
  }
  
  // 默认使用DDNS地址，但会在运行时动态检测
  return 'http://pjpc.tplinkdns.com:8090'
}

// 创建PocketBase实例
export const pb = new PocketBase(getPocketBaseUrl())

// 移除所有拦截器以避免数据修改问题

// 用户类型定义
export interface UserProfile {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "parent" | "accountant"
  status: "pending" | "approved" | "suspended"
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  loginAttempts: number
  lockedUntil?: string
  approvedBy?: string
  approvedAt?: string
}

// 认证状态类型
export interface AuthState {
  user: any | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'checking'
}

// 智能网络环境检测
export const detectNetworkEnvironment = async () => {
  const testUrls = [
    { url: 'http://192.168.0.59:8090', type: 'local', name: '局域网' },
    { url: 'http://pjpc.tplinkdns.com:8090', type: 'ddns', name: 'DDNS' }
  ]
  
  const results = []
  
  // 并行测试所有URL
  const testPromises = testUrls.map(async (testUrl) => {
    try {
      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      // 测试PocketBase的API健康检查端点
      const response = await fetch(`${testUrl.url}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      const endTime = Date.now()
      const latency = endTime - startTime
      
      if (response.ok) {
        return {
          url: testUrl.url,
          type: testUrl.type,
          name: testUrl.name,
          latency,
          success: true
        }
      }
    } catch (error) {
      console.log(`${testUrl.name}连接失败:`, error)
      return {
        url: testUrl.url,
        type: testUrl.type,
        name: testUrl.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
  
  const testResults = await Promise.all(testPromises)
  const successfulResults = testResults.filter((r): r is NonNullable<typeof r> & { success: true; latency: number } => r?.success === true)
  
  if (successfulResults.length === 0) {
    throw new Error('无法连接到PocketBase服务器')
  }
  
  // 选择延迟最低的连接
  const bestConnection = successfulResults.reduce((best, current) => 
    current.latency < best.latency ? current : best
  )
  
  console.log(`✅ 选择最佳连接: ${bestConnection.name} (${bestConnection.latency}ms)`)
  return bestConnection
}

// 智能连接检查函数
export const checkPocketBaseConnection = async () => {
  try {
    console.log('检查PocketBase连接...')
    
    // 使用本地API代理进行健康检查，避免直接访问PocketBase内部路径
    const healthUrl = '/api/pocketbase/health'
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    console.log('PocketBase健康检查响应:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('PocketBase健康检查数据:', data)
      return { connected: true, error: null }
    } else {
      console.error('PocketBase健康检查失败:', response.status, response.statusText)
      return { connected: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
  } catch (error) {
    console.error('PocketBase连接错误:', error)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { connected: false, error: '连接超时' }
      }
      return { connected: false, error: error.message }
    }
    return { connected: false, error: '未知错误' }
  }
}

// 动态更新PocketBase URL
export const updatePocketBaseUrl = async () => {
  try {
    const networkInfo = await detectNetworkEnvironment()
    const newUrl = networkInfo.url
    
    // 更新PocketBase实例的baseURL（修复已弃用的 baseUrl 属性）
    pb.baseURL = newUrl
    console.log(`PocketBase URL已更新为: ${newUrl} (${networkInfo.type})`)
    
    return { success: true, url: newUrl, type: networkInfo.type }
  } catch (error) {
    console.error('更新PocketBase URL失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '未知错误' }
  }
}

// 健康检查函数（兼容性）
export const checkPocketBaseHealth = async () => {
  return await checkPocketBaseConnection()
}

// 初始化连接
export const initializePocketBase = async () => {
  try {
    const result = await updatePocketBaseUrl()
    if (result.success) {
      // 执行健康检查
      const healthCheck = await checkPocketBaseHealth()
      console.log('PocketBase健康状态:', healthCheck)
      return { ...result, health: healthCheck }
    }
    return result
  } catch (error) {
    console.error('PocketBase初始化失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

// 导出默认实例
export default pb
