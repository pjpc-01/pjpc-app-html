/**
 * 安全的API客户端
 * 通过API路由获取数据，避免直接访问PocketBase
 */

/**
 * 通过API路由获取数据
 */
const fetchFromAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      // 如果是500错误，尝试返回空结果而不是抛出错误
      if (response.status === 500) {
        console.warn(`⚠️ API返回500错误 [${endpoint}]，返回空结果`)
        return { items: [], totalItems: 0, page: 1, perPage: 10, totalPages: 0 }
      }
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API请求失败 [${endpoint}]:`, error)
    
    // 对于网络错误或500错误，返回空结果而不是抛出错误
    if (error instanceof Error && (
      error.message.includes('500') || 
      error.message.includes('fetch') ||
      error.message.includes('network')
    )) {
      console.warn(`⚠️ 网络或服务器错误，返回空结果`)
      return { items: [], totalItems: 0, page: 1, perPage: 10, totalPages: 0 }
    }
    
    throw error
  }
}

/**
 * 构建API端点URL
 */
const buildApiUrl = (collection: string, options: any = {}) => {
  const baseUrl = '/api/pocketbase-proxy/api/collections'
  let url = `${baseUrl}/${collection}/records`
  
  const params = new URLSearchParams()
  
  if (options.page) params.append('page', options.page.toString())
  if (options.perPage) params.append('perPage', options.perPage.toString())
  if (options.filter) params.append('filter', options.filter)
  if (options.sort) params.append('sort', options.sort)
  
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

/**
 * 安全的数据获取函数
 */
export const fetchSecureData = async <T>(
  collectionName: string,
  options: {
    page?: number
    perPage?: number
    filter?: string
    sort?: string
    fullList?: boolean
  } = {}
): Promise<T> => {
  try {
    if (options.fullList) {
      // 获取完整列表时使用较大的perPage
      options.perPage = options.perPage || 200
    }

    const url = buildApiUrl(collectionName, options)
    const result = await fetchFromAPI(url)
    
    // 如果请求的是fullList，返回items数组，否则返回完整结果
    if (options.fullList && result && typeof result === 'object' && 'items' in result) {
      return (result as any).items as T
    }
    
    return result as T
  } catch (error) {
    console.error(`获取${collectionName}数据失败:`, error)
    throw error
  }
}

/**
 * 并行获取多个集合的数据
 */
export const fetchMultipleCollections = async (requests: Array<{
  collection: string
  options?: any
  fullList?: boolean
}>) => {
  try {
    const promises = requests.map(({ collection, options, fullList }) => {
      return fetchSecureData(collection, {
        ...options,
        fullList
      })
    })

    return await Promise.all(promises)
  } catch (error) {
    console.error('并行获取数据失败:', error)
    throw error
  }
}

/**
 * 获取单个记录
 */
export const fetchRecord = async (collectionName: string, recordId: string) => {
  try {
    const url = `/api/pocketbase-proxy/api/collections/${collectionName}/records/${recordId}`
    return await fetchFromAPI(url)
  } catch (error) {
    console.error(`获取${collectionName}记录失败:`, error)
    throw error
  }
}

/**
 * 创建记录
 */
export const createRecord = async (collectionName: string, data: any) => {
  try {
    const url = `/api/pocketbase-proxy/api/collections/${collectionName}/records`
    return await fetchFromAPI(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error(`创建${collectionName}记录失败:`, error)
    throw error
  }
}

/**
 * 更新记录
 */
export const updateRecord = async (collectionName: string, recordId: string, data: any) => {
  try {
    const url = `/api/pocketbase-proxy/api/collections/${collectionName}/records/${recordId}`
    return await fetchFromAPI(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error(`更新${collectionName}记录失败:`, error)
    throw error
  }
}

/**
 * 删除记录
 */
export const deleteRecord = async (collectionName: string, recordId: string) => {
  try {
    const url = `/api/pocketbase-proxy/api/collections/${collectionName}/records/${recordId}`
    return await fetchFromAPI(url, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error(`删除${collectionName}记录失败:`, error)
    throw error
  }
}
