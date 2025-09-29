'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Users, 
  Zap, 
  Copy, 
  Wand2,
  Target,
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react'
import { format, addDays } from 'date-fns'

interface SmartSchedulePanelProps {
  employees: any[]
  templates: any[]
  onQuickSchedule: (data: any) => void
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export default function SmartSchedulePanel({
  employees,
  templates,
  onQuickSchedule,
  selectedDate,
  onDateChange
}: SmartSchedulePanelProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [scheduleDays, setScheduleDays] = useState<number>(1)

  // 智能排班预设
  const smartPresets = [
    {
      name: "全天班",
      icon: "🌅",
      description: "9:00-17:00 全天工作",
      startTime: "09:00",
      endTime: "17:00",
      days: 5
    },
    {
      name: "上午班",
      icon: "☀️",
      description: "9:00-12:00 上午教学",
      startTime: "09:00",
      endTime: "12:00",
      days: 5
    },
    {
      name: "下午班",
      icon: "🌤️",
      description: "14:00-17:00 下午辅导",
      startTime: "14:00",
      endTime: "17:00",
      days: 5
    },
    {
      name: "晚班",
      icon: "🌙",
      description: "18:00-21:00 晚间补习",
      startTime: "18:00",
      endTime: "21:00",
      days: 5
    },
    {
      name: "周末班",
      icon: "📚",
      description: "9:00-15:00 周末补习",
      startTime: "09:00",
      endTime: "15:00",
      days: 2
    }
  ]

  // 一键排班
  const handleQuickSchedule = (preset: any) => {
    if (!selectedEmployee) {
      alert('请先选择教师')
      return
    }

    const employee = employees.find(emp => emp.id === selectedEmployee)
    if (!employee) return

    // 为选定的天数创建排班
    for (let i = 0; i < preset.days; i++) {
      const scheduleDate = addDays(selectedDate, i)
      
      onQuickSchedule({
        teacher_id: selectedEmployee,
        teacher_name: employee.name,
        schedule_type: employee.type,
        date: format(scheduleDate, 'yyyy-MM-dd'),
        start_time: preset.startTime,
        end_time: preset.endTime,
        center: employee.center || '总校',
        room: 'A101',
        status: 'scheduled',
        is_overtime: false,
        hourly_rate: employee.hourlyRate,
        total_hours: calculateHours(preset.startTime, preset.endTime),
        notes: `智能排班 - ${preset.name}`
      })
    }

    alert(`成功为 ${employee.name} 安排了 ${preset.days} 天的 ${preset.name}！`)
  }

  // 复制整周排班
  const handleCopyWeek = () => {
    if (!selectedEmployee) {
      alert('请先选择教师')
      return
    }

    const employee = employees.find(emp => emp.id === selectedEmployee)
    if (!employee) return

    // 复制周一到周五的排班
    for (let i = 0; i < 5; i++) {
      const scheduleDate = addDays(selectedDate, i)
      
      onQuickSchedule({
        teacher_id: selectedEmployee,
        teacher_name: employee.name,
        schedule_type: employee.type,
        date: format(scheduleDate, 'yyyy-MM-dd'),
        start_time: "09:00",
        end_time: "17:00",
        center: employee.center || '总校',
        room: 'A101',
        status: 'scheduled',
        is_overtime: false,
        hourly_rate: employee.hourlyRate,
        total_hours: 8,
        notes: '智能排班 - 整周复制'
      })
    }

    alert(`成功为 ${employee.name} 复制了整周排班！`)
  }

  // 计算工作时长
  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10
  }

  return (
    <div className="space-y-4">
      {/* 智能排班标题 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            智能排班助手
          </CardTitle>
          <CardDescription>
            选择教师和预设方案，一键完成排班
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 选择教师 */}
            <div>
              <label className="block text-sm font-medium mb-2">选择教师</label>
              <div className="grid grid-cols-2 gap-2">
                {employees.map(employee => (
                  <Button
                    key={employee.id}
                    variant={selectedEmployee === employee.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEmployee(employee.id)}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {employee.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {employee.type === 'fulltime' ? '全职' : '兼职'}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* 快速操作 */}
            <div>
              <label className="block text-sm font-medium mb-2">快速操作</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWeek}
                  disabled={!selectedEmployee}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  复制整周
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(addDays(selectedDate, 1))
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  下一天
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 智能预设 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            智能预设方案
          </CardTitle>
          <CardDescription>
            点击预设方案，自动为选中的教师安排排班
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {smartPresets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start text-left hover:bg-blue-50"
                onClick={() => handleQuickSchedule(preset)}
                disabled={!selectedEmployee}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{preset.icon}</span>
                  <span className="font-medium">{preset.name}</span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {preset.description}
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Play className="h-3 w-3" />
                  点击应用
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 当前选择状态 */}
      {selectedEmployee && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                已选择教师：{employees.find(emp => emp.id === selectedEmployee)?.name}
              </span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              现在可以选择预设方案进行快速排班
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

