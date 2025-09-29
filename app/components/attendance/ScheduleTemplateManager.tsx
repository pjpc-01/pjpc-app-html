'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Calendar,
  Users
} from 'lucide-react'

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

export default function ScheduleTemplateManager() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  // 默认模板数据
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

  useEffect(() => {
    setTemplates(defaultTemplates)
  }, [])

  // 添加模板
  const handleAddTemplate = () => {
    const newTemplate: ScheduleTemplate = {
      id: Date.now().toString(),
      name: '新模板',
      type: 'fulltime',
      work_days: [1, 2, 3, 4, 5],
      start_time: '09:00',
      end_time: '17:00',
      max_hours_per_week: 40,
      color: '#6b7280',
      is_active: true
    }
    setTemplates([...templates, newTemplate])
    setEditingTemplate(newTemplate)
    setIsAdding(false)
  }

  // 编辑模板
  const handleEditTemplate = (template: ScheduleTemplate) => {
    setEditingTemplate(template)
  }

  // 保存模板
  const handleSaveTemplate = () => {
    if (!editingTemplate) return

    setTemplates(templates.map(t => 
      t.id === editingTemplate.id ? editingTemplate : t
    ))
    setEditingTemplate(null)
  }

  // 删除模板
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      setTemplates(templates.filter(t => t.id !== templateId))
    }
  }

  // 计算工作时长
  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10
  }

  // 获取类型显示名称
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

  // 获取工作日显示
  const getWorkDaysDisplay = (workDays: number[]) => {
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    return workDays.map(day => dayNames[day]).join('、')
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">排班模板管理</h2>
          <p className="text-gray-600">管理排班时间模板，调整工作时间设置</p>
        </div>
        <Button onClick={handleAddTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          添加模板
        </Button>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                <Badge variant="outline" className="mr-2">
                  {getTypeName(template.type)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {getWorkDaysDisplay(template.work_days)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {template.start_time} - {template.end_time}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {calculateHours(template.start_time, template.end_time)}小时
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    每周最多 {template.max_hours_per_week} 小时
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {template.is_active ? '启用中' : '已禁用'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑对话框 */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>编辑排班模板</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>模板名称</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label>类型</Label>
                <Select
                  value={editingTemplate.type}
                  onValueChange={(value: any) => setEditingTemplate({
                    ...editingTemplate,
                    type: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fulltime">全职</SelectItem>
                    <SelectItem value="parttime">兼职</SelectItem>
                    <SelectItem value="teaching_only">仅教书</SelectItem>
                    <SelectItem value="admin">管理</SelectItem>
                    <SelectItem value="support">后勤</SelectItem>
                    <SelectItem value="service">服务</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始时间</Label>
                  <Input
                    type="time"
                    value={editingTemplate.start_time}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      start_time: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label>结束时间</Label>
                  <Input
                    type="time"
                    value={editingTemplate.end_time}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      end_time: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label>每周最大工时</Label>
                <Input
                  type="number"
                  value={editingTemplate.max_hours_per_week}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    max_hours_per_week: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingTemplate(null)}
                >
                  <X className="h-4 w-4 mr-1" />
                  取消
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-1" />
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

