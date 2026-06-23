// 📓 每日日志 Hook — 安亲班核心模块

import { useState, useEffect, useCallback } from 'react'

export interface DailyLog {
  id: string
  studentId: string
  teacherId: string
  date: string
  homework_done: boolean
  nap: boolean
  meal: string         // ate_all | ate_some | refused
  mood: string         // happy | neutral | upset
  behavior_note: string
  photo: string[]      // file IDs
  parent_viewed: boolean
  centerId: string
  created: string
  updated: string
  expand?: {
    studentId?: { id: string; name: string; grade?: string }
    teacherId?: { id: string; name: string }
    centerId?: { id: string; name: string; code: string }
  }
}

export interface DailyLogFormData {
  studentId: string
  teacherId: string
  date: string
  homework_done: boolean
  nap: boolean
  meal: string
  mood: string
  behavior_note: string
  centerId?: string
}

const MEAL_LABELS: Record<string, string> = {
  ate_all: '🍽️ 吃完',
  ate_some: '🥄 吃一半',
  refused: '😕 不吃',
}

const MOOD_LABELS: Record<string, string> = {
  happy: '😊 开心',
  neutral: '😐 一般',
  upset: '😢 不开心',
}

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  upset: '😢',
}

const MEAL_EMOJI: Record<string, string> = {
  ate_all: '🍽️',
  ate_some: '🥄',
  refused: '😕',
}

export { MEAL_LABELS, MOOD_LABELS, MOOD_EMOJI, MEAL_EMOJI }

// ============================================================
// useDailyLogs — 教师端：按日期/中心查询
// ============================================================

export function useDailyLogs(date?: string, centerId?: string) {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!date) return
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ date })
      if (centerId) params.set('centerId', centerId)
      params.set('perPage', '200')

      const response = await fetch(`/api/daily-logs?${params}`)
      const result = await response.json()
      if (result.success) {
        setLogs(result.data?.items || [])
      } else {
        throw new Error(result.error || '获取日志失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取日志失败')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [date, centerId])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const createLog = useCallback(async (data: DailyLogFormData) => {
    const response = await fetch('/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const result = await response.json()
    if (response.status === 409) {
      // 已有记录
      throw new Error('EXISTING_LOG')
    }
    if (result.success) {
      await fetchLogs()
      return result.data
    }
    throw new Error(result.error || '创建失败')
  }, [fetchLogs])

  const updateLog = useCallback(async (id: string, data: Partial<DailyLogFormData>) => {
    const response = await fetch('/api/daily-logs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    const result = await response.json()
    if (result.success) {
      await fetchLogs()
      return result.data
    }
    throw new Error(result.error || '更新失败')
  }, [fetchLogs])

  return { logs, loading, error, refetch: fetchLogs, createLog, updateLog }
}

// ============================================================
// useStudentDailyLogs — 家长端：查单个学生的日志
// ============================================================

export function useStudentDailyLogs(studentId?: string, limit = 30) {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!studentId) return
    try {
      setLoading(true)
      const params = new URLSearchParams({ studentId, perPage: String(limit) })
      const response = await fetch(`/api/daily-logs?${params}`)
      const result = await response.json()
      if (result.success) {
        setLogs(result.data?.items || [])
      }
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [studentId, limit])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return { logs, loading, refetch: fetchLogs }
}
