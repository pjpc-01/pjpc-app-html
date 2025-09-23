'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Users, Settings, Plus, Edit, Trash2, Save } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, eachDayOfInterval } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 排班类型定义
interface ScheduleTemplate {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'shift'
  workDays: number[] // 0-6, 0=Sunday
  startTime: string
  endTime: string
  breakDuration: number // 分钟
  maxHoursPerWeek: number
  color: string
}

interface EmployeeSchedule {
  id: string
  employeeId: string
  employeeName: string
  employeeType: 'fulltime' | 'parttime'
  templateId: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
}

interface WeeklySchedule {
  weekStart: string
  weekEnd: string
  schedules: EmployeeSchedule[]
}

export default function ScheduleManagement() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [employees, setEmployees] = useState<any[]>([])
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([])
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<EmployeeSchedule>>({})

  // 默认排班模板
  const defaultTemplates: ScheduleTemplate[] = [
    {
      id: 'fulltime-standard',
      name: '全职标准班',
      type: 'fulltime',
      workDays: [1, 2, 3, 4, 5], // 周一到周五
      startTime: '09:00',
      endTime: '18:00',
      breakDuration: 60,
      maxHoursPerWeek: 40,
      color: '#3b82f6'
    },
    {
      id: 'parttime-morning',
      name: '兼职早班',
      type: 'parttime',
      workDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '13:00',
      breakDuration: 0,
      maxHoursPerWeek: 20,
      color: '#10b981'
    },
    {
      id: 'parttime-afternoon',
      name: '兼职下午班',
      type: 'parttime',
      workDays: [1, 2, 3, 4, 5],
      startTime: '14:00',
      endTime: '18:00',
      breakDuration: 0,
      maxHoursPerWeek: 20,
      color: '#f59e0b'
    },
    {
      id: 'weekend-shift',
      name: '周末班',
      type: 'shift',
      workDays: [6, 0], // 周六周日
      startTime: '10:00',
      endTime: '16:00',
      breakDuration: 30,
      maxHoursPerWeek: 12,
      color: '#8b5cf6'
    }
  ]

  // 获取当前周的日期范围
  const getWeekDates = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // 周一开始
    const end = endOfWeek(date, { weekStartsOn: 1 })
    return { start, end }
  }

  // 生成一周的日期数组
  const getWeekDays = (date: Date) => {
    const { start } = getWeekDates(date)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  // 生成一个月的日期数组
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // 获取月份开始前的空白日期（用于填充日历）
    const startOfMonth = startOfWeek(firstDay, { weekStartsOn: 1 })
    const endOfMonth = endOfWeek(lastDay, { weekStartsOn: 1 })
    
    return eachDayOfInterval({ start: startOfMonth, end: endOfMonth })
  }

  // 获取某天的排班
  const getSchedulesForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules.filter(schedule => schedule.date === dateStr)
  }

  // 计算工作时长
  const calculateWorkHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours - breakDuration / 60)
  }

  // 自动排班
  const autoSchedule = () => {
    const days = viewMode === 'week' ? getWeekDays(currentWeek) : getMonthDays(currentMonth)
    const newSchedules: EmployeeSchedule[] = []

    employees.forEach(employee => {
      const template = templates.find(t => t.type === employee.employeeType)
      if (!template) return

      days.forEach(day => {
        // 只处理当前月份的日期
        if (viewMode === 'month' && day.getMonth() !== currentMonth.getMonth()) {
          return
        }

        if (template.workDays.includes(day.getDay())) {
          const existingSchedule = schedules.find(s => 
            s.employeeId === employee.id && s.date === format(day, 'yyyy-MM-dd')
          )

          if (!existingSchedule) {
            newSchedules.push({
              id: `schedule-${Date.now()}-${Math.random()}`,
              employeeId: employee.id,
              employeeName: employee.name || employee.teacher_name,
              employeeType: employee.employeeType || 'fulltime',
              templateId: template.id,
              date: format(day, 'yyyy-MM-dd'),
              startTime: template.startTime,
              endTime: template.endTime,
              status: 'scheduled'
            })
          }
        }
      })
    })

    setSchedules(prev => [...prev, ...newSchedules])
  }

  // 保存排班
  const saveSchedule = async (schedule: EmployeeSchedule) => {
    try {
      // 这里应该调用API保存到数据库
      console.log('保存排班:', schedule)
      setSchedules(prev => 
        prev.map(s => s.id === schedule.id ? schedule : s)
      )
    } catch (error) {
      console.error('保存排班失败:', error)
    }
  }

  // 删除排班
  const deleteSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))
  }

  // 初始化数据
  useEffect(() => {
    setTemplates(defaultTemplates)
    // 这里应该从API获取员工和排班数据
    setEmployees([
      { id: '1', name: 'Cheng Mun Poo', employeeType: 'fulltime' },
      { id: '2', name: 'Teacher 2', employeeType: 'parttime' }
    ])
  }, [])

  const weekDays = getWeekDays(currentWeek)
  const { start: weekStart, end: weekEnd } = getWeekDates(currentWeek)

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">排班管理</h2>
          <p className="text-gray-600">管理全职和兼职员工的排班安排</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              周视图
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              月视图
            </Button>
          </div>
          <Button onClick={autoSchedule} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            {viewMode === 'week' ? '自动排班(周)' : '自动排班(月)'}
          </Button>
          <Button onClick={() => setIsAddingSchedule(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加排班
          </Button>
        </div>
      </div>

      {/* 日期选择器 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {viewMode === 'week' 
                ? `${format(weekStart, 'yyyy年MM月dd日', { locale: zhCN })} - ${format(weekEnd, 'yyyy年MM月dd日', { locale: zhCN })}`
                : format(currentMonth, 'yyyy年MM月', { locale: zhCN })
              }
            </CardTitle>
            <div className="flex gap-2">
              {viewMode === 'week' ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(prev => addDays(prev, -7))}
                  >
                    上一周
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(new Date())}
                  >
                    本周
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentWeek(prev => addDays(prev, 7))}
                  >
                    下一周
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  >
                    上一月
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    本月
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  >
                    下一月
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 排班表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 w-32">
                    员工
                  </th>
                  {(viewMode === 'week' ? weekDays : getMonthDays(currentMonth)).map(day => (
                    <th key={day.toISOString()} className="px-4 py-3 text-center text-sm font-medium text-gray-900 min-w-32">
                      <div>
                        <div className="font-semibold">
                          {format(day, 'EEE', { locale: zhCN })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(day, 'MM/dd')}
                        </div>
                        {viewMode === 'month' && day.getMonth() !== currentMonth.getMonth() && (
                          <div className="text-xs text-gray-400">上月/下月</div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map(employee => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{employee.name || employee.teacher_name}</div>
                          <Badge 
                            variant={employee.employeeType === 'fulltime' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {employee.employeeType === 'fulltime' ? '全职' : '兼职'}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    {(viewMode === 'week' ? weekDays : getMonthDays(currentMonth)).map(day => {
                      const daySchedules = getSchedulesForDay(day).filter(s => s.employeeId === employee.id)
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                      const isToday = isSameDay(day, new Date())
                      
                      return (
                        <td 
                          key={day.toISOString()} 
                          className={`px-4 py-3 ${!isCurrentMonth ? 'bg-gray-50' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                        >
                          {daySchedules.map(schedule => (
                            <div 
                              key={schedule.id}
                              className={`border rounded-lg p-2 mb-1 ${
                                isCurrentMonth 
                                  ? 'bg-blue-50 border-blue-200' 
                                  : 'bg-gray-100 border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-xs">
                                  <div className="font-medium">{schedule.startTime} - {schedule.endTime}</div>
                                  <div className="text-gray-500">
                                    {calculateWorkHours(schedule.startTime, schedule.endTime).toFixed(1)}h
                                  </div>
                                </div>
                                {isCurrentMonth && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 text-red-500"
                                      onClick={() => deleteSchedule(schedule.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {daySchedules.length === 0 && (
                            <div className={`text-center text-xs py-2 ${
                              isCurrentMonth ? 'text-gray-400' : 'text-gray-300'
                            }`}>
                              {isCurrentMonth ? '无排班' : ''}
                            </div>
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

      {/* 月度统计概览 */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总排班天数</p>
                  <p className="text-2xl font-bold">
                    {getMonthDays(currentMonth).filter(day => day.getMonth() === currentMonth.getMonth()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总排班工时</p>
                  <p className="text-2xl font-bold">
                    {schedules
                      .filter(s => {
                        const scheduleDate = new Date(s.date)
                        return scheduleDate.getMonth() === currentMonth.getMonth() && 
                               scheduleDate.getFullYear() === currentMonth.getFullYear()
                      })
                      .reduce((sum, s) => sum + calculateWorkHours(s.startTime, s.endTime), 0)
                      .toFixed(0)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">工作日</p>
                  <p className="text-2xl font-bold">
                    {getMonthDays(currentMonth)
                      .filter(day => 
                        day.getMonth() === currentMonth.getMonth() && 
                        day.getDay() >= 1 && day.getDay() <= 5
                      ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">排班覆盖率</p>
                  <p className="text-2xl font-bold">
                    {(() => {
                      const totalWorkDays = getMonthDays(currentMonth)
                        .filter(day => 
                          day.getMonth() === currentMonth.getMonth() && 
                          day.getDay() >= 1 && day.getDay() <= 5
                        ).length
                      const scheduledDays = new Set(
                        schedules
                          .filter(s => {
                            const scheduleDate = new Date(s.date)
                            return scheduleDate.getMonth() === currentMonth.getMonth() && 
                                   scheduleDate.getFullYear() === currentMonth.getFullYear()
                          })
                          .map(s => s.date)
                      ).size
                      return totalWorkDays > 0 ? Math.round((scheduledDays / totalWorkDays) * 100) : 0
                    })()}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 排班模板管理 */}
      <Card>
        <CardHeader>
          <CardTitle>排班模板</CardTitle>
          <CardDescription>管理不同类型的排班模板</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map(template => (
              <div 
                key={template.id}
                className="border rounded-lg p-4"
                style={{ borderLeftColor: template.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{template.name}</h3>
                  <Badge variant="outline">
                    {template.type === 'fulltime' ? '全职' : '兼职'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {template.startTime} - {template.endTime}
                  </div>
                  <div>工作日: {template.workDays.length}天/周</div>
                  <div>最大工时: {template.maxHoursPerWeek}小时/周</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 添加排班对话框 */}
      {isAddingSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>添加排班</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>选择员工</Label>
                <Select onValueChange={(value) => setNewSchedule(prev => ({ ...prev, employeeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name || employee.teacher_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>选择模板</Label>
                <Select onValueChange={(value) => {
                  const template = templates.find(t => t.id === value)
                  if (template) {
                    setNewSchedule(prev => ({
                      ...prev,
                      templateId: value,
                      startTime: template.startTime,
                      endTime: template.endTime
                    }))
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择模板" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>开始时间</Label>
                <Input 
                  type="time" 
                  value={newSchedule.startTime || ''}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>结束时间</Label>
                <Input 
                  type="time" 
                  value={newSchedule.endTime || ''}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingSchedule(false)}>
                取消
              </Button>
              <Button onClick={() => {
                if (newSchedule.employeeId && newSchedule.startTime && newSchedule.endTime) {
                  const schedule: EmployeeSchedule = {
                    id: `schedule-${Date.now()}`,
                    employeeId: newSchedule.employeeId,
                    employeeName: employees.find(e => e.id === newSchedule.employeeId)?.name || 'Unknown',
                    employeeType: employees.find(e => e.id === newSchedule.employeeId)?.employeeType || 'fulltime',
                    templateId: newSchedule.templateId || '',
                    date: format(currentWeek, 'yyyy-MM-dd'),
                    startTime: newSchedule.startTime,
                    endTime: newSchedule.endTime,
                    status: 'scheduled'
                  }
                  setSchedules(prev => [...prev, schedule])
                  setIsAddingSchedule(false)
                  setNewSchedule({})
                }
              }}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
