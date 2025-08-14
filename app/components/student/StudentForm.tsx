"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Edit, AlertTriangle } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { validateEmail } from "./utils"
import { Badge } from "@/components/ui/badge"

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSubmit: (studentData: Partial<Student>) => Promise<void>
}

export default function StudentForm({
  open,
  onOpenChange,
  student,
  onSubmit
}: StudentFormProps) {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    studentId: '',
    grade: '',
    parentName: '',
    parentEmail: '',
    status: 'active'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!student

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        studentId: student.studentId || '',
        grade: student.grade || '',
        parentName: student.parentName || '',
        parentEmail: student.parentEmail || '',
        status: student.status || 'active'
      })
    } else {
      setFormData({
        name: '',
        studentId: '',
        grade: '',
        parentName: '',
        parentEmail: '',
        status: 'active'
      })
    }
    setErrors({})
  }, [student, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = '姓名是必填项'
    }

    if (!formData.studentId?.trim()) {
      newErrors.studentId = '学号是必填项'
    }

    if (!formData.grade?.trim()) {
      newErrors.grade = '年级是必填项'
    }

    if (formData.parentEmail && !validateEmail(formData.parentEmail)) {
      newErrors.parentEmail = '家长邮箱格式不正确'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      console.log('StudentForm 提交的数据:', formData)
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const gradeOptions = 
    ['1', '2', '3', '4', '5', '6']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {isEditing ? '编辑学生' : '添加学生'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? '修改学生信息' : '录入新学生信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="学生姓名"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="studentId">学号 *</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                placeholder="学号"
                className={errors.studentId ? 'border-red-500' : ''}
              />
              {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>}
            </div>

            <div>
              <Label htmlFor="grade">年级 *</Label>
              <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                <SelectTrigger className={errors.grade ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {`${grade}年级`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade}</p>}
            </div>

            <div>
              <Label htmlFor="status">状态</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在读</SelectItem>
                  <SelectItem value="graduated">已毕业</SelectItem>
                  <SelectItem value="transferred">已转学</SelectItem>
                  <SelectItem value="inactive">非活跃</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parentName">家长姓名</Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => handleInputChange('parentName', e.target.value)}
                placeholder="家长姓名"
              />
            </div>

            <div>
              <Label htmlFor="parentEmail">家长邮箱</Label>
              <Input
                id="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                placeholder="家长邮箱地址"
                className={errors.parentEmail ? 'border-red-500' : ''}
              />
              {errors.parentEmail && <p className="text-red-500 text-sm mt-1">{errors.parentEmail}</p>}
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                请检查并修正表单中的错误信息
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : (isEditing ? '更新' : '添加')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 