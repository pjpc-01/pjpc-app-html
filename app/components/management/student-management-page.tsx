"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
import { useLanguage } from "@/contexts/language-context"
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
import { toast } from "sonner"
import { useStudents } from "@/hooks/useStudents"
import { Student } from "@/hooks/useStudents"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePagination } from "@/hooks/usePagination"
import { convertGradeToChinese } from "../student/utils"
import StudentForm from "../student/StudentForm"
import StudentDetails from "../student/StudentDetails"
import StudentList from "../student/StudentList"
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
    student.father_name?.toLowerCase().includes(query) ||
    student.mother_name?.toLowerCase().includes(query) ||
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
               secondaryGrade === '7' || secondaryGrade === '8' || secondaryGrade === '9' || secondaryGrade === '10' || secondaryGrade === '11' || secondaryGrade === '12' ||
               secondaryGrade.toLowerCase().startsWith('form') || secondaryGrade.includes('中一') || secondaryGrade.includes('中二') || secondaryGrade.includes('中三') || secondaryGrade.includes('中四') || secondaryGrade.includes('中五') ||
               secondaryGrade.includes('预备班')
        case 'active':
        return student.status === 'active'
        case 'inactive':
        return student.status !== 'active'
        case 'has-phone':
        return (student.father_phone || student.mother_phone) && 
               ((student.father_phone || '').trim() !== '' || (student.mother_phone || '').trim() !== '')
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
          aValue = a.father_name || a.mother_name || ''
          bValue = b.father_name || b.mother_name || ''
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
  const { t } = useLanguage()
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents()
  
  const searchParams = useSearchParams()
  const urlCenterId = searchParams.get('center')
  const router = useRouter()
  
  // 状态管理
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedGrade: "all",
    selectedCenter: "",
    selectedStatus: "active",
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

  // 全局中心筛选 (通过 URL 参数 ?center=UUID)
  const centerFilteredStudents = useMemo(() => {
    if (!urlCenterId) return students
    return students.filter(student => student.centerId === urlCenterId)
  }, [students, urlCenterId])

  // 获取筛选选项 (基于全局筛选后的学生)
  const filterOptions = useMemo(() => {
    const grades = Array.from(new Set(centerFilteredStudents.map(s => s.standard).filter(Boolean))).sort()
    const statuses = Array.from(new Set(centerFilteredStudents.map(s => s.status).filter(Boolean))).sort()
    const centers = Array.from(new Set(centerFilteredStudents.map(s => s.center).filter(Boolean))).sort()
    
    return { grades, statuses, centers }
  }, [centerFilteredStudents])

  // 筛选和排序学生数据
  const filteredStudents = useMemo(() => {
    if (centerFilteredStudents.length === 0) return []
    return applyFilters(centerFilteredStudents, filters)
  }, [centerFilteredStudents, filters])

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
    pageSize: 50,
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
             grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6' ||
             grade.toLowerCase().startsWith('standard')
    }).length

    const secondaryCount = students.filter(student => {
      const grade = student.standard || ''
      return grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
             grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
             grade === '7' || grade === '8' || grade === '9' || grade === '10' || grade === '11' || grade === '12' ||
             grade.toLowerCase().startsWith('form') || grade.includes('中一') || grade.includes('中二') || grade.includes('中三') || grade.includes('中四') || grade.includes('中五') ||
             grade.includes('预备班')
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
      throw error // Re-throw so StudentForm can show error UI
    }
  }

  const handleUpdateStudent = async (studentData: Partial<Student>) => {
    if (!editingStudent) return
    try {
      await updateStudent(editingStudent.id, studentData)
      toast.success("学生信息已更新")
      setEditingStudent(null)
      refetch()
    } catch (error: any) {
      toast.error("更新失败", { description: error.message || "请重试" })
      console.error("Error updating student:", error)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("确定要删除此学生？此操作不可撤销。")) return
    try {
      await deleteStudent(studentId)
      refetch()
    } catch (error) {
      console.error("Error deleting student:", error)
      alert("删除失败: " + (error instanceof Error ? error.message : "未知错误"))
    }
  }

  // View/create student report
  const handleViewReport = async (student: Student) => {
    // Check if a report already exists for this student
    try {
      const res = await fetch(`/api/pocketbase-proxy/api/collections/student_reports/records?filter=(studentId="${student.id}")&sort=-year&perPage=1`)
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        router.push(`/student-report/${data.items[0].id}`)
        return
      }
    } catch (e) {}

    // Fetch default report settings from PB
    let settings: any = null
    try {
      const settingsRes = await fetch('/api/pocketbase-proxy/api/collections/report_settings/records?filter=(isDefault=true)&perPage=1')
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.items?.length > 0) {
          settings = settingsData.items[0]
        }
      }
    } catch (e) {}

    const studentName = student.student_name || student.name || "学生"

    // Build subjects from settings or fallback
    const subjectNames = settings?.defaultSubjects?.length > 0
      ? settings.defaultSubjects
      : ["华文", "国文", "英文", "数学", "科学", "地理", "历史", "道德", "美术", "体育"]
    const subjects = subjectNames.map((name: string) => ({
      name, midterm: null, final: null, evaluation: ""
    }))

    const growthMessage = settings?.growthMessage
      ? settings.growthMessage.replace('{studentName}', studentName)
      : `成长不在于做得最好，而在于愿意不断尝试、不断进步。${studentName}，继续加油！`

    const problems = settings?.problems?.length > 0
      ? settings.problems
      : ["在理科学习中，解题思路不够灵活，需加强思维训练。", "有时会因拖延导致作业完成质量不高。", "阅读量不足，知识面有待拓宽。"]

    const improvements = settings?.improvements?.length > 0
      ? settings.improvements
      : ["制定学习计划，提高学习效率，减少拖延。", "多做练习题，总结解题方法和技巧。", "每天阅读，拓宽知识面，做好读书笔记。", "遇到问题及时请教老师或同学，加强理解与应用。"]

    // Create new report with defaults from settings
    try {
      const now = new Date()
      const reportData = {
        studentId: student.id,
        term: "Term 1",
        year: now.getFullYear(),
        report_date: now.toISOString().split('T')[0],
        growth_message: growthMessage,
        subjects,
        activities: [],
        problems,
        improvements,
        future_goals_academic: settings?.futureGoalAcademic || "提高各科成绩，争取进入班级前列。",
        future_goals_ability: settings?.futureGoalAbility || "积极参与更多课外活动，提升自己的组织和沟通能力。",
        future_goals_character: settings?.futureGoalCharacter || "培养良好的学习和生活习惯，做一个全面发展的学生。",
        summary: settings?.summary || "本学期，我在学习和生活中都取得了一定的进步，但也认识到自己的不足。在未来的日子里，我将以更高的标准要求自己，不断超越自我，实现自己的目标，成为更好的自己！",
        status: "draft",
      }
      const createRes = await fetch("/api/pocketbase-proxy/api/collections/student_reports/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      })
      const created = await createRes.json()
      router.push(`/student-report/${created.id}`)
    } catch (e: any) {
      alert("创建报告失败: " + (e.message || "未知错误"))
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const studentId of selectedStudents) {
        await deleteStudent(studentId)
      }
      setSelectedStudents(new Set())
      refetch()
      alert(`已删除 ${selectedStudents.length} 名学生`)
    } catch (error) {
      console.error("Error bulk deleting students:", error)
      alert("批量删除失败: " + (error instanceof Error ? error.message : "未知错误"))
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

  const handleBulkExport = async () => {
    try {
      const response = await fetch('/api/students/export')
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('导出失败: ' + (e as Error).message)
    }
  }

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Import failed')
      alert('导入成功！')
      refetch()
    } catch (e) {
      alert('导入失败: ' + (e as Error).message)
    }
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
    <div className="max-w-full space-y-8">
        {/* 页面标题和操作栏 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-amber-200/40 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-yellow-50/80 to-amber-50/80 rounded-xl p-6 border border-amber-200/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch} 
                disabled={loading}
                className="bg-white/60 backdrop-blur-sm border-amber-200/40 hover:bg-amber-50/80 text-amber-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkExport}
                className="bg-white/60 backdrop-blur-sm border-amber-200/40 hover:bg-amber-50/80 text-amber-800"
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  id="student-import-input"
                  onChange={handleBulkImport}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('student-import-input')?.click()}
                  className="bg-white/60 backdrop-blur-sm border-amber-200/40 hover:bg-amber-50/80 text-amber-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  导入
                </Button>
              </div>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                添加学生
              </Button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border border-amber-200/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800">{t('dashboard.total_students')}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                    {stats.total}
                  </p>
                  <p className="text-xs text-amber-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    实时数据
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-amber-200/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800">{t('dashboard.active_students')}</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text text-transparent">
                    {stats.active}
                  </p>
                  <p className="text-xs text-yellow-700 flex items-center">
                    <UserCheck className="h-3 w-3 mr-1" />
                    活跃状态
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-amber-200/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800">小学生</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                    {stats.primaryCount}
                  </p>
                  <p className="text-xs text-orange-600 flex items-center">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    一年级到六年级
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-amber-200/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800">中学生</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
                    {stats.secondaryCount}
                  </p>
                  <p className="text-xs text-amber-600 flex items-center">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    初一到高三
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 筛选组件 */}
      <AdvancedFilters
        students={students}
        value={filters}
        onChange={(newFilters) => {
          setFilters(prev => ({
            ...prev,
            ...newFilters,
            dateRange: newFilters.enrollmentDateRange || { from: undefined, to: undefined }
          }))
        }}
        onClear={clearFilters}
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
        <div className="bg-white/80 backdrop-blur-sm border border-amber-200/30 rounded-2xl shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-amber-100/70 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-white shadow-sm text-amber-900' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'}
                >
                  <Table className="h-4 w-4 mr-2" />
                  表格视图
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white shadow-sm text-amber-900' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  网格视图
                </Button>
                <Button
                  variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('analytics')}
                  className={viewMode === 'analytics' ? 'bg-white shadow-sm text-amber-900' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  数据分析
                </Button>
              </div>
            </div>

            {/* 筛选结果统计 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
                <Users className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="mt-2 text-amber-700">加载学生数据中...</p>
              </div>
            </div>
          )}
                    {!loading && (
            <>
              {paginatedStudents.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-amber-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-amber-700">{t('student.no_student_data')}</p>
                    <p className="text-sm text-amber-500 mt-1">请添加学生或调整筛选条件</p>
                  </div>
                </div>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border border-amber-200/30 shadow-md rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <StudentList 
              students={paginatedStudents}
              loading={loading}
              selectedStudents={Array.from(selectedStudents)}
              onSelectStudent={handleSelectStudent}
              onSelectAll={handleSelectAll}
              onEditStudent={(s) => setEditingStudent(s)}
              onViewStudent={(s) => setViewingStudent(s)}
              onDeleteStudent={handleDeleteStudent}
              onViewReport={handleViewReport}
            />
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
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-[#e6be1e] to-[#d4a817] text-white text-sm font-semibold">
                        {student.student_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{student.student_name}</h3>
                      <p className="text-sm text-gray-500">{student.student_id}</p>
                    </div>
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
                    <span>{student.father_name || student.mother_name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{student.father_phone || student.mother_phone || '-'}</span>
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
          <div className="text-sm text-amber-700">
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
  )
}
