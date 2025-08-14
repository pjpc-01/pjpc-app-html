import { useState, useEffect } from 'react'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090')

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  centerId: string
  centerName: string
  timestamp: string
  type: 'check-in' | 'check-out'
  status: 'success' | 'error'
  deviceId?: string
  deviceName?: string
  created: string
  updated: string
}

export interface Center {
  id: string
  name: string
  address: string
  phone: string
  email: string
  status: 'active' | 'inactive'
}

export function useAttendance(centerId?: string) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取考勤记录
  const fetchAttendanceRecords = async (filters?: {
    centerId?: string
    studentId?: string
    date?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      let filter = ''

      if (filters?.centerId) {
        filter += `centerId = "${filters.centerId}"`
      }

      if (filters?.studentId) {
        if (filter) filter += ' && '
        filter += `studentId = "${filters.studentId}"`
      }

      if (filters?.date) {
        if (filter) filter += ' && '
        filter += `timestamp >= "${filters.date}T00:00:00.000Z" && timestamp <= "${filters.date}T23:59:59.999Z"`
      }

      const records = await pb.collection('attendance').getList(1, 100, {
        filter: filter || undefined,
        sort: '-timestamp'
      })

      setAttendanceRecords(records.items as AttendanceRecord[])
    } catch (err) {
      setError('获取考勤记录失败')
      console.error('获取考勤记录失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 记录考勤
  const recordAttendance = async (data: {
    studentId: string
    centerId: string
    type: 'check-in' | 'check-out'
    timestamp?: string
    deviceId?: string
    deviceName?: string
  }) => {
    try {
      const attendanceData = {
        studentId: data.studentId,
        centerId: data.centerId,
        type: data.type,
        timestamp: data.timestamp || new Date().toISOString(),
        status: 'success',
        deviceId: data.deviceId,
        deviceName: data.deviceName
      }

      const record = await pb.collection('attendance').create(attendanceData)
      
      // 更新本地状态
      setAttendanceRecords(prev => [record as AttendanceRecord, ...prev])
      
      return record
    } catch (err) {
      setError('记录考勤失败')
      console.error('记录考勤失败:', err)
      throw err
    }
  }

  // 获取今日考勤统计
  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => 
      record.timestamp.startsWith(today)
    )

    return {
      total: todayRecords.length,
      checkIn: todayRecords.filter(r => r.type === 'check-in').length,
      checkOut: todayRecords.filter(r => r.type === 'check-out').length,
      uniqueStudents: new Set(todayRecords.map(r => r.studentId)).size
    }
  }

  // 获取学生考勤历史
  const getStudentAttendanceHistory = (studentId: string, days: number = 30) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return attendanceRecords.filter(record => 
      record.studentId === studentId && 
      new Date(record.timestamp) >= cutoffDate
    )
  }

  // 初始化时获取考勤记录
  useEffect(() => {
    if (centerId) {
      fetchAttendanceRecords({ centerId })
    }
  }, [centerId])

  return {
    attendanceRecords,
    loading,
    error,
    fetchAttendanceRecords,
    recordAttendance,
    getTodayStats,
    getStudentAttendanceHistory
  }
}

export function useCenters() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取所有中心
  const fetchCenters = async () => {
    setLoading(true)
    setError(null)

    try {
      const records = await pb.collection('centers').getList(1, 100, {
        sort: 'name'
      })

      setCenters(records.items as Center[])
    } catch (err) {
      setError('获取中心信息失败')
      console.error('获取中心信息失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 获取特定中心
  const fetchCenter = async (centerId: string) => {
    try {
      const record = await pb.collection('centers').getOne(centerId)
      return record as Center
    } catch (err) {
      setError('获取中心信息失败')
      console.error('获取中心信息失败:', err)
      throw err
    }
  }

  // 初始化时获取中心列表
  useEffect(() => {
    fetchCenters()
  }, [])

  return {
    centers,
    loading,
    error,
    fetchCenters,
    fetchCenter
  }
}
