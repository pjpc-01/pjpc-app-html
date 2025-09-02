import PocketBase from 'pocketbase'
// 智能网络环境检测
const detectNetworkEnvironment = async () => {
  const testUrls = [
    { url: 'http://pjpc.tplinkdns.com:8090', type: 'ddns', name: 'DDNS' },
    { url: 'http://192.168.0.59:8090', type: 'local', name: '局域网' }
  ]
  
  // 并行测试所有URL
  const testPromises = testUrls.map(async (testUrl) => {
    try {
      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      // 测试PocketBase的根端点
      const response = await fetch(`${testUrl.url}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      const endTime = Date.now()
      const latency = endTime - startTime
      
      // 任何响应都认为是成功的（包括404，说明服务器在运行）
      return {
        url: testUrl.url,
        type: testUrl.type,
        name: testUrl.name,
        latency,
        success: true
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
  
  // 优先选择DDNS连接，如果DDNS可用则使用DDNS
  const ddnsConnection = successfulResults.find(r => r.type === 'ddns')
  if (ddnsConnection) {
    console.log(`🌐 网络环境检测完成: 优先使用DDNS (${ddnsConnection.url}) - 延迟: ${ddnsConnection.latency}ms`)
    return ddnsConnection.url
  }
  
  // 如果DDNS不可用，选择延迟最低的连接
  const bestConnection = successfulResults.reduce((best, current) => 
    current.latency < best.latency ? current : best
  )
  
  console.log(`🌐 网络环境检测完成: DDNS不可用，选择 ${bestConnection.name} (${bestConnection.url}) - 延迟: ${bestConnection.latency}ms`)
  
  return bestConnection.url
}

// PocketBase URL配置（智能检测网络环境）
const getPocketBaseUrl = async () => {
  // 优先使用环境变量（服务器端和客户端都支持）
  if (process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    console.log('🔧 使用环境变量配置的PocketBase URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL)
    return process.env.NEXT_PUBLIC_POCKETBASE_URL
  }
  
  // 智能检测网络环境
  try {
    const bestUrl = await detectNetworkEnvironment()
    return bestUrl
  } catch (error) {
    console.error('❌ 网络环境检测失败，使用默认DDNS配置:', error)
    // 默认使用DDNS地址
    return 'http://pjpc.tplinkdns.com:8090'
  }
}

// 创建PocketBase实例
let pbInstance: PocketBase | null = null
let authPromise: Promise<any> | null = null
let isAuthenticated = false

// 全局认证锁，防止并发认证
let authLock = false

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
  isAuthenticated = false
  authPromise = null
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

// 兼容性导出（保持向后兼容）
export const pb = new PocketBase('http://pjpc.tplinkdns.com:8090') // 临时实例，会被智能检测覆盖

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

// 管理员认证（带缓存和防重复）
export const authenticateAdmin = async (): Promise<void> => {
  if (isAuthenticated) {
    console.log('✅ 管理员已认证，跳过重复认证')
    return
  }

  // 检查全局认证锁
  if (authLock) {
    console.log('🔒 等待全局认证锁释放...')
    // 等待锁释放，最多等待5秒
    let waitTime = 0
    while (authLock && waitTime < 5000) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waitTime += 100
    }
    if (authLock) {
      throw new Error('认证锁超时')
    }
  }

  if (authPromise) {
    console.log('⏳ 等待进行中的认证请求...')
    try {
      await authPromise
      return
    } catch (error) {
      console.log('⚠️ 等待的认证请求失败，重新认证')
      // 如果等待的请求失败，清除状态并重新认证
      isAuthenticated = false
      authPromise = null
    }
  }

  // 设置全局认证锁
  authLock = true
  console.log('🔒 设置全局认证锁')

  try {
    // 添加重试机制
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        const pb = await getPocketBase()
        
        console.log(`🔄 开始管理员认证... (尝试 ${retryCount + 1}/${maxRetries})`)
        authPromise = pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        const authResult = await authPromise
        
        // 检查认证响应结构
        console.log('🔍 认证响应结构:', JSON.stringify(authResult, null, 2))
        
        if (authResult && (authResult.admin || authResult.token)) {
          isAuthenticated = true
          console.log('✅ 管理员认证成功')
          
          // 验证认证状态
          if (pb.authStore.isValid) {
            console.log('🔑 认证令牌有效')
            return // 成功，退出重试循环
          } else {
            console.log('⚠️ 认证令牌无效，重试...')
            isAuthenticated = false
            retryCount++
            continue
          }
        } else {
          console.log('⚠️ 认证响应格式:', authResult)
          throw new Error('认证响应格式错误')
        }
      } catch (error) {
        console.error(`❌ 管理员认证失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error)
        isAuthenticated = false
        retryCount++
        
        if (retryCount >= maxRetries) {
          console.error('❌ 达到最大重试次数，认证失败')
          throw error
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      } finally {
        authPromise = null
      }
    }
  } finally {
    // 释放全局认证锁
    authLock = false
    console.log('🔓 释放全局认证锁')
  }
}
