import PocketBase from 'pocketbase'
// 智能网络环境检测
const detectNetworkEnvironment = async () => {
  const testUrls = [
    { url: 'http://192.168.0.59:8090', type: 'local', name: '局域网' },
    { url: 'http://pjpc.tplinkdns.com:8090', type: 'ddns', name: 'DDNS' }
  ]
  
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
  
  console.log(`🌐 网络环境检测完成: 选择 ${bestConnection.name} (${bestConnection.url}) - 延迟: ${bestConnection.latency}ms`)
  
  return bestConnection.url
}

// PocketBase URL配置（智能检测网络环境）
const getPocketBaseUrl = async () => {
  // 优先使用环境变量
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    console.log('🔧 使用环境变量配置的PocketBase URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL)
    return process.env.NEXT_PUBLIC_POCKETBASE_URL
  }
  
  // 智能检测网络环境
  try {
    const bestUrl = await detectNetworkEnvironment()
    return bestUrl
  } catch (error) {
    console.error('❌ 网络环境检测失败，使用默认配置:', error)
    // 默认使用局域网地址
    return 'http://192.168.0.59:8090'
  }
}

// 创建PocketBase实例
let pbInstance: PocketBase | null = null

// 获取PocketBase实例（单例模式）
export const getPocketBase = async (): Promise<PocketBase> => {
  if (!pbInstance) {
    const url = await getPocketBaseUrl()
    pbInstance = new PocketBase(url)
    console.log('✅ PocketBase实例已创建:', url)
  }
  return pbInstance
}

// 重新初始化PocketBase实例（用于网络环境变化时）
export const reinitializePocketBase = async () => {
  pbInstance = null
  return await getPocketBase()
}

// 检查PocketBase连接状态
export const checkPocketBaseConnection = async () => {
  try {
    const pb = await getPocketBase()
    
    // 测试连接
    const response = await fetch(`${pb.baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (response.ok) {
      return {
        connected: true,
        url: pb.baseUrl,
        error: null
      }
    } else {
      return {
        connected: false,
        url: pb.baseUrl,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  } catch (error) {
    return {
      connected: false,
      url: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 兼容性导出（保持向后兼容）- 使用智能检测
export const pb = new Proxy({} as PocketBase, {
  get(target, prop) {
    if (!pbInstance) {
      // 如果实例不存在，创建一个默认实例
      pbInstance = new PocketBase('http://pjpc.tplinkdns.com:8090')
      console.log('🔧 创建兼容性PocketBase实例:', pbInstance.baseUrl)
    }
    return (pbInstance as any)[prop]
  }
})

// 初始化兼容性实例
const initCompatibilityInstance = async () => {
  try {
    const url = await getPocketBaseUrl()
    pbInstance = new PocketBase(url)
    console.log('✅ 兼容性PocketBase实例已初始化:', url)
  } catch (error) {
    console.error('❌ 兼容性PocketBase实例初始化失败:', error)
    // 使用默认URL
    pbInstance = new PocketBase('http://pjpc.tplinkdns.com:8090')
  }
}

// 在模块加载时初始化
if (typeof window !== 'undefined') {
  initCompatibilityInstance()
}

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

// 导出默认实例
export default pb
