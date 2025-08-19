import PocketBase from 'pocketbase'
import { networkDetector } from './network-config'

// 智能网络环境检测 - 使用新的网络检测器
const detectNetworkEnvironment = async () => {
  try {
    const networkStatus = await networkDetector.detectNetwork()
    
    if (!networkStatus.connected) {
      throw new Error(networkStatus.error || '网络连接失败')
    }
    
    return networkStatus.url
  } catch (error) {
    console.error('❌ 网络环境检测失败:', error)
    throw error
  }
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
    // 默认使用本地地址
    return 'http://localhost:8090'
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

// 兼容性导出（保持向后兼容）
export const pb = new PocketBase('http://192.168.0.59:8090') // 临时实例，会被智能检测覆盖

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
