"use client"

import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Users,
  GraduationCap,
  Calendar,
  MapPin,
  Phone,
  Mail,
  BarChart3,
  PieChart,
  TrendingUp,
  RefreshCw,
  Settings,
  FileText,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "../student/utils"
import StudentForm from "../student/StudentForm"
import StudentDetails from "../student/StudentDetails"
import AdvancedFilters from "../student/AdvancedFilters"
import StudentAnalytics from "../student/StudentAnalytics"
import BulkOperations from "../student/BulkOperations"

interface FilterState {
  searchTerm: string
  selectedGrade: string
  selectedStatus: string
  selectedCenter: string
  selectedGender: string
  ageRange: [number, number]
  enrollmentYear: string
  hasPhone: boolean
  hasEmail: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  quickFilters: string[]
}

export default function StudentManagementPage() {
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents()
  
  // 状态管理
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedGrade: "all",
    selectedStatus: "all",
    selectedCenter: "",
    selectedGender: "",
    ageRange: [0, 25],
    enrollmentYear: "",
    hasPhone: false,
    hasEmail: false,
    sortBy: "name",
    sortOrder: 'asc',
    dateRange: { from: undefined, to: undefined },
    quickFilters: []
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'analytics'>('table')
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: FilterState }[]>([])

  // 获取筛选选项
  const filterOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort()
    const statuses = Array.from(new Set(students.map(s => s.status).filter(Boolean))).sort()
    const centers = Array.from(new Set(students.map(s => s.parentName).filter(Boolean))).sort()
    
    return { grades, statuses, centers }
  }, [students])

  // 筛选和排序学生数据
  const filteredStudents = useMemo(() => {
    let filtered = students

    // 搜索筛选
    if (filters.searchTerm) {
      const lowerSearchTerm = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(lowerSearchTerm) ||
        student.studentId?.toLowerCase().includes(lowerSearchTerm) ||
        student.grade?.toLowerCase().includes(lowerSearchTerm) ||
        student.parentName?.toLowerCase().includes(lowerSearchTerm) ||
        student.parentEmail?.toLowerCase().includes(lowerSearchTerm) ||
        student.status?.toLowerCase().includes(lowerSearchTerm)
      )
    }

    // 年级筛选
    if (filters.selectedGrade && filters.selectedGrade !== "all") {
      filtered = filtered.filter(student => student.grade === filters.selectedGrade)
    }

    // 状态筛选
    if (filters.selectedStatus && filters.selectedStatus !== "all") {
      filtered = filtered.filter(student => student.status === filters.selectedStatus)
    }

    // 中心筛选
    if (filters.selectedCenter) {
      filtered = filtered.filter(student => student.parentName === filters.selectedCenter)
    }

    // 快速筛选
    filters.quickFilters.forEach(filterId => {
      switch (filterId) {
        case 'primary':
          filtered = filtered.filter(student => {
            const grade = student.grade || ''
            return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
                   grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
                   grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
          })
          break
        case 'secondary':
          filtered = filtered.filter(student => {
            const grade = student.grade || ''
            return grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
                   grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
                   grade === '7' || grade === '8' || grade === '9' || grade === '10' || grade === '11' || grade === '12'
          })
          break
        case 'active':
          filtered = filtered.filter(student => student.status === 'active')
          break
        case 'inactive':
          filtered = filtered.filter(student => student.status !== 'active')
          break
        case 'has-phone':
          filtered = filtered.filter(student => student.parentName && student.parentName.trim() !== '')
          break
        case 'has-email':
          filtered = filtered.filter(student => student.parentEmail && student.parentEmail.trim() !== '')
          break
      }
    })

    // 排序
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'studentId':
          aValue = a.studentId || ''
          bValue = b.studentId || ''
          break
        case 'grade':
          aValue = a.grade || ''
          bValue = b.grade || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'parentName':
          aValue = a.parentName || ''
          bValue = b.parentName || ''
          break
        default:
          aValue = a.name || ''
          bValue = b.name || ''
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [students, filters])

  // 分页
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, currentPage, pageSize])

  const totalPages = Math.ceil(filteredStudents.length / pageSize)

  // 统计数据
  const stats = useMemo(() => {
    const total = students.length
    const active = students.filter(s => s.status === 'active').length
    const inactive = students.filter(s => s.status !== 'active').length
    
    // 年级分布
    const gradeDistribution = students.reduce((acc, student) => {
      const grade = student.grade || '未知年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 小学/中学分布
    const primaryCount = students.filter(student => {
      const grade = student.grade || ''
      return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
             grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
             grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
    }).length

    const secondaryCount = students.filter(student => {
      const grade = student.grade || ''
      return grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
             grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
             grade === '7' || grade === '8' || grade === '9' || grade === '10' || grade === '11' || grade === '12'
    }).length

    return {
      total,
      active,
      inactive,
      primaryCount,
      secondaryCount,
      gradeDistribution
    }
  }, [students])

  // 处理函数
  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
      await addStudent(studentData)
      setIsAddDialogOpen(false)
      refetch()
    } catch (error) {
      console.error("Error adding student:", error)
    }
  }

  const handleUpdateStudent = async (studentData: Partial<Student>) => {
    if (!editingStudent) return
    try {
      await updateStudent(editingStudent.id, studentData)
      setEditingStudent(null)
      refetch()
    } catch (error) {
      console.error("Error updating student:", error)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId)
      refetch()
    } catch (error) {
      console.error("Error deleting student:", error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const studentId of selectedStudents) {
        await deleteStudent(studentId)
      }
      setSelectedStudents([])
      refetch()
    } catch (error) {
      console.error("Error bulk deleting students:", error)
    }
  }

  const handleBulkUpdate = async (updates: Partial<Student>) => {
    try {
      for (const studentId of selectedStudents) {
        await updateStudent(studentId, updates)
      }
      setSelectedStudents([])
      refetch()
    } catch (error) {
      console.error("Error bulk updating students:", error)
    }
  }

  const handleBulkExport = (format: 'csv' | 'excel' | 'pdf') => {
    const selectedStudentData = students.filter(student => selectedStudents.includes(student.id))
    console.log(`Exporting ${selectedStudentData.length} students as ${format}`)
    // 这里可以实现实际的导出逻辑
  }

  const handleBulkImport = async (file: File) => {
    console.log(`Importing students from ${file.name}`)
    // 这里可以实现实际的导入逻辑
  }

  const handleBulkMessage = async (message: string, type: 'email' | 'sms') => {
    const selectedStudentData = students.filter(student => selectedStudents.includes(student.id))
    console.log(`Sending ${type} message to ${selectedStudentData.length} students: ${message}`)
    // 这里可以实现实际的消息发送逻辑
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId])
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(student => student.id))
    } else {
      setSelectedStudents([])
    }
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedGrade: "",
      selectedStatus: "",
      selectedCenter: "",
      selectedGender: "",
      ageRange: [0, 25],
      enrollmentYear: "",
      hasPhone: false,
      hasEmail: false,
      sortBy: "name",
      sortOrder: 'asc',
      dateRange: { from: undefined, to: undefined },
      quickFilters: []
    })
    setCurrentPage(1)
  }

  const handleSaveFilter = (name: string, filterData: FilterState) => {
    setSavedFilters(prev => {
      const existing = prev.find(f => f.name === name)
      if (existing) {
        return prev.map(f => f.name === name ? { name, filters: filterData } : f)
      }
      return [...prev, { name, filters: filterData }]
    })
  }

  const handleLoadFilter = (name: string) => {
    const filter = savedFilters.find(f => f.name === name)
    if (filter) {
      setFilters(filter.filters)
    }
  }

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading students: {error}</p>
          </div>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">学生管理系统</h1>
          <p className="text-gray-600 mt-1">管理学生档案、学习进度和出勤记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            添加学生
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  实时数据
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">在读学生</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <UserCheck className="h-3 w-3 mr-1" />
                  活跃状态
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">小学生</p>
                <p className="text-2xl font-bold text-orange-600">{stats.primaryCount}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  一年级到六年级
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">中学生</p>
                <p className="text-2xl font-bold text-purple-600">{stats.secondaryCount}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  初一到高三
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 企业级筛选组件 */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSaveFilter={handleSaveFilter}
        onLoadFilter={handleLoadFilter}
        savedFilters={savedFilters}
      />

      {/* 批量操作组件 */}
      <BulkOperations
        selectedStudents={students.filter(student => selectedStudents.includes(student.id))}
        onClearSelection={() => setSelectedStudents([])}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        onBulkImport={handleBulkImport}
        onBulkMessage={handleBulkMessage}
      />

      {/* 视图模式切换 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table className="h-4 w-4 mr-2" />
            表格视图
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            网格视图
          </Button>
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analytics')}
          >
            <PieChart className="h-4 w-4 mr-2" />
            数据分析
          </Button>
        </div>

        {/* 筛选结果统计 */}
        <div className="text-sm text-gray-600">
          显示 {filteredStudents.length} 个学生
          {filters.searchTerm && (
            <span className="ml-2">
              (搜索: "{filters.searchTerm}")
            </span>
          )}
        </div>
      </div>

      {/* 学生列表 */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>学生信息</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>家长信息</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.studentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {convertGradeToChinese(student.grade)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{student.parentName}</div>
                          <div className="text-xs text-gray-500">{student.parentEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status === 'active' ? '在读' : '离校'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingStudent(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStudent(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* 网格视图 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.studentId}</p>
                  </div>
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                    {student.status === 'active' ? '在读' : '离校'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span>{convertGradeToChinese(student.grade)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{student.parentName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{student.parentEmail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewingStudent(student)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    查看
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingStudent(student)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分析视图 */}
      {viewMode === 'analytics' && (
        <StudentAnalytics 
          students={students}
          filteredStudents={filteredStudents}
        />
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)} 条，
            共 {filteredStudents.length} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                    onClick={() => setCurrentPage(pageNum)}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 对话框 */}
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
      />

      <StudentDetails
        student={viewingStudent}
        onOpenChange={(open: boolean) => {
          if (!open) setViewingStudent(null)
        }}
        onEdit={(student: Student) => {
          setViewingStudent(null)
          setEditingStudent(student)
        }}
        onDelete={handleDeleteStudent}
      />
    </div>
  )
}
