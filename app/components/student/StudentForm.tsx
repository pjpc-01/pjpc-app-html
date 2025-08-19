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
import { validateEmail, convertGradeToChinese } from "./utils"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSubmit: (studentData: Partial<Student>) => Promise<void>
  existingStudents?: Student[]
}

export default function StudentForm({
  open,
  onOpenChange,
  student,
  onSubmit,
  existingStudents = []
}: StudentFormProps) {
  const [formData, setFormData] = useState<Partial<Student>>({
    student_name: '',
    student_id: '',
    standard: '',
    parentName: '',
    email: '',
    status: 'active',
    Center: 'WX 01',
    gender: 'male',
    serviceType: 'afterschool',
    dob: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [showQuickYears, setShowQuickYears] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const isEditing = !!student

  useEffect(() => {
    if (student) {
      console.log('编辑学生数据:', student)
      console.log('学生serviceType:', student.serviceType)
      console.log('学生学号:', student.student_id)
      
      setFormData({
        student_name: student.student_name || '',
        student_id: student.student_id || '',
        standard: student.standard || '',
        parentName: student.parentName || '',
        email: student.email || '',
        status: student.status || 'active',
        Center: student.Center || 'WX 01',
        gender: student.gender || 'male',
        serviceType: student.serviceType || 'afterschool',
        dob: student.dob || ''
      })
    } else {
      setFormData({
        student_name: '',
        student_id: '',
        standard: '',
        parentName: '',
        email: '',
        status: 'active',
        Center: 'WX 01',
        gender: 'male',
        serviceType: 'afterschool',
        dob: ''
      })
    }
    setErrors({})
    setSubmitError('')
  }, [student, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.student_name?.trim()) {
      newErrors.student_name = '姓名是必填项'
    }

    if (!formData.student_id?.trim()) {
      newErrors.student_id = '学号是必填项'
    }

    if (!formData.Center?.trim()) {
      newErrors.Center = '中心是必填项'
    }

    if (!formData.serviceType?.trim()) {
      newErrors.serviceType = '服务类型是必填项'
    }

    if (!formData.gender?.trim()) {
      newErrors.gender = '性别是必填项'
    }

    if (!formData.dob?.trim()) {
      newErrors.dob = '出生日期是必填项'
    }

    if (!formData.standard?.trim()) {
      newErrors.standard = '请选择出生日期以自动计算年级'
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      // 清理和验证数据
      const cleanData = {
        ...formData,
        // 确保字符串字段不为undefined
        student_name: formData.student_name || '',
        student_id: formData.student_id || '',
        standard: formData.standard || '',
        Center: formData.Center || 'WX 01',
        serviceType: formData.serviceType || 'afterschool',
        gender: formData.gender || 'male',
        dob: formData.dob || '',
        parentName: formData.parentName || '',
        email: formData.email || '',
        status: formData.status || 'active'
      }
      
      console.log('StudentForm 提交的数据:', cleanData)
      await onSubmit(cleanData)
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error submitting form:', error)
      setSubmitError(error.message || '提交失败，请重试')
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

  // 自动生成学号
  const generateStudentId = () => {
    const { gender, serviceType, Center } = formData
    
    let prefix = ''
    if (serviceType === 'tuition') {
      prefix = 'T'
    } else if (gender === 'male') {
      prefix = 'B'
    } else if (gender === 'female') {
      prefix = 'G'
    } else {
      return ''
    }

    console.log(`生成学号 - 中心: ${Center}, 性别: ${gender}, 服务类型: ${serviceType}, 前缀: ${prefix}`)

    // 获取该中心已存在的学号
    const existingIds = existingStudents
      .filter(s => s.Center === Center && s.student_id?.startsWith(prefix))
      .map(s => {
        const num = parseInt(s.student_id?.substring(1) || '0')
        return num
      })
      .sort((a, b) => a - b)

    console.log(`该中心(${Center})已存在的${prefix}开头学号:`, existingIds)

    // 找到下一个可用的编号
    let nextNumber = 1
    for (const num of existingIds) {
      if (num === nextNumber) {
        nextNumber++
      } else {
        break
      }
    }

    const newStudentId = `${prefix}${nextNumber}`
    console.log(`生成的新学号: ${newStudentId}`)
    return newStudentId
  }

  // 当性别、服务类型或中心改变时，自动生成学号（仅在添加模式下）
  useEffect(() => {
    if (!isEditing && formData.gender && formData.serviceType && formData.Center) {
      console.log('触发学号重新生成')
      const newStudentId = generateStudentId()
      setFormData(prev => ({ ...prev, student_id: newStudentId }))
    }
  }, [formData.gender, formData.serviceType, formData.Center, isEditing, existingStudents])

  // 根据出生日期计算年级（马来西亚完整教育体系）
  const calculateGradeFromDob = (dob: string) => {
    if (!dob) return ''
    
    const birthYear = new Date(dob).getFullYear()
    const currentYear = new Date().getFullYear()
    
    // 马来西亚学年：1月开始，12月结束
    // 年级计算：当前年份 - 出生年份
    let grade = currentYear - birthYear
    
    console.log(`年级计算: ${currentYear} - ${birthYear} = ${grade}`)
    
    // 根据马来西亚教育体系标准计算年级
    // 7岁 = Standard 1, 8岁 = Standard 2, 以此类推
    if (grade >= 7 && grade <= 12) {
      // 小学：7-12岁对应Standard 1-6
      return (grade - 6).toString()
    } else if (grade >= 13 && grade <= 17) {
      // 中学：13-17岁对应Form 1-5
      return (grade - 6).toString()
    } else if (grade >= 18 && grade <= 19) {
      // 预科：18-19岁对应Form 6
      return '12'
    }
    
    return ''
  }

  // 当出生日期改变时，自动计算年级
  useEffect(() => {
    if (formData.dob) {
      const grade = calculateGradeFromDob(formData.dob)
      console.log(`出生日期: ${formData.dob}, 计算年级: ${grade}`)
      setFormData(prev => ({ ...prev, standard: grade }))
    }
  }, [formData.dob])



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
              <Label htmlFor="student_name">姓名 *</Label>
              <Input
                id="student_name"
                value={formData.student_name}
                onChange={(e) => handleInputChange('student_name', e.target.value)}
                placeholder="学生姓名"
                className={errors.student_name ? 'border-red-500' : ''}
              />
              {errors.student_name && <p className="text-red-500 text-sm mt-1">{errors.student_name}</p>}
            </div>

            <div>
              <Label htmlFor="student_id">学号 *</Label>
              <Input
                id="student_id"
                value={formData.student_id}
                onChange={(e) => handleInputChange('student_id', e.target.value)}
                placeholder="学号"
                className={errors.student_id ? 'border-red-500' : ''}
                readOnly={isEditing}
              />
              {!isEditing && <p className="text-xs text-gray-500 mt-1">学号将根据性别、服务类型和中心自动生成</p>}
              {isEditing && <p className="text-xs text-gray-500 mt-1">编辑模式下学号不可修改</p>}
              {errors.student_id && <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>}
            </div>

            <div>
              <Label htmlFor="Center">中心 *</Label>
              <Select value={formData.Center} onValueChange={(value) => handleInputChange('Center', value)}>
                <SelectTrigger className={errors.Center ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择中心" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WX 01">WX 01</SelectItem>
                  <SelectItem value="WX 02">WX 02</SelectItem>
                  <SelectItem value="WX 03">WX 03</SelectItem>
                  <SelectItem value="WX 04">WX 04</SelectItem>
                </SelectContent>
              </Select>
              {errors.Center && <p className="text-red-500 text-sm mt-1">{errors.Center}</p>}
            </div>

            <div>
              <Label htmlFor="serviceType">服务类型 *</Label>
              <Select value={formData.serviceType} onValueChange={(value) => handleInputChange('serviceType', value)}>
                <SelectTrigger className={errors.serviceType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择服务类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="afterschool">安亲</SelectItem>
                  <SelectItem value="tuition">补习</SelectItem>
                </SelectContent>
              </Select>
              {errors.serviceType && <p className="text-red-500 text-sm mt-1">{errors.serviceType}</p>}
            </div>

            <div>
              <Label htmlFor="gender">性别 *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择性别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            <div>
              <Label htmlFor="dob">出生日期 *</Label>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.dob && "text-muted-foreground"
                )}
                onClick={() => setIsCalendarOpen(true)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dob ? format(new Date(formData.dob), "PPP") : <span>选择出生日期</span>}
              </Button>
              
              {/* 日历对话框 */}
              <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>选择学生出生日期</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* 快速年份选择 */}
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 p-1 w-full justify-between"
                        onClick={() => setShowQuickYears(!showQuickYears)}
                      >
                        <span>快速选择年份</span>
                        <span>{showQuickYears ? '▼' : '▶'}</span>
                      </Button>
                      
                      {showQuickYears && (
                        <div className="space-y-3 border-t pt-3">
                          {/* 小学年份 */}
                          <div className="space-y-2">
                            <p className="text-xs text-blue-600 font-medium">小学 (7-12岁):</p>
                            <div className="grid grid-cols-6 gap-1">
                              {[2018, 2017, 2016, 2015, 2014, 2013].map((year) => (
                                <Button
                                  key={year}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 bg-blue-50 hover:bg-blue-100 px-1"
                                  onClick={() => {
                                    const dateString = `${year}-01-01`
                                    handleInputChange('dob', dateString)
                                    setIsCalendarOpen(false)
                                  }}
                                >
                                  {year}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          {/* 中学年份 */}
                          <div className="space-y-2">
                            <p className="text-xs text-green-600 font-medium">中学 (13-17岁):</p>
                            <div className="grid grid-cols-5 gap-1">
                              {[2012, 2011, 2010, 2009, 2008].map((year) => (
                                <Button
                                  key={year}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 bg-green-50 hover:bg-green-100 px-1"
                                  onClick={() => {
                                    const dateString = `${year}-01-01`
                                    handleInputChange('dob', dateString)
                                    setIsCalendarOpen(false)
                                  }}
                                >
                                  {year}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          {/* 预科年份 */}
                          <div className="space-y-2">
                            <p className="text-xs text-purple-600 font-medium">预科 (18-19岁):</p>
                            <div className="grid grid-cols-1 gap-1">
                              {[2007].map((year) => (
                                <Button
                                  key={year}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 bg-purple-50 hover:bg-purple-100 px-1"
                                  onClick={() => {
                                    const dateString = `${year}-01-01`
                                    handleInputChange('dob', dateString)
                                    setIsCalendarOpen(false)
                                  }}
                                >
                                  {year}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 日历组件 */}
                    <Calendar
                      mode="single"
                      selected={formData.dob ? new Date(formData.dob) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          // 修复时区问题，确保日期正确
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          const dateString = `${year}-${month}-${day}`
                          handleInputChange('dob', dateString)
                        } else {
                          handleInputChange('dob', '')
                        }
                        // 选择日期后自动关闭日历
                        setIsCalendarOpen(false)
                      }}
                      disabled={(date) => {
                        const today = new Date()
                        // 限制出生日期范围：1990年到今天
                        const minDate = new Date("1990-01-01")
                        const maxDate = new Date()
                        return date > maxDate || date < minDate
                      }}
                      className="rounded-md border"
                      captionLayout="dropdown"
                      fromYear={1990}
                      toYear={new Date().getFullYear()}
                    />
                    
                    {/* 底部操作 */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <p className="text-sm text-gray-600">
                        {formData.dob ? `已选择: ${format(new Date(formData.dob), "yyyy年MM月dd日")}` : '请选择日期'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleInputChange('dob', '')
                          setIsCalendarOpen(false)
                        }}
                      >
                        清除
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {formData.dob && (
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-green-600">
                    ✓ 出生日期: {format(new Date(formData.dob), "yyyy年MM月dd日")}
                  </p>
                  {formData.standard && (
                    <p className="text-xs text-blue-600">
                      📚 对应年级: {convertGradeToChinese(formData.standard)}
                    </p>
                  )}
                </div>
              )}
              {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
            </div>

            <div>
              <Label htmlFor="standard">年级 *</Label>
              <Input
                id="standard"
                value={formData.standard ? convertGradeToChinese(formData.standard) : ''}
                placeholder="请先选择出生日期"
                readOnly
                className={errors.standard ? 'border-red-500' : ''}
              />
              {formData.dob && formData.standard && (
                <p className="text-xs text-green-600 mt-1">✓ 年级已根据出生日期自动计算</p>
              )}
              {formData.dob && !formData.standard && (
                <p className="text-xs text-orange-600 mt-1">⚠ 该出生年份超出教育体系范围（1-12年级）</p>
              )}
              {errors.standard && <p className="text-red-500 text-sm mt-1">{errors.standard}</p>}
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
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="邮箱地址"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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

          {submitError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {submitError}
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