import { useState, useEffect, useRef, useCallback } from 'react'
import { apiService } from '../services/api'

interface Transaction {
  id: string
  student_name: string
  student_id: string
  teacher_name: string
  points_change: number
  transaction_type: 'add_points' | 'deduct_points' | 'redeem_gift'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created: string
  gift_name?: string
  gift_points?: number
}

interface UseTransactionsResult {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  isRealtime: boolean
}

// 调试日志工具
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Transactions] ${message}`, ...args)
  }
}

export function useTransactions(center: string, limit: number = 5): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isRealtime, setIsRealtime] = useState(false)

  // 使用 useRef 避免闭包问题
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const isRealtimeRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sseReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setLoading(true)
      setError(null)
      
      debugLog('获取交易记录...', { center, limit })
      
      const result = await apiService.getTransactions(center, limit)
      
      if (result.success) {
        setTransactions(result.data || [])
        setLastUpdate(new Date())
        retryCountRef.current = 0 // 重置重试计数
        debugLog('交易记录获取成功:', result.data?.length || 0, '条记录')
      } else {
        throw new Error(result.error || '获取交易记录失败')
      }
    } catch (err) {
      debugLog('获取交易记录失败:', err)
      
      if (!mountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      
      // 重试逻辑
      if (retryCountRef.current < 3 && (
        errorMessage.includes('HTTP') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('aborted')
      )) {
        retryCountRef.current++
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000) // 指数退避，最大5秒
        debugLog(`${delay}ms后重试 (${retryCountRef.current}/3)...`)
        
        // 清理之前的timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchTransactions()
          }
        }, delay)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [center, limit])

  // 建立SSE连接
  const setupSSE = useCallback(() => {
    try {
      const eventSource = new EventSource('/api/events')
      
      eventSource.onopen = () => {
        debugLog('SSE连接已建立')
        setIsRealtime(true)
        isRealtimeRef.current = true
        retryCountRef.current = 0 // 重置重试计数
      }
      
      eventSource.onmessage = (event) => {
        if (mountedRef.current) {
          try {
            const data = JSON.parse(event.data)
            debugLog('收到实时更新信号:', data)
            
            if (data.type === 'data_update' && data.updateTypes?.includes('transactions')) {
              debugLog('交易记录已更新，立即刷新...')
              fetchTransactions()
            }
          } catch (parseError) {
            debugLog('解析SSE数据失败:', parseError)
          }
        }
      }
      
      eventSource.onerror = (error) => {
        debugLog('SSE连接错误:', error)
        setIsRealtime(false)
        isRealtimeRef.current = false
        eventSource.close()
        
        // 自动重连 - 指数退避
        const reconnectDelay = Math.min(5000 * Math.pow(1.5, retryCountRef.current), 30000) // 5s-30s
        debugLog(`SSE将在${reconnectDelay}ms后重连`)
        
        sseReconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setupSSE()
          }
        }, reconnectDelay)
      }

      return eventSource
    } catch (sseError) {
      debugLog('SSE不支持，使用轮询模式:', sseError)
      setIsRealtime(false)
      isRealtimeRef.current = false
      return null
    }
  }, [fetchTransactions])

  useEffect(() => {
    if (!center) return

    mountedRef.current = true
    retryCountRef.current = 0
    isRealtimeRef.current = false

    let eventSource: EventSource | null = null
    let interval: NodeJS.Timeout | null = null

    // 立即获取一次
    fetchTransactions()
    
    // 建立SSE连接
    eventSource = setupSSE()
    
    // 设置定时刷新（作为SSE的备用方案）
    interval = setInterval(() => {
      if (mountedRef.current && !isRealtimeRef.current) {
        debugLog('轮询获取交易记录...')
        fetchTransactions()
      }
    }, 30000) // 30秒刷新一次

    return () => {
      mountedRef.current = false
      
      // 清理所有定时器
      if (interval) {
        clearInterval(interval)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (sseReconnectTimeoutRef.current) {
        clearTimeout(sseReconnectTimeoutRef.current)
      }
      
      // 关闭SSE连接
      if (eventSource) {
        eventSource.close()
        debugLog('SSE连接已关闭')
      }
    }
  }, [center, limit, fetchTransactions, setupSSE])

  return {
    transactions,
    loading,
    error,
    lastUpdate,
    isRealtime
  }
}