"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { UserPlus, Search, Edit, Users, Trash2 } from "lucide-react"
import React from "react" // Added for useEffect
import { useStudents, Student } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/enhanced-auth-context"

export default function StudentManagement() {
  const [dataType, setDataType] = useState<'primary' | 'secondary'>('primary')
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents({ dataType })
  


  // 年级转换函数：将英文年级转换为华文年级
  const convertGradeToChinese = (grade: string): string => {
    if (!grade) return '未知年级'
    
    const gradeStr = grade.toString().toLowerCase().trim()
    
    // 英文年级映射
    const englishGradeMap: Record<string, string> = {
      // Standard格式（Google Sheets中的标准格式）
      'standard 1': '一年级',
      'standard1': '一年级',
      'std 1': '一年级',
      'std1': '一年级',
      's1': '一年级',
      '1': '一年级',
      
      'standard 2': '二年级',
      'standard2': '二年级',
      'std 2': '二年级',
      'std2': '二年级',
      's2': '二年级',
      '2': '二年级',
      
      'standard 3': '三年级',
      'standard3': '三年级',
      'std 3': '三年级',
      'std3': '三年级',
      's3': '三年级',
      '3': '三年级',
      
      'standard 4': '四年级',
      'standard4': '四年级',
      'std 4': '四年级',
      'std4': '四年级',
      's4': '四年级',
      '4': '四年级',
      
      'standard 5': '五年级',
      'standard5': '五年级',
      'std 5': '五年级',
      'std5': '五年级',
      's5': '五年级',
      '5': '五年级',
      
      'standard 6': '六年级',
      'standard6': '六年级',
      'std 6': '六年级',
      'std6': '六年级',
      's6': '六年级',
      '6': '六年级',
      
      // Grade格式
      'grade 1': '一年级',
      'grade1': '一年级',
      '1st grade': '一年级',
      '1st': '一年级',
      'first grade': '一年级',
      'first': '一年级',
      
      'grade 2': '二年级',
      'grade2': '二年级',
      '2nd grade': '二年级',
      '2nd': '二年级',
      'second grade': '二年级',
      'second': '二年级',
      
      'grade 3': '三年级',
      'grade3': '三年级',
      '3rd grade': '三年级',
      '3rd': '三年级',
      'third grade': '三年级',
      'third': '三年级',
      
      'grade 4': '四年级',
      'grade4': '四年级',
      '4th grade': '四年级',
      '4th': '四年级',
      'fourth grade': '四年级',
      'fourth': '四年级',
      
      'grade 5': '五年级',
      'grade5': '五年级',
      '5th grade': '五年级',
      '5th': '五年级',
      'fifth grade': '五年级',
      'fifth': '五年级',
      
      'grade 6': '六年级',
      'grade6': '六年级',
      '6th grade': '六年级',
      '6th': '六年级',
      'sixth grade': '六年级',
      'sixth': '六年级',
      
      // 中学年级
      'form 1': '初一',
      'form1': '初一',
      'form 2': '初二',
      'form2': '初二',
      'form 3': '初三',
      'form3': '初三',
      
      'year 1': '初一',
      'year1': '初一',
      'year 2': '初二',
      'year2': '初二',
      'year 3': '初三',
      'year3': '初三',
      
      'secondary 1': '初一',
      'secondary1': '初一',
      'secondary 2': '初二',
      'secondary2': '初二',
      'secondary 3': '初三',
      'secondary3': '初三',
      
      // 华文年级（保持不变）
      '一年级': '一年级',
      '二年级': '二年级',
      '三年级': '三年级',
      '四年级': '四年级',
      '五年级': '五年级',
      '六年级': '六年级',
      '初一': '初一',
      '初二': '初二',
      '初三': '初三',
    }
    
    // 尝试精确匹配
    if (englishGradeMap[gradeStr]) {
      return englishGradeMap[gradeStr]
    }
    
    // 尝试部分匹配
    for (const [english, chinese] of Object.entries(englishGradeMap)) {
      if (gradeStr.includes(english) || english.includes(gradeStr)) {
        return chinese
      }
    }
    
    // 尝试数字匹配（如果输入只是数字）
    const numericMatch = gradeStr.match(/^(\d+)$/)
    if (numericMatch) {
      const num = parseInt(numericMatch[1])
      if (num >= 1 && num <= 6) {
        const chineseGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
        return chineseGrades[num - 1]
      }
    }
    
    // 如果无法匹配，返回原值
    console.log(`无法映射年级: "${grade}"，使用原值`)
    return grade
  }

  // Transform Firebase students to match the component's expected format
  const transformedStudents = students.map((student, index) => {
    // Use the actual Firebase data without any modifications
    return {
      id: student.id,
      name: student.name || "",
      grade: convertGradeToChinese(student.grade || ""), // 转换年级为华文
      class: student.class || "A班",
      fatherName: student.parentName || student.fatherName || "",
      motherName: student.parentEmail || student.motherName || "",
      phone: student.phone || "",
      attendance: student.attendance || 95,
      progress: student.progress || 85,
      status: student.status || "active",
      age: student.age || 9,
      dateOfBirth: student.dateOfBirth || "",
      studentId: student.id, // Use the actual Firebase ID
      address: student.address || "",
      emergencyContact: student.emergencyContact || student.parentName || "",
      emergencyPhone: student.emergencyPhone || student.phone || "",
      medicalInfo: student.medicalInfo || "无特殊病史",
      enrollmentDate: student.enrollmentDate || "",
      enrollmentYear: student.enrollmentYear,
      calculatedGrade: student.calculatedGrade ? convertGradeToChinese(student.calculatedGrade) : null,
      notes: student.notes || "",
      image: student.image || "",
    }
  })



  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("all")
  const [selectedGradeForView, setSelectedGradeForView] = useState<string | null>(null)
  
  // Grade management state
  const [grades, setGrades] = useState([
    { id: 1, name: "一年级", description: "小学一年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
    { id: 2, name: "二年级", description: "小学二年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
    { id: 3, name: "三年级", description: "小学三年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
    { id: 4, name: "四年级", description: "小学四年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
    { id: 5, name: "五年级", description: "小学五年级", studentCount: 0, avgProgress: 0 },
    { id: 6, name: "六年级", description: "小学六年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
    { id: 7, name: "初一", description: "中学一年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
    { id: 8, name: "初二", description: "中学二年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
    { id: 9, name: "初三", description: "中学三年级", studentCount: 0, avgAttendance: 0, avgProgress: 0 },
  ])
  

  
  // Add student form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [isDetailEditMode, setIsDetailEditMode] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isBulkActionMode, setIsBulkActionMode] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: "",
    grade: "",
    class: "",
    fatherName: "",
    motherName: "",
    phone: "",
    dateOfBirth: "",
    studentId: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalInfo: "",
    enrollmentDate: "",
    notes: "",
    image: "",
  })

  const filteredStudents = transformedStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = selectedGrade === "all" || student.grade === selectedGrade
    return matchesSearch && matchesGrade
  })

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setNewStudent(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Shared month mapping for date parsing
  const monthMap: Record<string, number> = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'june': 5,
    'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  }

  // Helper function to format birth date from various formats
  const formatBirthDate = (dateString: string): string => {
    if (!dateString || dateString.trim() === '') return '未设置'
    
    try {
      // Handle common date formats from Google Sheets
      const cleanDate = dateString.trim()
      
      // Try to parse as ISO date first
      const isoDate = new Date(cleanDate)
      if (!isNaN(isoDate.getTime())) {
        return isoDate.toLocaleDateString('zh-CN')
      }
      
      // Handle formats like "22 Sept 2014", "13 Aug 2016"
      // Match patterns like "22 Sept 2014"
      const match = cleanDate.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i)
      if (match) {
        const day = parseInt(match[1])
        const monthName = match[2].toLowerCase()
        const year = parseInt(match[3])
        
        if (monthMap[monthName] !== undefined && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
          const date = new Date(year, monthMap[monthName], day)
          return date.toLocaleDateString('zh-CN')
        }
      }
      
      // If all parsing fails, return the original string
      return cleanDate
    } catch (error) {
      console.error('Error formatting birth date:', error, 'Original string:', dateString)
      return dateString
    }
  }

  // Calculate age from birthdate
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0
    
    try {
      const today = new Date()
      const birth = new Date(birthDate)
      
      if (isNaN(birth.getTime())) {
        // Try to parse using the same logic as formatBirthDate
        const cleanDate = birthDate.trim()
        
        const match = cleanDate.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/i)
        if (match) {
          const day = parseInt(match[1])
          const monthName = match[2].toLowerCase()
          const year = parseInt(match[3])
          
          if (monthMap[monthName] !== undefined && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
            const parsedBirth = new Date(year, monthMap[monthName], day)
            let age = today.getFullYear() - parsedBirth.getFullYear()
            const monthDiff = today.getMonth() - parsedBirth.getMonth()
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirth.getDate())) {
              age--
            }
            
            return age
          }
        }
        return 0
      }
      
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    } catch (error) {
      console.error('Error calculating age:', error)
      return 0
    }
  }

  // Note: We no longer auto-generate IDs, we use Firebase's actual data

  // Handle adding new student
  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.grade || !newStudent.fatherName || !newStudent.phone) {
      alert("请填写所有必填字段")
      return
    }

    try {
      // Create new student in Firebase format - let Firebase generate the ID
      const newStudentData = {
        name: newStudent.name,
        grade: newStudent.grade,
        parentName: newStudent.fatherName,
        parentEmail: newStudent.motherName || "", // Using motherName field for email
        phone: newStudent.phone,
        address: newStudent.address || "",
        enrollmentDate: newStudent.enrollmentDate || new Date().toISOString().split('T')[0],
        status: "active",
      }
      
            // Add student to Firebase
      await addStudent(newStudentData)
      
      // Reset form
      setNewStudent({
        name: "",
        grade: "",
        class: "",
        fatherName: "",
        motherName: "",
        phone: "",
        dateOfBirth: "",
        studentId: "",
        address: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalInfo: "",
        enrollmentDate: "",
        notes: "",
        image: "",
      })
      
      // Close dialog
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding student:', error)
      alert('添加学生失败，请重试')
    }
  }

  // Reset form when dialog opens/closes
  const handleDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setNewStudent({
        name: "",
        grade: "",
        class: "",
        fatherName: "",
        motherName: "",
        phone: "",
        dateOfBirth: "",
        studentId: "",
        address: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalInfo: "",
        enrollmentDate: "",
        notes: "",
        image: "",
      })
    }
  }

  // Handle edit student from operations tab
  const handleEditStudent = (student: any) => {
    setSelectedStudent(student)
    setIsDetailDialogOpen(true)
    setIsDetailEditMode(true) // Open directly in edit mode
  }



  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    if (confirm("确定要删除这个学生吗？此操作无法撤销。")) {
      try {
        await deleteStudent(studentId)
        // The students list will be automatically refreshed by the hook
      } catch (error) {
        console.error('Error deleting student:', error)
        alert('删除学生失败，请重试')
      }
    }
  }

  // Handle bulk selection
  const handleBulkSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId])
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    }
  }

  // Handle select all students
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(student => String(student.studentId)))
    } else {
      setSelectedStudents([])
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      alert("请先选择要删除的学生")
      return
    }
    
    if (confirm(`确定要删除选中的 ${selectedStudents.length} 个学生吗？此操作无法撤销。`)) {
      try {
        // Delete each selected student
        for (const studentId of selectedStudents) {
          await deleteStudent(studentId)
        }
        setSelectedStudents([])
        setIsBulkActionMode(false)
        // The students list will be automatically refreshed by the hook
      } catch (error) {
        console.error('Error deleting students:', error)
        alert('批量删除学生失败，请重试')
      }
    }
  }

  // Handle bulk export
  const handleBulkExport = () => {
    if (selectedStudents.length === 0) {
      alert("请先选择要导出的学生")
      return
    }
    
    const selectedStudentData = students.filter(student => selectedStudents.includes(String(student.id)))
    const csvContent = generateCSV(selectedStudentData)
    downloadCSV(csvContent, "学生数据导出.csv")
  }

  // Generate CSV content
  const generateCSV = (studentData: any[]) => {
    const headers = ["学生编号", "姓名", "年级", "班级", "父亲姓名", "母亲姓名", "联系电话", "生日", "地址", "出勤率", "学习进度", "状态"]
    const rows = studentData.map(student => [
      student.studentId,
      student.name,
      student.grade,
      student.class,
      student.fatherName,
      student.motherName,
      student.phone,
      student.dateOfBirth,
      student.address,
      student.attendance,
      student.progress,
      student.status
    ])
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
  }

  // Download CSV file
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }



  // Handle detail view
  const handleViewStudentDetails = (student: any) => {
    setSelectedStudent(student)
    setIsDetailDialogOpen(true)
    setIsDetailEditMode(false) // Reset to read-only mode
  }

  // Handle detail form input changes
  const handleDetailInputChange = (field: string, value: string) => {
    setSelectedStudent((prev: any) => {
      const updatedStudent = {
        ...prev,
        [field]: value
      }
      
      // Auto-calculate age when birthdate changes
      if (field === "dateOfBirth") {
        updatedStudent.age = calculateAge(value)
      }
      
      return updatedStudent
    })
  }

  // Handle update student details
  const handleUpdateStudentDetails = async () => {
    try {
      // Convert the selectedStudent back to Firebase format
      const updates = {
        name: selectedStudent.name,
        grade: selectedStudent.grade,
        parentName: selectedStudent.fatherName,
        phone: selectedStudent.phone,
        address: selectedStudent.address,
        enrollmentDate: selectedStudent.enrollmentDate,
        status: selectedStudent.status,
      }
      
      await updateStudent(selectedStudent.studentId, updates)
      setIsDetailEditMode(false)
      setSelectedStudent(null)
      // The students list will be automatically refreshed by the hook
    } catch (error) {
      console.error('Error updating student:', error)
      alert('更新学生信息失败，请重试')
    }
  }

  // Handle cancel edit mode
  const handleCancelEdit = () => {
    setIsDetailEditMode(false)
    // Reset selectedStudent to original data
    if (selectedStudent) {
      const originalStudent = students.find(student => student.id === selectedStudent.id)
      if (originalStudent) {
        setSelectedStudent(originalStudent)
      } else {
        // If original student not found, close the dialog
        setIsDetailDialogOpen(false)
        setSelectedStudent(null)
      }
    }
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert("请选择有效的图片文件 (JPEG, PNG, GIF)")
        return
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert("图片文件大小不能超过 5MB")
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        if (imageData) {
          if (isDetailEditMode && selectedStudent) {
            handleDetailInputChange("image", imageData)
          } else if (isAddDialogOpen) {
            handleInputChange("image", imageData)
          }
        }
      }
      reader.onerror = () => {
        console.error("Failed to read image file")
        alert("图片上传失败，请重试")
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle grade click to view students in that grade
  const handleGradeClick = (grade: string) => {
    setSelectedGradeForView(grade)
  }

  // Get students filtered by selected grade for view
  const getStudentsByGrade = (grade: string) => {
    return transformedStudents.filter(student => student.grade === grade)
  }



  // Update grade statistics when students change
  const updateGradeStats = useCallback(() => {
    try {
      setGrades(prev => prev.map(grade => {
        const gradeStudents = transformedStudents.filter(student => student.grade === grade.name)
        
        return {
          ...grade,
          studentCount: gradeStudents.length,
        }
      }))
    } catch (error) {
      console.error('Error updating grade stats:', error)
    }
  }, [transformedStudents.length])

  // Update grade stats when students change
  React.useEffect(() => {
    if (transformedStudents.length > 0) {
      updateGradeStats()
    }
  }, [transformedStudents.length])

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载学生数据...</p>
            <p className="text-sm text-gray-500 mt-2">如果加载时间过长，请检查网络连接</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">加载学生数据失败: {error}</p>
            <Button onClick={refetch}>重试</Button>
          </div>
        </div>
      </div>
    )
  }

  // Error boundary for the component
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">学生管理系统</h2>
            <p className="text-gray-600">管理学生档案、班级分组、出勤记录和学习进度</p>
            
            {/* Data Type Selector */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="primary-data"
                    checked={dataType === 'primary'}
                    onChange={() => setDataType('primary')}
                  />
                  <Label htmlFor="primary-data" className="text-sm">
                    小学数据 (Primary)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="secondary-data"
                    checked={dataType === 'secondary'}
                    onChange={() => setDataType('secondary')}
                  />
                  <Label htmlFor="secondary-data" className="text-sm">
                    中学数据 (Secondary)
                  </Label>
                </div>
              </div>
              
              {/* 临时调试按钮 */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/check-secondary-data')
                    const data = await response.json()
                    console.log('Secondary data check:', data)
                    alert(`中学数据检查结果:\n\n${JSON.stringify(data.results, null, 2)}`)
                  } catch (error) {
                    console.error('Error checking secondary data:', error)
                    alert('检查中学数据失败')
                  }
                }}
              >
                检查中学数据
              </Button>
              
              {/* 添加中学测试数据按钮 */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/add-secondary-test-data', {
                      method: 'POST'
                    })
                    const data = await response.json()
                    console.log('Add secondary test data result:', data)
                    alert(data.message)
                    // 刷新数据
                    refetch()
                  } catch (error) {
                    console.error('Error adding secondary test data:', error)
                    alert('添加中学测试数据失败')
                  }
                }}
              >
                添加中学测试数据
              </Button>
            </div>
          </div>
        
        {/* Show message if no students */}
        {transformedStudents.length === 0 && !loading && (
          <div className="text-center p-4 border rounded-lg bg-blue-50">
            <p className="text-blue-600 mb-2">暂无学生数据</p>
            <p className="text-sm text-gray-600">请点击"添加学生"按钮开始录入学生信息</p>
          </div>
        )}
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
           <DialogTrigger asChild>
             <Button>
               <UserPlus className="h-4 w-4 mr-2" />
               添加学生
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>添加新学生</DialogTitle>
               <DialogDescription>录入新学生的完整信息</DialogDescription>
             </DialogHeader>
             <div className="grid gap-6 py-4">
               {/* Basic Information */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h3 className="text-lg font-semibold border-b pb-2">基本信息</h3>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addName" className="text-right">姓名</Label>
                     <Input 
                       id="addName" 
                       className="col-span-3"
                       value={newStudent.name}
                       onChange={(e) => handleInputChange("name", e.target.value)}
                       placeholder="请输入学生姓名"
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addStudentId" className="text-right">学号</Label>
                     <Input 
                       id="addStudentId" 
                       className="col-span-3"
                       value={newStudent.studentId}
                       onChange={(e) => handleInputChange("studentId", e.target.value)}
                       placeholder="自动生成 (如: G16) 或手动输入"
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addDateOfBirth" className="text-right">出生日期</Label>
                     <Input 
                       id="addDateOfBirth" 
                       className="col-span-3"
                       type="date"
                       value={newStudent.dateOfBirth}
                       onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addGrade" className="text-right">年级</Label>
                     <Select value={newStudent.grade} onValueChange={(value) => handleInputChange("grade", value)}>
                       <SelectTrigger className="col-span-3">
                         <SelectValue placeholder="选择年级" />
                       </SelectTrigger>
                       <SelectContent>
                         {grades.map((grade) => (
                           <SelectItem key={grade.id} value={grade.name}>
                             {grade.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addClass" className="text-right">班级</Label>
                     <Select value={newStudent.class} onValueChange={(value) => handleInputChange("class", value)}>
                       <SelectTrigger className="col-span-3">
                         <SelectValue placeholder="选择班级" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="A班">A班</SelectItem>
                         <SelectItem value="B班">B班</SelectItem>
                         <SelectItem value="C班">C班</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 {/* Contact Information */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-semibold border-b pb-2">联系信息</h3>
                                       <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="addFatherName" className="text-right">父亲姓名</Label>
                      <Input 
                        id="addFatherName" 
                        className="col-span-3"
                        value={newStudent.fatherName}
                        onChange={(e) => handleInputChange("fatherName", e.target.value)}
                        placeholder="请输入父亲姓名"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="addMotherName" className="text-right">母亲姓名</Label>
                      <Input 
                        id="addMotherName" 
                        className="col-span-3"
                        value={newStudent.motherName}
                        onChange={(e) => handleInputChange("motherName", e.target.value)}
                        placeholder="请输入母亲姓名"
                      />
                    </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addPhone" className="text-right">联系电话</Label>
                     <Input 
                       id="addPhone" 
                       className="col-span-3"
                       value={newStudent.phone}
                       onChange={(e) => handleInputChange("phone", e.target.value)}
                       placeholder="请输入联系电话"
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addEmergencyContact" className="text-right">紧急联系人</Label>
                     <Input 
                       id="addEmergencyContact" 
                       className="col-span-3"
                       value={newStudent.emergencyContact}
                       onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                       placeholder="请输入紧急联系人"
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addEmergencyPhone" className="text-right">紧急电话</Label>
                     <Input 
                       id="addEmergencyPhone" 
                       className="col-span-3"
                       value={newStudent.emergencyPhone}
                       onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                       placeholder="请输入紧急电话"
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addAddress" className="text-right">家庭地址</Label>
                     <Input 
                       id="addAddress" 
                       className="col-span-3"
                       value={newStudent.address}
                       onChange={(e) => handleInputChange("address", e.target.value)}
                       placeholder="请输入家庭地址"
                     />
                   </div>
                 </div>
               </div>

               {/* Academic Information */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h3 className="text-lg font-semibold border-b pb-2">学业信息</h3>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addEnrollmentDate" className="text-right">入学日期</Label>
                     <Input 
                       id="addEnrollmentDate" 
                       className="col-span-3"
                       type="date"
                       value={newStudent.enrollmentDate}
                       onChange={(e) => handleInputChange("enrollmentDate", e.target.value)}
                     />
                   </div>
                 </div>

                 {/* Medical Information */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-semibold border-b pb-2">医疗信息</h3>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="addMedicalInfo" className="text-right">医疗信息</Label>
                     <Input 
                       id="addMedicalInfo" 
                       className="col-span-3"
                       value={newStudent.medicalInfo}
                       onChange={(e) => handleInputChange("medicalInfo", e.target.value)}
                       placeholder="过敏史、特殊病史等"
                     />
                   </div>
                 </div>
               </div>

                               {/* Student Image */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">学生照片</h3>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="addImage" className="text-right pt-2">照片</Label>
                    <div className="col-span-3 space-y-4">
                      {newStudent.image ? (
                        <div className="flex items-center gap-4">
                          <img 
                            src={newStudent.image} 
                            alt="学生照片" 
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleInputChange("image", "")}
                          >
                            删除照片
                          </Button>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">暂无照片</div>
                      )}
                      <div>
                        <input
                          type="file"
                          id="addImage"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('addImage')?.click()}
                        >
                          {newStudent.image ? "更换照片" : "上传照片"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">备注信息</h3>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="addNotes" className="text-right pt-2">备注</Label>
                    <textarea
                      id="addNotes"
                      className="col-span-3 p-3 border rounded-md resize-none"
                      rows={4}
                      value={newStudent.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="学习情况、性格特点、特殊需求等"
                    />
                  </div>
                </div>
             </div>
             <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                 取消
               </Button>
               <Button onClick={handleAddStudent}>
                 添加学生
               </Button>
             </div>
           </DialogContent>
         </Dialog>

         

                   {/* Student Details Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>学生详细信息</DialogTitle>
                <DialogDescription>
                  {isDetailEditMode ? "编辑学生的完整信息" : "查看学生的完整信息"}
                </DialogDescription>
              </DialogHeader>
             {selectedStudent && (
               <div className="grid gap-6 py-4">
                 {/* Basic Information */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold border-b pb-2">基本信息</h3>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailName" className="text-right">姓名</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailName" 
                            className="col-span-3"
                            value={selectedStudent.name}
                            onChange={(e) => handleDetailInputChange("name", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.name}
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailStudentId" className="text-right">学号</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailStudentId" 
                            className="col-span-3"
                            value={selectedStudent.id}
                            onChange={(e) => handleDetailInputChange("id", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.id}
                          </div>
                        )}
                      </div>
                                                                    <div className="grid grid-cols-4 items-center gap-4">
                           <Label htmlFor="detailAge" className="text-right">年龄</Label>
                           <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                             {selectedStudent.age} 岁 
                           </div>
                         </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailDateOfBirth" className="text-right">出生日期</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailDateOfBirth" 
                            className="col-span-3"
                            type="date"
                            value={selectedStudent.dateOfBirth}
                            onChange={(e) => handleDetailInputChange("dateOfBirth", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {formatBirthDate(selectedStudent.dateOfBirth)}
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailGrade" className="text-right">年级</Label>
                        {isDetailEditMode ? (
                          <Select value={selectedStudent.grade} onValueChange={(value) => handleDetailInputChange("grade", value)}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.name}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.grade}
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailClass" className="text-right">班级</Label>
                        {isDetailEditMode ? (
                          <Select value={selectedStudent.class} onValueChange={(value) => handleDetailInputChange("class", value)}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A班">A班</SelectItem>
                              <SelectItem value="B班">B班</SelectItem>
                              <SelectItem value="C班">C班</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.class}
                          </div>
                        )}
                      </div>
                   </div>

                   {/* Student Image */}
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold border-b pb-2">学生照片</h3>
                     <div className="grid grid-cols-4 items-start gap-4">
                       <Label htmlFor="detailImage" className="text-right pt-2">照片</Label>
                       <div className="col-span-3 space-y-4">
                         {selectedStudent.image ? (
                           <div className="flex items-center gap-4">
                             <img 
                               src={selectedStudent.image} 
                               alt="学生照片" 
                               className="w-32 h-32 object-cover rounded-lg border"
                             />
                             {isDetailEditMode && (
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => handleDetailInputChange("image", "")}
                               >
                                 删除照片
                               </Button>
                             )}
                           </div>
                         ) : (
                           <div className="text-gray-500 text-sm">暂无照片</div>
                         )}
                         {isDetailEditMode && (
                           <div>
                             <input
                               type="file"
                               id="detailImage"
                               accept="image/*"
                               onChange={handleImageUpload}
                               className="hidden"
                             />
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => document.getElementById('detailImage')?.click()}
                             >
                               {selectedStudent.image ? "更换照片" : "上传照片"}
                             </Button>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>

                                       {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">联系信息</h3>
                                            <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="detailFatherName" className="text-right">父亲姓名</Label>
                         {isDetailEditMode ? (
                           <Input 
                             id="detailFatherName" 
                             className="col-span-3"
                             value={selectedStudent.fatherName}
                             onChange={(e) => handleDetailInputChange("fatherName", e.target.value)}
                           />
                         ) : (
                           <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                             {selectedStudent.fatherName}
                           </div>
                         )}
                       </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="detailMotherName" className="text-right">母亲姓名</Label>
                         {isDetailEditMode ? (
                           <Input 
                             id="detailMotherName" 
                             className="col-span-3"
                             value={selectedStudent.motherName}
                             onChange={(e) => handleDetailInputChange("motherName", e.target.value)}
                           />
                         ) : (
                           <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                             {selectedStudent.motherName}
                           </div>
                         )}
                       </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailPhone" className="text-right">联系电话</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailPhone" 
                            className="col-span-3"
                            value={selectedStudent.phone}
                            onChange={(e) => handleDetailInputChange("phone", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.phone}
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailEmergencyContact" className="text-right">紧急联系人</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailEmergencyContact" 
                            className="col-span-3"
                            value={selectedStudent.emergencyContact}
                            onChange={(e) => handleDetailInputChange("emergencyContact", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.emergencyContact}
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailEmergencyPhone" className="text-right">紧急电话</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailEmergencyPhone" 
                            className="col-span-3"
                            value={selectedStudent.emergencyPhone}
                            onChange={(e) => handleDetailInputChange("emergencyPhone", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.emergencyPhone}
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailAddress" className="text-right">家庭地址</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailAddress" 
                            className="col-span-3"
                            value={selectedStudent.address}
                            onChange={(e) => handleDetailInputChange("address", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.address}
                          </div>
                        )}
                      </div>
                   </div>
                 </div>

                 {/* Academic Information */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold border-b pb-2">学业信息</h3>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailEnrollmentDate" className="text-right">入学日期</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailEnrollmentDate" 
                            className="col-span-3"
                            type="date"
                            value={selectedStudent.enrollmentDate}
                            onChange={(e) => handleDetailInputChange("enrollmentDate", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.enrollmentDate}
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailAttendance" className="text-right">出勤率</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailAttendance" 
                            className="col-span-3"
                            type="number"
                            min="0"
                            max="100"
                            value={selectedStudent.attendance}
                            onChange={(e) => handleDetailInputChange("attendance", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.attendance}%
                          </div>
                        )}
                      </div>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailProgress" className="text-right">学习进度</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailProgress" 
                            className="col-span-3"
                            type="number"
                            min="0"
                            max="100"
                            value={selectedStudent.progress}
                            onChange={(e) => handleDetailInputChange("progress", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.progress}%
                          </div>
                        )}
                      </div>
                   </div>

                   {/* Medical Information */}
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold border-b pb-2">医疗信息</h3>
                                           <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detailMedicalInfo" className="text-right">医疗信息</Label>
                        {isDetailEditMode ? (
                          <Input 
                            id="detailMedicalInfo" 
                            className="col-span-3"
                            value={selectedStudent.medicalInfo}
                            onChange={(e) => handleDetailInputChange("medicalInfo", e.target.value)}
                            placeholder="过敏史、特殊病史等"
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.medicalInfo}
                          </div>
                        )}
                      </div>
                   </div>
                 </div>

                                   {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">备注信息</h3>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="detailNotes" className="text-right pt-2">备注</Label>
                      {isDetailEditMode ? (
                        <textarea
                          id="detailNotes"
                          className="col-span-3 p-3 border rounded-md resize-none"
                          rows={4}
                          value={selectedStudent.notes}
                          onChange={(e) => handleDetailInputChange("notes", e.target.value)}
                          placeholder="学习情况、性格特点、特殊需求等"
                        />
                      ) : (
                        <div className="col-span-3 p-3 bg-gray-50 rounded-md min-h-[100px]">
                          {selectedStudent.notes || "暂无备注"}
                        </div>
                      )}
                    </div>
                  </div>
               </div>
             )}
                           <div className="flex justify-end gap-2">
                {isDetailEditMode ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      取消
                    </Button>
                    <Button onClick={handleUpdateStudentDetails}>
                      保存更改
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                      关闭
                    </Button>
                    <Button onClick={() => setIsDetailEditMode(true)}>
                      编辑信息
                    </Button>
                  </>
                )}
              </div>
           </DialogContent>
         </Dialog>
       </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students">学生档案</TabsTrigger>
          <TabsTrigger value="classes">年级管理</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总学生数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transformedStudents.length}</div>
                <p className="text-xs text-muted-foreground">
                  当前在读学生
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">年级分布</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(transformedStudents.map(s => s.grade)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  覆盖年级数量
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>学生搜索</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索学生姓名或编号..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.name}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedGrade("all")
                  }}
                >
                  重置筛选
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>学生列表 ({filteredStudents.length})</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBulkActionMode(!isBulkActionMode)}
                  >
                    {isBulkActionMode ? "退出" : "批量操作"}
                  </Button>
                  {isBulkActionMode && selectedStudents.length > 0 && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        删除选中 ({selectedStudents.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkExport}
                      >
                        导出选中
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isBulkActionMode && (
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </TableHead>
                    )}
                    <TableHead>学生编号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>家长</TableHead>
                    <TableHead>联系电话</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      {isBulkActionMode && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(String(student.studentId))}
                            onChange={(e) => handleBulkSelect(String(student.studentId), e.target.checked)}
                            className="rounded"
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          onClick={() => handleViewStudentDetails(student)}
                        >
                          {student.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{student.grade}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>父亲: {student.fatherName}</div>
                          <div>母亲: {student.motherName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{student.phone}</TableCell>
                                             <TableCell>
                         <div className="flex gap-2">
                           <Button 
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleEditStudent(student)}
                           >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteStudent(student.studentId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          {selectedGradeForView ? (
            // Show students in selected grade
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedGradeForView}学生列表</h3>
                  <p className="text-gray-600">共 {getStudentsByGrade(selectedGradeForView).length} 名学生</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedGradeForView(null)}
                >
                  返回年级管理
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>学生列表</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>班级</TableHead>
                        <TableHead>家长</TableHead>
                        <TableHead>联系电话</TableHead>
                        <TableHead>出勤率</TableHead>
                        <TableHead>学习进度</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getStudentsByGrade(selectedGradeForView).map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                              onClick={() => handleViewStudentDetails(student)}
                            >
                              {student.name}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.class}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>父亲: {student.fatherName}</div>
                              <div>母亲: {student.motherName}</div>
                            </div>
                          </TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={student.attendance} className="w-16" />
                              <span className="text-sm">{student.attendance}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={student.progress} className="w-16" />
                              <span className="text-sm">{student.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Show grade overview
            <div className="space-y-6">
              {/* Grade Management Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">年级管理</h3>
                  <p className="text-gray-600">查看各年级学生分布</p>
                </div>
              </div>



              {/* Grade Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {grades.map((grade) => {
                  const gradeStudents = getStudentsByGrade(grade.name)
                  
                  return (
                    <Card 
                      key={grade.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleGradeClick(grade.name)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {grade.name}
                        </CardTitle>
                        <CardDescription>{grade.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>学生人数</span>
                            <Badge>{grade.studentCount}人</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>


      </Tabs>
    </div>
  )
}
