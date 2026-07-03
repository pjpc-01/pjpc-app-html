import PocketBase from 'pocketbase'

const detectNetworkEnvironment = async () => {
  const isGitHubPages = typeof window !== 'undefined' && 
    (window.location.hostname.includes('github.io') || window.location.hostname.includes('pjpc-01.github.io'))
  
  if (isGitHubPages) {
    return {
      url: process.env.POCKETBASE_URL || 'http://localhost:8090',
      type: 'ddns',
      name: 'GitHub Pages DDNS',
      latency: 0,
      success: true
    }
  }
  
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  if (isHttps) {
    return {
      url: '/api/pocketbase-proxy',
      type: 'proxy',
      name: 'HTTPS Proxy',
      latency: 0,
      success: true
    }
  }
  
  const testUrls = [
    { url: process.env.POCKETBASE_URL || 'http://localhost:8090', type: 'ddns', name: 'DDNS' },
    { url: 'http://192.168.0.59:8090', type: 'local', name: '局域网' }
  ]
  
  const testPromises = testUrls.map(async (testUrl) => {
    try {
      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const response = await fetch(`${testUrl.url}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const endTime = Date.now()
      return {
        url: testUrl.url,
        type: testUrl.type,
        name: testUrl.name,
        latency: endTime - startTime,
        success: true
      }
    } catch (error) {
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
  
  const ddnsConnection = successfulResults.find(r => r.type === 'ddns')
  if (ddnsConnection) return ddnsConnection.url
  
  const bestConnection = successfulResults.reduce((best, current) => 
    current.latency < best.latency ? current : best
  )
  return bestConnection.url
}

const getPocketBaseUrl = async (): Promise<string> => {
  if (typeof window === 'undefined') return process.env.POCKETBASE_URL || 'http://localhost:8090'
  return '/api/pocketbase-proxy'
}

let pbInstance: PocketBase | null = null
let authPromise: Promise<any> | null = null
let isAuthenticated = false
let authLock = false

export const getPocketBase = async (): Promise<PocketBase> => {
  if (!pbInstance) {
    const url = await getPocketBaseUrl()
    pbInstance = new PocketBase(url)
    
    pbInstance.afterSend = function (response, data) {
      if (!response.ok) {
        console.warn('PocketBase request failed:', {
          status: response.status,
          url: response.url,
        })
      }
      return data
    }
  }
  return pbInstance
}

export const reinitializePocketBase = async () => {
  pbInstance = null
  isAuthenticated = false
  authPromise = null
  return await getPocketBase()
}

export const checkPocketBaseConnection = async () => {
  try {
    const pb = await getPocketBase()
    const testUrl = pb.baseUrl.startsWith('/api/') ? pb.baseUrl.replace(/\/$/, '') : `${pb.baseUrl}/`
    const fullUrl = testUrl.startsWith('/') ? `${window.location.protocol}//${window.location.host}${testUrl}` : testUrl
    const response = await fetch(fullUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    if (response.status === 200 || response.status === 404) {
      return { connected: true, url: pb.baseUrl, error: null }
    }
    return { connected: false, url: pb.baseUrl, error: `HTTP ${response.status}` }
  } catch (error) {
    return { connected: false, url: 'unknown', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090') 
export * from './pocketbase-schema'
export type { Student as StudentFromStudents, StudentCreateData, StudentUpdateData } from './pocketbase-students'
export { getAllStudents, addStudent, updateStudent, deleteStudent, getStudentById, searchStudents, getStudentsByCenter, getStudentsByStatus } from './pocketbase-students'
export type { Teacher as TeacherFromTeachers, TeacherCreateData, TeacherUpdateData } from './pocketbase-teachers'
export { getAllTeachers, addTeacher, updateTeacher, deleteTeacher } from './pocketbase-teachers'

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
  approvedAt?: string
}

export interface AuthState {
  user: any | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'checking'
}

export default pb

export const getCollection = async (collectionName: string) => {
  const pb = await getPocketBase()
  return pb.collection(collectionName)
}

export const getBusinessCollections = async () => {
  const pb = await getPocketBase()
  await authenticateAdmin()
  const collections = await pb.collections.getFullList()
  return collections.filter(col => !col.system)
}

export const getCollectionFields = async (collectionName: string) => {
  const pb = await getPocketBase()
  await authenticateAdmin()
  try {
    const collection = await pb.collections.getOne(collectionName)
    return collection.schema || []
  } catch (error) {
    return []
  }
}

export const collectionExists = async (collectionName: string): Promise<boolean> => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
    const collections = await pb.collections.getFullList()
    return collections.some(col => col.name === collectionName)
  } catch (error) {
    return false
  }
}

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
      perPage: result.perPage
    }
  } catch (error) {
    return null
  }
}

export const getCollectionFieldInfo = async (collectionName: string) => {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()
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
    }
    return { collectionName, hasData: false, fieldCount: 0, fields: [], systemFields: [], sampleData: null }
  } catch (error) {
    return { collectionName, hasData: false, fieldCount: 0, fields: [], systemFields: [], sampleData: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

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
    throw error
  }
}

export const validateCollectionFields = async (collectionName: string, interfaceName: string) => {
  try {
    const fieldInfo = await getCollectionFieldInfo(collectionName)
    if (!fieldInfo.hasData) {
      return { collectionName, interfaceName, status: 'no_data', message: '集合没有数据，无法验证字段' }
    }
    return { collectionName, interfaceName, status: 'validated', fieldCount: fieldInfo.fieldCount, fields: fieldInfo.fields.map(f => f.name), message: '字段验证完成' }
  } catch (error) {
    return { collectionName, interfaceName, status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export const authenticateAdmin = async (): Promise<void> => {
  if (isAuthenticated) return
  if (authLock) {
    let waitTime = 0
    while (authLock && waitTime < 5000) {
      await new Promise(resolve => setTimeout(resolve, 100))
      waitTime += 100
    }
    if (authLock) throw new Error('认证锁超时')
  }

  authLock = true
  try {
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || 'admin@pjpc.com',
      process.env.POCKETBASE_ADMIN_PASSWORD || '1234567890'
    )
    isAuthenticated = true
  } catch (error) {
    isAuthenticated = false
    throw error
  } finally {
    authLock = false
  }
}
