"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  TrendingUp,
  PieChart,
  BarChart3,
  Loader2,
  Settings
} from "lucide-react"

import { useAuth } from "@/contexts/pocketbase-auth-context"
import { formatDate, formatCurrency } from "@/lib/utils"

// Types
interface TeacherSalaryStructure {
  id: string
  teacher_id: string
  base_salary: number
  hourly_rate?: number
  overtime_rate?: number
  allowance_fixed: number
  allowance_transport?: number
  allowance_meal?: number
  allowance_other?: number
  epf_rate: number
  socso_rate: number
  eis_rate: number
  tax_rate: number
  salary_type: 'monthly' | 'hourly' | 'commission'
  effective_date: string
  end_date?: string
  status: 'active' | 'inactive'
  notes?: string
  expand?: {
    teacher_id: {
      name: string
      email: string
    }
  }
}

interface TeacherSalaryRecord {
  id: string
  teacher_id: string
  salary_period: string
  year: number
  month: number
  base_salary: number
  hours_worked: number
  overtime_hours: number
  overtime_pay: number
  allowances: number
  gross_salary: number
  epf_deduction: number
  socso_deduction: number
  eis_deduction: number
  tax_deduction: number
  other_deductions: number
  net_salary: number
  bonus?: number
  commission?: number
  status: 'draft' | 'approved' | 'paid'
  payment_date?: string
  payment_method?: string
  bank_reference?: string
  notes?: string
  expand?: {
    teacher_id: {
      name: string
      email: string
    }
  }
}

interface Teacher {
  id: string
  name: string
  email: string
  department?: string
  position?: string
}

