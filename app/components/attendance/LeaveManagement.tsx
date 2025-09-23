'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Calendar, 
  Clock, 
  Download, 
  Eye, 
  Filter,
  Search,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  FileText,
  CalendarDays,
  UserCheck,
  UserX
} from 'lucide-react'

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  department: string
  leaveType: 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity' | 'unpaid'
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  appliedDate: string
  approvedBy?: string
  approvedDate?: string
  rejectionReason?: string
  attachments?: string[]
}

interface LeaveBalance {
  employeeId: string
  employeeName: string
  annualLeave: number
  sickLeave: number
  emergencyLeave: number
  maternityLeave: number
  paternityLeave: number
  usedAnnual: number
  usedSick: number
  usedEmergency: number
  usedMaternity: number
  usedPaternity: number
}

export function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  // 模拟数据
  useEffect(() => {
    const mockRequests: LeaveRequest[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        employeeName: 'Ahmad Rahman',
        department: '教学部',
        leaveType: 'annual',
        startDate: '2024-01-20',
        endDate: '2024-01-22',
        totalDays: 3,
        reason: '家庭聚会',
        status: 'pending',
        appliedDate: '2024-01-15'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        employeeName: 'Siti Aminah',
        department: '行政部',
        leaveType: 'sick',
        startDate: '2024-01-18',
        endDate: '2024-01-18',
        totalDays: 1,
        reason: '发烧感冒',
        status: 'approved',
        appliedDate: '2024-01-17',
        approvedBy: 'HR Manager',
        approvedDate: '2024-01-17'
      },
      {
        id: '3',
        employeeId: 'EMP003',
        employeeName: 'Muhammad Ali',
        department: '教学部',
        leaveType: 'emergency',
        startDate: '2024-01-16',
        endDate: '2024-01-16',
        totalDays: 1,
        reason: '紧急家庭事务',
        status: 'approved',
        appliedDate: '2024-01-16',
        approvedBy: 'Department Head',
        approvedDate: '2024-01-16'
      },
      {
        id: '4',
        employeeId: 'EMP004',
        employeeName: 'Fatimah Zahra',
        department: '支持部',
        leaveType: 'maternity',
        startDate: '2024-02-01',
        endDate: '2024-05-01',
        totalDays: 90,
        reason: '产假',
        status: 'pending',
        appliedDate: '2024-01-10'
      }
    ]

    const mockBalances: LeaveBalance[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'Ahmad Rahman',
        annualLeave: 21,
        sickLeave: 14,
        emergencyLeave: 3,
        maternityLeave: 0,
        paternityLeave: 0,
        usedAnnual: 5,
        usedSick: 2,
        usedEmergency: 1,
        usedMaternity: 0,
        usedPaternity: 0
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Siti Aminah',
        annualLeave: 21,
        sickLeave: 14,
        emergencyLeave: 3,
        maternityLeave: 0,
        paternityLeave: 0,
        usedAnnual: 3,
        usedSick: 4,
        usedEmergency: 0,
        usedMaternity: 0,
        usedPaternity: 0
      }
    ]

    setLeaveRequests(mockRequests)
    setLeaveBalances(mockBalances)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审批'
      case 'approved':
        return '已批准'
      case 'rejected':
        return '已拒绝'
      case 'cancelled':
        return '已取消'
      default:
        return '未知'
    }
  }

  const getLeaveTypeText = (type: string) => {
    switch (type) {
      case 'annual':
        return '年假'
      case 'sick':
        return '病假'
      case 'emergency':
        return '紧急假'
      case 'maternity':
        return '产假'
      case 'paternity':
        return '陪产假'
      case 'unpaid':
        return '无薪假'
      default:
        return '未知'
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-100 text-blue-800'
      case 'sick':
        return 'bg-red-100 text-red-800'
      case 'emergency':
        return 'bg-orange-100 text-orange-800'
      case 'maternity':
        return 'bg-pink-100 text-pink-800'
      case 'paternity':
        return 'bg-purple-100 text-purple-800'
      case 'unpaid':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus
    const matchesType = selectedType === 'all' || request.leaveType === selectedType
    return matchesSearch && matchesStatus && matchesType
  })

  const handleApprove = (requestId: string) => {
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'approved' as const, approvedBy: 'Current User', approvedDate: new Date().toISOString().split('T')[0] }
        : req
    ))
  }

  const handleReject = (requestId: string) => {
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'rejected' as const, rejectionReason: '不符合公司政策' }
        : req
    ))
  }

  return (
    <div className="space-y-6">
      {/* 请假统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">待审批</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {leaveRequests.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">请假申请</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">本月批准</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leaveRequests.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">已批准</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">总请假天数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveRequests.reduce((sum, r) => sum + r.totalDays, 0)}
            </div>
            <p className="text-xs text-muted-foreground">天</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均请假</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(leaveRequests.reduce((sum, r) => sum + r.totalDays, 0) / leaveRequests.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">天/人</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要功能区域 */}
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">请假申请</TabsTrigger>
          <TabsTrigger value="balances">假期余额</TabsTrigger>
          <TabsTrigger value="policies">请假政策</TabsTrigger>
        </TabsList>

        {/* 请假申请 */}
        <TabsContent value="requests" className="space-y-6">
          {/* 筛选和搜索 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                请假申请管理
              </CardTitle>
              <CardDescription>管理和审批员工请假申请</CardDescription>
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
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待审批</SelectItem>
                    <SelectItem value="approved">已批准</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="请假类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="annual">年假</SelectItem>
                    <SelectItem value="sick">病假</SelectItem>
                    <SelectItem value="emergency">紧急假</SelectItem>
                    <SelectItem value="maternity">产假</SelectItem>
                    <SelectItem value="paternity">陪产假</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Filter className="h-4 w-4 mr-2" />
                  应用筛选
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  导出报告
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 请假申请列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  请假申请列表
                </span>
                <Badge variant="outline">
                  {filteredRequests.length} 条申请
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div>
                            <h3 className="font-medium">{request.employeeName}</h3>
                            <p className="text-sm text-gray-500">
                              {request.employeeId} · {request.department}
                            </p>
                          </div>
                          <Badge className={getLeaveTypeColor(request.leaveType)}>
                            {getLeaveTypeText(request.leaveType)}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">请假日期:</span>
                            <p className="font-medium">{request.startDate} 至 {request.endDate}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">请假天数:</span>
                            <p className="font-medium">{request.totalDays} 天</p>
                          </div>
                          <div>
                            <span className="text-gray-500">申请日期:</span>
                            <p className="font-medium">{request.appliedDate}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">请假原因:</span>
                            <p className="font-medium">{request.reason}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              批准
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              拒绝
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 假期余额 */}
        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                员工假期余额
              </CardTitle>
              <CardDescription>查看员工各类假期余额使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">员工信息</th>
                      <th className="text-left py-3 px-4">年假</th>
                      <th className="text-left py-3 px-4">病假</th>
                      <th className="text-left py-3 px-4">紧急假</th>
                      <th className="text-left py-3 px-4">产假</th>
                      <th className="text-left py-3 px-4">陪产假</th>
                      <th className="text-left py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveBalances.map((balance) => (
                      <tr key={balance.employeeId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{balance.employeeName}</div>
                            <div className="text-sm text-gray-500">{balance.employeeId}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{balance.annualLeave - balance.usedAnnual} 天</div>
                            <div className="text-gray-500">已用 {balance.usedAnnual}/{balance.annualLeave}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{balance.sickLeave - balance.usedSick} 天</div>
                            <div className="text-gray-500">已用 {balance.usedSick}/{balance.sickLeave}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{balance.emergencyLeave - balance.usedEmergency} 天</div>
                            <div className="text-gray-500">已用 {balance.usedEmergency}/{balance.emergencyLeave}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{balance.maternityLeave - balance.usedMaternity} 天</div>
                            <div className="text-gray-500">已用 {balance.usedMaternity}/{balance.maternityLeave}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{balance.paternityLeave - balance.usedPaternity} 天</div>
                            <div className="text-gray-500">已用 {balance.usedPaternity}/{balance.paternityLeave}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 请假政策 */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                马来西亚劳工法令请假政策
              </CardTitle>
              <CardDescription>符合马来西亚劳工法令的请假政策说明</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">年假 (Annual Leave)</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 工作满1年：12天年假</li>
                      <li>• 工作满2年：13天年假</li>
                      <li>• 工作满3年：14天年假</li>
                      <li>• 工作满4年：15天年假</li>
                      <li>• 工作满5年及以上：16天年假</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">病假 (Sick Leave)</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 工作满4个月：14天病假</li>
                      <li>• 工作满6个月：18天病假</li>
                      <li>• 工作满1年：22天病假</li>
                      <li>• 工作满2年：28天病假</li>
                      <li>• 工作满3年及以上：30天病假</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">产假 (Maternity Leave)</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 连续工作满12个月：90天产假</li>
                      <li>• 连续工作满3个月但未满12个月：60天产假</li>
                      <li>• 产假期间享受全薪</li>
                      <li>• 产假可提前30天申请</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">陪产假 (Paternity Leave)</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• 连续工作满12个月：7天陪产假</li>
                      <li>• 陪产假期间享受全薪</li>
                      <li>• 陪产假在孩子出生后30天内使用</li>
                      <li>• 需要提供出生证明</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">重要提醒</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• 所有请假申请需要提前至少24小时提交</li>
                    <li>• 紧急情况除外，但需要事后补交说明</li>
                    <li>• 病假需要提供医生证明（超过3天）</li>
                    <li>• 年假需要提前2周申请</li>
                    <li>• 未使用的年假可以累积到下一年（最多2年）</li>
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
