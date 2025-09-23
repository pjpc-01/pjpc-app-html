'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator, 
  DollarSign, 
  Clock, 
  Download, 
  Eye, 
  Filter,
  Search,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Settings
} from 'lucide-react'

interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  position: string
  basicSalary: number
  overtimePay: number
  allowances: number
  deductions: number
  grossSalary: number
  netSalary: number
  workingDays: number
  presentDays: number
  absentDays: number
  overtimeHours: number
  leaveDays: number
  payPeriod: string
  status: 'draft' | 'approved' | 'paid'
}

interface PayrollSummary {
  totalEmployees: number
  totalGrossSalary: number
  totalNetSalary: number
  totalOvertimePay: number
  totalAllowances: number
  totalDeductions: number
  averageSalary: number
  payrollCost: number
}

interface SalaryComponent {
  name: string
  amount: number
  type: 'basic' | 'allowance' | 'overtime' | 'deduction'
  description: string
}

export function PayrollIntegration() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [summary, setSummary] = useState<PayrollSummary | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)

  // 从API获取真实数据
  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        const today = new Date()
        const currentMonth = today.getMonth() + 1
        const currentYear = today.getFullYear()
        const payPeriod = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
        
        // 获取教师数据
        const teachersResponse = await fetch('/api/teachers')
        const teachersData = await teachersResponse.json()
        const teachers = teachersData.teachers || []
        
        // 获取考勤数据
        const attendanceResponse = await fetch(`/api/teacher-attendance?date=${today.toISOString().split('T')[0]}`)
        const attendanceData = await attendanceResponse.json()
        const attendanceRecords = attendanceData.records || []
        
        // 计算薪资记录
        const records: PayrollRecord[] = teachers.map((teacher: any) => {
          const teacherAttendance = attendanceRecords.filter((record: any) => record.teacher_id === teacher.id)
          const presentDays = teacherAttendance.filter((record: any) => record.check_in).length
          const workingDays = 22 // 假设一个月22个工作日
          const absentDays = workingDays - presentDays
          
          // 计算加班时间
          const overtimeHours = teacherAttendance.reduce((sum: number, record: any) => {
            if (record.check_in && record.check_out) {
              const checkIn = new Date(record.check_in)
              const checkOut = new Date(record.check_out)
              const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
              return sum + Math.max(0, hours - 8)
            }
            return sum
          }, 0)
          
          // 基本工资（从教师数据获取或使用默认值）
          const basicSalary = teacher.salary || 3000
          
          // 加班费计算（按1.5倍基本工资计算）
          const hourlyRate = basicSalary / (workingDays * 8)
          const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100
          
          // 津贴（固定津贴）
          const allowances = 200
          
          // 扣除项计算（EPF + SOCSO + EIS）
          const epfEmployee = Math.round(basicSalary * 0.11 * 100) / 100
          const socsoEmployee = Math.round(basicSalary * 0.005 * 100) / 100
          const eisEmployee = Math.round(basicSalary * 0.002 * 100) / 100
          const deductions = epfEmployee + socsoEmployee + eisEmployee
          
          const grossSalary = basicSalary + overtimePay + allowances
          const netSalary = grossSalary - deductions
          
          return {
            id: teacher.id,
            employeeId: teacher.id,
            employeeName: teacher.name || 'Unknown Teacher',
            department: teacher.department || 'Unknown',
            position: teacher.position || 'Unknown',
            basicSalary,
            overtimePay,
            allowances,
            deductions,
            grossSalary: Math.round(grossSalary * 100) / 100,
            netSalary: Math.round(netSalary * 100) / 100,
            workingDays,
            presentDays,
            absentDays,
            overtimeHours: Math.round(overtimeHours * 10) / 10,
            leaveDays: 0, // 需要从请假系统获取
            payPeriod,
            status: 'draft' as const
          }
        })
        
        setPayrollRecords(records)
        
        // 计算汇总数据
        const totalEmployees = records.length
        const totalGrossSalary = records.reduce((sum, r) => sum + r.grossSalary, 0)
        const totalNetSalary = records.reduce((sum, r) => sum + r.netSalary, 0)
        const totalOvertimePay = records.reduce((sum, r) => sum + r.overtimePay, 0)
        const totalAllowances = records.reduce((sum, r) => sum + r.allowances, 0)
        const totalDeductions = records.reduce((sum, r) => sum + r.deductions, 0)
        const averageSalary = totalEmployees > 0 ? Math.round((totalNetSalary / totalEmployees) * 100) / 100 : 0
        
        setSummary({
          totalEmployees,
          totalGrossSalary: Math.round(totalGrossSalary * 100) / 100,
          totalNetSalary: Math.round(totalNetSalary * 100) / 100,
          totalOvertimePay: Math.round(totalOvertimePay * 100) / 100,
          totalAllowances: Math.round(totalAllowances * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          averageSalary,
          payrollCost: Math.round(totalGrossSalary * 100) / 100
        })
      } catch (error) {
        console.error('获取薪资数据失败:', error)
        setPayrollRecords([])
        setSummary(null)
      }
    }
    
    fetchPayrollData()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'paid':
        return <DollarSign className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿'
      case 'approved':
        return '已批准'
      case 'paid':
        return '已支付'
      default:
        return '未知'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount)
  }

  const calculateAttendanceRate = (presentDays: number, workingDays: number) => {
    return ((presentDays / workingDays) * 100).toFixed(1)
  }

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEmployee = selectedEmployee === 'all' || record.employeeId === selectedEmployee
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus
    return matchesSearch && matchesEmployee && matchesStatus
  })

  const getSalaryComponents = (record: PayrollRecord): SalaryComponent[] => {
    return [
      {
        name: '基本工资',
        amount: record.basicSalary,
        type: 'basic',
        description: '月基本工资'
      },
      {
        name: '加班费',
        amount: record.overtimePay,
        type: 'overtime',
        description: `加班 ${record.overtimeHours} 小时`
      },
      {
        name: '津贴',
        amount: record.allowances,
        type: 'allowance',
        description: '交通津贴、餐补等'
      },
      {
        name: '扣除项',
        amount: -record.deductions,
        type: 'deduction',
        description: 'EPF、SOCSO、税务等'
      }
    ]
  }

  return (
    <div className="space-y-6">
      {/* 薪资统计 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总员工数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">员工</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总薪资支出</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalNetSalary)}
              </div>
              <p className="text-xs text-muted-foreground">
                毛薪资 {formatCurrency(summary.totalGrossSalary)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">平均薪资</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.averageSalary)}
              </div>
              <p className="text-xs text-muted-foreground">月平均</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">加班费</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.totalOvertimePay)}
              </div>
              <p className="text-xs text-muted-foreground">本月总计</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要功能区域 */}
      <Tabs defaultValue="payroll" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payroll">薪资管理</TabsTrigger>
          <TabsTrigger value="calculation">薪资计算</TabsTrigger>
          <TabsTrigger value="reports">薪资报告</TabsTrigger>
          <TabsTrigger value="settings">薪资设置</TabsTrigger>
        </TabsList>

        {/* 薪资管理 */}
        <TabsContent value="payroll" className="space-y-6">
          {/* 筛选和搜索 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                薪资管理
              </CardTitle>
              <CardDescription>管理和查看员工薪资记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索员工姓名或工号..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="薪资周期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">当前周期</SelectItem>
                    <SelectItem value="last">上期</SelectItem>
                    <SelectItem value="2024-01">2024年1月</SelectItem>
                    <SelectItem value="2024-02">2024年2月</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="approved">已批准</SelectItem>
                    <SelectItem value="paid">已支付</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Filter className="h-4 w-4 mr-2" />
                  应用筛选
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  导出薪资单
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 薪资记录列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  薪资记录
                </span>
                <Badge variant="outline">
                  {filteredRecords.length} 条记录
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">员工信息</th>
                      <th className="text-left py-3 px-4">基本工资</th>
                      <th className="text-left py-3 px-4">加班费</th>
                      <th className="text-left py-3 px-4">津贴</th>
                      <th className="text-left py-3 px-4">扣除项</th>
                      <th className="text-left py-3 px-4">实发工资</th>
                      <th className="text-left py-3 px-4">出勤率</th>
                      <th className="text-left py-3 px-4">状态</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{record.employeeName}</div>
                            <div className="text-sm text-gray-500">
                              {record.employeeId} · {record.department}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(record.basicSalary)}</td>
                        <td className="py-3 px-4">
                          {record.overtimePay > 0 ? (
                            <span className="text-purple-600 font-medium">
                              {formatCurrency(record.overtimePay)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{formatCurrency(record.allowances)}</td>
                        <td className="py-3 px-4 text-red-600">
                          -{formatCurrency(record.deductions)}
                        </td>
                        <td className="py-3 px-4 font-bold text-green-600">
                          {formatCurrency(record.netSalary)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">
                              {calculateAttendanceRate(record.presentDays, record.workingDays)}%
                            </div>
                            <div className="text-gray-500">
                              {record.presentDays}/{record.workingDays} 天
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(record.status)}
                            <Badge className={getStatusColor(record.status)}>
                              {getStatusText(record.status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 薪资计算 */}
        <TabsContent value="calculation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                薪资计算器
              </CardTitle>
              <CardDescription>根据考勤记录自动计算员工薪资</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">基本工资计算</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">月基本工资</label>
                      <Input placeholder="输入基本工资" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">工作天数</label>
                      <Input placeholder="输入工作天数" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">出勤天数</label>
                      <Input placeholder="输入出勤天数" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">加班费计算</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">加班小时数</label>
                      <Input placeholder="输入加班小时" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">加班费率</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择费率" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.5">1.5倍 (工作日)</SelectItem>
                          <SelectItem value="2.0">2.0倍 (休息日)</SelectItem>
                          <SelectItem value="3.0">3.0倍 (公共假期)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">计算结果</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">基本工资</div>
                      <div className="text-lg font-bold">RM 0.00</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">加班费</div>
                      <div className="text-lg font-bold">RM 0.00</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">津贴</div>
                      <div className="text-lg font-bold">RM 0.00</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">实发工资</div>
                      <div className="text-lg font-bold text-green-600">RM 0.00</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">重置</Button>
                  <Button>计算薪资</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 薪资报告 */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                薪资报告
              </CardTitle>
              <CardDescription>生成和分析薪资相关报告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  月度薪资报告
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  薪资趋势分析
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <PieChart className="h-6 w-6 mb-2" />
                  部门薪资对比
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Clock className="h-6 w-6 mb-2" />
                  加班费报告
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <User className="h-6 w-6 mb-2" />
                  个人薪资历史
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  导出薪资单
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 薪资设置 */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                薪资设置
              </CardTitle>
              <CardDescription>配置薪资计算规则和参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">马来西亚薪资法规</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>EPF 员工贡献率:</span>
                        <span className="font-medium">11%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EPF 雇主贡献率:</span>
                        <span className="font-medium">12%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SOCSO 员工贡献率:</span>
                        <span className="font-medium">0.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SOCSO 雇主贡献率:</span>
                        <span className="font-medium">1.75%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EIS 员工贡献率:</span>
                        <span className="font-medium">0.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EIS 雇主贡献率:</span>
                        <span className="font-medium">0.2%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">加班费设置</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>工作日加班费率:</span>
                        <span className="font-medium">1.5倍</span>
                      </div>
                      <div className="flex justify-between">
                        <span>休息日加班费率:</span>
                        <span className="font-medium">2.0倍</span>
                      </div>
                      <div className="flex justify-between">
                        <span>公共假期加班费率:</span>
                        <span className="font-medium">3.0倍</span>
                      </div>
                      <div className="flex justify-between">
                        <span>最低工资标准:</span>
                        <span className="font-medium">RM 1,500/月</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">重要提醒</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• 所有薪资计算必须符合马来西亚劳工法令</li>
                    <li>• EPF、SOCSO、EIS 贡献必须按时缴纳</li>
                    <li>• 加班费计算必须按照法定费率执行</li>
                    <li>• 薪资记录必须保存至少7年</li>
                    <li>• 员工有权查看自己的薪资单</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
