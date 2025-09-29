"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import StatsGrid from "@/components/ui/StatsGrid"
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
import { usePagination } from "@/hooks/usePagination"
import { convertGradeToChinese } from "../student/utils"
import StudentForm from "../student/StudentForm"
import StudentDetails from "../student/StudentDetails"
import AdvancedFilters from "../student/AdvancedFilters"
import StudentAnalytics from "../student/StudentAnalytics"
import BulkOperations from "../student/BulkOperations"

interface FilterState {
  // 基本信息筛选
  searchTerm: string
  selectedGrade: string
  selectedCenter: string
  selectedStatus: string
  selectedGender: string
  selectedLevel: string
  
  // 年龄和入学筛选
  ageRange: [number, number]
  enrollmentYear: string
  enrollmentDateRange: { from: Date | undefined; to: Date | undefined }
  
  // 联系信息筛选
  hasPhone: boolean
  hasEmail: boolean
  hasAddress: boolean
  
  // 学术信息筛选
  hasGrades: boolean
  hasAssignments: boolean
  attendanceRate: [number, number]
  
  // 排序
  sortBy: string
  sortOrder: 'asc' | 'desc'
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  quickFilters: string[]
}

// 筛选函数
const applySearchFilter = (student: Student, searchTerm: string) => {
  if (!searchTerm) return true
  const query = searchTerm.toLowerCase()
  return (
    student.student_name?.toLowerCase().includes(query) ||
    student.student_id?.toLowerCase().includes(query) ||
    student.standard?.toLowerCase().includes(query) ||
    student.parentName?.toLowerCase().includes(query) ||
    student.email?.toLowerCase().includes(query) ||
    student.status?.toLowerCase().includes(query)
  )
}

const applyGradeFilter = (student: Student, selectedGrade: string) => 
  !selectedGrade || selectedGrade === "all" || student.standard === selectedGrade

const applyStatusFilter = (student: Student, selectedStatus: string) => 
  !selectedStatus || selectedStatus === "all" || student.status === selectedStatus

const applyCenterFilter = (student: Student, selectedCenter: string) => 
  !selectedCenter || selectedCenter === "all" || student.center === selectedCenter

const applyGenderFilter = (student: Student, selectedGender: string) => 
  !selectedGender || selectedGender === "all" || student.gender === selectedGender

const applyLevelFilter = (student: Student, selectedLevel: string) => 
  !selectedLevel || selectedLevel === "all" || student.level === selectedLevel

const applyQuickFilter = (student: Student, quickFilters: string[]) => {
  if (!quickFilters.length) return true
  
  return quickFilters.every(filterId => {
      switch (filterId) {
        case 'primary':
            const grade = student.standard || ''
            return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
                   grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
                   grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
        case 'secondary':
        const secondaryGrade = student.standard || ''
        return secondaryGrade.includes('初一') || secondaryGrade.includes('初二') || secondaryGrade.includes('初三') || 
               secondaryGrade.includes('高一') || secondaryGrade.includes('高二') || secondaryGrade.includes('高三') ||
               secondaryGrade === '7' || secondaryGrade === '8' || secondaryGrade === '9' || secondaryGrade === '10' || secondaryGrade === '11' || secondaryGrade === '12'
        case 'active':
        return student.status === 'active'
        case 'inactive':
        return student.status !== 'active'
        case 'has-phone':
        return student.parentPhone && student.parentPhone.trim() !== ''
        case 'has-email':
        return student.email && student.email.trim() !== ''
      default:
        return true
      }
    })
}

const applySorting = (a: Student, b: Student, sortBy: string, sortOrder: 'asc' | 'desc') => {
  if (!sortBy) return 0
  
      let aValue: any
      let bValue: any

  switch (sortBy) {
        case 'name':
          aValue = a.student_name || ''
          bValue = b.student_name || ''
          break
        case 'studentId':
          aValue = a.student_id || ''
          bValue = b.student_id || ''
          break
        case 'grade':
          aValue = a.standard || ''
          bValue = b.standard || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'parentName':
          aValue = a.parentName || ''
          bValue = b.parentName || ''
          break
    case 'center':
      aValue = a.center || ''
      bValue = b.center || ''
          break
        default:
      return 0
  }

  if (aValue == null) return 1
  if (bValue == null) return -1

  if (typeof aValue === "string" && typeof bValue === "string") {
    return sortOrder === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue)
  }

  if (typeof aValue === "number" && typeof bValue === "number") {
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue
  }

  return 0
}

const applyFilters = (students: Student[], filters: FilterState) => {
  return students
    .filter(student => applySearchFilter(student, filters.searchTerm))
    .filter(student => applyGradeFilter(student, filters.selectedGrade))
    .filter(student => applyStatusFilter(student, filters.selectedStatus))
    .filter(student => applyCenterFilter(student, filters.selectedCenter))
    .filter(student => applyGenderFilter(student, filters.selectedGender))
    .filter(student => applyLevelFilter(student, filters.selectedLevel))
    .filter(student => applyQuickFilter(student, filters.quickFilters))
    .sort((a, b) => applySorting(a, b, filters.sortBy, filters.sortOrder))
}

