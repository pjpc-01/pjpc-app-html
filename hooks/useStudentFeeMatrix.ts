// ========================================
// Student Fee Matrix Hook - 企业级实现 (Combined with API)
// ========================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { getPocketBase } from '@/lib/pocketbase'
import {
  StudentFeeMatrixState,
  StudentFeeMatrixActions,
  StudentNameCard,
  FeeItem,
  StudentFeeAssignment,
  PaymentStatus,
  FeeCategory,
  LoadingState,
  ApiResponse,
  StudentFeeError,
  BatchOperation
} from '@/types/student-fees'

/**
 * API Error Handler - 统一错误处理
 */
class StudentFeeApiError extends Error {
  constructor(
    message: string,
    public type: StudentFeeError,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message)
    this.name = 'StudentFeeApiError'
  }
}

/**
 * Student Fee Matrix Hook - 企业级实现
 * 
 * 特性:
 * - 类型安全的状态管理
 * - 统一的错误处理
 * - 企业级日志记录
 * - 优化的性能（防抖、缓存）
 * - 清晰的数据流
 * - 内置API服务（无需外部依赖）
 */
export function useStudentFeeMatrix() {
  // ========================================
  // Component Identification & Logging
  // ========================================
  const componentId = useRef(`StudentFeeMatrix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const pbRef = useRef<any>(null)
  const initializedRef = useRef(false)
  
  // ========================================
  // Authentication & Connection
  // ========================================
  const { user, connectionStatus, loading } = useAuth()
  const isConnected = connectionStatus === 'connected' && !!user

  // ========================================
  // Utility Functions
  // ========================================

  /**
   * Logger utility - 企业级日志记录
   */
  const log = useCallback((level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    console.log(`🔍 [${componentId.current}] [${timestamp}] [${level.toUpperCase()}] ${message}`, data || '')
  }, [])

  /**
   * Initialize PocketBase connection
   */
  const initializePocketBase = useCallback(async (): Promise<void> => {
    if (initializedRef.current) {
      log('info', 'PocketBase already initialized, skipping')
      return
    }

    try {
      log('info', 'Initializing PocketBase connection...')
      
      pbRef.current = await getPocketBase()
      
      if (!pbRef.current) {
        throw new StudentFeeApiError('Failed to get PocketBase instance', 'NETWORK_ERROR', 500)
      }

      log('info', 'PocketBase instance obtained', {
        baseUrl: pbRef.current.baseUrl
      })

      // Perform health check
      try {
        await pbRef.current.health.check()
        log('info', 'PocketBase health check passed')
      } catch (healthError) {
        log('warn', 'PocketBase health check failed, but continuing', healthError)
      }

      initializedRef.current = true
      log('info', 'PocketBase initialized successfully')
    } catch (error) {
      log('error', 'Failed to initialize PocketBase', error)
      throw error
    }
  }, [log])

  /**
   * Validate authentication and connection
   */
  const validateAuth = useCallback((): void => {
    if (!pbRef.current) {
      log('error', 'PocketBase instance not initialized')
      throw new StudentFeeApiError('PocketBase not initialized', 'NETWORK_ERROR', 500)
    }

    if (!pbRef.current.authStore) {
      log('error', 'PocketBase authStore not available')
      throw new StudentFeeApiError('Authentication store not available', 'AUTHENTICATION_ERROR', 401)
    }

    if (!pbRef.current.authStore.isValid) {
      log('error', 'Authentication required - authStore not valid')
      throw new StudentFeeApiError('Authentication required', 'AUTHENTICATION_ERROR', 401)
    }

    if (!pbRef.current.authStore.model) {
      log('error', 'No authenticated user found')
      throw new StudentFeeApiError('No authenticated user found', 'AUTHENTICATION_ERROR', 401)
    }

    const userRole = pbRef.current.authStore.model.role
    if (!userRole || (userRole !== 'admin' && userRole !== 'accountant')) {
      log('error', `Insufficient permissions. User role: ${userRole}`)
      throw new StudentFeeApiError('Insufficient permissions', 'PERMISSION_ERROR', 403)
    }

    log('info', 'Authentication validated successfully', {
      userId: pbRef.current.authStore.model.id,
      email: pbRef.current.authStore.model.email,
      role: userRole
    })
  }, [log])

  /**
   * Safe JSON parser with error handling
   */
  const safeParseJson = useCallback(<T>(data: any, defaultValue: T): T => {
    if (!data) return defaultValue
    
    if (Array.isArray(data)) return data as T
    
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed as T : defaultValue
      } catch (error) {
        log('warn', 'Failed to parse JSON string', { data, error })
        return defaultValue
      }
    }
    
    return typeof data === 'object' ? data as T : defaultValue
  }, [log])

  // ========================================
  // Connection and Authentication State
  // ========================================
  
  const isFullyConnected = useMemo(() => {
    const isConnected = connectionStatus === 'connected'
    const isAuthenticated = !!user && !!user.id
    const isNotLoading = !loading
    
    const isStable = isConnected && isAuthenticated && isNotLoading
    
    log('info', 'Connection state check', {
      connectionStatus,
      isConnected,
      hasUser: !!user,
      userId: user?.id,
      isAuthenticated,
      authLoading: loading,
      isNotLoading,
      isStable
    })
    
    return isStable
  }, [connectionStatus, user, loading, log])

  // ========================================
  // Enhanced Retry Logic
  // ========================================
  
  /**
   * Enhanced Retry Logic with better PocketBase error handling
   */
  const fetchWithRetry = useCallback(async (fetchFn: () => Promise<any>, retries = 3) => {
    for (let i = 0; i <= retries; i++) {
      try {
        if (i > 0) {
          const delay = Math.min(1000 * Math.pow(2, i - 1), 5000)
          log('warn', `Retry attempt ${i}/${retries}, waiting ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        return await fetchFn()
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error'
        const errorStatus = error?.status || 0
        const errorType = error?.constructor?.name || 'Unknown'
        
        if (i === retries) {
          log('error', `Final retry attempt failed`, {
            error: errorMessage,
            status: errorStatus,
            type: errorType
          })
          throw error
        }
        
        if (errorMessage.includes('autocancelled') || 
            errorMessage.includes('AbortError') ||
            errorMessage.includes('Authentication required') ||
            errorMessage.includes('401') ||
            errorMessage.includes('403') ||
            errorMessage.includes('400') ||
            errorStatus === 400 ||
            errorStatus === 401 ||
            errorStatus === 403) {
          log('warn', `Attempt ${i + 1} failed with PocketBase error, retrying...`, {
            error: errorMessage,
            status: errorStatus,
            type: errorType,
            attempt: i + 1,
            maxRetries: retries
          })
          continue
        }
        
        log('error', `Non-retryable error on attempt ${i + 1}`, {
          error: errorMessage,
          status: errorStatus,
          type: errorType
        })
        throw error
      }
    }
  }, [log])

  // ========================================
  // API Methods (Integrated from student-fees.ts)
  // ========================================

  /**
   * Fetch all student cards
   */
  const fetchStudentCards = useCallback(async (): Promise<ApiResponse<StudentNameCard[]>> => {
    try {
      await initializePocketBase()
      validateAuth()

      log('info', 'Fetching student cards from students collection...')
      
      const requestKey = `students_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const response = await pbRef.current.collection('students').getFullList({
        filter: 'status = "active"',
        sort: 'student_name',
        requestKey: requestKey
      })

      const studentCards: StudentNameCard[] = response.map((card: any) => ({
        id: card.id,
        studentName: card.student_name,
        grade: card.standard,
        parentName: card.parents_name,
        studentId: card.studentId
      }))

      log('info', `Successfully fetched ${studentCards.length} active student cards`)
      
      return {
        success: true,
        data: studentCards
      }
    } catch (error: any) {
      log('error', 'Failed to fetch student cards', {
        error: error.message,
        status: error.status,
        type: error.constructor.name
      })
      
      return {
        success: true,
        data: [],
        message: 'Failed to fetch student cards, showing empty state'
      }
    }
  }, [initializePocketBase, validateAuth, log])

  /**
   * Fetch all fee items
   */
  const fetchFeeItems = useCallback(async (): Promise<ApiResponse<FeeItem[]>> => {
    try {
      await initializePocketBase()
      validateAuth()

      log('info', 'Fetching fee items from fees_items collection...')
      
      const requestKey = `fees_items_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const response = await pbRef.current.collection('fees_items').getFullList({
        filter: 'status = "active"',
        sort: 'name',
        requestKey: requestKey
      })

      const feeItems: FeeItem[] = response.map((item: any) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        active: true,
        category: item.category,
        description: item.description
      }))

      log('info', `Successfully fetched ${feeItems.length} active fee items`)
      
      return {
        success: true,
        data: feeItems
      }
    } catch (error: any) {
      log('error', 'Failed to fetch fee items', {
        error: error.message,
        status: error.status,
        type: error.constructor.name
      })
      
      return {
        success: true,
        data: [],
        message: 'Failed to fetch fee items, showing empty state'
      }
    }
  }, [initializePocketBase, validateAuth, log])

  /**
   * Fetch all student fee assignments
   */
  const fetchStudentFeeAssignments = useCallback(async (): Promise<ApiResponse<StudentFeeAssignment[]>> => {
    try {
      await initializePocketBase()
      validateAuth()

      log('info', 'Fetching student fee assignments from student_fees collection...')
      
      const requestKey = `student_fees_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      let response: any[]
      try {
        response = await pbRef.current.collection('student_fees').getFullList({
          sort: 'created',
          requestKey: requestKey
        })
        log('info', `Primary query successful, fetched ${response.length} records`)
      } catch (primaryError: any) {
        log('warn', 'Primary query failed, trying fallback strategies', {
          error: primaryError.message,
          status: primaryError.status,
          requestKey: requestKey
        })
        
        const fallbackKey1 = `student_fees_fallback1_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        try {
          response = await pbRef.current.collection('student_fees').getFullList({
            sort: '-created',
            requestKey: fallbackKey1
          })
          log('info', `Fallback 1 query successful, fetched ${response.length} records`)
        } catch (fallback1Error: any) {
          log('warn', 'Fallback 1 also failed, trying minimal query', {
            error: fallback1Error.message,
            status: fallback1Error.status,
            requestKey: fallbackKey1
          })
          
          const fallbackKey2 = `student_fees_fallback2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          try {
            response = await pbRef.current.collection('student_fees').getFullList({
              requestKey: fallbackKey2
            })
            log('info', `Fallback 2 query successful, fetched ${response.length} records`)
          } catch (fallback2Error: any) {
            log('error', 'All query attempts failed', {
              primaryError: primaryError.message,
              fallback1Error: fallback1Error.message,
              fallback2Error: fallback2Error.message,
              requestKeys: [requestKey, fallbackKey1, fallbackKey2]
            })
            
            return {
              success: true,
              data: [],
              message: 'No student fee assignments found or query failed'
            }
          }
        }
      }

      log('info', `Raw response from student_fees:`, {
        count: response.length,
        sample: response.length > 0 ? response[0] : null
      })

      const assignments: StudentFeeAssignment[] = []
      
      for (const record of response) {
        try {
          let expandedStudent = null
          if (record.students) {
            const expandKey = `student_expand_${record.students}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            try {
              expandedStudent = await pbRef.current.collection('students').getOne(record.students, {
                requestKey: expandKey
              })
              log('info', `Successfully expanded student ${record.students}`)
            } catch (expandError: any) {
              log('warn', `Failed to expand student ${record.students}`, {
                error: expandError.message,
                status: expandError.status,
                requestKey: expandKey
              })
            }
          }

          const parsedFeeItems = safeParseJson<FeeItem[]>(record.fee_items, [])
          
          log('info', `Processing assignment for student ${record.students}:`, {
            feeItemsCount: parsedFeeItems.length,
            totalAmount: record.totalAmount,
            hasExpandedStudent: !!expandedStudent
          })

          const assignment: StudentFeeAssignment = {
            id: record.id,
            students: record.students,
            fee_items: parsedFeeItems,
            totalAmount: record.totalAmount || 0,
            expand: expandedStudent ? {
              students: {
                id: expandedStudent.id,
                student_name: expandedStudent.student_name,
                standard: expandedStudent.standard,
                parents_name: expandedStudent.parents_name,
                studentId: expandedStudent.studentId
              }
            } : undefined
          }

          assignments.push(assignment)
        } catch (recordError: any) {
          log('error', `Failed to process record ${record.id}`, {
            error: recordError.message,
            status: recordError.status
          })
          const parsedFeeItems = safeParseJson<FeeItem[]>(record.fee_items, [])
          assignments.push({
            id: record.id,
            students: record.students,
            fee_items: parsedFeeItems,
            totalAmount: record.totalAmount || 0
          })
        }
      }

      log('info', `Successfully processed ${assignments.length} student fee assignments`)
      
      return {
        success: true,
        data: assignments
      }
    } catch (error: any) {
      log('error', 'Failed to fetch student fee assignments', {
        error: error.message,
        status: error.status,
        type: error.constructor.name
      })
      
      return {
        success: true,
        data: [],
        message: 'Failed to fetch student fee assignments, showing empty state'
      }
    }
  }, [initializePocketBase, validateAuth, safeParseJson, log])

  /**
   * Create or update student fee assignment
   */
  const upsertStudentFeeAssignment = useCallback(async (
    studentId: string,
    feeItems: FeeItem[],
    totalAmount: number
  ): Promise<ApiResponse<StudentFeeAssignment>> => {
    try {
      await initializePocketBase()
      validateAuth()

      log('info', `Upserting student fee assignment for student: ${studentId}`)
      
      const findKey = `find_assignment_${studentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const existingAssignment = await pbRef.current.collection('student_fees').getFirstListItem(
        `students = "${studentId}"`,
        { requestKey: findKey }
      ).catch(() => null)

      const assignmentData = {
        students: studentId,
        fee_items: JSON.stringify(feeItems),
        totalAmount: totalAmount
      }

      let result: any

      if (existingAssignment) {
        const updateKey = `update_assignment_${existingAssignment.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        result = await pbRef.current.collection('student_fees').update(
          existingAssignment.id,
          assignmentData,
          { requestKey: updateKey }
        )
        log('info', `Updated existing assignment: ${existingAssignment.id}`)
      } else {
        const createKey = `create_assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        result = await pbRef.current.collection('student_fees').create(
          assignmentData,
          { requestKey: createKey }
        )
        log('info', `Created new assignment: ${result.id}`)
      }

      let expandedStudent = null
      try {
        const expandKey = `expand_student_${studentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        expandedStudent = await pbRef.current.collection('students').getOne(studentId, {
          requestKey: expandKey
        })
      } catch (expandError: any) {
        log('warn', `Failed to expand student ${studentId}`, {
          error: expandError.message,
          status: expandError.status
        })
      }

      const assignment: StudentFeeAssignment = {
        id: result.id,
        students: result.students,
        fee_items: safeParseJson<FeeItem[]>(result.fee_items, []),
        totalAmount: result.totalAmount,
        expand: expandedStudent ? {
          students: {
            id: expandedStudent.id,
            student_name: expandedStudent.student_name,
            standard: expandedStudent.standard,
            parents_name: expandedStudent.parents_name,
            studentId: expandedStudent.studentId
          }
        } : undefined
      }

      return {
        success: true,
        data: assignment,
        message: existingAssignment ? 'Assignment updated successfully' : 'Assignment created successfully'
      }
    } catch (error: any) {
      log('error', 'Failed to upsert student fee assignment', {
        error: error.message,
        status: error.status,
        type: error.constructor.name
      })
      return {
        success: false,
        error: error instanceof StudentFeeApiError ? error.message : 'Unknown error occurred'
      }
    }
  }, [initializePocketBase, validateAuth, safeParseJson, log])

  // ========================================
  // State Management
  // ========================================
  const [state, setState] = useState<StudentFeeMatrixState>({
    students: [],
    fees: [],
    assignments: [],
    loading: false,
    error: null,
    editMode: false,
    expandedStudents: new Set(),
    expandedCategories: new Set(),
    searchTerm: '',
    selectedGradeFilter: 'all',
    batchMode: false
  })

  // Local edit state (not persisted until save)
  const [localAssignments, setLocalAssignments] = useState<Map<string, Set<string>>>(new Map())
  
  // Loading states
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')

  // ========================================
  // Refs for cleanup and optimization
  // ========================================
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentFetchIdRef = useRef<string>('')
  const hasInitializedRef = useRef(false)
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ========================================
  // Utility Functions
  // ========================================

  /**
   * Safe state setter - 防止组件卸载后的状态更新
   */
  const safeSetState = useCallback((updater: (prev: StudentFeeMatrixState) => StudentFeeMatrixState) => {
    if (isMountedRef.current) {
      setState(updater)
    }
  }, [])

  /**
   * Generate unique fetch ID
   */
  const generateFetchId = useCallback(() => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  /**
   * Group fees by category - 按分类组织费用
   */
  const groupedFees = useMemo((): Record<string, FeeCategory> => {
    const groups: Record<string, FeeCategory> = {}
    
    state.fees.forEach(fee => {
      const category = fee.category || '其他'
      
      if (!groups[category]) {
        groups[category] = {
          name: category,
          fees: [],
          totalItems: 0,
          assignedCount: 0,
          totalAmount: 0
        }
      }
      
      groups[category].fees.push(fee)
      groups[category].totalItems++
      groups[category].totalAmount += fee.amount
    })

    // Calculate assigned counts
    Object.keys(groups).forEach(category => {
      const categoryFees = groups[category].fees
      let assignedCount = 0
      
      state.students.forEach(student => {
        const studentAssignment = localAssignments.get(student.id)
        if (studentAssignment) {
          categoryFees.forEach(fee => {
            if (studentAssignment.has(fee.id)) {
              assignedCount++
            }
          })
        }
      })
      
      groups[category].assignedCount = assignedCount
    })

    return groups
  }, [state.fees, state.students, localAssignments])

  /**
   * Filter students based on search and filters
   */
  const filteredStudents = useMemo((): StudentNameCard[] => {
    return state.students.filter(student => {
      const matchesSearch = !state.searchTerm || 
        student.studentName.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(state.searchTerm.toLowerCase())
        
      const matchesGrade = state.selectedGradeFilter === 'all' || 
        student.grade === state.selectedGradeFilter
      
      return matchesSearch && matchesGrade
    })
  }, [state.students, state.searchTerm, state.selectedGradeFilter])

  // ========================================
  // Data Fetching Operations
  // ========================================

  /**
   * Fetch all data from PocketBase
   */
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    log('info', 'fetchData called', {
      isMounted: isMountedRef.current,
      hasInitialized: hasInitializedRef.current,
      isFullyConnected,
      hasSignal: !!signal,
      signalAborted: signal?.aborted,
      connectionStatus,
      hasUser: !!user,
      userId: user?.id
    })

    if (!isMountedRef.current) {
      log('info', 'Component already unmounted, skipping fetchData')
      return
    }

    if (hasInitializedRef.current && !signal) {
      log('info', 'Already initialized, skipping automatic fetch')
      return
    }

    if (!isFullyConnected) {
      log('warn', 'Not fully connected, skipping data fetch', {
        connectionStatus,
        hasUser: !!user,
        userId: user?.id
      })
      return
    }

    log('info', 'Starting data fetch...', {
      fetchId: generateFetchId(),
      timestamp: new Date().toISOString()
    })
    setLoadingState('loading')
    safeSetState(prev => ({ ...prev, loading: true, error: null }))

    const fetchId = generateFetchId()
    currentFetchIdRef.current = fetchId

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      await new Promise(resolve => setTimeout(resolve, 200))

      if (!isMountedRef.current) {
        log('info', 'Component unmounted before fetch started, aborting')
        return
      }

      if (signal?.aborted) {
        log('info', 'Fetch aborted by signal')
        return
      }

      // Fetch all data in parallel with retry logic
      const [studentsResponse, feesResponse, assignmentsResponse] = await Promise.all([
        fetchWithRetry(() => fetchStudentCards()),
        fetchWithRetry(() => fetchFeeItems()),
        fetchWithRetry(() => fetchStudentFeeAssignments())
      ])

      if (currentFetchIdRef.current !== fetchId) {
        log('info', 'Fetch operation superseded by newer request, skipping state update')
        return
      }

      if (!isMountedRef.current) {
        log('info', 'Component unmounted during fetch, skipping state update')
        return
      }

      if (signal?.aborted) {
        log('info', 'Fetch aborted by signal during processing')
        return
      }

      const successfulResponses = [
        studentsResponse.success ? studentsResponse : null,
        feesResponse.success ? feesResponse : null,
        assignmentsResponse.success ? assignmentsResponse : null
      ].filter(Boolean)

      const failedResponses = [
        !studentsResponse.success ? 'students' : null,
        !feesResponse.success ? 'fees' : null,
        !assignmentsResponse.success ? 'assignments' : null
      ].filter(Boolean)

      if (failedResponses.length > 0) {
        log('warn', `Some data fetch operations failed: ${failedResponses.join(', ')}`, {
          studentsSuccess: studentsResponse.success,
          feesSuccess: feesResponse.success,
          assignmentsSuccess: assignmentsResponse.success,
          fetchId: fetchId
        })
      }

      safeSetState(prev => {
        if (currentFetchIdRef.current !== fetchId) {
          return prev
        }

        return {
          ...prev,
          students: studentsResponse.success ? (studentsResponse.data || []) : prev.students,
          fees: feesResponse.success ? (feesResponse.data || []) : prev.fees,
          assignments: assignmentsResponse.success ? (assignmentsResponse.data || []) : prev.assignments,
          loading: false,
          error: failedResponses.length > 0 ? `Failed to fetch: ${failedResponses.join(', ')}` : null
        }
      })

      if (assignmentsResponse.success && assignmentsResponse.data) {
        const initialAssignments = new Map<string, Set<string>>()
        
        if (assignmentsResponse.data.length > 0) {
          assignmentsResponse.data.forEach((assignment: any) => {
            const studentId = assignment.students
            const feeIds = new Set<string>()
            
            assignment.fee_items.forEach((item: any) => {
              if (item.active) {
                feeIds.add(item.id)
              }
            })
            
            if (feeIds.size > 0) {
              initialAssignments.set(studentId, feeIds)
            }
          })
          
          log('info', `Initialized ${initialAssignments.size} student assignments`)
        } else {
          log('info', 'No existing student fee assignments found - starting with empty assignments')
        }
        
        if (currentFetchIdRef.current === fetchId) {
          setLocalAssignments(initialAssignments)
        }
      }

      hasInitializedRef.current = true

      log('info', 'Data fetch completed', {
        students: studentsResponse.success ? (studentsResponse.data?.length || 0) : 'failed',
        fees: feesResponse.success ? (feesResponse.data?.length || 0) : 'failed',
        assignments: assignmentsResponse.success ? (assignmentsResponse.data?.length || 0) : 'failed',
        failedOperations: failedResponses,
        fetchId: fetchId
      })

    } catch (error) {
      if (currentFetchIdRef.current !== fetchId) {
        log('info', 'Fetch operation superseded by newer request, ignoring error')
        return
      }

      if (!isMountedRef.current) {
        log('info', 'Component unmounted during fetch error, ignoring')
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      log('error', 'Data fetch failed', { error, fetchId })
      
      safeSetState(prev => {
        if (currentFetchIdRef.current !== fetchId) {
          return prev
        }

        return {
          ...prev,
          loading: false,
          error: errorMessage
        }
      })
    } finally {
      if (currentFetchIdRef.current === fetchId && isMountedRef.current) {
        setLoadingState('idle')
      }
    }
  }, [isFullyConnected, safeSetState, log, fetchWithRetry, generateFetchId, fetchStudentCards, fetchFeeItems, fetchStudentFeeAssignments, connectionStatus, user])

  /**
   * Refresh data with debouncing
   */
  const refreshData = useCallback(async () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      hasInitializedRef.current = false
      fetchData()
    }, 300)
  }, [fetchData])

  // ========================================
  // Assignment Operations
  // ========================================

  /**
   * Check if a fee is assigned to a student
   */
  const isAssigned = useCallback((studentId: string, feeId: string): boolean => {
    if (state.editMode) {
      const studentAssignment = localAssignments.get(studentId)
      return studentAssignment ? studentAssignment.has(feeId) : false
    } else {
      const assignment = state.assignments.find(a => a.students === studentId)
      return assignment?.fee_items.some(item => item.id === feeId && item.active) || false
    }
  }, [state.editMode, state.assignments, localAssignments])

  /**
   * Get student's total amount
   */
  const getStudentAmount = useCallback((studentId: string): number => {
    if (state.editMode) {
      const studentAssignment = localAssignments.get(studentId)
      if (!studentAssignment) return 0
      
      return state.fees
        .filter(fee => studentAssignment.has(fee.id))
        .reduce((total, fee) => total + fee.amount, 0)
    } else {
      const assignment = state.assignments.find(a => a.students === studentId)
      return assignment?.totalAmount || 0
    }
  }, [state.editMode, state.assignments, state.fees, localAssignments])

  /**
   * Assign fee to student (local state only during edit mode)
   */
  const assignFee = useCallback(async (studentId: string, feeId: string) => {
    if (!state.editMode) {
      log('warn', 'Cannot assign fee outside edit mode')
      return
    }

    log('info', `Assigning fee ${feeId} to student ${studentId}`)
    
    setLocalAssignments(prev => {
      const newMap = new Map(prev)
      const studentAssignment = new Set(newMap.get(studentId) || [])
      studentAssignment.add(feeId)
      newMap.set(studentId, studentAssignment)
      return newMap
    })
  }, [state.editMode, log])

  /**
   * Remove fee from student (local state only during edit mode)
   */
  const removeFee = useCallback(async (studentId: string, feeId: string) => {
    if (!state.editMode) {
      log('warn', 'Cannot remove fee outside edit mode')
      return
    }

    log('info', `Removing fee ${feeId} from student ${studentId}`)
    
    setLocalAssignments(prev => {
      const newMap = new Map(prev)
      const studentAssignment = new Set(newMap.get(studentId) || [])
      studentAssignment.delete(feeId)
      newMap.set(studentId, studentAssignment)
      return newMap
    })
  }, [state.editMode, log])

  /**
   * Save all local assignments to PocketBase
   */
  const saveAssignments = useCallback(async () => {
    if (!isFullyConnected) {
      log('error', 'Not fully connected, cannot save assignments', {
        connectionStatus,
        hasUser: !!user,
        userId: user?.id
      })
      return
    }

    log('info', 'Saving assignments to PocketBase...')
    setLoadingState('saving')

    try {
      const results = await Promise.allSettled(
        Array.from(localAssignments.entries()).map(async ([studentId, feeIds]) => {
          const feeItems = state.fees
            .filter(fee => feeIds.has(fee.id))
            .map(fee => ({
              id: fee.id,
              name: fee.name,
              amount: fee.amount,
              active: true,
              category: fee.category,
              description: fee.description
            }))

          const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0)

          return upsertStudentFeeAssignment(studentId, feeItems, totalAmount)
        })
      )

      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.filter(result => result.status === 'rejected').length

      log('info', `Save operation completed`, { successful, failed })

      if (failed > 0) {
        throw new Error(`${failed} assignments failed to save`)
      }

      await fetchData()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      log('error', 'Failed to save assignments', error)
      
      safeSetState(prev => ({
        ...prev,
        error: errorMessage
      }))
    } finally {
      if (isMountedRef.current) {
        setLoadingState('idle')
      }
    }
  }, [isFullyConnected, connectionStatus, user, localAssignments, state.fees, upsertStudentFeeAssignment, fetchData, safeSetState, log])

  // ========================================
  // UI State Operations
  // ========================================

  const toggleEditMode = useCallback(() => {
    const newEditMode = !state.editMode
    log('info', `${newEditMode ? 'Entering' : 'Exiting'} edit mode`)
    
    if (newEditMode) {
      const initialAssignments = new Map<string, Set<string>>()
      state.assignments.forEach(assignment => {
        const feeIds = new Set<string>()
        assignment.fee_items.forEach(item => {
          if (item.active) {
            feeIds.add(item.id)
          }
        })
        if (feeIds.size > 0) {
          initialAssignments.set(assignment.students, feeIds)
        }
      })
      setLocalAssignments(initialAssignments)
    } else {
      saveAssignments()
    }

    safeSetState(prev => ({ ...prev, editMode: newEditMode }))
  }, [state.editMode, state.assignments, saveAssignments, safeSetState, log])

  const toggleStudentExpansion = useCallback((studentId: string) => {
    safeSetState(prev => {
      const newExpanded = new Set(prev.expandedStudents)
      if (newExpanded.has(studentId)) {
        newExpanded.delete(studentId)
      } else {
        newExpanded.add(studentId)
      }
      return { ...prev, expandedStudents: newExpanded }
    })
  }, [safeSetState])

  const toggleCategoryExpansion = useCallback((category: string) => {
    safeSetState(prev => {
      const newExpanded = new Set(prev.expandedCategories)
      if (newExpanded.has(category)) {
        newExpanded.delete(category)
      } else {
        newExpanded.add(category)
      }
      return { ...prev, expandedCategories: newExpanded }
    })
  }, [safeSetState])

  const setSearchTerm = useCallback((term: string) => {
    safeSetState(prev => ({ ...prev, searchTerm: term }))
  }, [safeSetState])

  const setGradeFilter = useCallback((grade: string) => {
    safeSetState(prev => ({ ...prev, selectedGradeFilter: grade }))
  }, [safeSetState])

  const setBatchMode = useCallback((enabled: boolean) => {
    safeSetState(prev => ({ ...prev, batchMode: enabled }))
  }, [safeSetState])

  // ========================================
  // Utility Operations
  // ========================================

  const getPaymentStatus = useCallback((studentId: string): PaymentStatus => {
    return {
      status: 'not_issued',
      date: undefined,
      amount: getStudentAmount(studentId)
    }
  }, [getStudentAmount])

  // ========================================
  // Effects
  // ========================================

  // Auto-fetch data when connection is established
  useEffect(() => {
    log('info', 'Connection state changed, checking if should fetch data', {
      isFullyConnected,
      hasInitialized: hasInitializedRef.current,
      isMounted: isMountedRef.current
    })

    if (isFullyConnected && !hasInitializedRef.current && isMountedRef.current) {
      log('info', 'Connection established and not initialized, triggering data fetch')
      
      // Use a small delay to ensure connection is stable
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current && isFullyConnected) {
          log('info', 'Executing delayed data fetch')
          fetchData()
        } else {
          log('info', 'Component unmounted or connection lost during delay, skipping fetch')
        }
      }, 500)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [isFullyConnected, fetchData])

  // Cleanup on unmount
  useEffect(() => {
    log('info', 'Component mounted, setting up cleanup')
    
    return () => {
      log('info', 'Component unmounting, cleaning up')
      isMountedRef.current = false
      hasInitializedRef.current = false
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
      }

      // Clear PocketBase reference
      pbRef.current = null
      initializedRef.current = false
    }
  }, [])

  // ========================================
  // Return Interface
  // ========================================

  const actions: StudentFeeMatrixActions = {
    fetchData,
    refreshData,
    assignFee,
    removeFee,
    saveAssignments,
    toggleEditMode,
    toggleStudentExpansion,
    toggleCategoryExpansion,
    setSearchTerm,
    setGradeFilter,
    setBatchMode,
    isAssigned,
    getStudentAmount,
    getPaymentStatus
  }

  // Add diagnostic method for debugging
  const runDiagnostics = useCallback(async () => {
    try {
      log('info', 'Running diagnostics...', {
        connectionStatus,
        hasUser: !!user,
        userId: user?.id,
        isFullyConnected
      })
      
      await initializePocketBase()
      validateAuth()
      
      const collectionsKey = `diagnostics_collections_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const collections = await pbRef.current.collections.getFullList({
        requestKey: collectionsKey
      })
      const collectionNames = collections.map((c: any) => c.name)
      
      log('info', 'Available collections:', collectionNames)
      
      const diagnostics = {
        collections: collectionNames,
        hasStudents: collectionNames.includes('students'),
        hasFeesItems: collectionNames.includes('fees_items'),
        hasStudentFees: collectionNames.includes('student_fees'),
        studentsCount: 0,
        feesCount: 0,
        assignmentsCount: 0
      }

      try {
        const studentsKey = `diagnostics_students_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const studentsResponse = await pbRef.current.collection('students').getList(1, 1, {
          requestKey: studentsKey
        })
        diagnostics.studentsCount = studentsResponse.totalItems
      } catch (error: any) {
        log('warn', 'Could not count students:', {
          error: error.message,
          status: error.status
        })
      }

      try {
        const feesKey = `diagnostics_fees_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const feesResponse = await pbRef.current.collection('fees_items').getList(1, 1, {
          requestKey: feesKey
        })
        diagnostics.feesCount = feesResponse.totalItems
      } catch (error: any) {
        log('warn', 'Could not count fees:', {
          error: error.message,
          status: error.status
        })
      }

      try {
        const assignmentsKey = `diagnostics_assignments_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const assignmentsResponse = await pbRef.current.collection('student_fees').getList(1, 1, {
          requestKey: assignmentsKey
        })
        diagnostics.assignmentsCount = assignmentsResponse.totalItems
      } catch (error: any) {
        log('warn', 'Could not count assignments:', {
          error: error.message,
          status: error.status
        })
      }

      log('info', 'Diagnostics completed:', diagnostics)
      return diagnostics
    } catch (error) {
      log('error', 'Diagnostics error:', error)
      throw error
    }
  }, [initializePocketBase, validateAuth, log, connectionStatus, user, isFullyConnected])

  return {
    // State
    ...state,
    groupedFees,
    filteredStudents,
    loadingState,
    
    // Actions
    ...actions,
    
    // Connection state
    isFullyConnected,
    
    // Debug
    runDiagnostics
  }
}