export default function TeacherSalaryManagement() {
  const { userProfile } = useAuth()
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [salaryStructures, setSalaryStructures] = useState<TeacherSalaryStructure[]>([])
  const [salaryRecords, setSalaryRecords] = useState<TeacherSalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)
  
  // Dialog states
  const [structureDialogOpen, setStructureDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<TeacherSalaryStructure | null>(null)
  const [editingRecord, setEditingRecord] = useState<TeacherSalaryRecord | null>(null)
  
  // Form states
  const [structureForm, setStructureForm] = useState({
    teacher_id: '',
    base_salary: 0,
    hourly_rate: 0,
    overtime_rate: 0,
    allowance_fixed: 0,
    allowance_transport: 0,
    allowance_meal: 0,
    allowance_other: 0,
    epf_rate: 0.11,
    socso_rate: 0.005,
    eis_rate: 0.002,
    tax_rate: 0,
    salary_type: 'monthly' as const,
    effective_date: '',
    end_date: '',
    notes: ''
  })
  
  const [recordForm, setRecordForm] = useState({
    teacher_id: '',
    salary_period: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    base_salary: 0,
    hours_worked: 0,
    overtime_hours: 0,
    overtime_pay: 0,
    allowances: 0,
    gross_salary: 0,
    epf_deduction: 0,
    socso_deduction: 0,
    eis_deduction: 0,
    tax_deduction: 0,
    other_deductions: 0,
    net_salary: 0,
    bonus: 0,
    commission: 0,
    notes: ''
  })
  
  // Filters
  const [filters, setFilters] = useState({
    teacher_id: '',
    year: new Date().getFullYear(),
    month: '',
    status: ''
  })

  // 数据获取
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch('/api/teachers')
      const result = await response.json()
      if (result.success && result.data && Array.isArray(result.data.items)) {
        setTeachers(result.data.items)
      } else {
        console.error('获取教师列表失败:', result.error || '数据格式错误')
        setTeachers([])
      }
    } catch (error) {
      console.error('获取教师列表失败:', error)
      setTeachers([])
    }
  }, [])

  const fetchSalaryStructures = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.teacher_id) params.append('teacher_id', filters.teacher_id)
      
      const response = await fetch(`/api/teacher-salary?type=structure&${params}`)
      const result = await response.json()
      if (result.success) {
        setSalaryStructures(result.data)
      }
    } catch (error) {
      console.error('获取薪资结构失败:', error)
      setError('获取薪资结构失败')
    }
  }, [filters.teacher_id])

  const fetchSalaryRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.teacher_id) params.append('teacher_id', filters.teacher_id)
      if (filters.year) params.append('year', filters.year.toString())
      if (filters.month) params.append('month', filters.month)
      if (filters.status) params.append('status', filters.status)
      
      const response = await fetch(`/api/teacher-salary?type=record&${params}`)
      const result = await response.json()
      if (result.success) {
        setSalaryRecords(result.data)
      }
    } catch (error) {
      console.error('获取薪资记录失败:', error)
      setError('获取薪资记录失败')
    }
  }, [filters])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchTeachers(),
        fetchSalaryStructures(),
        fetchSalaryRecords()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchTeachers, fetchSalaryStructures, fetchSalaryRecords])

  // 计算薪资
  const calculateSalary = useCallback((form: typeof structureForm) => {
    const baseSalary = form.base_salary
    const allowances = form.allowance_fixed + (form.allowance_transport || 0) + (form.allowance_meal || 0) + (form.allowance_other || 0)
    const grossSalary = baseSalary + allowances
    
    const epfDeduction = grossSalary * form.epf_rate
    const socsoDeduction = grossSalary * form.socso_rate
    const eisDeduction = grossSalary * form.eis_rate
    const taxDeduction = grossSalary * form.tax_rate
    const totalDeductions = epfDeduction + socsoDeduction + eisDeduction + taxDeduction
    const netSalary = grossSalary - totalDeductions
    
    return {
      grossSalary,
      epfDeduction,
      socsoDeduction,
      eisDeduction,
      taxDeduction,
      totalDeductions,
      netSalary
    }
  }, [])

  // 自动生成薪资
  const handleAutoGenerateSalary = async () => {
    setIsGenerating(true)
    try {
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const response = await fetch('/api/salary/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          created_by: userProfile?.id || 'system'
        })
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`薪资生成完成！\n成功: ${result.summary.success}\n跳过: ${result.summary.skipped}\n失败: ${result.summary.error}`)
        fetchSalaryRecords()
      } else {
        alert('薪资生成失败: ' + result.error)
      }
    } catch (error) {
      console.error('自动生成薪资失败:', error)
      alert('自动生成薪资失败')
    } finally {
      setIsGenerating(false)
    }
  }

  // 绩效调整薪资
  const handlePerformanceAdjustment = async () => {
    // 这里可以添加一个对话框让用户选择教师和绩效评估
    const teacherId = prompt('请输入教师ID:')
    const evaluationId = prompt('请输入绩效评估ID:')
    const adjustmentType = prompt('请输入调整类型 (conservative/moderate/aggressive):')
    
    if (!teacherId || !evaluationId || !adjustmentType) {
      return
    }
    
    setIsAdjusting(true)
    try {
      const response = await fetch('/api/salary/performance-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          evaluation_id: evaluationId,
          adjustment_type: adjustmentType,
          created_by: userProfile?.id || 'system'
        })
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`薪资调整完成！\n教师: ${teacherId}\n绩效评分: ${result.data.performance_score}\n调整幅度: ${result.data.adjustment_percentage}%`)
        fetchSalaryStructures()
      } else {
        alert('薪资调整失败: ' + result.error)
      }
    } catch (error) {
      console.error('绩效薪资调整失败:', error)
      alert('绩效薪资调整失败')
    } finally {
      setIsAdjusting(false)
    }
  }

  // 处理薪资结构表单
  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/teacher-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'structure', data: structureForm })
      })
      
      const result = await response.json()
      if (result.success) {
        setStructureDialogOpen(false)
        setStructureForm({
          teacher_id: '',
          base_salary: 0,
          hourly_rate: 0,
          overtime_rate: 0,
          allowance_fixed: 0,
          allowance_transport: 0,
          allowance_meal: 0,
          allowance_other: 0,
          epf_rate: 0.11,
          socso_rate: 0.005,
          eis_rate: 0.002,
          tax_rate: 0,
          salary_type: 'monthly',
          effective_date: '',
          end_date: '',
          notes: ''
        })
        fetchSalaryStructures()
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('创建薪资结构失败')
    }
  }

  // 处理薪资记录表单
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/teacher-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'record', data: recordForm })
      })
      
      const result = await response.json()
      if (result.success) {
        setRecordDialogOpen(false)
        setRecordForm({
          teacher_id: '',
          salary_period: '',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          base_salary: 0,
          hours_worked: 0,
          overtime_hours: 0,
          overtime_pay: 0,
          allowances: 0,
          gross_salary: 0,
          epf_deduction: 0,
          socso_deduction: 0,
          eis_deduction: 0,
          tax_deduction: 0,
          other_deductions: 0,
          net_salary: 0,
          bonus: 0,
          commission: 0,
          notes: ''
        })
        fetchSalaryRecords()
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('创建薪资记录失败')
    }
  }

  // 统计数据
  const stats = useMemo(() => {
    const totalGrossSalary = salaryRecords.reduce((sum, record) => sum + record.gross_salary, 0)
    const totalNetSalary = salaryRecords.reduce((sum, record) => sum + record.net_salary, 0)
    const totalDeductions = totalGrossSalary - totalNetSalary
    const averageSalary = salaryRecords.length > 0 ? totalNetSalary / salaryRecords.length : 0
    
    return {
      totalGrossSalary,
      totalNetSalary,
      totalDeductions,
      averageSalary,
      recordCount: salaryRecords.length
    }
  }, [salaryRecords])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">教师薪资管理</h1>
          <p className="text-gray-600">管理教师薪资结构和薪资记录</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setStructureDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建薪资结构
          </Button>
          <Button onClick={() => setRecordDialogOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            新建薪资记录
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总薪资支出</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalGrossSalary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">净薪资支出</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalNetSalary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均薪资</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageSalary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">薪资记录数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recordCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 自动操作按钮 */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={handleAutoGenerateSalary}
          disabled={isGenerating}
          className="bg-green-600 hover:bg-green-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              自动生成薪资
            </>
          )}
        </Button>
        
        <Button 
          onClick={handlePerformanceAdjustment}
          disabled={isAdjusting}
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
        >
          {isAdjusting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              调整中...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              绩效调整薪资
            </>
          )}
        </Button>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="structures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structures">薪资结构</TabsTrigger>
          <TabsTrigger value="records">薪资记录</TabsTrigger>
          <TabsTrigger value="automation">自动化</TabsTrigger>
        </TabsList>

        {/* 薪资结构标签页 */}
        <TabsContent value="structures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资结构列表</CardTitle>
              <CardDescription>管理教师的薪资结构和福利设置</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>教师</TableHead>
                    <TableHead>薪资类型</TableHead>
                    <TableHead>基本薪资</TableHead>
                    <TableHead>津贴</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>生效日期</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryStructures.map((structure) => (
                    <TableRow key={structure.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{structure.expand?.teacher_id?.name}</p>
                          <p className="text-sm text-gray-500">{structure.expand?.teacher_id?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {structure.salary_type === 'monthly' ? '月薪' : 
                           structure.salary_type === 'hourly' ? '时薪' : '佣金'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(structure.base_salary)}</TableCell>
                      <TableCell>{formatCurrency(structure.allowance_fixed)}</TableCell>
                      <TableCell>
                        <Badge variant={structure.status === 'active' ? 'default' : 'secondary'}>
                          {structure.status === 'active' ? '生效' : '失效'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(structure.effective_date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
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

        {/* 薪资记录标签页 */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资记录列表</CardTitle>
              <CardDescription>查看和管理教师的薪资发放记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>教师</TableHead>
                    <TableHead>薪资期间</TableHead>
                    <TableHead>基本薪资</TableHead>
                    <TableHead>津贴</TableHead>
                    <TableHead>总薪资</TableHead>
                    <TableHead>净薪资</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.expand?.teacher_id?.name}</p>
                          <p className="text-sm text-gray-500">{record.expand?.teacher_id?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.year}年{record.month}月</p>
                          <p className="text-sm text-gray-500">{record.salary_period}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(record.base_salary)}</TableCell>
                      <TableCell>{formatCurrency(record.allowances)}</TableCell>
                      <TableCell>{formatCurrency(record.gross_salary)}</TableCell>
                      <TableCell>{formatCurrency(record.net_salary)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          record.status === 'paid' ? 'default' : 
                          record.status === 'approved' ? 'secondary' : 'outline'
                        }>
                          {record.status === 'draft' ? '草稿' : 
                           record.status === 'approved' ? '已批准' : '已支付'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
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

        {/* 自动化标签页 */}
        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资自动化</CardTitle>
              <CardDescription>自动生成薪资记录和基于绩效的薪资调整</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 自动生成薪资 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">自动生成薪资</h3>
                <p className="text-sm text-gray-600 mb-4">
                  基于排班记录和考勤数据自动计算并生成月度薪资记录
                </p>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleAutoGenerateSalary}
                    disabled={isGenerating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        生成本月薪资
                      </>
                    )}
                  </Button>
                  <Button variant="outline" disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    配置规则
                  </Button>
                </div>
              </div>

              {/* 绩效薪资调整 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">绩效薪资调整</h3>
                <p className="text-sm text-gray-600 mb-4">
                  根据绩效评估结果自动调整教师薪资结构
                </p>
                <div className="flex gap-4">
                  <Button 
                    onClick={handlePerformanceAdjustment}
                    disabled={isAdjusting}
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    {isAdjusting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        调整中...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        绩效调整
                      </>
                    )}
                  </Button>
                  <Button variant="outline" disabled>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    查看绩效
                  </Button>
                </div>
              </div>

              {/* 自动化设置 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">自动化设置</h3>
                <p className="text-sm text-gray-600 mb-4">
                  配置薪资自动化的规则和参数
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>自动生成频率</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">每周</SelectItem>
                        <SelectItem value="monthly">每月</SelectItem>
                        <SelectItem value="quarterly">每季度</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>绩效调整阈值</Label>
                    <Select defaultValue="8">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7分以上</SelectItem>
                        <SelectItem value="8">8分以上</SelectItem>
                        <SelectItem value="9">9分以上</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 薪资结构对话框 */}
      <Dialog open={structureDialogOpen} onOpenChange={setStructureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建薪资结构</DialogTitle>
            <DialogDescription>为教师设置薪资结构和福利待遇</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStructureSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teacher_id">选择教师</Label>
                <Select value={structureForm.teacher_id} onValueChange={(value) => 
                  setStructureForm(prev => ({ ...prev, teacher_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择教师" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(teachers) && teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="salary_type">薪资类型</Label>
                <Select value={structureForm.salary_type} onValueChange={(value: any) => 
                  setStructureForm(prev => ({ ...prev, salary_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月薪</SelectItem>
                    <SelectItem value="hourly">时薪</SelectItem>
                    <SelectItem value="commission">佣金</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_salary">基本薪资</Label>
                <Input
                  id="base_salary"
                  type="number"
                  value={structureForm.base_salary}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    base_salary: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="allowance_fixed">固定津贴</Label>
                <Input
                  id="allowance_fixed"
                  type="number"
                  value={structureForm.allowance_fixed}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    allowance_fixed: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="allowance_transport">交通津贴</Label>
                <Input
                  id="allowance_transport"
                  type="number"
                  value={structureForm.allowance_transport}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    allowance_transport: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="allowance_meal">餐费津贴</Label>
                <Input
                  id="allowance_meal"
                  type="number"
                  value={structureForm.allowance_meal}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    allowance_meal: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="allowance_other">其他津贴</Label>
                <Input
                  id="allowance_other"
                  type="number"
                  value={structureForm.allowance_other}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    allowance_other: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="effective_date">生效日期</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={structureForm.effective_date}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    effective_date: e.target.value 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">结束日期（可选）</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={structureForm.end_date}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    end_date: e.target.value 
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={structureForm.notes}
                onChange={(e) => setStructureForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStructureDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">创建薪资结构</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 薪资记录对话框 */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建薪资记录</DialogTitle>
            <DialogDescription>记录教师的薪资发放情况</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="record_teacher_id">选择教师</Label>
                <Select value={recordForm.teacher_id} onValueChange={(value) => 
                  setRecordForm(prev => ({ ...prev, teacher_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择教师" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(teachers) && teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="salary_period">薪资期间</Label>
                <Input
                  id="salary_period"
                  value={recordForm.salary_period}
                  onChange={(e) => setRecordForm(prev => ({ 
                    ...prev, 
                    salary_period: e.target.value 
                  }))}
                  placeholder="例如：2024年1月"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">年份</Label>
                <Input
                  id="year"
                  type="number"
                  value={recordForm.year}
                  onChange={(e) => setRecordForm(prev => ({ 
                    ...prev, 
                    year: parseInt(e.target.value) || new Date().getFullYear() 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="month">月份</Label>
                <Select value={recordForm.month.toString()} onValueChange={(value) => 
                  setRecordForm(prev => ({ ...prev, month: parseInt(value) }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="base_salary">基本薪资</Label>
                <Input
                  id="base_salary"
                  type="number"
                  value={recordForm.base_salary}
                  onChange={(e) => setRecordForm(prev => ({ 
                    ...prev, 
                    base_salary: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="allowances">津贴总额</Label>
                <Input
                  id="allowances"
                  type="number"
                  value={recordForm.allowances}
                  onChange={(e) => setRecordForm(prev => ({ 
                    ...prev, 
                    allowances: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="gross_salary">总薪资</Label>
                <Input
                  id="gross_salary"
                  type="number"
                  value={recordForm.gross_salary}
                  onChange={(e) => setRecordForm(prev => ({ 
                    ...prev, 
                    gross_salary: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="net_salary">净薪资</Label>
                <Input
                  id="net_salary"
                  type="number"
                  value={recordForm.net_salary}
                  onChange={(e) => setRecordForm(prev => ({ 
                    ...prev, 
                    net_salary: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="bonus">奖金</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={recordForm.bonus}
                  onChange={(e) => setRecordForm(prev => ({ 
                    ...prev, 
                    bonus: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="record_notes">备注</Label>
              <Textarea
                id="record_notes"
                value={recordForm.notes}
                onChange={(e) => setRecordForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">创建薪资记录</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
