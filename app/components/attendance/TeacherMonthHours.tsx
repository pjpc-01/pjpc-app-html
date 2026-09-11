'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Users } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"
import { useTeachers, Teacher } from '@/hooks/useTeachers'

// 教师本月教学工时面板（独立于月视图，单独显示）
export default function TeacherMonthHours({
  month,
}: {
  month: Date
}) {
  const { t } = useLanguage()
  const { teachers, loading: teachersLoading } = useTeachers()
  const [monthHoursMap, setMonthHoursMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // 月初/月末字符串
  const y = month.getFullYear()
  const m = String(month.getMonth() + 1).padStart(2, '0')
  const prefix = `${y}-${m}`

  // 加载每个教师的本月工时（按课程排班 start~end 累计）
  const fetchMonthHours = async () => {
    setLoading(true)
    try {
      const [schRes, courseRes] = await Promise.all([
        fetch(`/api/pocketbase-proxy/api/collections/schedules/records?perPage=300&filter=${encodeURIComponent('schedule_type="course_schedule"')}`),
        fetch('/api/courses'),
      ])
      if (!schRes.ok) return
      const schData = await schRes.json()

      // course_id → teacher_id 映射
      const courseMap: Record<string, string> = {}
      try {
        const cd = await courseRes.json()
        const cList = cd?.data?.items || cd?.items || []
        cList.forEach((c: any) => {
          if (c.id && c.teacher_id) courseMap[c.id] = c.teacher_id
        })
      } catch (e) { console.error('加载课程映射失败:', e) }

      const items = schData?.items || []
      // 只统计当前月份的排班（模板 date=2026-01-05 占位不算）
      const map: Record<string, number> = {}
      items.forEach((s: any) => {
        if (!s.start_time || !s.end_time) return
        const day = (s.date || '').split(' ')[0]
        if (!day.startsWith(prefix)) return
        const teacherId = s.teacher_id || courseMap[s.course_id]
        if (!teacherId) return
        const hs = new Date(`2000-01-01T${s.start_time}`).getTime()
        const he = new Date(`2000-01-01T${s.end_time}`).getTime()
        const h = (he - hs) / 3600000
        if (h > 0 && h <= 24) {
          map[teacherId] = Math.round(((map[teacherId] || 0) + h) * 100) / 100
        }
      })
      setMonthHoursMap(map)
    } catch (e) {
      console.error('加载本月工时失败:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthHours()
  }, [month])

  const teacherName = (t: Teacher) => t.teacher_name || '未知'

  // 有工时的老师排前，没工时的排后，都显示（让用户看到哪些老师这个月没排班）
  const sorted = teachers.filter(t => {
    // 只显示全职/兼职/仅教书等教学岗
    const pos = (t.position || '').toLowerCase()
    if (['admin', 'management', 'manager', '后勤', '管理', 'support', 'service', '服务'].some(k => pos.includes(k) )) return false
    return true
  }).sort((a, b) => {
    const ha = monthHoursMap[a.id] || 0
    const hb = monthHoursMap[b.id] || 0
    return hb - ha
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-600" />
            教师本月教学工时
            <span className="text-xs font-normal text-gray-400">({y} 年 {m} 月)</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-gray-400 text-sm">加载工时数据...</div>
        ) : sorted.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">暂无教师数据</div>
        ) : (
          <div className="space-y-1.5">
            {sorted.map(teacher => {
              const hours = monthHoursMap[teacher.id]
              return (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{teacherName(teacher)}</div>
                      <div className="text-xs text-gray-400">
                        {teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.slice(0, 3).join(', ') : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className={`text-lg font-bold ${hours ? 'text-cyan-600' : 'text-gray-300'}`}>
                      {hours !== undefined ? `${hours} h` : '0 h'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}