export default function StudentManagementPage() {
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents()
  
  // 状态管理
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedGrade: "all",
    selectedCenter: "",
    selectedStatus: "all",
    selectedGender: "",
    selectedLevel: "",
    ageRange: [0, 25],
    enrollmentYear: "",
    enrollmentDateRange: { from: undefined, to: undefined },
    hasPhone: false,
    hasEmail: false,
    hasAddress: false,
    hasGrades: false,
    hasAssignments: false,
    attendanceRate: [0, 100],
    sortBy: "name",
    sortOrder: 'asc',
    dateRange: { from: undefined, to: undefined },
    quickFilters: []
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'analytics'>('table')
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: FilterState }[]>([])

  // 获取筛选选项
  const filterOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.standard).filter(Boolean))).sort()
    const statuses = Array.from(new Set(students.map(s => s.status).filter(Boolean))).sort()
    const centers = Array.from(new Set(students.map(s => s.center).filter(Boolean))).sort()
    
    return { grades, statuses, centers }
  }, [students])

  // 筛选和排序学生数据
  const filteredStudents = useMemo(() => {
    if (students.length === 0) return []
    return applyFilters(students, filters)
  }, [students, filters])

  // 分页
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedStudents,
    totalItems,
    startIndex,
    endIndex,
    setCurrentPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrev
  } = usePagination({
    data: filteredStudents,
    pageSize: 20,
    initialPage: 1
  })

  // 统计数据
  const stats = useMemo(() => {
    const total = students.length
    const active = students.filter(s => s.status === 'active').length
    const inactive = students.filter(s => s.status !== 'active').length
    
    // 年级分布
    const gradeDistribution = students.reduce((acc, student) => {
      const grade = student.standard || '未知年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 小学/中学分布
    const primaryCount = students.filter(student => {
      const grade = student.standard || ''
      return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
             grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
             grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
    }).length

    const secondaryCount = students.filter(student => {
      const grade = student.standard || ''
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
      setSelectedStudents(new Set())
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
      setSelectedStudents(new Set())
      refetch()
    } catch (error) {
      console.error("Error bulk updating students:", error)
    }
  }

  const handleBulkExport = (format: 'csv' | 'excel' | 'pdf') => {
    const selectedStudentData = students.filter(student => selectedStudents.has(student.id))
    console.log(`Exporting ${selectedStudentData.length} students as ${format}`)
    // 这里可以实现实际的导出逻辑
  }

  const handleBulkImport = async (file: File) => {
    console.log(`Importing students from ${file.name}`)
    // 这里可以实现实际的导入逻辑
  }

  const handleBulkMessage = async (message: string, type: 'email' | 'sms') => {
    const selectedStudentData = students.filter(student => selectedStudents.has(student.id))
    console.log(`Sending ${type} message to ${selectedStudentData.length} students: ${message}`)
    // 这里可以实现实际的消息发送逻辑
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
    if (checked) {
        newSet.add(studentId)
    } else {
        newSet.delete(studentId)
    }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(student => student.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const clearFilters = () => {
    console.log('🔍 清除筛选条件...')
    const clearedFilters: FilterState = {
      searchTerm: "",
      selectedGrade: "all",
      selectedCenter: "",
      selectedStatus: "all",
      selectedGender: "",
      selectedLevel: "",
      ageRange: [0, 25],
      enrollmentYear: "",
      enrollmentDateRange: { from: undefined, to: undefined },
      hasPhone: false,
      hasEmail: false,
      hasAddress: false,
      hasGrades: false,
      hasAssignments: false,
      attendanceRate: [0, 100],
      sortBy: "name",
      sortOrder: 'asc',
      dateRange: { from: undefined, to: undefined },
      quickFilters: []
    }
    console.log('🔍 清除后的筛选条件:', clearedFilters)
    setFilters(clearedFilters)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题和操作栏 */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    学生管理系统
                  </h1>
                  <p className="text-gray-600 mt-1">智能管理学生档案、学习进度和出勤记录</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch} 
                disabled={loading}
                className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/50 backdrop-blur-sm border-white/20 hover:bg-white/80"
              >
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                添加学生
              </Button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">总学生数</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {stats.total}
                  </p>
                  <p className="text-xs text-blue-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    实时数据
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">在读学生</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    {stats.active}
                  </p>
                  <p className="text-xs text-green-600 flex items-center">
                    <UserCheck className="h-3 w-3 mr-1" />
                    活跃状态
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">小学生</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                    {stats.primaryCount}
                  </p>
                  <p className="text-xs text-orange-600 flex items-center">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    一年级到六年级
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">中学生</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    {stats.secondaryCount}
                  </p>
                  <p className="text-xs text-purple-600 flex items-center">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    初一到高三
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 企业级筛选组件 */}
      <AdvancedFilters
        students={students}
        onFiltersChange={useCallback((newFilters) => {
          console.log('🔍 学生管理: 收到筛选条件更新:', newFilters)
          setFilters(prev => ({
            ...prev,
            ...newFilters,
            dateRange: newFilters.enrollmentDateRange || { from: undefined, to: undefined }
          }))
        }, [])}
        onClearFilters={clearFilters}
      />

      {/* 批量操作组件 */}
      <BulkOperations
        selectedStudents={students.filter(student => selectedStudents.has(student.id))}
        onClearSelection={() => setSelectedStudents(new Set())}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        onBulkImport={handleBulkImport}
        onBulkMessage={handleBulkMessage}
      />

        {/* 视图模式切换和统计信息 */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                >
                  <Table className="h-4 w-4 mr-2" />
                  表格视图
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  网格视图
                </Button>
                <Button
                  variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('analytics')}
                  className={viewMode === 'analytics' ? 'bg-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  数据分析
                </Button>
              </div>
            </div>

            {/* 筛选结果统计 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  显示 {filteredStudents.length} 个学生
                </span>
              </div>
              {filters.searchTerm && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
                  <Search className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    搜索: &quot;{filters.searchTerm}&quot;
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* 学生列表 */}
      {viewMode === 'table' && (
        <>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">加载学生数据中...</p>
              </div>
            </div>
          )}
                    {!loading && (
            <>
              {paginatedStudents.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">暂无学生数据</p>
                    <p className="text-sm text-gray-400 mt-1">请添加学生或调整筛选条件</p>
                  </div>
                </div>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto min-w-full">
              <Table className="border-collapse w-full">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <TableHead className="w-12 px-4 py-3">
                      <Checkbox
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold px-4 py-3">学生信息</TableHead>
                    <TableHead className="font-semibold px-4 py-3">年级</TableHead>
                    <TableHead className="font-semibold px-4 py-3">中心</TableHead>
                    <TableHead className="font-semibold px-4 py-3">服务类型</TableHead>
                    <TableHead className="font-semibold px-4 py-3">家长联系方式</TableHead>
                    <TableHead className="font-semibold px-4 py-3">学费状态</TableHead>
                    <TableHead className="font-semibold px-4 py-3">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student, index) => (
                    <TableRow key={student.id} className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <TableCell className="px-4 py-3">
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {student.student_name?.charAt(0) || 'S'}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-base text-gray-900">{student.student_name}</div>
                            <div className="text-sm text-gray-600 font-medium">学号: {student.student_id}</div>
                          </div>
                          {student.status && (
                            <Badge 
                              variant={student.status === 'active' ? 'default' : 'secondary'}
                              className={`text-xs px-2 py-1 ${
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
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="font-medium bg-blue-50 text-blue-800 border-blue-200">
                          {convertGradeToChinese(student.standard || '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="secondary" className="font-medium bg-purple-50 text-purple-800 border-purple-200">
                          {student.center || '未设置'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="text-gray-600 bg-orange-50 text-orange-800 border-orange-200">
                          {(() => {
                            console.log('🔍 学生服务类型调试:', {
                              student_name: student.student_name,
                              student_id: student.student_id,
                              services: student.services,
                              hasServices: 'services' in student
                            })
                            return student.services === 'Daycare' ? '日托服务' : 
                                   student.services === 'Tuition' ? '补习服务' : 
                                   student.services || '未知'
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-sm">
                          {student.parentPhone || student.father_phone || student.mother_phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge 
                          variant={student.tuitionStatus === 'paid' ? 'default' : 
                                  student.tuitionStatus === 'overdue' ? 'destructive' : 
                                  'outline'}
                          className="text-xs"
                        >
                          {student.tuitionStatus === 'paid' ? '已缴费' : 
                           student.tuitionStatus === 'pending' ? '待缴费' : 
                           student.tuitionStatus === 'partial' ? '部分缴费' : 
                           student.tuitionStatus === 'overdue' ? '逾期' : 
                           '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200"
                            onClick={() => setViewingStudent(student)}
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 rounded-lg transition-all duration-200"
                            onClick={() => setEditingStudent(student)}
                            title="编辑学生"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                            onClick={() => handleDeleteStudent(student.id)}
                            title="删除学生"
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
            </>
          )}
        </>
      )}

      {/* 网格视图 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{student.student_name}</h3>
                    <p className="text-sm text-gray-500">{student.student_id}</p>
                  </div>
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                    {student.status === 'active' ? '在读' : '离校'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span>{convertGradeToChinese(student.standard || '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{student.center || '未设置'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{student.parentName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{student.email}</span>
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
            显示第 {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} 条，
            共 {filteredStudents.length} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
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
              onClick={nextPage}
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
          onDelete={() => handleDeleteStudent(viewingStudent.id)}
        />
      )}
      </div>
    </div>
  )
}
