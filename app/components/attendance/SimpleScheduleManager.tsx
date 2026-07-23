'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Zap,
  AlertTriangle,
  ShieldAlert,
  Loader2
} from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

// 冲突检测
import { detectAllConflicts, getConflictBadge, type Conflict } from '@/lib/schedule-conflicts'
import { format, addDays, startOfWeek, endOfWeek, isToday, isWeekend } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useTeachers, Teacher } from '@/hooks/useTeachers'

interface Schedule {
  id: string
  teacher_id: string
  teacher_name: string
  date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'completed'
  notes?: string
}

interface ScheduleTemplate {
  id: string
  name: string
  work_days: number[]
  start_time: string
  end_time: string
  max_hours_per_week: number
  color: string
  is_active: boolean
}

export default function SimpleScheduleManager() {
  const { t } = useLanguage()
  // 基础状态
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 从 PocketBase 获取真实教师数据
  const { teachers, loading: teachersLoading } = useTeachers()

  // 冲突检测状态
  const [showConflicts, setShowConflicts] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  // 排班模板（本地硬编码，无需 PB 持久化）
  const templates: ScheduleTemplate[] = [
    { id: '1', name: '全职教师班', work_days: [1, 2, 3, 4, 5], start_time: '09:00', end_time: '17:00', max_hours_per_week: 40, color: '#3b82f6', is_active: true },
    { id: '2', name: '兼职下午班', work_days: [1, 2, 3, 4, 5], start_time: '14:00', end_time: '18:00', max_hours_per_week: 20, color: '#10b981', is_active: true },
    { id: '3', name: '仅教书时段', work_days: [1, 2, 3, 4, 5, 6, 0], start_time: '16:00', end_time: '19:00', max_hours_per_week: 15, color: '#f59e0b', is_active: true },
    { id: '4', name: '管理层标准班', work_days: [1, 2, 3, 4, 5], start_time: '08:00', end_time: '18:00', max_hours_per_week: 50, color: '#8b5cf6', is_active: true },
  ]

  // 获取当前周排班
  useEffect(() => {
    fetchSchedules()
  }, [currentWeek])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const weekStart = format(startOfWeek(currentWeek), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(currentWeek), 'yyyy-MM-dd')

      const res = await fetch(
        `/api/pocketbase-proxy/api/collections/schedules/records?filter=(date>%3D'${weekStart}'%26%26date<%3D'${weekEnd}')&sort=date,start_time&perPage=200`
      )
      const data = await res.json()

      const mappedSchedules = (data?.items || []).map((item: any) => ({
        id: item.id,
        teacher_id: item.teacher_id || '',
        teacher_name: item.teacher_name || '',
        date: item.date || '',
        start_time: item.start_time || '',
        end_time: item.end_time || '',
        status: item.status || 'scheduled',
        notes: item.notes || '',
      }))

      setSchedules(mappedSchedules)
    } catch (err) {
      console.error('获取排班失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 检测冲突
  const handleDetectConflicts = () => {
    const slots = schedules.map(s => ({
      teacher_id: s.teacher_id,
      teacher_name: s.teacher_name,
      date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
      id: s.id,
    }))
    const result = detectAllConflicts(slots)
    setConflicts(result.conflicts)
    setShowConflicts(true)

    if (!result.hasConflict) {
      alert('✅ 当前排班没有时间冲突')
      setShowConflicts(false)
    }
  }

  // 获取一周的日期
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfWeek(currentWeek), i)
    return date
  })

  // 获取某天的排班
  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules.filter(s => s.date === dateStr)
  }

  // 获取某教师某天的排班
  const getEmployeeSchedule = (teacherId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules.find(s => s.teacher_id === teacherId && s.date === dateStr)
  }

  // 获取教师类型显示名称
  const getTypeName = (teacher: Teacher) => {
    if (teacher.position === 'parttime' || teacher.position === '兼职') return '兼职'
    if (teacher.position === 'teaching_only' || teacher.position === '仅教书') return '仅教书'
    return '全职'
  }

  // 从教师名称中提取类型提示（部分教师 name 可能含类型标记）
  const getTeacherType = (teacher: Teacher): string => {
    if (teacher.position === 'parttime' || teacher.position === '兼职') return 'parttime'
    if (teacher.position === 'teaching_only' || teacher.position === '仅教书') return 'teaching_only'
    if (teacher.position === 'admin' || teacher.position === '管理') return 'admin'
    if (teacher.position === 'support' || teacher.position === '后勤') return 'support'
    if (teacher.position === 'service' || teacher.position === '服务') return 'service'
    return 'fulltime'
  }

  // 添加排班
  const handleAddSchedule = async (teacherId: string, date: Date) => {
    const teacher = teachers.find(t => t.id === teacherId)
    if (!teacher) return

    setSaving(true)
    const dateStr = format(date, 'yyyy-MM-dd')

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          teacher_name: teacher.teacher_name || teacher.name || '',
          date: dateStr,
          start_time: '09:00',
          end_time: '17:00',
          status: 'scheduled',
          userId: 'admin',
          userName: '系统管理员',
          userRole: 'admin',
        }),
      })
      const data = await res.json()
      if (data.success && data.schedule) {
        const newSchedule: Schedule = {
          id: data.schedule.id,
          teacher_id: teacherId,
          teacher_name: teacher.teacher_name || teacher.name || '',
          date: dateStr,
          start_time: '09:00',
          end_time: '17:00',
          status: 'scheduled',
          notes: '',
        }
        setSchedules([...schedules, newSchedule])
      } else {
        console.error('添加排班失败:', data.error)
      }
    } catch (error) {
      console.error('添加排班失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 编辑排班
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule({ ...schedule })
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingSchedule) return

    setSaving(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSchedule.id,
          start_time: editingSchedule.start_time,
          end_time: editingSchedule.end_time,
          status: editingSchedule.status,
          notes: editingSchedule.notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSchedules(schedules.map(s =>
          s.id === editingSchedule.id ? editingSchedule : s
        ))
        setEditingSchedule(null)
      } else {
        console.error('更新排班失败:', data.error)
      }
    } catch (error) {
      console.error('更新排班失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 删除排班
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('确定要删除这个排班吗？')) return

    setSaving(true)
    try {
      const res = await fetch(`/api/schedule?id=${scheduleId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setSchedules(schedules.filter(s => s.id !== scheduleId))
      } else {
        console.error('删除排班失败:', data.error)
      }
    } catch (error) {
      console.error('删除排班失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 快速排班 - 使用模板
  const handleQuickSchedule = async (teacherId: string, templateId: string) => {
    const teacher = teachers.find(t => t.id === teacherId)
    const template = templates.find(t => t.id === templateId)

    if (!teacher || !template) return

    setSaving(true)
    const newSchedules: Schedule[] = []

    try {
      for (const workDay of template.work_days) {
        const date = addDays(startOfWeek(currentWeek), workDay === 0 ? 6 : workDay - 1)
        const dateStr = format(date, 'yyyy-MM-dd')

        // 检查是否已存在排班
        const existingSchedule = schedules.find(s =>
          s.teacher_id === teacherId && s.date === dateStr
        )

        if (!existingSchedule) {
          const res = await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacher_id: teacherId,
              teacher_name: teacher.teacher_name || teacher.name || '',
              date: dateStr,
              start_time: template.start_time,
              end_time: template.end_time,
              status: 'scheduled',
              notes: `快速排班 - ${template.name}`,
              userId: 'admin',
              userName: '系统管理员',
              userRole: 'admin',
            }),
          })
          const data = await res.json()
          if (data.success && data.schedule) {
            newSchedules.push({
              id: data.schedule.id,
              teacher_id: teacherId,
              teacher_name: teacher.teacher_name || teacher.name || '',
              date: dateStr,
              start_time: template.start_time,
              end_time: template.end_time,
              status: 'scheduled',
              notes: `快速排班 - ${template.name}`,
            })
          }
        }
      }

      if (newSchedules.length > 0) {
        setSchedules(prev => [...prev, ...newSchedules])
      }
    } catch (error) {
      console.error('快速排班失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const teacherName = (t: Teacher) => t.teacher_name || t.name || '未知'

  return (
    <div className="space-y-6">
      {/* 标题和导航 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">排班管理</h1>
          <p className="text-gray-600">
            {format(startOfWeek(currentWeek), 'MM月dd日', { locale: zhCN })} -
            {format(endOfWeek(currentWeek), 'MM月dd日', { locale: zhCN })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          >
            <ArrowLeft className="h-4 w-4" />
            上周
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            今天
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          >
            下周
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant={showConflicts ? "default" : "outline"}
            size="sm"
            onClick={handleDetectConflicts}
            className={showConflicts ? "bg-red-500 hover:bg-red-600 text-white" : ""}
          >
            <ShieldAlert className="h-4 w-4 mr-1" />
            检测冲突
          </Button>
        </div>
      </div>

      {/* 加载状态 */}
      {(loading || teachersLoading) && (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          加载中...
        </div>
      )}

      {/* 冲突检测面板 */}
      {showConflicts && conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              发现 {conflicts.length} 个排班冲突
            </CardTitle>
            <CardDescription className="text-red-600">
              以下教师在同一时间有重叠排班，请调整
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-red-700">{conflict.description}</p>
                    <p className="text-xs text-red-400 mt-1">
                      {conflict.withSchedule.date} · {conflict.withSchedule.start_time}-{conflict.withSchedule.end_time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => setShowConflicts(false)}>
              关闭
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* 快速排班 */}
      {!teachersLoading && teachers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              快速排班
            </CardTitle>
            <CardDescription>基于时间模板一键为教师安排整周排班</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teachers.map(teacher => (
                <div key={teacher.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{teacherName(teacher)}</div>
                      <div className="text-sm text-gray-500">
                        {getTypeName(teacher)}
                        {teacher.subjects && teacher.subjects.length > 0 && ` · ${teacher.subjects.join(', ')}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {templates.map(template => (
                      <Button
                        key={template.id}
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickSchedule(teacher.id, template.id)}
                        className="text-xs"
                        style={{ borderColor: template.color }}
                        disabled={saving}
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: template.color }}
                        />
                        {template.name}
                        <span className="ml-1 text-gray-500">
                          ({template.start_time}-{template.end_time})
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 排班表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium">{t('teacher.teacher')}</th>
                  {weekDates.map(date => (
                    <th key={date.toISOString()} className="text-center p-4 font-medium min-w-32">
                      <div className="text-sm">
                        {format(date, 'EEE', { locale: zhCN })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(date, 'd')}
                      </div>
                      {isToday(date) && (
                        <div className="text-xs text-blue-600">{t('attendance.today')}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachersLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      加载教师数据...
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      暂未找到教师数据，请先在教师管理中添加教师
                    </td>
                  </tr>
                ) : (
                  teachers.map(teacher => (
                    <tr key={teacher.id} className="border-b">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{teacherName(teacher)}</div>
                            <div className="text-sm text-gray-500">
                              {getTypeName(teacher)}
                            </div>
                            {teacher.subjects && teacher.subjects.length > 0 && (
                              <div className="text-xs text-gray-400">
                                {teacher.subjects.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {weekDates.map(date => {
                        const schedule = getEmployeeSchedule(teacher.id, date)
                        const isWeekendDay = isWeekend(date)

                        return (
                          <td key={date.toISOString()} className="p-2 text-center">
                            {schedule ? (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                <div className="text-sm font-medium">
                                  {schedule.start_time} - {schedule.end_time}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  {schedule.status === 'scheduled' ? '已安排' :
                                   schedule.status === 'confirmed' ? '已确认' : '已完成'}
                                </div>
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditSchedule(schedule)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-500"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                    disabled={saving}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : isWeekendDay ? (
                              <div className="text-gray-400 text-sm">{t('attendance.weekend')}</div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-full"
                                onClick={() => handleAddSchedule(teacher.id, date)}
                                disabled={saving}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                添加
                              </Button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 编辑排班对话框 */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>编辑排班</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('teacher.teacher')}</Label>
                <div className="text-sm text-gray-600">{editingSchedule.teacher_name}</div>
              </div>

              <div>
                <Label>{t('finance.date')}</Label>
                <div className="text-sm text-gray-600">
                  {format(new Date(editingSchedule.date), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('attendance.start_time')}</Label>
                  <Input
                    type="time"
                    value={editingSchedule.start_time}
                    onChange={(e) => setEditingSchedule({
                      ...editingSchedule,
                      start_time: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label>{t('attendance.end_time')}</Label>
                  <Input
                    type="time"
                    value={editingSchedule.end_time}
                    onChange={(e) => setEditingSchedule({
                      ...editingSchedule,
                      end_time: e.target.value
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>{t('teacher.status')}</Label>
                <Select
                  value={editingSchedule.status}
                  onValueChange={(value: any) => setEditingSchedule({
                    ...editingSchedule,
                    status: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">{t('exam.scheduled')}</SelectItem>
                    <SelectItem value="confirmed">{t('teacher.confirmed')}</SelectItem>
                    <SelectItem value="completed">{t('assignment.completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('teacher.notes')}</Label>
                <Input
                  value={editingSchedule.notes || ''}
                  onChange={(e) => setEditingSchedule({
                    ...editingSchedule,
                    notes: e.target.value
                  })}
                  placeholder="排班备注"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingSchedule(null)}
                >
                  取消
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
