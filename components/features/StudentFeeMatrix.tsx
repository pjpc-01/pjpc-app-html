"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ChevronDown, 
  ChevronRight, 
  DollarSign, 
  FileText, 
  Download,
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react'

interface Student {
  id: string
  name: string
  grade: string
  fees: {
    tuition: number
    transportation: number
    meals: number
    activities: number
    total: number
  }
  status: 'paid' | 'pending' | 'overdue'
  lastPayment?: string
}

interface FeeItem {
  id: string
  name: string
  amount: number
  description: string
  required: boolean
}

export default function StudentFeeMatrix() {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: '张三',
      grade: '7年级',
      fees: {
        tuition: 5000,
        transportation: 800,
        meals: 1200,
        activities: 500,
        total: 7500
      },
      status: 'paid',
      lastPayment: '2024-01-15'
    },
    {
      id: '2',
      name: '李四',
      grade: '8年级',
      fees: {
        tuition: 5000,
        transportation: 800,
        meals: 1200,
        activities: 500,
        total: 7500
      },
      status: 'pending',
      lastPayment: '2024-01-10'
    },
    {
      id: '3',
      name: '王五',
      grade: '9年级',
      fees: {
        tuition: 5000,
        transportation: 800,
        meals: 1200,
        activities: 500,
        total: 7500
      },
      status: 'overdue',
      lastPayment: '2023-12-20'
    }
  ])

  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const feeItems: FeeItem[] = [
    { id: 'tuition', name: '学费', amount: 5000, description: '学期学费', required: true },
    { id: 'transportation', name: '交通费', amount: 800, description: '校车服务费', required: false },
    { id: 'meals', name: '餐费', amount: 1200, description: '午餐费用', required: false },
    { id: 'activities', name: '活动费', amount: 500, description: '课外活动费用', required: false }
  ]

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesGrade = filterGrade === 'all' || student.grade === filterGrade
      const matchesStatus = filterStatus === 'all' || student.status === filterStatus
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.grade.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesGrade && matchesStatus && matchesSearch
    })
  }, [students, filterGrade, filterStatus, searchTerm])

  // Statistics
  const totalRevenue = useMemo(() => {
    return students
      .filter(student => student.status === 'paid')
      .reduce((sum, student) => sum + student.fees.total, 0)
  }, [students])

  const pendingAmount = useMemo(() => {
    return students
      .filter(student => student.status === 'pending' || student.status === 'overdue')
      .reduce((sum, student) => sum + student.fees.total, 0)
  }, [students])

  // Event handlers
  const toggleStudentExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId)
    } else {
      newExpanded.add(studentId)
    }
    setExpandedStudents(newExpanded)
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const toggleAllStudents = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">已缴费</Badge>
      case 'pending':
        return <Badge variant="secondary">待缴费</Badge>
      case 'overdue':
        return <Badge variant="destructive">逾期</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const createInvoice = () => {
    const selectedStudentList = students.filter(s => selectedStudents.has(s.id))
    alert(`为 ${selectedStudentList.length} 名学生创建发票`)
  }

  const exportData = () => {
    const data = students.map(student => ({
      姓名: student.name,
      年级: student.grade,
      学费: student.fees.tuition,
      交通费: student.fees.transportation,
      餐费: student.fees.meals,
      活动费: student.fees.activities,
      总计: student.fees.total,
      状态: student.status === 'paid' ? '已缴费' : student.status === 'pending' ? '待缴费' : '逾期',
      最后缴费日期: student.lastPayment || '无'
    }))
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '学生费用报表.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">学生费用管理</h2>
          <p className="text-gray-600">管理学生的各项费用和缴费状态</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createInvoice} disabled={selectedStudents.size === 0}>
            <FileText className="h-4 w-4 mr-2" />
            创建发票 ({selectedStudents.size})
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总学生数</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">注册学生总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已收费用</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">NT$ {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">已缴费学生总额</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待收费用</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">NT$ {pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">待缴费学生总额</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选选项</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="search">搜索:</Label>
              <Input
                id="search"
                placeholder="搜索学生姓名或年级..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="grade-filter">年级:</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部年级</SelectItem>
                  <SelectItem value="7年级">7年级</SelectItem>
                  <SelectItem value="8年级">8年级</SelectItem>
                  <SelectItem value="9年级">9年级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter">状态:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="paid">已缴费</SelectItem>
                  <SelectItem value="pending">待缴费</SelectItem>
                  <SelectItem value="overdue">逾期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>学生费用详情</CardTitle>
              <CardDescription>点击学生姓名查看详细费用信息</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                onCheckedChange={toggleAllStudents}
              />
              <Label>全选</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">未找到匹配的学生</p>
              <p className="text-sm">请尝试不同的搜索关键词</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => {
                const isExpanded = expandedStudents.has(student.id)
                const isSelected = selectedStudents.has(student.id)
                
                return (
                  <div key={student.id} className="border rounded-lg">
                    <div className="flex items-center p-4 hover:bg-gray-50">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStudentExpansion(student.id)}
                        className="flex-1 justify-start ml-2"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        <span className="font-medium">{student.name}</span>
                        <Badge variant="outline" className="ml-2">{student.grade}</Badge>
                      </Button>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">NT$ {student.fees.total.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">总费用</div>
                        </div>
                        {getStatusBadge(student.status)}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">费用明细</h4>
                            <div className="space-y-2">
                              {feeItems.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.name}</span>
                                  <span>NT$ {student.fees[item.id as keyof typeof student.fees]?.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">缴费信息</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>状态:</span>
                                {getStatusBadge(student.status)}
                              </div>
                              {student.lastPayment && (
                                <div className="flex justify-between">
                                  <span>最后缴费:</span>
                                  <span>{student.lastPayment}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
