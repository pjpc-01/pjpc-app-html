import { useEffect, useState, useCallback, useRef } from "react"
import { AnnouncementItem, Student, StudentPoints } from "../types"
import { isSameCenter, normalizeCenter } from "../utils"
import { apiService } from "../services/api"

interface TVBoardDataResult {
  announcements: AnnouncementItem[]
  students: Student[]
  points: StudentPoints[]
  transactions: any[]
  ready: boolean
  lastUpdate: Date
  isRealtime: boolean
  error: string | null
  refetch: () => Promise<void>
}

// API 响应类型定义
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 支持的事件类型
type SSEEventType = 'data_update' | 'points_update' | 'announcement_update' | 'student_update'

interface SSEEvent {
  type: SSEEventType
  center?: string
  data?: any
}

// 调试日志工具
const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TV] ${message}`, ...args)
  }
}

// 数据处理器 - 避免重复逻辑
const processData = (
  studentsResult: ApiResponse<Student[]>,
  pointsResult: ApiResponse<StudentPoints[]>,
  announcementsResult: ApiResponse<AnnouncementItem[]>,
  transactionsResult: ApiResponse<any[]>,
  center: string,
  setStudents: (students: Student[]) => void,
  setPoints: (points: StudentPoints[]) => void,
  setAnnouncements: (announcements: AnnouncementItem[]) => void,
  setTransactions: (transactions: any[]) => void,
  setLastUpdate: (date: Date) => void,
  setReady: (ready: boolean) => void,
  setError: (error: string | null) => void
) => {
  try {
    // 检查是否有错误
    if (!studentsResult.success) {
      console.warn('学生数据获取失败:', studentsResult.error)
      // 设置空的学生数据，但继续显示其他内容
      setStudents([])
      setPoints(Array.isArray(pointsResult.data) ? pointsResult.data : [])
      setAnnouncements(Array.isArray(announcementsResult.data) ? announcementsResult.data : [])
      setTransactions(Array.isArray(transactionsResult.data) ? transactionsResult.data : [])
      setLastUpdate(new Date())
      setReady(true) // 仍然显示界面，只是没有学生数据
      setError(null) // 清除错误，让其他内容正常显示
      return
    }

    // 归一化学生数据 - 确保studentsData是数组
    const studentsData = Array.isArray(studentsResult.data) ? studentsResult.data : []
    const normalizedStudents = studentsData.map((s: any) => ({
      ...s,
      center: s?.center ?? s?.Center ?? s?.centre ?? s?.branch ?? s?.CENTER ?? s?.Centre ?? s?.Branch ?? s?.CenterName ?? s?.center_name,
      dob: s?.dob ?? s?.dateOfBirth ?? s?.birthDate ?? s?.birthday ?? null,
    }))

    debugLog('学生数据中心字段检查:', {
      center: center,
      sampleCenters: normalizedStudents.slice(0, 3).map(s => ({
        student_id: s.student_id,
        center: s.center,
        normalized: normalizeCenter(s.center)
      })),
      allCenters: [...new Set(normalizedStudents.map(s => s.center))]
    })

    // API已经按中心过滤了学生数据，不需要再次过滤
    const centerStudents = normalizedStudents

    debugLog('数据获取成功:', {
      center,
      studentsCount: centerStudents.length,
      pointsCount: pointsResult.data?.length || 0,
      announcementsCount: announcementsResult.data?.length || 0,
      transactionsCount: transactionsResult.data?.length || 0
    })

    // 更新状态 - 确保所有数据都是数组
    setStudents(centerStudents)
    setPoints(Array.isArray(pointsResult.data) ? pointsResult.data : [])
    setAnnouncements(Array.isArray(announcementsResult.data) ? announcementsResult.data : [])
    setTransactions(Array.isArray(transactionsResult.data) ? transactionsResult.data : [])
    setLastUpdate(new Date())
    setReady(true)
    setError(null)
    
    debugLog('数据状态更新完成:', {
      studentsCount: centerStudents.length,
      pointsCount: Array.isArray(pointsResult.data) ? pointsResult.data.length : 0,
      announcementsCount: Array.isArray(announcementsResult.data) ? announcementsResult.data.length : 0,
      transactionsCount: Array.isArray(transactionsResult.data) ? transactionsResult.data.length : 0
    })

  } catch (err) {
    debugLog('数据处理失败:', err)
    setError(err instanceof Error ? err.message : '数据处理失败')
    setReady(true) // 即使出错也显示界面
    throw err
  }
}

// 检查SSE事件是否需要刷新数据
const shouldRefreshData = (event: SSEEvent, center: string): boolean => {
  switch (event.type) {
    case 'data_update':
      // 数据更新：检查中心是否匹配
      return !event.center || isSameCenter(event.center, center)
    case 'points_update':
      // 积分更新：全局事件，总是刷新
      return true
    case 'announcement_update':
      // 公告更新：全局事件，总是刷新
      return true
    case 'student_update':
      // 学生更新：检查中心是否匹配
      return !event.center || isSameCenter(event.center, center)
    default:
      return false
  }
}

export function useTVBoardData(center: string): TVBoardDataResult {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [points, setPoints] = useState<StudentPoints[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [ready, setReady] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRealtime, setIsRealtime] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 使用 useRef 避免闭包问题
  const mountedRef = useRef(true)
  const isRealtimeRef = useRef(false)
  const fetchRetryCountRef = useRef(0)
  const sseRetryCountRef = useRef(0)
  const sseReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    mountedRef.current = true
    fetchRetryCountRef.current = 0
    sseRetryCountRef.current = 0

    let eventSource: EventSource | null = null
    let retryTimer: NodeJS.Timeout | null = null
    let pollTimer: NodeJS.Timeout | null = null

    const fetchData = async () => {
      if (!mountedRef.current) return

      try {
        setError(null)
        debugLog('开始获取数据...', { center, retryCount: fetchRetryCountRef.current })

        // 并行获取所有数据，添加错误处理
        const [studentsResult, pointsResult, announcementsResult] = await Promise.allSettled([
          apiService.getStudents(center),
          apiService.getPoints(),
          apiService.getAnnouncements()
        ]).then(results => results.map(result => 
          result.status === 'fulfilled' ? result.value : { 
            success: false, 
            error: result.reason instanceof Error ? result.reason.message : String(result.reason) || '未知错误' 
          }
        ))
        
        debugLog('API调用结果:', {
          studentsSuccess: studentsResult.success,
          studentsDataLength: studentsResult.data?.length || 0,
          studentsDataSample: studentsResult.data?.slice(0, 2) || [],
          studentsError: studentsResult.error,
          pointsSuccess: pointsResult.success,
          pointsDataLength: pointsResult.data?.length || 0,
          announcementsSuccess: announcementsResult.success,
          announcementsDataLength: announcementsResult.data?.length || 0
        })
        
        // 单独获取交易记录，避免影响其他数据
        let transactionsResult = { success: false, data: [] }
        try {
          transactionsResult = await apiService.getTransactions(center, 10)
        } catch (error) {
          console.warn('交易记录获取失败:', error)
        }

        if (!mountedRef.current) return

        // 处理数据
        processData(
          studentsResult,
          pointsResult,
          announcementsResult,
          transactionsResult,
          center,
          setStudents,
          setPoints,
          setAnnouncements,
          setTransactions,
          setLastUpdate,
          setReady,
          setError
        )

        fetchRetryCountRef.current = 0 // 重置数据获取重试计数

      } catch (err) {
        debugLog('数据获取失败:', err)
        fetchRetryCountRef.current++
        
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : '数据获取失败')
          setReady(true) // 即使出错也显示界面
        }

        // 如果重试次数未达到上限，延迟重试
        if (fetchRetryCountRef.current < 3) {
          const delay = Math.min(1000 * Math.pow(2, fetchRetryCountRef.current), 10000) // 指数退避，最大10秒
          debugLog(`${delay}ms后重试数据获取 (${fetchRetryCountRef.current}/3)`)
          retryTimer = setTimeout(fetchData, delay)
        }
      }
    }

    // 建立SSE连接
    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/events')
        
        eventSource.onopen = () => {
          debugLog('SSE连接已建立')
          setIsRealtime(true)
          isRealtimeRef.current = true
          sseRetryCountRef.current = 0 // 重置SSE重连计数
        }

        eventSource.onmessage = (event) => {
          try {
            const data: SSEEvent = JSON.parse(event.data)
            debugLog('收到SSE消息:', data)
            
            // 检查是否需要刷新数据
            if (shouldRefreshData(data, center)) {
              debugLog('检测到相关数据更新，重新获取数据...', { type: data.type, center: data.center })
              // 立即刷新数据
              setTimeout(() => {
                fetchData()
              }, 100) // 稍微延迟确保数据库更新完成
            } else {
              debugLog('SSE事件无需刷新数据', { type: data.type, center: data.center })
            }
          } catch (err) {
            debugLog('SSE消息解析失败:', err)
          }
        }

        eventSource.onerror = (event) => {
          debugLog('SSE连接错误:', event)
          setIsRealtime(false)
          isRealtimeRef.current = false
          eventSource?.close()
          
          // 指数退避重连 - 使用独立的SSE重连计数
          sseRetryCountRef.current++
          const reconnectDelay = Math.min(5000 * Math.pow(1.5, sseRetryCountRef.current), 30000) // 5s-30s
          debugLog(`SSE将在${reconnectDelay}ms后重连 (${sseRetryCountRef.current}次)`)
          
          sseReconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setupSSE()
            }
          }, reconnectDelay)
        }

      } catch (err) {
        debugLog('SSE连接建立失败:', err)
        setIsRealtime(false)
        isRealtimeRef.current = false
      }
    }

    // 初始化
    fetchData()
    setupSSE()

    // 设置轮询定时器（作为SSE的备用方案）
    pollTimer = setInterval(() => {
      if (mountedRef.current && !isRealtimeRef.current) {
        debugLog('轮询获取数据...')
        fetchData()
      }
    }, 30000) // 30秒轮询

    return () => {
      mountedRef.current = false
      
      // 清理所有定时器
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
      if (pollTimer) {
        clearInterval(pollTimer)
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
  }, [center])

  // 数据刷新函数
  const refetch = useCallback(async () => {
    try {
      debugLog('手动刷新数据...')
      setReady(false)
      setError(null)
      
      // 清除 API 缓存确保获取最新数据
      apiService.clearCache()

      // 并行获取所有数据
      const [studentsResult, pointsResult, announcementsResult] = await Promise.all([
        apiService.getStudents(center),
        apiService.getPoints(),
        apiService.getAnnouncements()
      ])

      // 单独获取交易记录，避免影响其他数据
      let transactionsResult = { success: false, data: [] }
      try {
        transactionsResult = await apiService.getTransactions(center, 10)
      } catch (error) {
        console.warn('交易记录获取失败:', error)
      }

      // 处理数据
      processData(
        studentsResult,
        pointsResult,
        announcementsResult,
        transactionsResult,
        center,
        setStudents,
        setPoints,
        setAnnouncements,
        setTransactions,
        setLastUpdate,
        setReady,
        setError
      )

      debugLog('手动刷新数据成功')

    } catch (error) {
      debugLog('手动刷新失败:', error)
      setError(error instanceof Error ? error.message : '数据刷新失败')
      setReady(true) // 即使出错也显示界面
    }
  }, [center])

  return {
    announcements,
    students,
    points,
    transactions,
    ready,
    lastUpdate,
    isRealtime,
    error,
    refetch
  }
}