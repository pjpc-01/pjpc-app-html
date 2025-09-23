'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Copy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  UserCheck,
  UserX
} from 'lucide-react'
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isSameDay, 
  parseISO,
  eachDayOfInterval,
  isToday,
  isWeekend,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 企业级排班类型定义
interface Employee {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'contract'
  department: string
  position: string
  skills: string[]
  maxHoursPerWeek: number
  preferredShifts: string[]
  unavailableDays: string[]
  avatar?: string
  status: 'active' | 'inactive' | 'on_leave'
}

interface ShiftTemplate {
  id: string
  name: string
  type: 'morning' | 'afternoon' | 'evening' | 'night' | 'full_day'
  startTime: string
  endTime: string
  breakDuration: number
  color: string
  requiredSkills: string[]
  maxEmployees: number
  minEmployees: number
  isActive: boolean
}

interface Schedule {
  id: string
  employeeId: string
  shiftTemplateId: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  isOvertime: boolean
  createdAt: string
  updatedAt: string
}

interface ScheduleConflict {
  type: 'overlap' | 'overtime' | 'unavailable' | 'skill_mismatch' | 'overstaffed' | 'understaffed'
  message: string
  severity: 'low' | 'medium' | 'high'
  scheduleId: string
}

interface ScheduleStats {
  totalSchedules: number
  confirmedSchedules: number
  pendingSchedules: number
  cancelledSchedules: number
  totalHours: number
  overtimeHours: number
  coverageRate: number
  conflictCount: number
}

