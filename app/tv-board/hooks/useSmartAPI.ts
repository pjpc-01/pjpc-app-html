import { useState, useEffect, useRef, useCallback } from 'react'
import { apiService } from '../services/api'
import { useDebounce, useThrottle } from './useMemoryOptimization'

interface SmartAPIConfig {
  refreshInterval?: number
  retryAttempts?: number
  retryDelay?: number
  enableCache?: boolean
  cacheTimeout?: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

/**
 * 智能API管理Hook
 * 提供缓存、重试、节流等功能
 */
export function useSmartAPI<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: SmartAPIConfig = {}
) {
  const {
    refreshInterval = 30000,
    retryAttempts = 3,
    retryDelay = 1000,
    enableCache = true,
    cacheTimeout = 60000
  } = config

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())
  const retryCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout>()

  // 检查缓存是否有效
  const isCacheValid = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() < entry.expiresAt
  }, [])

  // 从缓存获取数据
  const getFromCache = useCallback((): T | null => {
    if (!enableCache) return null
    
    const entry = cacheRef.current.get(key)
    if (entry && isCacheValid(entry)) {
      return entry.data
    }
    
    if (entry) {
      cacheRef.current.delete(key)
    }
    
    return null
  }, [key, enableCache, isCacheValid])

  // 保存到缓存
  const saveToCache = useCallback((newData: T) => {
    if (!enableCache) return
    
    const now = Date.now()
    cacheRef.current.set(key, {
      data: newData,
      timestamp: now,
      expiresAt: now + cacheTimeout
    })
  }, [key, enableCache, cacheTimeout])

  // 获取数据
  const fetchData = useCallback(async (isRetry = false) => {
    try {
      setError(null)
      
      if (!isRetry) {
        setLoading(true)
      }

      // 先检查缓存
      const cachedData = getFromCache()
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        setLastFetch(new Date())
        return cachedData
      }

      // 获取新数据
      const newData = await fetcher()
      
      setData(newData)
      setLoading(false)
      setLastFetch(new Date())
      retryCountRef.current = 0
      
      // 保存到缓存
      saveToCache(newData)
      
      return newData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取数据失败'
      setError(errorMessage)
      
      // 重试逻辑
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++
        console.log(`[SmartAPI] 重试 ${retryCountRef.current}/${retryAttempts} 在 ${retryDelay}ms 后...`)
        
        setTimeout(() => {
          fetchData(true)
        }, retryDelay * retryCountRef.current)
      } else {
        setLoading(false)
        retryCountRef.current = 0
      }
      
      throw err
    }
  }, [fetcher, getFromCache, saveToCache, retryAttempts, retryDelay])

  // 节流的刷新函数
  const throttledRefresh = useThrottle(fetchData, 1000)

  // 防抖的刷新函数
  const debouncedRefresh = useDebounce(fetchData, 500)

  // 手动刷新
  const refresh = useCallback(() => {
    throttledRefresh()
  }, [throttledRefresh])

  // 强制刷新（忽略缓存）
  const forceRefresh = useCallback(() => {
    if (enableCache) {
      cacheRef.current.delete(key)
    }
    fetchData()
  }, [key, enableCache, fetchData])

  // 清理缓存
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  // 初始化和定时刷新
  useEffect(() => {
    fetchData()

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        throttledRefresh()
      }, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, throttledRefresh, refreshInterval])

  return {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    forceRefresh,
    clearCache,
    isCached: enableCache && cacheRef.current.has(key)
  }
}

/**
 * 专门用于TV Board数据的智能API Hook
 */
export function useTVBoardSmartAPI(center: string) {
  const studentsAPI = useSmartAPI(
    `students-${center}`,
    () => apiService.getStudents(center),
    { refreshInterval: 30000, enableCache: true, cacheTimeout: 120000 }
  )

  const pointsAPI = useSmartAPI(
    'points',
    () => apiService.getPoints(),
    { refreshInterval: 15000, enableCache: true, cacheTimeout: 60000 }
  )

  const announcementsAPI = useSmartAPI(
    'announcements',
    () => apiService.getAnnouncements(),
    { refreshInterval: 60000, enableCache: true, cacheTimeout: 300000 }
  )

  const transactionsAPI = useSmartAPI(
    `transactions-${center}`,
    () => apiService.getTransactions(center, 10),
    { refreshInterval: 20000, enableCache: true, cacheTimeout: 30000 }
  )

  return {
    students: studentsAPI,
    points: pointsAPI,
    announcements: announcementsAPI,
    transactions: transactionsAPI
  }
}
