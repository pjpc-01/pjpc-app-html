"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { User, Upload, Edit, UserPlus, CalendarIcon, AlertTriangle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Student } from '@/types/student'

// 工具函数
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const convertGradeToChinese = (grade: string): string => {
  const gradeMap: Record<string, string> = {
    '1': 'Standard 1',
    '2': 'Standard 2', 
    '3': 'Standard 3',
    '4': 'Standard 4',
    '5': 'Standard 5',
    '6': 'Standard 6',
    '7': 'Form 1',
    '8': 'Form 2',
    '9': 'Form 3',
    '10': 'Form 4',
    '11': 'Form 5',
    '12': 'Form 6'
  }
  return gradeMap[grade] || grade
}

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
    center: 'WX 01',
    gender: 'male',
    serviceType: 'afterschool',
    dob: '',
    // 新增字段
    nric: '',
    school: '',
    parentPhone: '',
    emergencyContact: '',
    emergencyPhone: '',
    healthInfo: '',
    pickupMethod: 'parent',
    // 接送安排 - 方式A：固定字段（最多3个授权接送人）
    authorizedPickup1Name: '',
    authorizedPickup1Phone: '',
    authorizedPickup1Relation: '',
    authorizedPickup2Name: '',
    authorizedPickup2Phone: '',
    authorizedPickup2Relation: '',
    authorizedPickup3Name: '',
    authorizedPickup3Phone: '',
    authorizedPickup3Relation: '',
    registrationDate: new Date().toISOString().split('T')[0],
    tuitionStatus: 'pending',
            birthCertificate: null,
        avatar: null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isRegistrationCalendarOpen, setIsRegistrationCalendarOpen] = useState(false)
  const [showQuickYears, setShowQuickYears] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const [birthCertificateFile, setBirthCertificateFile] = useState<File | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

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
        center: student.center || 'WX 01',
        gender: student.gender || 'male',
        serviceType: student.serviceType || 'afterschool',
        dob: student.dob || '',
        // 新增字段
        nric: student.nric || '',
        school: student.school || '',
        parentPhone: student.parentPhone || '',
        emergencyContact: student.emergencyContact || '',
        emergencyPhone: student.emergencyPhone || '',
        healthInfo: student.healthInfo || '',
        pickupMethod: student.pickupMethod || 'parent',
        // 接送安排 - 方式A：固定字段（最多3个授权接送人）
        authorizedPickup1Name: student.authorizedPickup1Name || '',
        authorizedPickup1Phone: student.authorizedPickup1Phone || '',
        authorizedPickup1Relation: student.authorizedPickup1Relation || '',
        authorizedPickup2Name: student.authorizedPickup2Name || '',
        authorizedPickup2Phone: student.authorizedPickup2Phone || '',
        authorizedPickup2Relation: student.authorizedPickup2Relation || '',
        authorizedPickup3Name: student.authorizedPickup3Name || '',
        authorizedPickup3Phone: student.authorizedPickup3Phone || '',
        authorizedPickup3Relation: student.authorizedPickup3Relation || '',
        registrationDate: student.registrationDate || new Date().toISOString().split('T')[0],
        tuitionStatus: student.tuitionStatus || 'pending',
        birthCertificate: student.birthCertificate || null,
        avatar: student.avatar || null
      })
    } else {
      setFormData({
        student_name: '',
        student_id: '',
        standard: '',
        parentName: '',
        email: '',
        status: 'active',
        center: 'WX 01',
        gender: 'male',
        serviceType: 'afterschool',
        dob: '',
        // 新增字段
        nric: '',
        school: '',
        parentPhone: '',
        emergencyContact: '',
        emergencyPhone: '',
        healthInfo: '',
        pickupMethod: 'parent',
        registrationDate: new Date().toISOString().split('T')[0],
        tuitionStatus: 'pending',
        birthCertificate: null
      })
    }
    setErrors({})
    setSubmitError('')
    setBirthCertificateFile(null)
    
    // 重置学号生成标志
    hasGeneratedStudentId.current = false
  }, [student, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.student_name?.trim()) {
      newErrors.student_name = '姓名是必填项'
    }

    if (!formData.student_id?.trim()) {
      newErrors.student_id = '学号是必填项'
    }

    if (!formData.center?.trim()) {
      newErrors.center = '中心是必填项'
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

    if (!formData.nric?.trim()) {
      newErrors.nric = 'NRIC/护照是必填项'
    }

    if (!formData.school?.trim()) {
      newErrors.school = '学校是必填项'
    }

    if (!formData.parentName?.trim()) {
      newErrors.parentName = '父母姓名是必填项'
    }

    if (!formData.parentPhone?.trim()) {
      newErrors.parentPhone = '父母电话是必填项'
    }

    if (!formData.emergencyContact?.trim()) {
      newErrors.emergencyContact = '紧急联络人是必填项'
    }

    if (!formData.emergencyPhone?.trim()) {
      newErrors.emergencyPhone = '紧急联络电话是必填项'
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
        center: formData.center || 'WX 01',
        serviceType: formData.serviceType || 'afterschool',
        gender: formData.gender || 'male',
        dob: formData.dob || '',
        parentName: formData.parentName || '',
        email: formData.email || '',
        status: formData.status || 'active',
        // 新增字段
        nric: formData.nric || '',
        school: formData.school || '',
        parentPhone: formData.parentPhone || '',
        emergencyContact: formData.emergencyContact || '',
        emergencyPhone: formData.emergencyPhone || '',
        healthInfo: formData.healthInfo || '',
        pickupMethod: formData.pickupMethod || 'parent',
        registrationDate: formData.registrationDate || new Date().toISOString().split('T')[0],
        tuitionStatus: formData.tuitionStatus || 'pending',
        avatar: formData.avatar || null
      }
      
      console.log('StudentForm 提交的数据:', cleanData)
      await onSubmit(cleanData)
      onOpenChange(false)
    } catch (error: unknown) {
      console.error('Error submitting form:', error)
      setSubmitError(error instanceof Error ? error.message : '提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value || '' }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBirthCertificateFile(file)
      setFormData(prev => ({ ...prev, birthCertificate: file.name }))
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      
      // 验证文件大小 (最大 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('图片文件大小不能超过 2MB')
        return
      }

      setAvatarFile(file)
      
      // 创建预览URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      setFormData(prev => ({ ...prev, avatar: file.name }))
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setFormData(prev => ({ ...prev, avatar: null }))
  }

  // 自动生成学号 - 使用 useCallback 优化性能
  const generateStudentId = useCallback(() => {
    const { gender, serviceType, center } = formData
    
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

    console.log(`生成学号 - 中心: ${center}, 性别: ${gender}, 服务类型: ${serviceType}, 前缀: ${prefix}`)

    // 获取该中心已存在的学号
    const existingIds = existingStudents
      .filter(s => s.center === center && s.student_id?.startsWith(prefix))
      .map(s => {
        const num = parseInt(s.student_id?.substring(1) || '0')
        return num
      })
      .sort((a, b) => a - b)

    console.log(`该中心(${center})已存在的${prefix}开头学号:`, existingIds)

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
  }, [formData.gender, formData.serviceType, formData.center, existingStudents])

  // 使用 useRef 来跟踪是否已经生成过学号，避免重复生成
  const hasGeneratedStudentId = useRef(false)
  const generateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 当性别、服务类型或中心改变时，自动生成学号（仅在添加模式下）
  useEffect(() => {
    if (!isEditing && formData.gender && formData.serviceType && formData.center) {
      // 如果已经生成过学号，则跳过
      if (hasGeneratedStudentId.current) {
        console.log('学号已经生成过，跳过自动生成')
        return
      }
      
      // 清除之前的定时器
      if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current)
      }
      
      // 使用防抖机制，延迟500ms后生成学号
      generateTimeoutRef.current = setTimeout(() => {
        // 避免重复生成相同的学号
        const currentStudentId = formData.student_id
        
        // 如果已经有学号且不是空字符串，则跳过生成
        if (currentStudentId && currentStudentId.trim() !== '') {
          console.log('学号已存在，跳过生成:', currentStudentId)
          hasGeneratedStudentId.current = true
          return
        }
        
        const newStudentId = generateStudentId()
        
        // 只有当新生成的学号与当前学号不同时才更新
        if (newStudentId !== currentStudentId) {
          console.log('触发学号重新生成:', { 旧学号: currentStudentId, 新学号: newStudentId })
          setFormData(prev => ({ ...prev, student_id: newStudentId }))
          hasGeneratedStudentId.current = true
        } else {
          console.log('学号无需更新，保持:', currentStudentId)
        }
      }, 500)
    }
    
    // 清理函数
    return () => {
      if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current)
      }
    }
  }, [formData.gender, formData.serviceType, formData.center, isEditing, generateStudentId])

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
      let grade = calculateGradeFromDob(formData.dob)
      console.log(`出生日期: ${formData.dob}, 计算年级: ${grade}`)
      setFormData(prev => ({ ...prev, standard: grade }))
    }
  }, [formData.dob])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {isEditing ? '编辑学生' : '添加学生'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? '修改学生信息' : '录入新学生信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">基本信息</h3>
            
            {/* 头像上传 */}
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex-shrink-0">
                <div className="relative">
                  {avatarPreview || student?.avatar ? (
                    <img 
                      src={avatarPreview || (student?.avatar || '')} 
                      alt="学生头像预览"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-lg">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="avatar" className="text-sm font-medium text-gray-700 mb-2 block">
                  学生头像
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatar')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {avatarPreview || student?.avatar ? '更换头像' : '上传头像'}
                  </Button>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    支持 JPG、PNG 格式，最大 2MB
                  </p>
                </div>
                {avatarPreview && (
                  <p className="text-xs text-green-600 mt-1">✓ 头像已选择</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_name">学生姓名 *</Label>
                <Input
                  id="student_name"
                  value={formData.student_name || ''}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="学生姓名"
                  className={errors.student_name ? 'border-red-500' : ''}
                />
                {errors.student_name && <p className="text-red-500 text-sm mt-1">{errors.student_name}</p>}
              </div>

                             <div>
                 <Label htmlFor="student_id">学号 *</Label>
                 <div className="flex gap-2">
                   <Input
                     id="student_id"
                     value={formData.student_id || ''}
                     onChange={(e) => handleInputChange('student_id', e.target.value)}
                     placeholder="学号"
                     className={errors.student_id ? 'border-red-500' : ''}
                     readOnly={isEditing}
                   />
                   {!isEditing && (
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                                               onClick={() => {
                          if (formData.gender && formData.serviceType && formData.center) {
                            const newStudentId = generateStudentId()
                            setFormData(prev => ({ ...prev, student_id: newStudentId }))
                            hasGeneratedStudentId.current = true
                            console.log('手动生成学号:', newStudentId)
                          } else {
                            alert('请先选择性别、服务类型和中心')
                          }
                        }}
                       className="whitespace-nowrap"
                     >
                       生成学号
                     </Button>
                   )}
                 </div>
                 {!isEditing && <p className="text-xs text-gray-500 mt-1">学号将根据性别、服务类型和中心自动生成，或点击"生成学号"按钮手动生成</p>}
                 {isEditing && <p className="text-xs text-gray-500 mt-1">编辑模式下学号不可修改</p>}
                 {errors.student_id && <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>}
               </div>

              <div>
                <Label htmlFor="nric">NRIC/护照 *</Label>
                <Input
                  id="nric"
                  value={formData.nric || ''}
                  onChange={(e) => handleInputChange('nric', e.target.value)}
                  placeholder="NRIC号码或护照号码"
                  className={errors.nric ? 'border-red-500' : ''}
                />
                {errors.nric && <p className="text-red-500 text-sm mt-1">{errors.nric}</p>}
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
                {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
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
                {errors.standard && <p className="text-red-500 text-sm mt-1">{errors.standard}</p>}
              </div>
            </div>
          </div>

          {/* 学校信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">学校信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">学校 *</Label>
                <Input
                  id="school"
                  value={formData.school || ''}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  placeholder="就读学校名称"
                  className={errors.school ? 'border-red-500' : ''}
                />
                {errors.school && <p className="text-red-500 text-sm mt-1">{errors.school}</p>}
              </div>

              <div>
                <Label htmlFor="center">中心 *</Label>
                <Select value={formData.center} onValueChange={(value) => handleInputChange('center', value)}>
                  <SelectTrigger className={errors.center ? 'border-red-500' : ''}>
                    <SelectValue placeholder="选择中心" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WX 01">WX 01</SelectItem>
                    <SelectItem value="WX 02">WX 02</SelectItem>
                    <SelectItem value="WX 03">WX 03</SelectItem>
                    <SelectItem value="WX 04">WX 04</SelectItem>
                  </SelectContent>
                </Select>
                {errors.center && <p className="text-red-500 text-sm mt-1">{errors.center}</p>}
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
            </div>
          </div>

          {/* 父母信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">父母信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">父母姓名 *</Label>
                <Input
                  id="parentName"
                  value={formData.parentName || ''}
                  onChange={(e) => handleInputChange('parentName', e.target.value)}
                  placeholder="父母姓名"
                  className={errors.parentName ? 'border-red-500' : ''}
                />
                {errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>}
              </div>

              <div>
                <Label htmlFor="parentPhone">父母电话 *</Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone || ''}
                  onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                  placeholder="父母联系电话"
                  className={errors.parentPhone ? 'border-red-500' : ''}
                />
                {errors.parentPhone && <p className="text-red-500 text-sm mt-1">{errors.parentPhone}</p>}
              </div>

              <div>
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="邮箱地址"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* 紧急联络人 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">紧急联络人</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">紧急联络人 *</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ''}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="紧急联络人姓名"
                  className={errors.emergencyContact ? 'border-red-500' : ''}
                />
                {errors.emergencyContact && <p className="text-red-500 text-sm mt-1">{errors.emergencyContact}</p>}
              </div>

              <div>
                <Label htmlFor="emergencyPhone">紧急联络电话 *</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone || ''}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  placeholder="紧急联络电话"
                  className={errors.emergencyPhone ? 'border-red-500' : ''}
                />
                {errors.emergencyPhone && <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone}</p>}
              </div>
            </div>
          </div>

          {/* 健康信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">健康信息</h3>
            <div>
              <Label htmlFor="healthInfo">健康/过敏记录</Label>
              <Textarea
                id="healthInfo"
                value={formData.healthInfo || ''}
                onChange={(e) => handleInputChange('healthInfo', e.target.value)}
                placeholder="请详细描述学生的健康状况、过敏史、特殊需求等"
                rows={3}
              />
            </div>
          </div>

          {/* 接送信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">接送信息</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pickupMethod">接送方式</Label>
                <Select value={formData.pickupMethod} onValueChange={(value) => handleInputChange('pickupMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择接送方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">父母接送</SelectItem>
                    <SelectItem value="guardian">监护人接送</SelectItem>
                    <SelectItem value="authorized">授权人接送</SelectItem>
                    <SelectItem value="public">公共交通</SelectItem>
                    <SelectItem value="walking">步行</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 授权接送人信息 - 最多3个 */}
              <div className="space-y-4">
                <Label className="text-base font-medium">授权接送人信息</Label>
                <p className="text-sm text-gray-600">最多可添加3个授权接送人</p>
                
                {/* 授权接送人1 */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">授权接送人 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="authorizedPickup1Name">姓名</Label>
                                             <Input
                         id="authorizedPickup1Name"
                         value={formData.authorizedPickup1Name || ''}
                         onChange={(e) => handleInputChange('authorizedPickup1Name', e.target.value)}
                         placeholder="接送人姓名"
                       />
                     </div>
                     <div>
                       <Label htmlFor="authorizedPickup1Phone">电话</Label>
                       <Input
                         id="authorizedPickup1Phone"
                         value={formData.authorizedPickup1Phone || ''}
                         onChange={(e) => handleInputChange('authorizedPickup1Phone', e.target.value)}
                         placeholder="联系电话"
                       />
                     </div>
                     <div>
                       <Label htmlFor="authorizedPickup1Relation">关系</Label>
                       <Input
                         id="authorizedPickup1Relation"
                         value={formData.authorizedPickup1Relation || ''}
                         onChange={(e) => handleInputChange('authorizedPickup1Relation', e.target.value)}
                         placeholder="与学生关系"
                       />
                     </div>
                   </div>
                 </div>

                 {/* 授权接送人2 */}
                 <div className="border rounded-lg p-4 space-y-3">
                   <h4 className="font-medium text-gray-900">授权接送人 2</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <div>
                       <Label htmlFor="authorizedPickup2Name">姓名</Label>
                       <Input
                         id="authorizedPickup2Name"
                         value={formData.authorizedPickup2Name || ''}
                         onChange={(e) => handleInputChange('authorizedPickup2Name', e.target.value)}
                         placeholder="接送人姓名"
                       />
                     </div>
                     <div>
                       <Label htmlFor="authorizedPickup2Phone">电话</Label>
                       <Input
                         id="authorizedPickup2Phone"
                         value={formData.authorizedPickup2Phone || ''}
                         onChange={(e) => handleInputChange('authorizedPickup2Phone', e.target.value)}
                         placeholder="联系电话"
                       />
                     </div>
                     <div>
                       <Label htmlFor="authorizedPickup2Relation">关系</Label>
                       <Input
                         id="authorizedPickup2Relation"
                         value={formData.authorizedPickup2Relation || ''}
                         onChange={(e) => handleInputChange('authorizedPickup2Relation', e.target.value)}
                         placeholder="与学生关系"
                       />
                     </div>
                   </div>
                 </div>

                 {/* 授权接送人3 */}
                 <div className="border rounded-lg p-4 space-y-3">
                   <h4 className="font-medium text-gray-900">授权接送人 3</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <div>
                       <Label htmlFor="authorizedPickup3Name">姓名</Label>
                       <Input
                         id="authorizedPickup3Name"
                         value={formData.authorizedPickup3Name || ''}
                         onChange={(e) => handleInputChange('authorizedPickup3Name', e.target.value)}
                         placeholder="接送人姓名"
                       />
                     </div>
                     <div>
                       <Label htmlFor="authorizedPickup3Phone">电话</Label>
                       <Input
                         id="authorizedPickup3Phone"
                         value={formData.authorizedPickup3Phone || ''}
                         onChange={(e) => handleInputChange('authorizedPickup3Phone', e.target.value)}
                         placeholder="联系电话"
                       />
                     </div>
                     <div>
                       <Label htmlFor="authorizedPickup3Relation">关系</Label>
                       <Input
                         id="authorizedPickup3Relation"
                         value={formData.authorizedPickup3Relation || ''}
                         onChange={(e) => handleInputChange('authorizedPickup3Relation', e.target.value)}
                         placeholder="与学生关系"
                       />
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* 注册和学费信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">注册和学费信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationDate">注册日期</Label>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.registrationDate && "text-muted-foreground"
                  )}
                  onClick={() => setIsRegistrationCalendarOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.registrationDate ? format(new Date(formData.registrationDate), "PPP") : <span>选择注册日期</span>}
                </Button>
              </div>

              <div>
                <Label htmlFor="tuitionStatus">学费状态</Label>
                <Select value={formData.tuitionStatus} onValueChange={(value) => handleInputChange('tuitionStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学费状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待付款</SelectItem>
                    <SelectItem value="paid">已付款</SelectItem>
                    <SelectItem value="partial">部分付款</SelectItem>
                    <SelectItem value="overdue">逾期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 报生纸副本 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">报生纸副本</h3>
            <div>
              <Label htmlFor="birthCertificate">上传报生纸副本</Label>
              <div className="mt-2">
                <Input
                  id="birthCertificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">支持 PDF、JPG、JPEG、PNG 格式，最大 5MB</p>
                {birthCertificateFile && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">{birthCertificateFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 日历对话框 - 出生日期 */}
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
                      const year = date.getFullYear()
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const day = String(date.getDate()).padStart(2, '0')
                      const dateString = `${year}-${month}-${day}`
                      handleInputChange('dob', dateString)
                    } else {
                      handleInputChange('dob', '')
                    }
                    setIsCalendarOpen(false)
                  }}
                  disabled={(date) => {
                    const today = new Date()
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

          {/* 日历对话框 - 注册日期 */}
          <Dialog open={isRegistrationCalendarOpen} onOpenChange={setIsRegistrationCalendarOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>选择注册日期</DialogTitle>
              </DialogHeader>
              
              <Calendar
                mode="single"
                selected={formData.registrationDate ? new Date(formData.registrationDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateString = `${year}-${month}-${day}`
                    handleInputChange('registrationDate', dateString)
                  } else {
                    handleInputChange('registrationDate', '')
                  }
                  setIsRegistrationCalendarOpen(false)
                }}
                disabled={(date) => {
                  const today = new Date()
                  return date > today
                }}
                className="rounded-md border"
                captionLayout="dropdown"
                fromYear={2020}
                toYear={new Date().getFullYear()}
              />
            </DialogContent>
          </Dialog>

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