"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  UserPlus, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  Edit,
  Eye,
  Trash2,
  Plus,
  GraduationCap,
  Award,
  Calendar
} from "lucide-react"

interface Teacher {
  id: string
  name: string
  employeeId: string
  email: string
  phone: string
  department: string
  position: string
  subjects: string[]
  experience: number
  status: 'active' | 'inactive' | 'on_leave'
  joinDate: string
  lastActive: string
  courses: number
  students: number
}

interface TeachersTabProps {
  stats: any
  statsLoading: boolean
  setActiveTab: (tab: string) => void
}

export default function TeachersTab({ stats, statsLoading, setActiveTab }: TeachersTabProps) {
  // 模拟教师数据
  const mockTeachers: Teacher[] = [
    {
      id: "1",
      name: "张老师",
      employeeId: "T001",
      email: "zhang@school.com",
      phone: "13800138001",
      department: "数学系",
      position: "高级教师",
      subjects: ["数学", "物理"],
      experience: 8,
      status: "active",
      joinDate: "2016-09-01",
      lastActive: "2024-01-15",
      courses: 4,
      students: 120
    },
    {
      id: "2",
      name: "李老师",
      employeeId: "T002",
      email: "li@school.com",
      phone: "13800138002",
      department: "语文系",
      position: "主任教师",
      subjects: ["语文", "历史"],
      experience: 12,
      status: "active",
      joinDate: "2012-03-15",
      lastActive: "2024-01-14",
      courses: 3,
      students: 90
    },
    {
      id: "3",
      name: "王老师",
      employeeId: "T003",
      email: "wang@school.com",
      phone: "13800138003",
      department: "英语系",
      position: "中级教师",
      subjects: ["英语"],
      experience: 5,
      status: "active",
      joinDate: "2019-08-20",
      lastActive: "2024-01-13",
      courses: 2,
      students: 60
    },
    {
      id: "4",
      name: "陈老师",
      employeeId: "T004",
      email: "chen@school.com",
      phone: "13800138004",
      department: "科学系",
      position: "初级教师",
      subjects: ["化学", "生物"],
      experience: 3,
      status: "on_leave",
      joinDate: "2021-02-10",
      lastActive: "2024-01-10",
      courses: 1,
      students: 30
    }
  ]

  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  const teachers = mockTeachers

  // 获取教师数据统计
  const teachersStats = useMemo(() => {
    const totalTeachers = teachers.length
    const activeTeachers = teachers.filter(t => t.status === 'active').length
    const onLeaveTeachers = teachers.filter(t => t.status === 'on_leave').length
    const totalExperience = teachers.reduce((sum, t) => sum + t.experience, 0)
    const avgExperience = totalTeachers > 0 ? Math.round(totalExperience / totalTeachers * 10) / 10 : 0

    // 按部门统计
    const departmentStats = teachers.reduce((acc, teacher) => {
      const dept = teacher.department
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalTeachers,
      activeTeachers,
      onLeaveTeachers,
      avgExperience,
      departmentStats
    }
  }, [teachers])

  // 筛选教师
  const filteredTeachers = useMemo(() => {
    let filtered = teachers

    if (searchTerm) {
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(teacher => teacher.department === selectedDepartment)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(teacher => teacher.status === selectedStatus)
    }

    return filtered
  }, [teachers, searchTerm, selectedDepartment, selectedStatus])

  // 分页逻辑
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredTeachers.slice(startIndex, endIndex)
  }, [filteredTeachers, currentPage, pageSize])

  const totalPages = Math.ceil(filteredTeachers.length / pageSize)

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 获取部门选项
  const departmentOptions = useMemo(() => {
    const departments = Array.from(new Set(teachers.map(t => t.department))).sort()
    return departments
  }, [teachers])

  return (
    <div className="space-y-6">
      {/* 标题和概览 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">教师管理</h2>
        <p className="text-gray-600">管理教师信息、课程分配和教学安排</p>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">教师总数</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-600">{teachersStats.totalTeachers}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      实时数据
                    </p>
                  </>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">在职教师</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-green-600">{teachersStats.activeTeachers}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <UserPlus className="h-3 w-3 mr-1" />
                      活跃状态
                    </p>
                  </>
                )}
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">请假教师</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-orange-600">{teachersStats.onLeaveTeachers}</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      暂时离岗
                    </p>
                  </>
                )}
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均教龄</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-purple-600">{teachersStats.avgExperience}年</p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <Award className="h-3 w-3 mr-1" />
                      教学经验
                    </p>
                  </>
                )}
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 教师列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>教师列表</CardTitle>
              <CardDescription>查看和管理所有教师信息及教学安排</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                课程分配
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加教师
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
                  placeholder="搜索教师姓名、工号、邮箱或科目..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有部门</SelectItem>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">在职</SelectItem>
                <SelectItem value="inactive">离职</SelectItem>
                <SelectItem value="on_leave">请假</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setCurrentPage(1)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>

          {/* 教师表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>教师信息</TableHead>
                  <TableHead>部门职位</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>教学信息</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{teacher.name}</div>
                        <div className="text-sm text-gray-500">工号: {teacher.employeeId}</div>
                        <div className="text-xs text-gray-400">教龄: {teacher.experience}年</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{teacher.department}</div>
                        <div className="text-sm text-gray-600">{teacher.position}</div>
                        <div className="text-xs text-gray-500">
                          {teacher.subjects.join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{teacher.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{teacher.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-blue-500" />
                          <span className="text-sm">{teacher.courses} 门课程</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-green-500" />
                          <span className="text-sm">{teacher.students} 名学生</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-purple-500" />
                          <span className="text-xs">入职: {teacher.joinDate}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        teacher.status === 'active' ? 'default' : 
                        teacher.status === 'on_leave' ? 'secondary' : 'destructive'
                      }>
                        {teacher.status === 'active' ? '在职' : 
                         teacher.status === 'on_leave' ? '请假' : '离职'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
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
                显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredTeachers.length)} 条，
                共 {filteredTeachers.length} 条记录
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
    </div>
  )
}