export default function EnterpriseScheduleManagement() {
  // 视图状态
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  
  // 数据状态
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  
  // UI状态
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [isEditingSchedule, setIsEditingSchedule] = useState<string | null>(null)
  const [showConflicts, setShowConflicts] = useState(true)
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({})

  // 默认数据
  const defaultShiftTemplates: ShiftTemplate[] = [
    {
      id: 'morning-shift',
      name: '早班',
      type: 'morning',
      startTime: '08:00',
      endTime: '16:00',
      breakDuration: 60,
      color: '#3b82f6',
      requiredSkills: ['basic'],
      maxEmployees: 5,
      minEmployees: 2,
      isActive: true
    },
    {
      id: 'afternoon-shift',
      name: '下午班',
      type: 'afternoon',
      startTime: '14:00',
      endTime: '22:00',
      breakDuration: 60,
      color: '#10b981',
      requiredSkills: ['basic'],
      maxEmployees: 4,
      minEmployees: 2,
      isActive: true
    },
    {
      id: 'evening-shift',
      name: '晚班',
      type: 'evening',
      startTime: '18:00',
      endTime: '02:00',
      breakDuration: 30,
      color: '#f59e0b',
      requiredSkills: ['advanced'],
      maxEmployees: 3,
      minEmployees: 1,
      isActive: true
    },
    {
      id: 'full-day-shift',
      name: '全天班',
      type: 'full_day',
      startTime: '09:00',
      endTime: '18:00',
      breakDuration: 90,
      color: '#8b5cf6',
      requiredSkills: ['management'],
      maxEmployees: 2,
      minEmployees: 1,
      isActive: true
    }
  ]

  // 计算当前视图的日期范围
  const getViewDates = () => {
    switch (viewMode) {
      case 'day':
        return [currentDate]
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      case 'month':
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
      default:
        return []
    }
  }

  // 获取某天的排班
  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules.filter(schedule => schedule.date === dateStr)
  }

  // 获取员工信息
  const getEmployee = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)
  }

  // 获取班次模板
  const getShiftTemplate = (templateId: string) => {
    return shiftTemplates.find(template => template.id === templateId)
  }

  // 计算工作时长
  const calculateWorkHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours - breakDuration / 60)
  }

  // 检测排班冲突
  const detectConflicts = (schedules: Schedule[]) => {
    const conflicts: ScheduleConflict[] = []
    
    schedules.forEach(schedule => {
      const employee = getEmployee(schedule.employeeId)
      const template = getShiftTemplate(schedule.shiftTemplateId)
      
      if (!employee || !template) return

      // 检查员工是否在不可用日期
      if (employee.unavailableDays.includes(schedule.date)) {
        conflicts.push({
          type: 'unavailable',
          message: `${employee.name} 在 ${schedule.date} 不可用`,
          severity: 'high',
          scheduleId: schedule.id
        })
      }

      // 检查技能匹配
      const hasRequiredSkills = template.requiredSkills.every(skill => 
        employee.skills.includes(skill)
      )
      if (!hasRequiredSkills) {
        conflicts.push({
          type: 'skill_mismatch',
          message: `${employee.name} 缺少所需技能: ${template.requiredSkills.join(', ')}`,
          severity: 'medium',
          scheduleId: schedule.id
        })
      }

      // 检查员工状态
      if (employee.status !== 'active') {
        conflicts.push({
          type: 'unavailable',
          message: `${employee.name} 当前状态为 ${employee.status}`,
          severity: 'high',
          scheduleId: schedule.id
        })
      }
    })

    return conflicts
  }

  // 智能排班建议
  const getSmartSuggestions = (date: Date, shiftTemplateId: string) => {
    const template = getShiftTemplate(shiftTemplateId)
    if (!template) return []

    const availableEmployees = employees.filter(emp => 
      emp.status === 'active' &&
      !emp.unavailableDays.includes(format(date, 'yyyy-MM-dd')) &&
      template.requiredSkills.every(skill => emp.skills.includes(skill))
    )

    // 按技能匹配度和偏好排序
    return availableEmployees
      .map(emp => ({
        ...emp,
        score: calculateEmployeeScore(emp, template, date)
      }))
      .sort((a, b) => b.score - a.score)
  }

  // 计算员工评分
  const calculateEmployeeScore = (employee: Employee, template: ShiftTemplate, date: Date) => {
    let score = 0
    
    // 技能匹配度
    const skillMatch = template.requiredSkills.filter(skill => 
      employee.skills.includes(skill)
    ).length / template.requiredSkills.length
    score += skillMatch * 40

    // 偏好匹配
    if (employee.preferredShifts.includes(template.type)) {
      score += 30
    }

    // 最近排班频率（避免过度排班）
    const recentSchedules = schedules.filter(s => 
      s.employeeId === employee.id &&
      Math.abs(new Date(s.date).getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000
    ).length
    score += Math.max(0, 20 - recentSchedules * 5)

    // 部门匹配
    if (selectedDepartment === 'all' || employee.department === selectedDepartment) {
      score += 10
    }

    return score
  }

  // 自动排班
  const autoSchedule = () => {
    const dates = getViewDates()
    const newSchedules: Schedule[] = []

    dates.forEach(date => {
      if (viewMode === 'month' && date.getMonth() !== currentDate.getMonth()) return

      shiftTemplates.forEach(template => {
        if (!template.isActive) return

        const existingSchedules = getSchedulesForDate(date)
        const currentCount = existingSchedules.filter(s => s.shiftTemplateId === template.id).length
        
        if (currentCount < template.minEmployees) {
          const suggestions = getSmartSuggestions(date, template.id)
          const needed = template.minEmployees - currentCount
          
          suggestions.slice(0, needed).forEach(employee => {
            const existingSchedule = existingSchedules.find(s => s.employeeId === employee.id)
            if (!existingSchedule) {
              newSchedules.push({
                id: `schedule-${Date.now()}-${Math.random()}`,
                employeeId: employee.id,
                shiftTemplateId: template.id,
                date: format(date, 'yyyy-MM-dd'),
                startTime: template.startTime,
                endTime: template.endTime,
                status: 'scheduled',
                isOvertime: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
            }
          })
        }
      })
    })

    setSchedules(prev => [...prev, ...newSchedules])
  }

  // 复制排班
  const copySchedule = (fromDate: Date, toDate: Date) => {
    const fromSchedules = getSchedulesForDate(fromDate)
    const newSchedules: Schedule[] = []

    fromSchedules.forEach(schedule => {
      newSchedules.push({
        ...schedule,
        id: `schedule-${Date.now()}-${Math.random()}`,
        date: format(toDate, 'yyyy-MM-dd'),
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })

    setSchedules(prev => [...prev, ...newSchedules])
  }

  // 更新统计
  const updateStats = () => {
    const totalSchedules = schedules.length
    const confirmedSchedules = schedules.filter(s => s.status === 'confirmed').length
    const pendingSchedules = schedules.filter(s => s.status === 'scheduled').length
    const cancelledSchedules = schedules.filter(s => s.status === 'cancelled').length
    
    const totalHours = schedules.reduce((sum, s) => {
      const template = getShiftTemplate(s.shiftTemplateId)
      return sum + calculateWorkHours(s.startTime, s.endTime, template?.breakDuration || 0)
    }, 0)

    const overtimeHours = schedules.filter(s => s.isOvertime).reduce((sum, s) => {
      const template = getShiftTemplate(s.shiftTemplateId)
      return sum + calculateWorkHours(s.startTime, s.endTime, template?.breakDuration || 0)
    }, 0)

    const conflicts = detectConflicts(schedules)
    const coverageRate = totalSchedules > 0 ? Math.round((confirmedSchedules / totalSchedules) * 100) : 0

    setStats({
      totalSchedules,
      confirmedSchedules,
      pendingSchedules,
      cancelledSchedules,
      totalHours: Math.round(totalHours * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      coverageRate,
      conflictCount: conflicts.length
    })

    setConflicts(conflicts)
  }

  // 初始化数据
  useEffect(() => {
    setShiftTemplates(defaultShiftTemplates)
    setEmployees([
      {
        id: '1',
        name: 'Cheng Mun Poo',
        type: 'fulltime',
        department: 'Management',
        position: 'Manager',
        skills: ['management', 'advanced'],
        maxHoursPerWeek: 40,
        preferredShifts: ['morning', 'full_day'],
        unavailableDays: [],
        status: 'active'
      },
      {
        id: '2',
        name: 'Teacher 2',
        type: 'parttime',
        department: 'Teaching',
        position: 'Teacher',
        skills: ['basic'],
        maxHoursPerWeek: 20,
        preferredShifts: ['afternoon'],
        unavailableDays: [],
        status: 'active'
      }
    ])
  }, [])

  // 更新统计
  useEffect(() => {
    updateStats()
  }, [schedules, employees])

  const viewDates = getViewDates()
  const filteredEmployees = employees.filter(emp => 
    (selectedDepartment === 'all' || emp.department === selectedDepartment) &&
    (showInactiveEmployees || emp.status === 'active')
  )

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">企业级排班管理</h2>
          <p className="text-gray-600">智能排班系统 - 支持日/周/月视图</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              日
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              周
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              月
            </Button>
          </div>
          <Button onClick={autoSchedule} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            智能排班
          </Button>
          <Button onClick={() => setIsAddingSchedule(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加排班
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总排班</p>
                  <p className="text-2xl font-bold">{stats.totalSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已确认</p>
                  <p className="text-2xl font-bold">{stats.confirmedSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">待确认</p>
                  <p className="text-2xl font-bold">{stats.pendingSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已取消</p>
                  <p className="text-2xl font-bold">{stats.cancelledSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总工时</p>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">覆盖率</p>
                  <p className="text-2xl font-bold">{stats.coverageRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">冲突</p>
                  <p className="text-2xl font-bold">{stats.conflictCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">员工</p>
                  <p className="text-2xl font-bold">{filteredEmployees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和设置 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label>部门筛选</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有部门</SelectItem>
                  <SelectItem value="Management">管理部</SelectItem>
                  <SelectItem value="Teaching">教学部</SelectItem>
                  <SelectItem value="Support">支持部</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactiveEmployees}
                onCheckedChange={setShowInactiveEmployees}
              />
              <Label htmlFor="show-inactive">显示非活跃员工</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-conflicts"
                checked={showConflicts}
                onCheckedChange={setShowConflicts}
              />
              <Label htmlFor="show-conflicts">显示冲突</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 冲突提醒 */}
      {showConflicts && conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              排班冲突提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                  <AlertTriangle className={`h-4 w-4 ${
                    conflict.severity === 'high' ? 'text-red-500' :
                    conflict.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <span className="text-sm">{conflict.message}</span>
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 w-48">
                    员工
                  </th>
                  {viewDates.map(date => (
                    <th key={date.toISOString()} className="px-4 py-3 text-center text-sm font-medium text-gray-900 min-w-32">
                      <div>
                        <div className="font-semibold">
                          {format(date, 'EEE', { locale: zhCN })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(date, 'MM/dd')}
                        </div>
                        {isToday(date) && (
                          <div className="text-xs text-blue-600 font-bold">今天</div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map(employee => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                          <div className="flex gap-1 mt-1">
                            <Badge variant={employee.type === 'fulltime' ? 'default' : 'secondary'} className="text-xs">
                              {employee.type === 'fulltime' ? '全职' : employee.type === 'parttime' ? '兼职' : '合同'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {employee.department}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>
                    {viewDates.map(date => {
                      const daySchedules = getSchedulesForDate(date).filter(s => s.employeeId === employee.id)
                      const isCurrentMonth = viewMode !== 'month' || date.getMonth() === currentDate.getMonth()
                      const isToday = isSameDay(date, new Date())
                      
                      return (
                        <td 
                          key={date.toISOString()} 
                          className={`px-4 py-3 ${!isCurrentMonth ? 'bg-gray-50' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                        >
                          {daySchedules.map(schedule => {
                            const template = getShiftTemplate(schedule.shiftTemplateId)
                            const conflict = conflicts.find(c => c.scheduleId === schedule.id)
                            
                            return (
                              <div 
                                key={schedule.id}
                                className={`border rounded-lg p-2 mb-1 ${
                                  conflict 
                                    ? 'bg-red-50 border-red-200' 
                                    : schedule.status === 'confirmed'
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="text-xs">
                                    <div className="font-medium">{schedule.startTime} - {schedule.endTime}</div>
                                    <div className="text-gray-500">
                                      {template?.name} • {calculateWorkHours(schedule.startTime, schedule.endTime, template?.breakDuration || 0).toFixed(1)}h
                                    </div>
                                    {conflict && (
                                      <div className="text-red-600 text-xs mt-1">
                                        ⚠️ {conflict.message}
                                      </div>
                                    )}
                                  </div>
                                  {isCurrentMonth && (
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-red-500"
                                        onClick={() => setSchedules(prev => prev.filter(s => s.id !== schedule.id))}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          {daySchedules.length === 0 && isCurrentMonth && (
                            <div className="text-center text-gray-400 text-xs py-2">
                              无排班
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

      {/* 班次模板管理 */}
      <Card>
        <CardHeader>
          <CardTitle>班次模板</CardTitle>
          <CardDescription>管理不同类型的班次模板</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {shiftTemplates.map(template => (
              <div 
                key={template.id}
                className="border rounded-lg p-4"
                style={{ borderLeftColor: template.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{template.name}</h3>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? '启用' : '禁用'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {template.startTime} - {template.endTime}
                  </div>
                  <div>休息: {template.breakDuration}分钟</div>
                  <div>人数: {template.minEmployees}-{template.maxEmployees}人</div>
                  <div>技能: {template.requiredSkills.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
