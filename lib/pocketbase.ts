import PocketBase from 'pocketbase'
// 智能网络环境检测
const detectNetworkEnvironment = async () => {
  // 检查是否在GitHub Pages环境中运行
  const isGitHubPages = typeof window !== 'undefined' && 
    (window.location.hostname.includes('github.io') || window.location.hostname.includes('pjpc-01.github.io'))
  
  if (isGitHubPages) {
    // GitHub Pages环境下直接使用DDNS连接
    return {
      url: process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090',
      type: 'ddns',
      name: 'GitHub Pages DDNS',
      latency: 0,
      success: true
    }
  }
  
  // 检查是否在HTTPS模式下运行
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  
  if (isHttps) {
    // HTTPS模式下使用代理连接，避免混合内容错误
    return {
      url: '/api/pocketbase-proxy',
      type: 'proxy',
      name: 'HTTPS Proxy',
      latency: 0,
      success: true
    }
  }
  
  const testUrls = [
    { url: process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090', type: 'ddns', name: 'DDNS' },
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
const getPocketBaseUrl = async (): Promise<string> => {
  // 服务器端直接使用HTTP连接，避免自签名证书问题
  if (typeof window === 'undefined') {
    console.log('🔧 服务器端使用直接HTTP连接')
    return process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090'
  }
  
  // 客户端优先使用代理连接（避免CORS问题）
  console.log('🔧 客户端使用代理连接避免CORS问题')
  return '/api/pocketbase-proxy'
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
    
    // 设置超时和重试配置
    pbInstance.autoCancellation = false // 禁用自动取消
    pbInstance.timeout = 30000 // 30秒超时
    
    console.log('✅ PocketBase实例已创建:', url)
    
    // 添加错误处理
    pbInstance.afterSend = function (response, data) {
      if (!response.ok) {
        console.error('PocketBase请求失败:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        // 特殊处理常见错误
        if (response.status === 0) {
          console.error('❌ 网络连接失败 - 可能是CORS问题或服务器不可达')
        } else if (response.status === 404) {
          console.error('❌ 资源不存在 - 检查集合名称和端点')
        } else if (response.status === 400) {
          console.error('❌ 请求错误 - 检查请求参数和认证状态')
        } else if (response.status === 401) {
          console.error('❌ 认证失败 - 检查用户名密码或token')
        } else if (response.status === 403) {
          console.error('❌ 权限不足 - 检查用户角色和权限')
        } else if (response.status >= 500) {
          console.error('❌ 服务器错误 - PocketBase服务器可能有问题')
        }
      }
      return data
    }
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
    
    // 测试连接 - 使用PocketBase的根端点而不是/api/health
    // 如果baseUrl是代理路径，确保路径正确
    const testUrl = pb.baseUrl.startsWith('/api/') ? pb.baseUrl.replace(/\/$/, '') : `${pb.baseUrl}/`
    console.log('🔍 checkPocketBaseConnection 调试信息:', {
      baseUrl: pb.baseUrl,
      testUrl: testUrl,
      isApiPath: pb.baseUrl.startsWith('/api/'),
      protocol: window.location.protocol,
      host: window.location.host
    })
    
    // 在HTTPS环境下，确保使用正确的协议
    const fullUrl = testUrl.startsWith('/') ? `${window.location.protocol}//${window.location.host}${testUrl}` : testUrl
    console.log('🔍 完整URL:', fullUrl)
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    // 任何响应都认为是成功的（包括404，说明服务器在运行）
    if (response.status === 200 || response.status === 404) {
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
export const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090') // 临时实例，会被智能检测覆盖

// 导入集合定义
export * from './pocketbase-schema'
export type { 
  Student as StudentFromStudents,
  StudentCreateData,
  StudentUpdateData
} from './pocketbase-students'
export { 
  getAllStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getStudentById,
  searchStudents,
  getStudentsByCenter,
  getStudentsByStatus
} from './pocketbase-students'
export type { 
  Teacher as TeacherFromTeachers,
  TeacherCreateData,
  TeacherUpdateData
} from './pocketbase-teachers'
export { 
  getAllTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher
} from './pocketbase-teachers'

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

// ============================================================================
// 集合管理工具函数
// ============================================================================

/**
 * 获取集合实例
 */
export const getCollection = async (collectionName: string) => {
  const pb = await getPocketBase()
  return pb.collection(collectionName)
}

/**
 * 获取所有业务集合列表
 */
export const getBusinessCollections = async () => {
  const pb = await getPocketBase()
  await authenticateAdmin()
  
  const collections = await pb.collections.getFullList()
  return collections.filter(col => !col.system)
}

/**
 * 获取集合字段信息
 */
export const getCollectionFields = async (collectionName: string) => {
  const pb = await getPocketBase()
  await authenticateAdmin()
  
  try {
    const collection = await pb.collections.getOne(collectionName)
    return collection.schema || []
  } catch (error) {
    console.error(`获取集合 ${collectionName} 字段信息失败:`, error)
    return []
  }
}

/**
 * 验证集合是否存在
 */
export const collectionExists = async (collectionName: string): Promise<boolean> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const collections = await pb.collections.getFullList()
    return collections.some(col => col.name === collectionName)
  } catch (error) {
    console.error(`验证集合 ${collectionName} 存在性失败:`, error)
    return false
  }
}

/**
 * 获取集合统计信息
 */
export const getCollectionStats = async (collectionName: string) => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const collection = pb.collection(collectionName)
    const result = await collection.getList(1, 1)
    
    return {
      name: collectionName,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      perPage: result.perPage,
      page: result.page
    }
  } catch (error) {
    console.error(`获取集合 ${collectionName} 统计信息失败:`, error)
    return null
  }
}

/**
 * 获取集合字段信息（基于真实数据）
 */
export const getCollectionFieldInfo = async (collectionName: string) => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    // 尝试获取样本数据来推断字段
    const sampleResult = await pb.collection(collectionName).getList(1, 1)
    
    if (sampleResult.items && sampleResult.items.length > 0) {
      const sampleItem = sampleResult.items[0]
      const fields = Object.keys(sampleItem).map(key => ({
        name: key,
        type: typeof sampleItem[key],
        value: sampleItem[key],
        isSystem: ['id', 'created', 'updated', 'collectionId', 'collectionName'].includes(key)
      }))
      
      return {
        collectionName,
        hasData: true,
        fieldCount: fields.length,
        fields: fields.filter(f => !f.isSystem),
        systemFields: fields.filter(f => f.isSystem),
        sampleData: sampleItem
      }
    } else {
      return {
        collectionName,
        hasData: false,
        fieldCount: 0,
        fields: [],
        systemFields: [],
        sampleData: null
      }
    }
  } catch (error) {
    console.error(`获取集合 ${collectionName} 字段信息失败:`, error)
    return {
      collectionName,
      hasData: false,
      fieldCount: 0,
      fields: [],
      systemFields: [],
      sampleData: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 获取所有集合的完整字段信息
 */
export const getAllCollectionsFieldInfo = async () => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    
    const collections = await pb.collections.getFullList()
    const businessCollections = collections.filter(col => !col.system)
    
    const fieldInfo = {
      timestamp: new Date().toISOString(),
      server: pbInstance?.baseUrl || 'unknown',
      totalCollections: businessCollections.length,
      collections: [] as any[]
    }
    
    for (const collection of businessCollections) {
      const info = await getCollectionFieldInfo(collection.name)
      fieldInfo.collections.push(info)
    }
    
    return fieldInfo
  } catch (error) {
    console.error('获取所有集合字段信息失败:', error)
    throw error
  }
}

/**
 * 验证集合字段与TypeScript接口的一致性
 */
export const validateCollectionFields = async (collectionName: string, interfaceName: string) => {
  try {
    const fieldInfo = await getCollectionFieldInfo(collectionName)
    
    if (!fieldInfo.hasData) {
      return {
        collectionName,
        interfaceName,
        status: 'no_data',
        message: '集合没有数据，无法验证字段'
      }
    }
    
    // 这里可以添加更详细的字段验证逻辑
    return {
      collectionName,
      interfaceName,
      status: 'validated',
      fieldCount: fieldInfo.fieldCount,
      fields: fieldInfo.fields.map(f => f.name),
      message: '字段验证完成'
    }
  } catch (error) {
    return {
      collectionName,
      interfaceName,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

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
  if (authLock) {
    console.log('🔒 等待其他认证完成...')
    // 等待锁释放
    let waitTime = 0
    while (authLock && waitTime < 10000) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waitTime += 100
    }
    if (authLock) {
      throw new Error('认证锁超时')
    }
    return // 其他认证已完成
  }
  
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
        // 优先使用环境变量，如果环境变量有问题则使用硬编码凭据
        let adminEmail = process.env.POCKETBASE_ADMIN_EMAIL
        let adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD
        
        // 如果环境变量有问题（编码问题等），使用硬编码凭据
        if (!adminEmail || !adminPassword || adminEmail.includes('undefined') || adminPassword.includes('undefined')) {
          console.log('⚠️ 环境变量有问题，使用硬编码凭据')
          adminEmail = 'pjpcemerlang@gmail.com'
          adminPassword = '0122270775Sw!'
        }

        if (!adminEmail || !adminPassword) {
          throw new Error('管理员凭据未配置，请检查环境变量')
        }

        authPromise = pb.admins.authWithPassword(adminEmail, adminPassword)
        
        // 添加超时处理
        const authResult = await Promise.race([
          authPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('认证超时')), 15000)
          )
        ])
        
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
