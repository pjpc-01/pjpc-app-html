'use client'

import { useState, useEffect } from 'react'

interface AttendanceStats {
  todayPresent: number
  todayAbsent: number
  weekSchedules: number
  attendanceRate: number
  loading: boolean
  error: string | null
}

export function useAttendanceStats() {
  const [stats, setStats] = useState<AttendanceStats>({
    todayPresent: 0,
    todayAbsent: 0,
    weekSchedules: 0,
    attendanceRate: 0,
    loading: true,
    error: null
  })

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }))

      const today = new Date().toISOString().split('T')[0]
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date()
      endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()))

      // 获取今日考勤数据
      const [studentAttendanceRes, teacherAttendanceRes, scheduleRes] = await Promise.all([
        fetch(`/api/student-attendance?date=${today}`),
        fetch(`/api/teacher-attendance?type=teacher&date=${today}`),
        fetch(`/api/schedule?date=${today}`)
      ])

      const [studentData, teacherData, scheduleData] = await Promise.all([
        studentAttendanceRes.json(),
        teacherAttendanceRes.json(),
        scheduleRes.json()
      ])

      // 计算今日出勤和缺勤
      const todayStudentRecords = studentData.success ? studentData.records || [] : []
      const todayTeacherRecords = teacherData.success ? teacherData.records || [] : []
      const allTodayRecords = [...todayStudentRecords, ...todayTeacherRecords]

      const todayPresent = allTodayRecords.filter(record => record.status === 'present').length
      const todayAbsent = allTodayRecords.filter(record => record.status === 'absent').length

      // 计算本周排班数量
      const weekSchedules = scheduleData.success ? (scheduleData.schedules || []).length : 0

      // 计算出勤率
      const totalTodayRecords = todayPresent + todayAbsent
      const attendanceRate = totalTodayRecords > 0 ? Math.round((todayPresent / totalTodayRecords) * 100) : 0

      setStats({
        todayPresent,
        todayAbsent,
        weekSchedules,
        attendanceRate,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '获取统计数据失败'
      }))
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    ...stats,
    refetch: fetchStats
  }
}
