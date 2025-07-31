"use client"

import { useState } from "react"
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
import { UserPlus, Search, Edit, Calendar, TrendingUp, Users, Trash2 } from "lucide-react"
import React from "react" // Added for useEffect

export default function StudentManagement() {
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "王小明",
      grade: "三年级",
      class: "A班",
      fatherName: "王爸爸",
      motherName: "王妈妈",
      phone: "138****1234",
      attendance: 95,
      progress: 85,
      status: "active",
      age: 9,
      dateOfBirth: "2015-03-15",
      studentId: "STU001",
      address: "北京市朝阳区阳光小区1号楼",
      emergencyContact: "王妈妈",
      emergencyPhone: "139****5678",
      medicalInfo: "无特殊病史",
      enrollmentDate: "2023-09-01",
      notes: "学习认真，性格开朗",
      image: "",
    },
    {
      id: 2,
      name: "李小红",
      grade: "四年级",
      class: "B班",
      fatherName: "李爸爸",
      motherName: "李妈妈",
      phone: "139****5678",
      attendance: 98,
      progress: 92,
      status: "active",
      age: 10,
      dateOfBirth: "2014-07-22",
      studentId: "STU002",
      address: "北京市海淀区智慧园2号楼",
      emergencyContact: "李爸爸",
      emergencyPhone: "138****1234",
      medicalInfo: "对花生过敏",
      enrollmentDate: "2022-09-01",
      notes: "成绩优秀，擅长数学",
      image: "",
    },
    {
      id: 3,
      name: "张小华",
      grade: "三年级",
      class: "A班",
      fatherName: "张爸爸",
      motherName: "张妈妈",
      phone: "137****9012",
      attendance: 88,
      progress: 78,
      status: "active",
      age: 9,
      dateOfBirth: "2015-11-08",
      studentId: "STU003",
      address: "北京市西城区文化街3号楼",
      emergencyContact: "张爸爸",
      emergencyPhone: "136****3456",
      medicalInfo: "无特殊病史",
      enrollmentDate: "2023-09-01",
      notes: "需要加强英语学习",
      image: "",
    },
  ])

  const [attendanceRecords] = useState([
    { date: "2024-01-15", present: 85, absent: 4, late: 0 },
    { date: "2024-01-14", present: 87, absent: 2, late: 0 },
    { date: "2024-01-13", present: 89, absent: 0, late: 0 },
    { date: "2024-01-12", present: 86, absent: 2, late: 1 },
    { date: "2024-01-11", present: 88, absent: 1, late: 0 },
  ])

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
  ])
  
  // Grade management dialog states
  const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false)
  const [isEditGradeDialogOpen, setIsEditGradeDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<any>(null)
  const [newGrade, setNewGrade] = useState({
    name: "",
    description: "",
  })
  const [isGradeEditMode, setIsGradeEditMode] = useState(false)
  
  // Add student form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [isDetailEditMode, setIsDetailEditMode] = useState(false)
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

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Calculate age from birthdate
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Handle adding new student
  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.grade || !newStudent.class || (!newStudent.fatherName && !newStudent.motherName) || !newStudent.phone) {
      alert("请填写所有必填字段")
      return
    }

    const calculatedAge = calculateAge(newStudent.dateOfBirth)

    const newStudentData = {
      id: students.length + 1,
      name: newStudent.name,
      grade: newStudent.grade,
      class: newStudent.class,
      fatherName: newStudent.fatherName,
      motherName: newStudent.motherName,
      phone: newStudent.phone,
      attendance: 100, // Default attendance for new student
      progress: 0, // Default progress for new student
      status: "active",
      age: calculatedAge,
      dateOfBirth: newStudent.dateOfBirth || "",
      studentId: newStudent.studentId || `STU${String(students.length + 1).padStart(3, '0')}`,
      address: newStudent.address || "",
      emergencyContact: newStudent.emergencyContact || "",
      emergencyPhone: newStudent.emergencyPhone || "",
      medicalInfo: newStudent.medicalInfo || "无特殊病史",
      enrollmentDate: newStudent.enrollmentDate || new Date().toISOString().split('T')[0],
      notes: newStudent.notes || "",
      image: newStudent.image || "",
    }

    setStudents(prev => [...prev, newStudentData])
    
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
  const handleDeleteStudent = (studentId: number) => {
    if (confirm("确定要删除这个学生吗？此操作无法撤销。")) {
      setStudents(prev => prev.filter(student => student.id !== studentId))
    }
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
  const handleUpdateStudentDetails = () => {
    setStudents(prev => prev.map(student => 
      student.id === selectedStudent.id ? selectedStudent : student
    ))
    setIsDetailEditMode(false)
    setSelectedStudent(null)
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
    return students.filter(student => student.grade === grade)
  }

  // Grade management functions
  const handleAddGrade = () => {
    if (!newGrade.name || !newGrade.description) {
      alert("请填写年级名称和描述")
      return
    }

    const newGradeData = {
      id: grades.length + 1,
      name: newGrade.name,
      description: newGrade.description,
      studentCount: 0,
      avgAttendance: 0,
      avgProgress: 0,
    }

    setGrades(prev => [...prev, newGradeData])
    
    // Reset form
    setNewGrade({
      name: "",
      description: "",
    })
    
    // Close dialog
    setIsAddGradeDialogOpen(false)
  }

  const handleEditGrade = (grade: any) => {
    setEditingGrade(grade)
    setIsEditGradeDialogOpen(true)
  }

  const handleUpdateGrade = () => {
    if (!editingGrade.name || !editingGrade.description) {
      alert("请填写年级名称和描述")
      return
    }

    setGrades(prev => prev.map(grade => 
      grade.id === editingGrade.id ? editingGrade : grade
    ))
    
    setIsEditGradeDialogOpen(false)
    setEditingGrade(null)
  }

  const handleDeleteGrade = (gradeId: number) => {
    // Check if there are students in this grade
    const gradeToDelete = grades.find(g => g.id === gradeId)
    if (!gradeToDelete) {
      alert("年级不存在")
      return
    }
    
    const studentsInGrade = students.filter(student => student.grade === gradeToDelete.name)
    
    if (studentsInGrade.length > 0) {
      alert(`无法删除年级，该年级还有 ${studentsInGrade.length} 名学生。请先转移或删除这些学生。`)
      return
    }

    if (confirm("确定要删除这个年级吗？此操作无法撤销。")) {
      setGrades(prev => prev.filter(grade => grade.id !== gradeId))
    }
  }

  const handleGradeInputChange = (field: string, value: string) => {
    setNewGrade(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditGradeInputChange = (field: string, value: string) => {
    setEditingGrade((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGradeEditMode = () => {
    setIsGradeEditMode(!isGradeEditMode)
  }

  // Update grade statistics when students change
  const updateGradeStats = () => {
    setGrades(prev => prev.map(grade => {
      const gradeStudents = students.filter(student => student.grade === grade.name)
      const avgAttendance = gradeStudents.length > 0 
        ? Math.round(gradeStudents.reduce((sum, student) => sum + student.attendance, 0) / gradeStudents.length)
        : 0
      const avgProgress = gradeStudents.length > 0
        ? Math.round(gradeStudents.reduce((sum, student) => sum + student.progress, 0) / gradeStudents.length)
        : 0
      
      return {
        ...grade,
        studentCount: gradeStudents.length,
        avgAttendance,
        avgProgress,
      }
    }))
  }

  // Update grade stats when students change
  React.useEffect(() => {
    updateGradeStats()
  }, [students])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">学生管理系统</h2>
          <p className="text-gray-600">管理学生档案、班级分组、出勤记录和学习进度</p>
        </div>
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
                       placeholder="自动生成或手动输入"
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
                            value={selectedStudent.studentId}
                            onChange={(e) => handleDetailInputChange("studentId", e.target.value)}
                          />
                        ) : (
                          <div className="col-span-3 py-2 px-3 bg-gray-50 rounded-md">
                            {selectedStudent.studentId}
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
                            {selectedStudent.dateOfBirth}
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
          <TabsTrigger value="attendance">出勤记录</TabsTrigger>
          <TabsTrigger value="progress">学习进度</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
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
                      placeholder="搜索学生姓名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
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
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>学生列表 ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>家长</TableHead>
                    <TableHead>联系电话</TableHead>
                    <TableHead>出勤率</TableHead>
                    <TableHead>学习进度</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                                     {filteredStudents.map((student) => (
                     <TableRow key={student.id}>
                       <TableCell className="font-medium">
                         <button
                           className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                           onClick={() => handleViewStudentDetails(student)}
                         >
                           {student.name}
                         </button>
                       </TableCell>
                      <TableCell>{student.grade}</TableCell>
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
                             variant="ghost" 
                             size="sm"
                             onClick={() => handleEditStudent(student)}
                           >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteStudent(student.id)}
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
                  <p className="text-gray-600">管理学校年级信息</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGradeEditMode}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isGradeEditMode ? "退出编辑" : "编辑"}
                  </Button>
                  <Dialog open={isAddGradeDialogOpen} onOpenChange={setIsAddGradeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        添加年级
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加新年级</DialogTitle>
                        <DialogDescription>创建新的年级信息</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="gradeName" className="text-right">年级名称</Label>
                          <Input
                            id="gradeName"
                            className="col-span-3"
                            value={newGrade.name}
                            onChange={(e) => handleGradeInputChange("name", e.target.value)}
                            placeholder="例如：一年级"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="gradeDescription" className="text-right">年级描述</Label>
                          <Input
                            id="gradeDescription"
                            className="col-span-3"
                            value={newGrade.description}
                            onChange={(e) => handleGradeInputChange("description", e.target.value)}
                            placeholder="例如：小学一年级"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddGradeDialogOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={handleAddGrade}>
                          添加年级
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Edit Grade Dialog */}
              <Dialog open={isEditGradeDialogOpen} onOpenChange={setIsEditGradeDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>编辑年级</DialogTitle>
                    <DialogDescription>修改年级信息</DialogDescription>
                  </DialogHeader>
                  {editingGrade && (
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editGradeName" className="text-right">年级名称</Label>
                        <Input
                          id="editGradeName"
                          className="col-span-3"
                          value={editingGrade.name}
                          onChange={(e) => handleEditGradeInputChange("name", e.target.value)}
                          placeholder="例如：一年级"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="editGradeDescription" className="text-right">年级描述</Label>
                        <Input
                          id="editGradeDescription"
                          className="col-span-3"
                          value={editingGrade.description}
                          onChange={(e) => handleEditGradeInputChange("description", e.target.value)}
                          placeholder="例如：小学一年级"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditGradeDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleUpdateGrade}>
                      保存更改
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Grade Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {grades.map((grade) => {
                  const gradeStudents = getStudentsByGrade(grade.name)
                  
                  return (
                    <Card 
                      key={grade.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => !isGradeEditMode && handleGradeClick(grade.name)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {grade.name}
                          </CardTitle>
                          {isGradeEditMode && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditGrade(grade)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteGrade(grade.id)
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <CardDescription>{grade.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>学生人数</span>
                            <Badge>{grade.studentCount}人</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>平均出勤率</span>
                            <Badge variant="outline">{grade.avgAttendance}%</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>平均进度</span>
                            <Badge variant="outline">{grade.avgProgress}%</Badge>
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

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                出勤统计
              </CardTitle>
              <CardDescription>最近5天的出勤情况</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>出勤人数</TableHead>
                    <TableHead>缺勤人数</TableHead>
                    <TableHead>迟到人数</TableHead>
                    <TableHead>出勤率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record, index) => {
                    const total = record.present + record.absent + record.late
                    const rate = Math.round((record.present / total) * 100)
                    return (
                      <TableRow key={index}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          <Badge variant="default">{record.present}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{record.absent}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.late}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={rate} className="w-16" />
                            <span className="text-sm">{rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  学习进度概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>数学</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>语文</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>英语</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>科学</span>
                      <span>88%</span>
                    </div>
                    <Progress value={88} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学习表现分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>优秀学生</span>
                    <Badge variant="default">23人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>良好学生</span>
                    <Badge variant="secondary">45人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>需要帮助</span>
                    <Badge variant="outline">12人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>进步显著</span>
                    <Badge variant="default">18人</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
