import PocketBase from 'pocketbase'

// PocketBase客户端配置
export const pb = new PocketBase('http://192.168.0.59:8090')

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

// 连接检查函数
export const checkPocketBaseConnection = async () => {
  try {
    console.log('Checking PocketBase connection...')
    
    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch('http://192.168.0.59:8090/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    console.log('PocketBase health check response:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('PocketBase health check data:', data)
      return { connected: true, error: null }
    } else {
      console.error('PocketBase health check failed:', response.status, response.statusText)
      return { connected: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
  } catch (error) {
    console.error('PocketBase connection error:', error)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { connected: false, error: '连接超时' }
      }
      return { connected: false, error: error.message }
    }
    return { connected: false, error: 'Unknown error' }
  }
}
