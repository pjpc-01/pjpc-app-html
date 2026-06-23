import { useState, useCallback } from 'react'
import { fetchSecureData } from '@/lib/secure-api-client'

export interface PickupRecord {
  id: string
  studentId: string
  pickup_date: string
  pickup_time: string
  pickup_by: string
  relationship: string
  phone: string
  vehicle_plate: string
  status: 'scheduled' | 'picked_up' | 'delayed' | 'cancelled'
  notes: string
  teacherId: string
  parent_confirmed: boolean
  created: string
  expand?: {
    studentId?: { id: string; name: string; grade: string }
    teacherId?: { id: string; name: string }
  }
}

export const usePickup = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取今日接送列表
  const getTodayPickups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const today = new Date().toISOString().split('T')[0]
      const data = await fetchSecureData<PickupRecord[]>('pickup_records', {
        fullList: true,
        filter: `pickup_date = "${today}"`,
        sort: '-pickup_time',
        expand: 'studentId,teacherId',
      })
      return data || []
    } catch (err) {
      setError('获取接送记录失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取学生接送历史
  const getStudentPickups = useCallback(async (studentId: string, limit = 20) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<PickupRecord[]>('pickup_records', {
        fullList: true,
        filter: `studentId = "${studentId}"`,
        sort: '-pickup_date',
        expand: 'studentId,teacherId',
      })
      return (data || []).slice(0, limit)
    } catch (err) {
      setError('获取接送历史失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 登记接送
  const recordPickup = useCallback(async (data: {
    studentId: string
    pickup_date: string
    pickup_time?: string
    pickup_by: string
    relationship?: string
    phone?: string
    vehicle_plate?: string
    notes?: string
  }) => {
    try {
      const res = await fetch('/api/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '登记失败')
      return json.data
    } catch (err) {
      setError('登记接送失败')
      throw err
    }
  }, [])

  // 更新接送状态
  const updatePickup = useCallback(async (id: string, updates: {
    status?: string
    pickup_time?: string
    notes?: string
    parent_confirmed?: boolean
  }) => {
    try {
      const res = await fetch('/api/pickup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '更新失败')
      return json.data
    } catch (err) {
      setError('更新接送失败')
      throw err
    }
  }, [])

  return {
    loading,
    error,
    getTodayPickups,
    getStudentPickups,
    recordPickup,
    updatePickup,
  }
}
