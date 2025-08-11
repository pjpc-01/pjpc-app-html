import PocketBase from 'pocketbase'

// 智能PocketBase URL检测和配置
const getPocketBaseUrl = () => {
  // 优先使用环境变量
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    return process.env.NEXT_PUBLIC_POCKETBASE_URL
  }
  
  // 浏览器环境 - 强制使用DDNS地址（因为现在在家）
  if (typeof window !== 'undefined') {
    return 'http://pjpc.tplinkdns.com:8090'
  }
  
  // 服务器环境 - 智能检测网络环境
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：优先尝试局域网，失败则使用DDNS
    return process.env.LOCAL_POCKETBASE_URL || 'http://192.168.0.59:8090'
  }
  
  // 生产环境使用DDNS
  return 'http://pjpc.tplinkdns.com:8090'
}

// 创建PocketBase实例
export const pb = new PocketBase(getPocketBaseUrl())

// 添加请求拦截器来处理网络错误
pb.beforeSend = function(url, options) {
  console.log('PocketBase请求:', url, options)
  return { url, options }
}

pb.afterSend = function(response, data) {
  console.log('PocketBase响应:', response.status, data)
  return { response, data }
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

// 网络环境检测
export const detectNetworkEnvironment = async () => {
  const testUrls = [
    'http://192.168.0.59:8090/api/health',  // 局域网
    'http://pjpc.tplinkdns.com:8090/api/health',  // DDNS
  ]
  
  for (const url of testUrls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const isLocal = url.includes('192.168.0.59')
        console.log(`PocketBase连接成功: ${isLocal ? '局域网' : 'DDNS'} - ${url}`)
        return { 
          url: url.replace('/api/health', ''), 
          type: isLocal ? 'local' : 'ddns',
          latency: Date.now()
        }
      }
    } catch (error) {
      console.log(`连接失败: ${url}`, error)
      continue
    }
  }
  
  throw new Error('无法连接到PocketBase服务器')
}

// 智能连接检查函数
export const checkPocketBaseConnection = async () => {
  try {
    console.log('检查PocketBase连接...')
    
    // 根据环境选择正确的健康检查URL
    let healthUrl: string
    if (typeof window !== 'undefined') {
      // 浏览器环境使用代理
      healthUrl = '/api/pocketbase/health'
    } else {
      // 服务器环境 - 智能检测
      const networkInfo = await detectNetworkEnvironment()
      healthUrl = `${networkInfo.url}/api/health`
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
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
    
    // 更新PocketBase实例的baseURL
    pb.baseUrl = newUrl
    console.log(`PocketBase URL已更新为: ${newUrl} (${networkInfo.type})`)
    
    return { success: true, url: newUrl, type: networkInfo.type }
  } catch (error) {
    console.error('更新PocketBase URL失败:', error)
    return { success: false, error: error instanceof Error ? error.message : '未知错误' }
  }
}
