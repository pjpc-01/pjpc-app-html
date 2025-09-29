"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Edit,
  Eye,
  Trash2,
  FileSpreadsheet,
  UserPlus,
  Users,
  CheckCircle,
  GraduationCap,
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import StudentForm from "../student/StudentForm"
import StudentDetails from "../student/StudentDetails"
import { convertGradeToChinese } from "../student/utils"

interface StudentsTabProps {
  setActiveTab: (tab: string) => void
}



export default function StudentsTab({ 
  setActiveTab 
}: StudentsTabProps) {
  const { students, loading: studentsLoading, refetch: refetchStudents, addStudent, updateStudent, deleteStudent } = useStudents()
  const { userProfile } = useAuth()
  
  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCenter, setSelectedCenter] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [viewingStudent, setViewingStudent] = useState<any>(null)



  // 筛选学生
  const filteredStudents = useMemo(() => {
    let filtered = students

         if (searchTerm) {
       filtered = filtered.filter(student => 
         student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.center?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.nric?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.parentPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.emergencyContact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.emergencyPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.father_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.mother_phone?.toLowerCase().includes(searchTerm.toLowerCase())
       )
     }

    if (selectedCenter !== 'all') {
      filtered = filtered.filter(student => student.center === selectedCenter)
    }

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.standard === selectedGrade)
    }

    return filtered
  }, [students, searchTerm, selectedCenter, selectedGrade])

  // 获取中心选项
  const centerOptions = useMemo(() => {
    const centers = Array.from(new Set(students.map(s => s.Center).filter(Boolean))).sort() as string[]
    return centers
  }, [students])

  // 获取年级选项
  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.standard).filter(Boolean))).sort() as string[]
    return grades
  }, [students])

  // 分页逻辑
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, currentPage, pageSize])

  const totalPages = Math.ceil(filteredStudents.length / pageSize)

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 当筛选条件改变时，重置到第一页
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  // 处理添加学生
  const handleAddStudent = async (studentData: any) => {
    try {
      console.log('StudentsTab 接收到的数据:', studentData)
      await addStudent(studentData)
      setIsAddDialogOpen(false)
      refetchStudents()
    } catch (error) {
      console.error("Error adding student:", error)
    }
  }

  // 处理更新学生
  const handleUpdateStudent = async (studentData: any) => {
    if (!editingStudent) return
    try {
      console.log('准备更新学生:', {
        studentId: editingStudent.id,
        studentData: studentData,
        editingStudent: editingStudent
      })
      await updateStudent(editingStudent.id, studentData)
      setEditingStudent(null)
      refetchStudents()
    } catch (error) {
      console.error("Error updating student:", error)
    }
  }

  // 处理删除学生
  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId)
      refetchStudents()
    } catch (error) {
      console.error("Error deleting student:", error)
    }
  }

  // 计算统计数据
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active').length
    const primaryStudents = students.filter(s => {
      const grade = s.standard || ''
      return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
             grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
             grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
    }).length
    const secondaryStudents = students.filter(s => {
      const grade = s.standard || ''
      return grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
             grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
             grade === '7' || grade === '8' || grade === '9' || grade === '10' || grade === '11' || grade === '12'
    }).length
    
    return {
      total: students.length,
      active: activeStudents,
      primary: primaryStudents,
      secondary: secondaryStudents
    }
  }, [students])

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">在读学生</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">小学生</p>
                <p className="text-2xl font-bold text-gray-900">{stats.primary}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">中学生</p>
                <p className="text-2xl font-bold text-gray-900">{stats.secondary}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>学生列表</CardTitle>
              <CardDescription>查看和管理所有学生基本资料及打卡状态</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                批量导入
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                添加学生
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                 <Input
                   placeholder="搜索学生姓名、学号、NRIC、学校、年级、中心、服务类型或联系方式..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
              </div>
            </div>
            <Select value={selectedCenter} onValueChange={(value) => {
              setSelectedCenter(value)
              handleFilterChange()
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择中心" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有中心</SelectItem>
                {centerOptions.map((center: string) => (
                  <SelectItem key={center} value={center}>{center}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGrade} onValueChange={(value) => {
              setSelectedGrade(value)
              handleFilterChange()
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有年级</SelectItem>
                {gradeOptions.map((grade: string) => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetchStudents()}>
              刷新
            </Button>
          </div>

          {/* 学生表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生信息</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead>学校</TableHead>
                  <TableHead>中心</TableHead>
                  <TableHead>服务类型</TableHead>
                  <TableHead>家长联系方式</TableHead>
                  <TableHead>学费状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student: any) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {student.student_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-medium">{student.student_name}</div>
                          <div className="text-sm text-gray-500">学号: {student.student_id}</div>
                        </div>
                        {student.status && (
                          <Badge 
                            variant={student.status === 'active' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              student.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {student.status === 'active' ? '在读' : '离校'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                        {convertGradeToChinese(student.standard || '')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{student.school || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-800 border-purple-200">
                        {student.center || '未知'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200">
                        {student.serviceType === 'afterschool' ? '安亲' : student.serviceType === 'tuition' ? '补习' : `未知(${student.serviceType})`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {student.parentPhone && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{student.parentPhone}</span>
                          </div>
                        )}
                        {student.emergencyPhone && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs">紧急: {student.emergencyPhone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        student.tuitionStatus === 'paid' ? 'default' : 
                        student.tuitionStatus === 'partial' ? 'secondary' : 
                        student.tuitionStatus === 'overdue' ? 'destructive' : 'outline'
                      }>
                        {student.tuitionStatus === 'pending' ? '待付款' : 
                         student.tuitionStatus === 'paid' ? '已付款' : 
                         student.tuitionStatus === 'partial' ? '部分付款' : 
                         student.tuitionStatus === 'overdue' ? '逾期' : '-'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log('点击编辑学生:', student)
                            console.log('学生serviceType:', student.serviceType)
                            console.log('学生完整数据:', JSON.stringify(student, null, 2))
                            setEditingStudent(student)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页组件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)} 条，
                共 {filteredStudents.length} 条记录
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Student Dialog */}
      <StudentForm
        open={isAddDialogOpen || !!editingStudent}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingStudent(null)
          }
        }}
        student={editingStudent}
        onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
        existingStudents={students}
      />

      {/* Student Details Dialog */}
      {viewingStudent && (
        <StudentDetails
          open={!!viewingStudent}
          student={viewingStudent}
          onOpenChange={(open: boolean) => {
            if (!open) setViewingStudent(null)
          }}
          onEdit={() => {
            setViewingStudent(null)
            setEditingStudent(viewingStudent)
          }}
          onDelete={() => {
            if (viewingStudent) {
              handleDeleteStudent(viewingStudent.id)
              setViewingStudent(null)
            }
          }}
        />
      )}
    </div>
  )
}
