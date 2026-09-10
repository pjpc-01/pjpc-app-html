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

      // 计算本月总工时（按真实占用时间去重：同一老师同一天的排班时段合并后求占用小时）
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
          // 按 (老师, 日期) 分组，组内合并重叠/重复时段，只计实际占用小时
          const byTeacherDate = new Map<string, { s: number; e: number }[]>()
          items.forEach((s: any) => {
            if (!s.teacher_id || !s.start_time || !s.end_time) return
            const day = (s.date || '').split(' ')[0]
            const key = `${s.teacher_id}|${day}`
            let h1 = 0, m1 = 0, h2 = 0, m2 = 0
            try { [h1, m1] = s.start_time.split(':').map(Number); [h2, m2] = s.end_time.split(':').map(Number) } catch { return }
            const st = h1 * 60 + m1
            const en = h2 * 60 + m2
            if (en <= st) return
            if (!byTeacherDate.has(key)) byTeacherDate.set(key, [])
            byTeacherDate.get(key)!.push({ s: st, e: en })
          })
          // 对每组合并交叠并求和
          byTeacherDate.forEach((spans, _key) => {
            spans.sort((a, b) => a.s - b.s)
            let merged: { s: number; e: number }[] = []
            for (const sp of spans) {
              if (merged.length && sp.s < merged[merged.length - 1].e) {
                merged[merged.length - 1].e = Math.max(merged[merged.length - 1].e, sp.e)
              } else {
                merged.push({ ...sp })
              }
            }
            monthHours += merged.reduce((sum, sp) => sum + (sp.e - sp.s), 0) / 60
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
