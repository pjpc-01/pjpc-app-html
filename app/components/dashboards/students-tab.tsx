"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  GraduationCap,
  Users,
  TrendingUp,
  RefreshCw,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  MapPin,
  CreditCard,
  Link,
  CheckCircle,
  AlertCircle,
  WifiOff,
  FileSpreadsheet,
  Mail,
  Phone,
  UserPlus,
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"

interface StudentsTabProps {
  stats: any
  statsLoading: boolean
  setActiveTab: (tab: string) => void
}

// 模拟数据 - 融合的学生数据
const mockStudents = [
  { 
    id: '1', 
    student_id: 'S001', 
    student_name: '张三', 
    standard: '一年级', 
    Center: 'WX 01', 
    father_phone: '0123456789', 
    mother_phone: '0123456790',
    studentUrl: 'https://example.com/student1',
    status: 'active',
    cardNumber: 'CARD001',
    cardType: 'NFC',
    lastUsed: '2024-01-15'
  },
  { 
    id: '2', 
    student_id: 'S002', 
    student_name: '李四', 
    standard: '二年级', 
    Center: 'WX 02', 
    father_phone: '0123456791', 
    mother_phone: '0123456792',
    studentUrl: 'https://example.com/student2',
    status: 'active',
    cardNumber: 'CARD002',
    cardType: 'RFID',
    lastUsed: '2024-01-14'
  },
  { 
    id: '3', 
    student_id: 'S003', 
    student_name: '王五', 
    standard: '三年级', 
    Center: 'WX 01', 
    father_phone: '0123456793', 
    mother_phone: '0123456794',
    status: 'inactive',
    cardNumber: 'CARD003',
    cardType: 'NFC',
    lastUsed: null
  },
]

export default function StudentsTab({ 
  stats, 
  statsLoading, 
  setActiveTab 
}: StudentsTabProps) {
  const { students: realStudents, loading: studentsLoading, refetch: refetchStudents } = useStudents()
  const { userProfile } = useAuth()
  
  // 使用模拟数据或真实数据
  const students: any[] = realStudents.length > 0 ? realStudents : mockStudents
  const isUsingMockData = realStudents.length === 0
  
  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCenter, setSelectedCenter] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // 获取学生数据统计
  const studentsStats = useMemo(() => {
    const totalStudents = students.length
    
    // 按中心统计
    const centerStats = students.reduce((acc, student) => {
      const center = student.Center || '未知中心'
      acc[center] = (acc[center] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 按年级统计
    const gradeStats = students.reduce((acc, student) => {
      const grade = student.standard || '未知年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 有打卡卡的学生数量
    const studentsWithCards = students.filter(student => 
      student.cardNumber && student.status === 'active'
    ).length

    // 有专属网址的学生数量
    const studentsWithUrls = students.filter(student => 
      student.studentUrl
    ).length

    return {
      totalStudents,
      studentsWithCards,
      studentsWithoutCards: totalStudents - studentsWithCards,
      studentsWithUrls,
      centerStats,
      gradeStats
    }
  }, [students])

  // 筛选学生
  const filteredStudents = useMemo(() => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.father_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.mother_phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCenter !== 'all') {
      filtered = filtered.filter(student => student.Center === selectedCenter)
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

  return (
    <div className="space-y-6">
      {/* 连接状态提示 */}
      {isUsingMockData && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">使用模拟数据</p>
                <p className="text-xs text-orange-600">PocketBase 连接失败，正在使用模拟数据进行演示</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 标题和概览 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">学生管理</h2>
        <p className="text-gray-600">统一管理学生基本资料和打卡数据</p>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">学生总数</p>
                {statsLoading || studentsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-green-600">{studentsStats.totalStudents}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {isUsingMockData ? '模拟数据' : '实时数据'}
                    </p>
                  </>
                )}
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">有卡学生</p>
                {statsLoading || studentsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-600">{studentsStats.studentsWithCards}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <CreditCard className="h-3 w-3 mr-1" />
                      已配置打卡
                    </p>
                  </>
                )}
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">无卡学生</p>
                {statsLoading || studentsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-orange-600">{studentsStats.studentsWithoutCards}</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      需配置打卡
                    </p>
                  </>
                )}
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">专属网址</p>
                {statsLoading || studentsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-purple-600">{studentsStats.studentsWithUrls}</p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <Link className="h-3 w-3 mr-1" />
                      已配置网址
                    </p>
                  </>
                )}
              </div>
              <Link className="h-8 w-8 text-purple-600" />
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
              <Button>
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
                  placeholder="搜索学生姓名、学号、年级或家长电话..."
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
                {centerOptions.map((center) => (
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
                {gradeOptions.map((grade) => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetchStudents()}>
              <RefreshCw className="h-4 w-4 mr-2" />
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
                  <TableHead>中心</TableHead>
                  <TableHead>家长联系方式</TableHead>
                  <TableHead>打卡信息</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-sm text-gray-500">学号: {student.student_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.standard}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.Center || '未知'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {student.father_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">父: {student.father_phone}</span>
                          </div>
                        )}
                        {student.mother_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">母: {student.mother_phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {student.cardNumber ? (
                          <>
                            <Badge variant={student.status === 'active' ? 'default' : 'destructive'}>
                              {student.status === 'active' ? '激活' : student.status}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {student.cardType} - {student.cardNumber}
                            </div>
                            {student.lastUsed && (
                              <div className="text-xs text-gray-400">
                                最后使用: {new Date(student.lastUsed).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          <Badge variant="destructive">无卡</Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
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
    </div>
  )
}
