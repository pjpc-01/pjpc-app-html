"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { AnnouncementItem, Student, StudentPoints } from "../types"
import { isSameCenter, normalizeCenter } from "../utils"
import { apiService } from "../services/api"
import { MOCK_STUDENTS } from "@/lib/mock-data"

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

// 新增：从 API 服务直接提取缓存数据的辅助函数
const getCachedApiResponse = <T>(url: string, options: RequestInit = {}): ApiResponse<T> | null => {
  try {
    const cacheKey = `${url}_${JSON.stringify(options)}`
    // @ts-ignore
    const cached = apiService['cache']?.get(cacheKey)
    if (cached) {
      return { success: true, data: cached.data }
    }
  } catch (e) {
    console.error('[TV] 读取缓存失败:', e)
  }
  return null
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
      debugLog('学生数据获取失败，使用 Mock 数据', studentsResult.error)
      
      const mockStudents = MOCK_STUDENTS.filter(s => s.center === center)
      setStudents(mockStudents)
      
      const mockPoints = mockStudents.map(s => ({
        student_id: s.id,
        points: Math.floor(Math.random() * 500) + 100,
        last_update: new Date().toISOString()
      }))
      setPoints(mockPoints)
      
      setAnnouncements([{ id: 'mock-1', content: 'Welcome to TV Board (Mock Mode)!', type: 'info', center: center }])
      setTransactions([])
      setLastUpdate(new Date())
      setReady(true) 
      setError(null) 
      return
    }

    const studentsData = Array.isArray(studentsResult.data) ? studentsResult.data : []
    const normalizedStudents = studentsData.map((s: any) => ({
      ...s,
      center: s?.center ?? s?.Center ?? s?.centre ?? s?.branch ?? s?.CENTER ?? s?.Centre ?? s?.Branch ?? s?.CenterName ?? s?.center_name,
      dob: s?.dob ?? s?.dateOfBirth ?? s?.birthDate ?? s?.birthday ?? null,
    }))

    const centerStudents = normalizedStudents

    setStudents(centerStudents)
    setPoints(Array.isArray(pointsResult.data) ? pointsResult.data : [])
    setAnnouncements(Array.isArray(announcementsResult.data) ? announcementsResult.data : [])
    setTransactions(Array.isArray(transactionsResult.data) ? transactionsResult.data : [])
    setLastUpdate(new Date())
    setReady(true)
    setError(null)
    
  } catch (err) {
    debugLog('数据处理失败:', err)
    setError(err instanceof Error ? err.message : '数据处理失败')
    setReady(true)
    throw err
  }
}

const shouldRefreshData = (event: SSEEvent, center: string): boolean => {
  switch (event.type) {
    case 'data_update':
      return !event.center || isSameCenter(event.center, center)
    case 'points_update':
      return true
    case 'announcement_update':
      return true
    case 'student_update':
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
        debugLog('Mock Mode Active: Skipping API and using mock data directly')
        
        const mockStudents = MOCK_STUDENTS.filter(s => s.center === center)
        setStudents(mockStudents)
        
        const mockPoints = mockStudents.map(s => ({
          student_id: s.id,
          points: Math.floor(Math.random() * 500) + 100,
          last_update: new Date().toISOString()
        }))
        setPoints(mockPoints)
        
        setAnnouncements([{ id: 'mock-1', content: 'FRONTEND TEST MODE: Using Mock Data', type: 'info', center: center }])
        setTransactions([])
        setLastUpdate(new Date())
        setReady(true)
        setError(null)
        
        fetchRetryCountRef.current = 0 
      } catch (err) {
        debugLog('Mock data load failed:', err)
        setError('Failed to load mock data')
        setReady(true)
      }
    }

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/events')
        
        eventSource.onopen = () => {
          debugLog('SSE连接已建立')
          setIsRealtime(true)
          isRealtimeRef.current = true
          sseRetryCountRef.current = 0
        }

        eventSource.onmessage = (event) => {
          try {
            const data: SSEEvent = JSON.parse(event.data)
            debugLog('收到SSE消息:', data)
            if (shouldRefreshData(data, center)) {
              setTimeout(() => {
                fetchData()
              }, 100)
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
          sseRetryCountRef.current++
          const reconnectDelay = Math.min(5000 * Math.pow(1.5, sseRetryCountRef.current), 30000)
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

    const loadInitialData = async () => {
      const cachedStudents = getCachedApiResponse<Student[]>(`/api/students?center=${encodeURIComponent(center)}&limit=500`)
      const cachedPoints = getCachedApiResponse<StudentPoints[]>('/api/points?page=1&per_page=300')
      const cachedAnnouncements = getCachedApiResponse<AnnouncementItem[]>('/api/announcements?status=published&page=1&per_page=50')
      const cachedTransactions = getCachedApiResponse<any[]>(`/api/points?transactions=true&limit=10&center=${encodeURIComponent(center)}`)

      if (cachedStudents || cachedPoints || cachedAnnouncements) {
        debugLog('检测到缓存数据，执行瞬时加载...')
        processData(
          cachedStudents || { success: false },
          cachedPoints || { success: false },
          cachedAnnouncements || { success: false },
          cachedTransactions || { success: false, data: [] },
          center,
          setStudents,
          setPoints,
          setAnnouncements,
          setTransactions,
          setLastUpdate,
          setReady,
          setError
        )
      }

      await fetchData()
    }

    loadInitialData()
    setupSSE()

    pollTimer = setInterval(() => {
      if (mountedRef.current && !isRealtimeRef.current) {
        fetchData()
      }
    }, 30000)

    return () => {
      mountedRef.current = false
      if (retryTimer) clearTimeout(retryTimer)
      if (pollTimer) clearInterval(pollTimer)
      if (sseReconnectTimeoutRef.current) clearTimeout(sseReconnectTimeoutRef.current)
      if (eventSource) eventSource.close()
    }
  }, [center])

  const refetch = useCallback(async () => {
    try {
      setReady(false)
      setError(null)
      apiService.clearCache()
      const [studentsResult, pointsResult, announcementsResult] = await Promise.all([
        apiService.getStudents(center),
        apiService.getPoints(),
        apiService.getAnnouncements()
      ])
      let transactionsResult = { success: false, data: [] }
      try {
        transactionsResult = await apiService.getTransactions(center, 10)
      } catch (error) {}
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
    } catch (error) {
      setError(error instanceof Error ? error.message : '数据刷新失败')
      setReady(true)
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