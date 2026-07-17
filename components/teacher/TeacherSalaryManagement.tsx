"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  FileDown,
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  Loader2,
  Settings,
  TrendingUp,
} from "lucide-react"

import { useAuth } from "@/contexts/pocketbase-auth-context"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { downloadPayslipPDF } from "@/lib/pdf-generator"
import PayslipSettingsManager, { type PayslipSettingsPreset } from "@/app/components/report/PayslipSettingsManager"

const formatCurrency = (amount: number) => {
  return `RM ${(amount || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Types
interface TeacherSalaryStructure {
  id: string
  teacher_id: string
  base_salary: number
  hourly_rate?: number
  overtime_rate?: number
  allowances: number
  epf_rate: number
  socso_rate: number
  eis_rate: number
  tax_rate: number
  epf_employer_rate?: number
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
  epf_employer?: number
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
  
  // Global salary settings (EPF/SOCSO/EIS/TAX rates)
  const [globalRates, setGlobalRates] = useState(() => {
    return { epf: 0.11, socso: 0.005, eis: 0.002, tax: 0, epf_employer: 0.13 }
  })
  
  // Fetch global rates from PocketBase
  useEffect(() => {
    const fetchGlobalRates = async () => {
      try {
        const response = await fetch('/api/salary-settings')
        const result = await response.json()
        if (result.success && result.data) {
          setGlobalRates({
            epf: result.data.epf_rate ?? 0.11,
            socso: result.data.socso_rate ?? 0.005,
            eis: result.data.eis_rate ?? 0.002,
            tax: result.data.tax_rate ?? 0,
            epf_employer: result.data.epf_employer_rate ?? 0.13,
          })
        }
      } catch (error) {
        console.error('获取薪资参数设置失败:', error)
      }
    }
    fetchGlobalRates()
  }, [])
  
  // Persist global rates to PocketBase
  const updateGlobalRates = async (updates: Partial<typeof globalRates>) => {
    const next = { ...globalRates, ...updates }
    setGlobalRates(next)
    try {
      await fetch('/api/salary-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          epf_rate: next.epf,
          socso_rate: next.socso,
          eis_rate: next.eis,
          tax_rate: next.tax,
          epf_employer_rate: next.epf_employer
        })
      })
    } catch (error) {
      console.error('保存薪资参数设置失败:', error)
    }
  }
  
  // Dialog states
  const [structureDialogOpen, setStructureDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<TeacherSalaryStructure | null>(null)
  const [editingRecord, setEditingRecord] = useState<TeacherSalaryRecord | null>(null)

  // Payslip PDF settings
  const [payslipSettings, setPayslipSettings] = useState<PayslipSettingsPreset>({
    id: "default", name: "默认设置", schoolName: "智慧教育学校", schoolNameEn: "",
    schoolLogo: "", schoolAddress: "", schoolPhone: "", schoolEmail: "",
    primaryColor: "#1e40af", secondaryColor: "#3b82f6", accentColor: "#f59e0b",
    footerText: "", showEmployerEPF: true,
    isDefault: true, createdAt: "", updatedAt: ""
  })
  const [isPayslipSettingsOpen, setIsPayslipSettingsOpen] = useState(false)
  const [payslipActivePresetId, setPayslipActivePresetId] = useState<string>()

  // Load payslip settings from PB
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/pocketbase-proxy/api/collections/salary_settings/records?perPage=1&sort=-created')
        if (!res.ok) return
        const data = await res.json()
        if (data.items?.length > 0) {
          const s = data.items[0]
          setPayslipSettings({
            id: s.id, name: s.name || "默认",
            schoolName: s.schoolName || "", schoolNameEn: s.schoolNameEn || "",
            schoolLogo: s.schoolLogo || "", schoolAddress: s.schoolAddress || "",
            schoolPhone: s.schoolPhone || "", schoolEmail: s.schoolEmail || "",
            primaryColor: s.primaryColor || "#1e40af", secondaryColor: s.secondaryColor || "#3b82f6",
            accentColor: s.accentColor || "#f59e0b", footerText: s.footerText || "",
            showEmployerEPF: s.showEmployerEPF !== false,
            isDefault: true, createdAt: s.created || "", updatedAt: s.updated || "",
          })
        }
      } catch {}
    }
    load()
  }, [])
  
  // Form states
  const [structureForm, setStructureForm] = useState({
    teacher_id: '',
    base_salary: 0,
    hourly_rate: 0,
    overtime_rate: 0,
    allowances: 0,
    epf_rate: 0.11,
    socso_rate: 0.005,
    eis_rate: 0.002,
    tax_rate: 0,
    epf_employer_rate: 0.13,
    salary_type: 'monthly' as 'monthly' | 'hourly' | 'commission',
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
      // API returns: { success: true, data: [...teachers], total: N }
      if (result.success && result.data && Array.isArray(result.data)) {
        setTeachers(result.data)
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
    const allowances = form.allowances
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
        toast.success(`薪资生成完成！成功: ${result.summary.success}, 跳过: ${result.summary.skipped}, 失败: ${result.summary.error}`)
        fetchSalaryRecords()
      } else {
        toast.error('薪资生成失败', { description: result.error })
      }
    } catch (error) {
      console.error('自动生成薪资失败:', error)
      toast.error('自动生成薪资失败')
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
        toast.success(`薪资调整完成！教师: ${teacherId}, 绩效评分: ${result.data.performance_score}, 调整幅度: ${result.data.adjustment_percentage}%`)
        fetchSalaryStructures()
      } else {
        toast.error('薪资调整失败', { description: result.error })
      }
    } catch (error) {
      console.error('绩效薪资调整失败:', error)
      toast.error('绩效薪资调整失败')
    } finally {
      setIsAdjusting(false)
    }
  }

  // 处理薪资结构表单
  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEdit = !!editingStructure
      const response = await fetch('/api/teacher-salary', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'structure',
          id: editingStructure?.id,
          data: structureForm
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setStructureDialogOpen(false)
        setStructureForm({
          teacher_id: '',
          base_salary: 0,
          hourly_rate: 0,
          overtime_rate: 0,
          allowances: 0,
          epf_rate: globalRates.epf,
          socso_rate: globalRates.socso,
          eis_rate: globalRates.eis,
          tax_rate: globalRates.tax,
          epf_employer_rate: globalRates.epf_employer || 0.13,
          salary_type: 'monthly',
          effective_date: '',
          end_date: '',
          notes: ''
        })
        fetchSalaryStructures()
        toast.success(isEdit ? '薪资结构更新成功' : '薪资结构创建成功')
      } else {
        toast.error('操作失败', { description: result.error })
        setError(result.error)
      }
    } catch (error) {
      toast.error('创建薪资结构失败')
      setError('创建薪资结构失败')
    }
  }

  // 编辑薪资结构
  // 新建薪资结构（重置表单用全局费率）
  const handleCreateStructure = () => {
    setEditingStructure(null)
    setStructureForm(prev => ({
      ...prev,
      teacher_id: '',
      base_salary: 0,
      hourly_rate: 0,
      overtime_rate: 0,
      allowances: 0,
      epf_rate: globalRates.epf,
      socso_rate: globalRates.socso,
      eis_rate: globalRates.eis,
      tax_rate: globalRates.tax,
      epf_employer_rate: globalRates.epf_employer || 0.13,
      salary_type: 'monthly',
      effective_date: '',
      end_date: '',
      notes: ''
    }))
    setStructureDialogOpen(true)
  }

  const handleEditStructure = (structure: TeacherSalaryStructure) => {
    setEditingStructure(structure)
    setStructureForm({
      teacher_id: structure.teacher_id,
      base_salary: structure.base_salary,
      hourly_rate: structure.hourly_rate || 0,
      overtime_rate: structure.overtime_rate || 0,
      allowances: structure.allowances || 0,
      epf_rate: structure.epf_rate ?? globalRates.epf,
      socso_rate: structure.socso_rate ?? globalRates.socso,
      eis_rate: structure.eis_rate ?? globalRates.eis,
      tax_rate: structure.tax_rate ?? globalRates.tax,
      epf_employer_rate: (structure.epf_employer_rate ?? globalRates.epf_employer) || 0.13,
      salary_type: structure.salary_type as 'monthly' | 'hourly' | 'commission',
      effective_date: structure.effective_date?.split(' ')[0] || '',
      end_date: structure.end_date?.split(' ')[0] || '',
      notes: structure.notes || ''
    })
    setStructureDialogOpen(true)
  }

  // 删除薪资结构
  const handleDeleteStructure = async (id: string) => {
    if (!confirm('确定要删除这个薪资结构吗？')) return
    try {
      const response = await fetch(`/api/teacher-salary?type=structure&id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        toast.success('薪资结构已删除')
        fetchSalaryStructures()
      } else {
        toast.error('删除失败', { description: result.error })
        setError(result.error)
      }
    } catch (error) {
      toast.error('删除薪资结构失败')
      setError('删除薪资结构失败')
    }
  }

  // 删除薪资记录
  const handleDeleteRecord = async (id: string) => {
    if (!confirm('确定要删除这条薪资记录吗？此操作不可恢复。')) return
    try {
      const response = await fetch(`/api/teacher-salary?type=record&id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        toast.success('薪资记录已删除')
        fetchSalaryRecords()
      } else {
        toast.error('删除失败', { description: result.error })
        setError(result.error)
      }
    } catch (error) {
      toast.error('删除薪资记录失败')
      setError('删除薪资记录失败')
    }
  }

  // 处理薪资记录表单
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isEdit = !!editingRecord
      const response = await fetch('/api/teacher-salary', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'record',
          id: editingRecord?.id,
          data: { ...recordForm, created_by: userProfile?.id || 'system' }
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setRecordDialogOpen(false)
        setEditingRecord(null)
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
        toast.success(isEdit ? "薪资记录更新成功" : "薪资记录创建成功")
      } else {
        toast.error(isEdit ? "更新失败" : "创建失败", { description: result.error })
        setError(result.error)
      }
    } catch (error) {
      toast.error("操作失败", { description: "网络错误" })
      setError('操作失败')
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
      {/* 操作按钮 - only structure creation at top level */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsPayslipSettingsOpen(true)}>
          <Settings className="h-4 h-4 mr-2" />
          设置
        </Button>
        <Button onClick={handleCreateStructure}>
          <Plus className="w-4 h-4 mr-2" />
          新建薪资结构
        </Button>
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

      {/* 全局薪资参数设置 */}
      <Card className="mb-6 border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            薪资参数设置
          </CardTitle>
          <CardDescription>设置 EPF、SOCSO、EIS、所得税等默认扣款比率，新建薪资结构时自动应用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="global_epf">EPF 雇员比率 (%)</Label>
              <Input
                id="global_epf"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={(globalRates.epf * 100).toFixed(1)}
                onChange={(e) => updateGlobalRates({ epf: (parseFloat(e.target.value) || 0) / 100 })}
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">雇员公积金</p>
            </div>
            <div>
              <Label htmlFor="global_socso">SOCSO 比率 (%)</Label>
              <Input
                id="global_socso"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={(globalRates.socso * 100).toFixed(2)}
                onChange={(e) => updateGlobalRates({ socso: (parseFloat(e.target.value) || 0) / 100 })}
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">社会保险</p>
            </div>
            <div>
              <Label htmlFor="global_eis">EIS 比率 (%)</Label>
              <Input
                id="global_eis"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={(globalRates.eis * 100).toFixed(2)}
                onChange={(e) => updateGlobalRates({ eis: (parseFloat(e.target.value) || 0) / 100 })}
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">就业保险</p>
            </div>
            <div>
              <Label htmlFor="global_tax">PCB 税率 (%)</Label>
              <Input
                id="global_tax"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={(globalRates.tax * 100).toFixed(1)}
                onChange={(e) => updateGlobalRates({ tax: (parseFloat(e.target.value) || 0) / 100 })}
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">每月预扣税（0=不扣）</p>
            </div>
            <div>
              <Label htmlFor="global_epf_employer">EPF 雇主比率 (%)</Label>
              <Input
                id="global_epf_employer"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={(globalRates.epf_employer * 100).toFixed(1)}
                onChange={(e) => updateGlobalRates({ epf_employer: (parseFloat(e.target.value) || 0) / 100 })}
                className="bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">雇主公积金</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 薪资结构 */}
      <section id="structures">
        <h2 className="text-lg font-semibold mb-3">薪资结构</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资结构列表</CardTitle>
              <CardDescription>管理教师的薪资结构和福利设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>教师</TableHead>
                    <TableHead>薪资类型</TableHead>
                    <TableHead>基本薪资</TableHead>
                    <TableHead>津贴</TableHead>
                    <TableHead>EPF %</TableHead>
                    <TableHead>SOCSO %</TableHead>
                    <TableHead>EIS %</TableHead>
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
                      <TableCell>{formatCurrency(structure.allowances)}</TableCell>
                      <TableCell>{(structure.epf_rate * 100).toFixed(1)}%</TableCell>
                      <TableCell>{(structure.socso_rate * 100).toFixed(2)}%</TableCell>
                      <TableCell>{(structure.eis_rate * 100).toFixed(2)}%</TableCell>
                      <TableCell>
                        <Badge variant={structure.status === 'active' ? 'default' : 'secondary'}>
                          {structure.status === 'active' ? '生效' : '失效'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(structure.effective_date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditStructure(structure)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteStructure(structure.id)}>
                            <Trash2 className="w-4 h-4" />
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
        </div>
      </section>

      {/* 分割线 */}
      <div className="border-t border-gray-200 my-6" />

      {/* 薪资记录 */}
      <section id="records">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">薪资记录</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRecordDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              新建薪资记录
            </Button>
            <Button 
              size="sm"
              onClick={handleAutoGenerateSalary}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />生成中...</>
              ) : (
                <><Calculator className="mr-1 h-3.5 w-3.5" />生成本月薪资</>
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>薪资记录列表</CardTitle>
              <CardDescription>查看和管理教师的薪资发放记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
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
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingRecord(record)
                            setRecordForm({
                              teacher_id: record.teacher_id,
                              salary_period: record.salary_period || '',
                              year: record.year,
                              month: record.month,
                              base_salary: record.base_salary,
                              hours_worked: record.hours_worked,
                              overtime_hours: record.overtime_hours,
                              overtime_pay: record.overtime_pay,
                              allowances: record.allowances,
                              gross_salary: record.gross_salary,
                              epf_deduction: record.epf_deduction,
                              socso_deduction: record.socso_deduction,
                              eis_deduction: record.eis_deduction,
                              tax_deduction: record.tax_deduction,
                              other_deductions: record.other_deductions,
                              net_salary: record.net_salary,
                              bonus: record.bonus || 0,
                              commission: record.commission || 0,
                              notes: record.notes || '',
                            })
                            setRecordDialogOpen(true)
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteRecord(record.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            const csv = [
                              ['教师', '年份', '月份', '基本薪资', '津贴', '加班费', '总薪资', '扣款', '净薪资', '奖金', '状态'],
                              [
                                record.expand?.teacher_id?.name || '',
                                record.year, record.month,
                                record.base_salary, record.allowances,
                                record.overtime_pay, record.gross_salary,
                                record.epf_deduction + record.eis_deduction + record.socso_deduction + record.tax_deduction + record.other_deductions,
                                record.net_salary, record.bonus || 0,
                                record.status
                              ]
                            ].map(r => r.join(',')).join('\n')
                            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url; a.download = `salary_${record.year}_${record.month}.csv`
                            a.click(); URL.revokeObjectURL(url)
                          }}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={record.status === 'approved' || record.status === 'paid' ? 'outline' : 'ghost'}
                            disabled={record.status !== 'approved' && record.status !== 'paid'}
                            title={record.status === 'approved' || record.status === 'paid' ? '下载薪资单PDF' : '仅已批准/已支付的记录可下载PDF'}
                            onClick={() => {
                              if (record.status === 'approved' || record.status === 'paid') {
                                downloadPayslipPDF(record, payslipSettings, record.expand?.teacher_id?.name || '教师')
                              }
                            }}
                          >
                            <FileDown className={`w-4 h-4 ${record.status === 'approved' || record.status === 'paid' ? 'text-blue-600' : 'text-gray-300'}`} />
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
        </div>
      </section>

      {/* 薪资结构对话框 */}
      <Dialog open={structureDialogOpen} onOpenChange={(open) => {
        setStructureDialogOpen(open)
        if (!open) setTimeout(() => setEditingStructure(null), 300)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStructure ? '编辑薪资结构' : '新建薪资结构'}</DialogTitle>
            <DialogDescription>{editingStructure ? '修改教师的薪资结构和福利设置' : '为教师设置薪资结构和福利待遇'}</DialogDescription>
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
                <Label htmlFor="allowances">每月补贴总额</Label>
                <Input
                  id="allowances"
                  type="number"
                  value={structureForm.allowances}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    allowances: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="epf_rate">EPF 雇员比率 (%)</Label>
                <Input
                  id="epf_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={(structureForm.epf_rate * 100).toFixed(1)}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    epf_rate: (parseFloat(e.target.value) || 0) / 100 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="socso_rate">SOCSO 比率 (%)</Label>
                <Input
                  id="socso_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(structureForm.socso_rate * 100).toFixed(2)}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    socso_rate: (parseFloat(e.target.value) || 0) / 100 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eis_rate">EIS 比率 (%)</Label>
                <Input
                  id="eis_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(structureForm.eis_rate * 100).toFixed(2)}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    eis_rate: (parseFloat(e.target.value) || 0) / 100 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="tax_rate">PCB 税率 (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={(structureForm.tax_rate * 100).toFixed(1)}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    tax_rate: (parseFloat(e.target.value) || 0) / 100 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="epf_employer_rate">EPF 雇主比率 (%)</Label>
                <Input
                  id="epf_employer_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={(structureForm.epf_employer_rate * 100).toFixed(1)}
                  onChange={(e) => setStructureForm(prev => ({ 
                    ...prev, 
                    epf_employer_rate: (parseFloat(e.target.value) || 0) / 100 
                  }))}
                />
              </div>
              <div></div>
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
              <Button type="submit">{editingStructure ? '更新薪资结构' : '创建薪资结构'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 薪资记录对话框 */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRecord ? '编辑薪资记录' : '新建薪资记录'}</DialogTitle>
            <DialogDescription>{editingRecord ? '修改教师的薪资发放记录' : '记录教师的薪资发放情况'}</DialogDescription>
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
              <Button type="submit">{editingRecord ? '更新薪资记录' : '创建薪资记录'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payslip Settings Dialog */}
      <Dialog open={isPayslipSettingsOpen} onOpenChange={setIsPayslipSettingsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />薪资单格式设置
            </DialogTitle>
            <DialogDescription>自定义薪资单 PDF 样式</DialogDescription>
          </DialogHeader>
          <PayslipSettingsManager
            onSettingsChange={(s) => {
              setPayslipSettings(s)
            }}
            activePresetId={payslipSettings.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
