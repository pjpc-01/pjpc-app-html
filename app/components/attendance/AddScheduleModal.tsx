'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Clock,
  Users,
  MapPin,
  Save,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'

interface Employee {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  department: string
  position: string
  subjects: string[]
  grades: string[]
  experience: number
  maxHoursPerWeek: number
  preferredTimes: string[]
  unavailableDays: string[]
  status: 'active' | 'inactive' | 'on_leave'
  center: string
  hourlyRate?: number
  monthlySalary?: number
  skills: string[]
  certifications: string[]
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

interface ClassSchedule {
  id: string
  name: string
  subject: string
  grade: string
  center: string
  room: string
  startTime: string
  endTime: string
  maxStudents: number
  currentStudents: number
  teacherId?: string
  teacherName?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  color: string
  notes?: string
}

interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (scheduleData: any) => Promise<void>
  employees: Employee[]
  templates: ScheduleTemplate[]
  classes: ClassSchedule[]
  selectedDate?: Date
}

export default function AddScheduleModal({
  isOpen,
  onClose,
  onSave,
  employees,
  templates,
  classes,
  selectedDate = new Date()
}: AddScheduleModalProps) {
  // 表单状态
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [date, setDate] = useState<string>(format(selectedDate, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('17:00')
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  
  // UI状态
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([])
  const [conflictWarning, setConflictWarning] = useState<string>('')
  const [availableRooms, setAvailableRooms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 重置表单
  const resetForm = () => {
    setSelectedEmployee('')
    setSelectedClass('')
    setSelectedTemplate('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setStartTime('09:00')
    setEndTime('17:00')
    setSelectedRoom('')
    setNotes('')
    setSuggestedTimes([])
    setConflictWarning('')
    setAvailableRooms([])
  }

  // 关闭浮窗时重置表单
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    } else {
      setDate(format(selectedDate, 'yyyy-MM-dd'))
    }
  }, [isOpen, selectedDate])

  // 计算工作时长
  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10
  }

  // 获取智能建议
  const getSuggestedTimes = (employeeId: string, date: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return []

    const suggestions: string[] = []
    if (employee.preferredTimes) {
      employee.preferredTimes.forEach(timeRange => {
        const [start, end] = timeRange.split('-')
        suggestions.push(`${start}-${end}`)
      })
    }

    // 根据岗位类型提供标准时间建议
    let standardTimes: string[] = []
    switch (employee.type) {
      case 'admin':
        standardTimes = ['08:00-12:00', '14:00-18:00', '07:30-18:30']
        break
      case 'support':
        if (employee.position?.includes('清洁')) {
          standardTimes = ['06:00-10:00', '16:00-20:00']
        } else if (employee.position?.includes('保安')) {
          standardTimes = ['20:00-08:00', '08:00-20:00']
        } else {
          standardTimes = ['08:00-12:00', '14:00-18:00']
        }
        break
      case 'service':
        if (employee.position?.includes('接送')) {
          standardTimes = ['07:00-09:00', '15:00-17:00']
        } else if (employee.position?.includes('食堂')) {
          standardTimes = ['10:00-14:00', '16:00-19:00']
        } else {
          standardTimes = ['08:00-12:00', '14:00-18:00']
        }
        break
      default: // 教学岗位
        standardTimes = ['09:00-12:00', '14:00-17:00', '18:00-21:00']
    }

    standardTimes.forEach(time => {
      if (!suggestions.includes(time)) {
        suggestions.push(time)
      }
    })

    return suggestions
  }

  // 检查时间冲突
  const checkTimeConflict = (employeeId: string, date: string, startTime: string, endTime: string) => {
    // 这里可以添加实际的冲突检查逻辑
    // 暂时返回空字符串表示无冲突
    return ''
  }

  // 获取可用教室
  const getAvailableRooms = (date: string, startTime: string, endTime: string) => {
    const rooms = ['A101', 'A102', 'A103', 'B101', 'B102', 'C101', 'C102']
    // 这里可以添加实际的教室占用检查逻辑
    // 暂时返回所有教室
    return rooms
  }

  // 当选择教师时更新建议
  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    const suggestions = getSuggestedTimes(employeeId, date)
    setSuggestedTimes(suggestions)
    
    // 设置默认时间
    if (suggestions.length > 0) {
      const [start, end] = suggestions[0].split('-')
      setStartTime(start)
      setEndTime(end)
    }
  }

  // 当时间改变时检查冲突和更新教室
  const handleTimeChange = (newStartTime: string, newEndTime: string) => {
    setStartTime(newStartTime)
    setEndTime(newEndTime)
    
    if (selectedEmployee) {
      const conflict = checkTimeConflict(selectedEmployee, date, newStartTime, newEndTime)
      setConflictWarning(conflict)
      
      const rooms = getAvailableRooms(date, newStartTime, newEndTime)
      setAvailableRooms(rooms)
      
      if (rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(rooms[0])
      }
    }
  }

  // 保存排班
  const handleSave = async () => {
    if (!selectedEmployee) {
      alert('请选择教师')
      return
    }

    if (conflictWarning) {
      alert(`时间冲突: ${conflictWarning}`)
      return
    }

    const selectedEmp = employees.find(emp => emp.id === selectedEmployee)
    if (!selectedEmp) {
      alert('选择的教师不存在')
      return
    }

    setIsLoading(true)

    try {
      const scheduleData = {
        teacher_id: selectedEmployee,
        teacher_name: selectedEmp.name,
        schedule_type: selectedEmp.type,
        date: date,
        start_time: startTime,
        end_time: endTime,
        center: selectedEmp.center || '总校',
        room: selectedRoom || 'A101',
        status: 'scheduled' as const,
        is_overtime: false,
        hourly_rate: selectedEmp.hourlyRate,
        total_hours: calculateHours(startTime, endTime),
        notes: notes || '智能排班添加'
      }

      await onSave(scheduleData)
      onClose()
    } catch (error) {
      console.error('保存排班失败:', error)
      alert('保存排班失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              添加排班
            </CardTitle>
            <CardDescription>
              为教师安排工作时间
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 智能建议区域 */}
          {suggestedTimes.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                智能建议
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestedTimes.map((time, index) => {
                  const [start, end] = time.split('-')
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTimeChange(start, end)}
                      className="text-xs"
                    >
                      {time}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 冲突警告 */}
          {conflictWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{conflictWarning}</AlertDescription>
            </Alert>
          )}

          {/* 表单字段 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>选择教师 *</Label>
              <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择教师" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span>{employee.name}</span>
                        <span className="text-xs text-gray-500">
                          {employee.type === 'fulltime' ? '全职' : 
                           employee.type === 'parttime' ? '兼职' : 
                           employee.type === 'teaching_only' ? '仅教书' :
                           employee.type === 'admin' ? '行政' :
                           employee.type === 'support' ? '后勤' : '服务'} · 
                          {employee.position || employee.subjects?.join(', ')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>选择课程</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="选择课程（可选）" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(classItem => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>日期 *</Label>
              <Input 
                type="date" 
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  // 重新计算建议
                  if (selectedEmployee) {
                    const suggestions = getSuggestedTimes(selectedEmployee, e.target.value)
                    setSuggestedTimes(suggestions)
                  }
                }}
              />
            </div>

            <div>
              <Label>排班模板</Label>
              <Select value={selectedTemplate} onValueChange={(value) => {
                setSelectedTemplate(value)
                const template = templates.find(t => t.id === value)
                if (template) {
                  setStartTime(template.start_time)
                  setEndTime(template.end_time)
                  handleTimeChange(template.start_time, template.end_time)
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择模板（可选）" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.start_time}-{template.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>开始时间 *</Label>
              <Input 
                type="time" 
                value={startTime}
                onChange={(e) => handleTimeChange(e.target.value, endTime)}
              />
            </div>
            
            <div>
              <Label>结束时间 *</Label>
              <Input 
                type="time" 
                value={endTime}
                onChange={(e) => handleTimeChange(startTime, e.target.value)}
              />
            </div>
            
            <div>
              <Label>教室 *</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="选择教室" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.length > 0 ? (
                    availableRooms.map(room => (
                      <SelectItem key={room} value={room}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {room} (可用)
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">该时间段无可用教室</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>工作时长</Label>
              <Input 
                value={`${calculateHours(startTime, endTime)} 小时`}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div>
            <Label>备注</Label>
            <Input 
              placeholder="排班备注信息"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedEmployee && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>已选择教师，智能建议已激活</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                取消
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!selectedEmployee || !!conflictWarning || availableRooms.length === 0 || isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? '保存中...' : '保存排班'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

