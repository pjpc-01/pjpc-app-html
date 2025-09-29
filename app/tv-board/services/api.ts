/**
 * TV Board API 服务
 * 统一管理所有API调用，简化错误处理和重试逻辑
 */

interface ApiResponse<T> {
  success: boolean
  data?: T
  students?: T
  error?: string
  details?: string
}

interface ApiConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
}

class ApiService {
  private baseConfig: ApiConfig = {
    timeout: 60000, // 增加超时时间到60秒
    retries: 3, // 增加重试次数
    retryDelay: 3000 // 增加重试延迟到3秒
  }
  
  // 简单的内存缓存
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 5000 // 减少到5秒缓存，确保数据及时更新

  // 清除缓存
  clearCache() {
    this.cache.clear()
    console.log('[API] 缓存已清除')
  }

  // 清除特定模式的缓存
  clearCacheByPattern(pattern: string) {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern))
    keysToDelete.forEach(key => this.cache.delete(key))
    console.log(`[API] 已清除 ${keysToDelete.length} 个匹配 "${pattern}" 的缓存项`)
  }

  private async fetchWithRetry<T>(
    url: string, 
    options: RequestInit = {}, 
    config: ApiConfig = {}
  ): Promise<ApiResponse<T>> {
    const finalConfig = { ...this.baseConfig, ...config }
    let lastError: Error | null = null

  // 检查缓存（仅对GET请求）
  if (options.method === 'GET' || !options.method) {
    const cacheKey = `${url}_${JSON.stringify(options)}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[API] 使用缓存数据: ${url}`)
      // 临时禁用缓存来调试问题
      // return { success: true, data: cached.data }
    }
  }

    for (let attempt = 0; attempt <= finalConfig.retries!; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...options.headers
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          // 尝试获取响应体中的错误信息
          let errorBody = null
          try {
            const errorText = await response.text()
            try {
              errorBody = JSON.parse(errorText)
            } catch {
              errorBody = { raw: errorText }
            }
          } catch (bodyError) {
            console.error('[API] 无法读取错误响应体:', bodyError)
          }

          // 对于401错误，不进行重试
          if (response.status === 401) {
            console.error(`[API] 401错误详情:`, {
              url,
              status: response.status,
              statusText: response.statusText,
              errorBody
            })
            throw new Error(`认证失败 (401): 请检查服务器配置或登录状态`)
          }
          // 对于408超时，不进行重试
          if (response.status === 408) {
            console.error(`[API] 408错误详情:`, {
              url,
              status: response.status,
              statusText: response.statusText,
              errorBody
            })
            throw new Error(`请求超时 (408): 服务器响应时间过长，请稍后重试`)
          }
          // 对于500错误，提供更友好的错误信息
          if (response.status === 500) {
            console.error(`[API] 500错误详情:`, {
              url,
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              errorBody
            })
            const errorMessage = errorBody?.error || errorBody?.message || '服务器暂时不可用'
            throw new Error(`服务器内部错误 (500): ${errorMessage}`)
          }
          // 对于其他错误
          console.error(`[API] ${response.status}错误详情:`, {
            url,
            status: response.status,
            statusText: response.statusText,
            errorBody
          })
          const errorMessage = errorBody?.error || errorBody?.message || response.statusText
          throw new Error(`HTTP ${response.status}: ${errorMessage}`)
        }

        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error(`[API] JSON解析失败:`, {
            url,
            status: response.status,
            error: jsonError
          })
          throw new Error(`响应数据格式错误: ${jsonError instanceof Error ? jsonError.message : '未知错误'}`)
        }
        
        // 存储到缓存（仅对GET请求）
        if (options.method === 'GET' || !options.method) {
          const cacheKey = `${url}_${JSON.stringify(options)}`
          this.cache.set(cacheKey, { data, timestamp: Date.now() })
        }
        
        return { success: true, data }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < finalConfig.retries!) {
          const delay = finalConfig.retryDelay! * Math.pow(2, attempt)
          console.log(`[API] 重试 ${attempt + 1}/${finalConfig.retries} 在 ${delay}ms 后...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed',
      details: lastError?.stack
    }
  }

  // 获取学生数据
  async getStudents(center: string): Promise<ApiResponse<any[]>> {
    console.log('[API] getStudents 调用:', { center })
    
    // 强制清除缓存
    this.clearCache()
    
    // 优先使用最稳定的端点
    const endpoints = [
      `/api/students?center=${encodeURIComponent(center)}&limit=500` // 主要端点（工作正常）
    ]

    for (const endpoint of endpoints) {
      console.log('[API] 尝试端点:', endpoint)
      const result = await this.fetchWithRetry<any>(endpoint, {}, {
        timeout: 45000, // 减少超时时间
        retries: 2 // 减少重试次数
      })
      console.log('[API] 端点结果:', { 
        endpoint, 
        success: result.success, 
        dataLength: result.data?.length || 0,
        studentsLength: (result as any).students?.length || 0
      })
      if (result.success) {
        // 学生API返回的数据结构是 {success: true, students: [...], total: ...}
        const finalData = result.data || (result as any).students || []
        console.log('[API] getStudents 结果:', { 
          success: result.success,
          dataLength: Array.isArray(finalData) ? finalData.length : 0,
          hasData: Array.isArray(finalData) && finalData.length > 0,
          isArray: Array.isArray(finalData),
          dataType: typeof finalData,
          hasStudentsField: !!(result as any).students,
          studentsLength: (result as any).students?.length || 0,
          totalFromAPI: (result as any).total || 0,
          sampleData: Array.isArray(finalData) ? finalData.slice(0, 2) : finalData,
          allStudentIds: Array.isArray(finalData) ? finalData.map(s => s.student_id) : []
        })
        return {
          success: true,
          data: Array.isArray(finalData) ? finalData : []
        }
      }
    }

    // 如果所有端点都失败，尝试全量获取
    const result = await this.fetchWithRetry<any>('/api/students?limit=500', {}, {
      timeout: 45000,
      retries: 1
    })
    if (result.success) {
      // 学生API返回的数据结构是 {success: true, students: [...], total: ...}
      const finalData = (result as any).students || result.data || []
      console.log('[API] getStudents 全量获取结果:', { 
        success: result.success,
        dataLength: Array.isArray(finalData) ? finalData.length : 0,
        isArray: Array.isArray(finalData),
        dataType: typeof finalData,
        hasStudentsField: !!(result as any).students,
        studentsLength: (result as any).students?.length || 0
      })
      return {
        success: true,
        data: Array.isArray(finalData) ? finalData : []
      }
    }

    return result
  }

  // 获取积分数据
  async getPoints(): Promise<ApiResponse<any[]>> {
    console.log('[API] getPoints 调用')
    
    // 强制清除缓存
    this.clearCache()
    
    const result = await this.fetchWithRetry<any>('/api/points?page=1&per_page=300', {}, {
      timeout: 45000, // 减少超时时间
      retries: 2 // 减少重试次数
    })
    console.log('[API] getPoints 结果:', { 
      success: result.success, 
      dataLength: result.data?.length || 0,
      itemsLength: result.data?.items?.length || 0
    })
    if (result.success) {
      const finalData = result.data?.items || result.data?.data?.items || result.data || []
      console.log('[API] getPoints 成功:', { 
        dataLength: Array.isArray(finalData) ? finalData.length : 0,
        isArray: Array.isArray(finalData),
        dataType: typeof finalData
      })
      return {
        success: true,
        data: Array.isArray(finalData) ? finalData : []
      }
    }
    return result
  }

  // 获取公告数据
  async getAnnouncements(): Promise<ApiResponse<any[]>> {
    const result = await this.fetchWithRetry<any>('/api/announcements?status=published&page=1&per_page=50')
    if (result.success) {
      return {
        success: true,
        data: result.data?.data?.items || result.data?.items || []
      }
    }
    return result
  }

  // 获取交易记录
  async getTransactions(center: string, limit: number = 5): Promise<ApiResponse<any[]>> {
    const url = `/api/points?transactions=true&limit=${limit}&center=${encodeURIComponent(center)}`
    const result = await this.fetchWithRetry<any>(url)
    if (result.success) {
      return {
        success: true,
        data: result.data?.items || result.data?.transactions || []
      }
    }
    return result
  }

  // 修复积分数据
  async fixPointsData(): Promise<ApiResponse<any>> {
    const result = await this.fetchWithRetry<any>('/api/points-sync', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return result
  }

  // 创建积分交易（使用新的同步API）
  async createPointTransaction(transactionData: {
    student_id: string
    teacher_id: string
    points_change: number
    transaction_type: string
    reason: string
    gift_name?: string
    gift_points?: number
  }): Promise<ApiResponse<any>> {
    const result = await this.fetchWithRetry<any>('/api/points-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    })
    
    // 如果交易创建成功，清除积分相关缓存
    if (result.success) {
      this.clearCacheByPattern('/api/points')
      this.clearCacheByPattern('/api/students')
    }
    
    return result
  }

  // 获取学生积分历史
  async getStudentPointsHistory(studentId: string, limit: number = 50): Promise<ApiResponse<any>> {
    const result = await this.fetchWithRetry<any>(`/api/points-sync?student_id=${studentId}&limit=${limit}`)
    return result
  }
}

export const apiService = new ApiService()
export default apiService
