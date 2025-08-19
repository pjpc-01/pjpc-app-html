"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Teacher } from '@/lib/pocketbase-teachers'

interface TeacherFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (teacherData: Partial<Teacher>) => Promise<void>
  teacher?: Teacher | null
  title?: string
}

export default function TeacherForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  teacher, 
  title = "添加教师" 
}: TeacherFormProps) {
  const [formData, setFormData] = useState({
    teacher_id: '',
    teacher_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    subjects: [] as string[],
    experience: 0,
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    joinDate: '',
    address: '',
    emergencyContact: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 重置表单
  const resetForm = () => {
    setFormData({
      teacher_id: '',
      teacher_name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      subjects: [],
      experience: 0,
      status: 'active',
      joinDate: '',
      address: '',
      emergencyContact: '',
      notes: ''
    })
    setErrors({})
  }

  // 当对话框打开/关闭时重置表单
  useEffect(() => {
    if (open) {
      if (teacher) {
        setFormData({
          teacher_id: teacher.teacher_id || '',
          teacher_name: teacher.teacher_name || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
          department: teacher.department || '',
          position: teacher.position || '',
          subjects: teacher.subjects || [],
          experience: teacher.experience || 0,
          status: teacher.status || 'active',
          joinDate: teacher.joinDate || '',
          address: teacher.address || '',
          emergencyContact: teacher.emergencyContact || '',
          notes: teacher.notes || ''
        })
      } else {
        resetForm()
      }
    }
  }, [open, teacher])

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.teacher_name?.trim()) {
      newErrors.teacher_name = '教师姓名不能为空'
    }

    if (!formData.email?.trim()) {
      newErrors.email = '邮箱不能为空'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = '电话不能为空'
    }

    if (!formData.department?.trim()) {
      newErrors.department = '部门不能为空'
    }

    if (!formData.position?.trim()) {
      newErrors.position = '职位不能为空'
    }

    if (formData.experience < 0) {
      newErrors.experience = '教龄不能为负数'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // 清理和验证数据
      const cleanData = {
        ...formData,
        teacher_id: formData.teacher_id || '',
        teacher_name: formData.teacher_name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        department: formData.department || '',
        position: formData.position || '',
        subjects: formData.subjects || [],
        experience: formData.experience || 0,
        status: formData.status || 'active',
        joinDate: formData.joinDate || '',
        address: formData.address || '',
        emergencyContact: formData.emergencyContact || '',
        notes: formData.notes || ''
      }

      console.log('TeacherForm 提交的数据:', cleanData)
      await onSubmit(cleanData)
      onOpenChange(false)
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher_name">教师姓名 *</Label>
              <Input
                id="teacher_name"
                value={formData.teacher_name}
                onChange={(e) => handleInputChange('teacher_name', e.target.value)}
                placeholder="请输入教师姓名"
                className={errors.teacher_name ? 'border-red-500' : ''}
              />
              {errors.teacher_name && (
                <p className="text-sm text-red-500">{errors.teacher_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher_id">教师工号</Label>
              <Input
                id="teacher_id"
                value={formData.teacher_id}
                onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                placeholder="请输入教师工号"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱 *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="请输入邮箱"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">电话 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="请输入电话"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">部门 *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="请输入部门"
                className={errors.department ? 'border-red-500' : ''}
              />
              {errors.department && (
                <p className="text-sm text-red-500">{errors.department}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">职位 *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="请输入职位"
                className={errors.position ? 'border-red-500' : ''}
              />
              {errors.position && (
                <p className="text-sm text-red-500">{errors.position}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">教龄（年）</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                placeholder="请输入教龄"
                className={errors.experience ? 'border-red-500' : ''}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">{errors.experience}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                  <SelectItem value="on_leave">请假</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joinDate">入职日期</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleInputChange('joinDate', e.target.value)}
              />
            </div>
          </div>

          {/* 地址和紧急联系人 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="请输入地址"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">紧急联系人</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="请输入紧急联系人"
              />
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="请输入备注信息"
              rows={3}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : (teacher ? '更新' : '添加')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
