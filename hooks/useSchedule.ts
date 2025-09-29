import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/pocketbase-auth-context'

export interface Schedule {
  id: string
  teacher_id: string
  teacher_name?: string
  class_id?: string
  class_name?: string
  date: string
  start_time: string
  end_time: string
  center: string
  room?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  is_overtime: boolean
  hourly_rate?: number
  total_hours: number
  schedule_type: 'fulltime' | 'parttime' | 'teaching_only'
  template_id?: string
  notes?: string
  created_by?: string
  approved_by?: string
  created?: string
  updated?: string
}

export interface ScheduleTemplate {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'teaching_only'
  work_days: number[] // JSON array of days (0-6)
  start_time: string
  end_time: string
  max_hours_per_week: number
  color: string
  is_active: boolean
  created?: string
  updated?: string
}

export interface AutoScheduleRequest {
  startDate: string
  endDate: string
  center?: string
  preferences?: {
    prioritizeExperience?: boolean
    avoidOvertime?: boolean
    balanceWorkload?: boolean
  }
}

export const useSchedule = () => {
  const { user, userProfile } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 获取排班数据
  const fetchSchedules = useCallback(async (params?: {
    date?: string
    employeeId?: string
    center?: string
    type?: string
  }) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 创建新的 AbortController
    const newAbortController = new AbortController()
    abortControllerRef.current = newAbortController

    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.date) searchParams.append('date', params.date)
      if (params?.employeeId) searchParams.append('employeeId', params.employeeId)
      if (params?.center) searchParams.append('center', params.center)
      if (params?.type) searchParams.append('type', params.type)

      const response = await fetch(`/api/schedule?${searchParams.toString()}`, {
        signal: newAbortController.signal
      })
      
      // 检查请求是否被取消
      if (newAbortController.signal.aborted) {
        return
      }
      
      const data = await response.json()

      if (data.success) {
        // 处理日期格式，将 ISO 日期字符串转换为 yyyy-MM-dd 格式
        const processedSchedules = data.schedules.map((schedule: any) => ({
          ...schedule,
          date: schedule.date ? schedule.date.split(' ')[0] : schedule.date
        }))
        setSchedules(processedSchedules)
      } else {
        throw new Error(data.error || '获取排班数据失败')
      }
    } catch (err) {
      // 如果是取消错误，不设置错误状态
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('排班数据请求被取消')
        return
      }
      console.error('获取排班数据失败:', err)
      setError(err instanceof Error ? err.message : '获取排班数据失败')
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  // 获取排班模板
  const fetchTemplates = useCallback(async (type?: string) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (type) searchParams.append('type', type)

      const response = await fetch(`/api/schedule-templates?${searchParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates)
      } else {
        throw new Error(data.error || '获取排班模板失败')
      }
    } catch (err) {
      console.error('获取排班模板失败:', err)
      setError(err instanceof Error ? err.message : '获取排班模板失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 创建排班
  const createSchedule = useCallback(async (scheduleData: Partial<Schedule>) => {
    try {
      setLoading(true)
      setError(null)

      // 检查用户是否已登录
      if (!user || !userProfile) {
        throw new Error('用户未登录')
      }

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scheduleData,
          userId: user.id,
          userName: userProfile.name || user.email,
          userRole: userProfile.role || 'teacher'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSchedules(prev => [...prev, data.schedule])
        if (data.message) {
          console.warn(data.message)
        }
        return data.schedule
      } else {
        throw new Error(data.error || '创建排班失败')
      }
    } catch (err) {
      console.error('创建排班失败:', err)
      setError(err instanceof Error ? err.message : '创建排班失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, userProfile])

  // 更新排班
  const updateSchedule = useCallback(async (id: string, updateData: Partial<Schedule>) => {
    try {
      setLoading(true)
      setError(null)

      // 检查用户是否已登录
      if (!user || !userProfile) {
        throw new Error('用户未登录')
      }

      const response = await fetch('/api/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id, 
          ...updateData,
          userId: user.id,
          userName: userProfile.name || user.email,
          userRole: userProfile.role || 'teacher'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSchedules(prev => prev.map(s => s.id === id ? data.schedule : s))
        return data.schedule
      } else {
        throw new Error(data.error || '更新排班失败')
      }
    } catch (err) {
      console.error('更新排班失败:', err)
      setError(err instanceof Error ? err.message : '更新排班失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, userProfile])

  // 删除排班
  const deleteSchedule = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // 检查用户是否已登录
      if (!user || !userProfile) {
        throw new Error('用户未登录')
      }

      const response = await fetch(`/api/schedule?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userName: userProfile.name || user.email,
          userRole: userProfile.role || 'teacher'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSchedules(prev => prev.filter(s => s.id !== id))
      } else {
        throw new Error(data.error || '删除排班失败')
      }
    } catch (err) {
      console.error('删除排班失败:', err)
      setError(err instanceof Error ? err.message : '删除排班失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, userProfile])

  // 智能排班
  const autoSchedule = useCallback(async (request: AutoScheduleRequest) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/schedule/auto-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (data.success) {
        // 重新获取排班数据
        await fetchSchedules({
          startDate: request.startDate,
          endDate: request.endDate,
          center: request.center
        })
        return data.schedules
      } else {
        throw new Error(data.error || '智能排班失败')
      }
    } catch (err) {
      console.error('智能排班失败:', err)
      setError(err instanceof Error ? err.message : '智能排班失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchSchedules])

  // 创建排班模板
  const createTemplate = useCallback(async (templateData: Partial<ScheduleTemplate>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/schedule-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      const data = await response.json()

      if (data.success) {
        setTemplates(prev => [...prev, data.template])
        return data.template
      } else {
        throw new Error(data.error || '创建排班模板失败')
      }
    } catch (err) {
      console.error('创建排班模板失败:', err)
      setError(err instanceof Error ? err.message : '创建排班模板失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 更新排班模板
  const updateTemplate = useCallback(async (id: string, updateData: Partial<ScheduleTemplate>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/schedule-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updateData }),
      })

      const data = await response.json()

      if (data.success) {
        setTemplates(prev => prev.map(t => t.id === id ? data.template : t))
        return data.template
      } else {
        throw new Error(data.error || '更新排班模板失败')
      }
    } catch (err) {
      console.error('更新排班模板失败:', err)
      setError(err instanceof Error ? err.message : '更新排班模板失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 删除排班模板
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/schedule-templates?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setTemplates(prev => prev.filter(t => t.id !== id))
      } else {
        throw new Error(data.error || '删除排班模板失败')
      }
    } catch (err) {
      console.error('删除排班模板失败:', err)
      setError(err instanceof Error ? err.message : '删除排班模板失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    schedules,
    templates,
    loading,
    error,
    fetchSchedules,
    fetchTemplates,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    autoSchedule,
    createTemplate,
    updateTemplate,
    deleteTemplate
  }
}
