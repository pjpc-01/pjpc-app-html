'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Zap
} from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, isToday, isWeekend } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Employee {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'teaching_only'
  subjects: string[]
}

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
  type: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  work_days: number[]
  start_time: string
  end_time: string
  max_hours_per_week: number
  color: string
  is_active: boolean
}

interface SimpleScheduleManagerProps {
  onSaveSchedule: (schedule: any) => Promise<void>
  onDeleteSchedule: (id: string) => Promise<void>
  onUpdateSchedule: (id: string, schedule: any) => Promise<void>
}

export default function SimpleScheduleManager({
  onSaveSchedule,
  onDeleteSchedule,
  onUpdateSchedule
}: SimpleScheduleManagerProps) {
  // 基础状态
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])

  // 员工数据
  const employees: Employee[] = [
    { id: '1', name: 'Cheng Mun Poo', type: 'fulltime', subjects: ['数学', '科学'] },
    { id: '2', name: 'WONG CHOW MEI', type: 'fulltime', subjects: ['华文', '数学'] },
    { id: '3', name: '李老师', type: 'parttime', subjects: ['英文'] },
    { id: '4', name: '王老师', type: 'parttime', subjects: ['科学'] }
  ]

  // 默认模板数据 - 与ScheduleTemplateManager保持一致
  const defaultTemplates: ScheduleTemplate[] = [
    {
      id: '1',
      name: '全职教师班',
      type: 'fulltime',
      work_days: [1, 2, 3, 4, 5],
      start_time: '09:00',
      end_time: '17:00',
      max_hours_per_week: 40,
      color: '#3b82f6',
      is_active: true
    },
    {
      id: '2',
      name: '兼职下午班',
      type: 'parttime',
      work_days: [1, 2, 3, 4, 5],
      start_time: '14:00',
      end_time: '18:00',
      max_hours_per_week: 20,
      color: '#10b981',
      is_active: true
    },
    {
      id: '3',
      name: '仅教书时段',
      type: 'teaching_only',
      work_days: [1, 2, 3, 4, 5, 6, 0],
      start_time: '16:00',
      end_time: '19:00',
      max_hours_per_week: 15,
      color: '#f59e0b',
      is_active: true
    },
    {
      id: '4',
      name: '管理层标准班',
      type: 'admin',
      work_days: [1, 2, 3, 4, 5],
      start_time: '08:00',
      end_time: '18:00',
      max_hours_per_week: 50,
      color: '#8b5cf6',
      is_active: true
    }
  ]

  // 初始化模板数据
  useEffect(() => {
    setTemplates(defaultTemplates)
  }, [])

  // 根据教师类型获取匹配的模板
  const getTemplatesForEmployeeType = (employeeType: string) => {
    return templates.filter(template => 
      template.is_active && 
      (template.type === employeeType || 
       (employeeType === 'teaching_only' && template.type === 'teaching_only') ||
       (employeeType === 'parttime' && template.type === 'parttime') ||
       (employeeType === 'fulltime' && template.type === 'fulltime'))
    )
  }

  // 获取教师类型显示名称
  const getTypeName = (type: string) => {
    switch (type) {
      case 'fulltime': return '全职'
      case 'parttime': return '兼职'
      case 'teaching_only': return '仅教书'
      case 'admin': return '管理'
      case 'support': return '后勤'
      case 'service': return '服务'
      default: return type
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

  // 获取某员工某天的排班
  const getEmployeeSchedule = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules.find(s => s.teacher_id === employeeId && s.date === dateStr)
  }

  // 添加排班
  const handleAddSchedule = async (employeeId: string, date: Date) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return

    const newSchedule: Schedule = {
      id: Date.now().toString(),
      teacher_id: employeeId,
      teacher_name: employee.name,
      date: format(date, 'yyyy-MM-dd'),
      start_time: '09:00',
      end_time: '17:00',
      status: 'scheduled',
      notes: ''
    }

    try {
      await onSaveSchedule(newSchedule)
      setSchedules([...schedules, newSchedule])
    } catch (error) {
      console.error('添加排班失败:', error)
    }
  }

  // 编辑排班
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingSchedule) return

    try {
      await onUpdateSchedule(editingSchedule.id, editingSchedule)
      setSchedules(schedules.map(s => 
        s.id === editingSchedule.id ? editingSchedule : s
      ))
      setEditingSchedule(null)
    } catch (error) {
      console.error('更新排班失败:', error)
    }
  }

  // 删除排班
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('确定要删除这个排班吗？')) return

    try {
      await onDeleteSchedule(scheduleId)
      setSchedules(schedules.filter(s => s.id !== scheduleId))
    } catch (error) {
      console.error('删除排班失败:', error)
    }
  }

  // 快速排班 - 使用模板
  const handleQuickSchedule = async (employeeId: string, templateId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    const template = templates.find(t => t.id === templateId)
    
    if (!employee || !template) return

    // 为模板指定的工作日创建排班
    for (const workDay of template.work_days) {
      const date = addDays(startOfWeek(currentWeek), workDay === 0 ? 6 : workDay - 1)
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // 检查是否已存在排班
      const existingSchedule = schedules.find(s => 
        s.teacher_id === employeeId && s.date === dateStr
      )
      
      if (!existingSchedule) {
        const newSchedule: Schedule = {
          id: `${Date.now()}-${workDay}`,
          teacher_id: employeeId,
          teacher_name: employee.name,
          date: dateStr,
          start_time: template.start_time,
          end_time: template.end_time,
          status: 'scheduled',
          notes: `快速排班 - ${template.name}`
        }

        try {
          await onSaveSchedule(newSchedule)
          setSchedules(prev => [...prev, newSchedule])
        } catch (error) {
          console.error('快速排班失败:', error)
        }
      }
    }
  }

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
        </div>
      </div>

      {/* 快速排班 */}
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
            {employees.map(employee => {
              const availableTemplates = getTemplatesForEmployeeType(employee.type)
              return (
                <div key={employee.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">
                        {getTypeName(employee.type)} · {employee.subjects.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  {availableTemplates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableTemplates.map(template => (
                        <Button
                          key={template.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSchedule(employee.id, template.id)}
                          className="text-xs"
                          style={{ borderColor: template.color }}
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
                  ) : (
                    <div className="text-sm text-gray-500">
                      暂无匹配的排班模板
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 排班表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium">教师</th>
                  {weekDates.map(date => (
                    <th key={date.toISOString()} className="text-center p-4 font-medium min-w-32">
                      <div className="text-sm">
                        {format(date, 'EEE', { locale: zhCN })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(date, 'd')}
                      </div>
                      {isToday(date) && (
                        <div className="text-xs text-blue-600">今天</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(employee => (
                  <tr key={employee.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">
                            {employee.type === 'fulltime' ? '全职' : '兼职'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {employee.subjects.join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {weekDates.map(date => {
                      const schedule = getEmployeeSchedule(employee.id, date)
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
                              <div className="flex gap-1">
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
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : isWeekendDay ? (
                            <div className="text-gray-400 text-sm">周末</div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-full"
                              onClick={() => handleAddSchedule(employee.id, date)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              添加
                            </Button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
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
                <Label>教师</Label>
                <div className="text-sm text-gray-600">{editingSchedule.teacher_name}</div>
              </div>
              
              <div>
                <Label>日期</Label>
                <div className="text-sm text-gray-600">
                  {format(new Date(editingSchedule.date), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始时间</Label>
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
                  <Label>结束时间</Label>
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
                <Label>状态</Label>
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
                    <SelectItem value="scheduled">已安排</SelectItem>
                    <SelectItem value="confirmed">已确认</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>备注</Label>
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
                <Button onClick={handleSaveEdit}>
                  <CheckCircle className="h-4 w-4 mr-1" />
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

