'use client'

import { useState, useEffect } from 'react'

interface AttendanceStats {
  todayPresent: number
  todayAbsent: number
  weekSchedules: number
  attendanceRate: number
  monthHours: number
  loading: boolean
  error: string | null
}

export function useAttendanceStats() {
  const [stats, setStats] = useState<AttendanceStats>({
    todayPresent: 0,
    todayAbsent: 0,
    weekSchedules: 0,
    attendanceRate: 0,
    monthHours: 0,
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

      // 计算本月总工时（纯按排班：start_time ~ end_time 累加）
      let monthHours = 0
      try {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const startDate = `${y}-${m}-01`
        const endDate = new Date(y, now.getMonth() + 1, 0).toISOString().split('T')[0]
        const schRes = await fetch(
          `/api/pocketbase-proxy/api/collections/schedules/records?perPage=200&filter=${encodeURIComponent(`date >= "${startDate}" && date <= "${endDate}"`)}`
        )
        if (schRes.ok) {
          const sd = await schRes.json()
          const items = sd?.items || []
          items.forEach((s: any) => {
            if (s.start_time && s.end_time) {
              const hs = new Date(`2000-01-01T${s.start_time}`).getTime()
              const he = new Date(`2000-01-01T${s.end_time}`).getTime()
              const h = (he - hs) / 3600000
              if (h > 0 && h <= 24) monthHours += h
            }
          })
          monthHours = Math.round(monthHours * 100) / 100
        }
      } catch (e) {
        console.error('计算本月工时失败:', e)
      }

      // 计算出勤率
      const totalTodayRecords = todayPresent + todayAbsent
      const attendanceRate = totalTodayRecords > 0 ? Math.round((todayPresent / totalTodayRecords) * 100) : 0

      setStats({
        todayPresent,
        todayAbsent,
        weekSchedules,
        attendanceRate,
        monthHours,
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
