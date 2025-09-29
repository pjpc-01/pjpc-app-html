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
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  Filter,
  FileText,
  TrendingUp,
  PieChart
} from "lucide-react"

import { useAuth } from "@/contexts/pocketbase-auth-context"
import { formatDate } from "@/lib/utils"

// Types
interface TeacherLeaveRecord {
  id: string
  teacher_id: string
  leave_type: 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity' | 'unpaid'
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  applied_date: string
  approved_by?: string
  approved_date?: string
  rejection_reason?: string
  substitute_teacher?: string
  notes?: string
  expand?: {
    teacher_id: {
      name: string
      email: string
    }
    approved_by?: {
      name: string
      email: string
    }
    substitute_teacher?: {
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

export default function TeacherLeaveManagement() {
  const { userProfile } = useAuth()
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [leaveRecords, setLeaveRecords] = useState<TeacherLeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<TeacherLeaveRecord | null>(null)
  
  // Form states
  const [leaveForm, setLeaveForm] = useState({
    teacher_id: '',
    leave_type: 'annual' as const,
    start_date: '',
    end_date: '',
    reason: '',
    substitute_teacher: '',
    notes: ''
  })
  
  const [approvalForm, setApprovalForm] = useState<{
    status: 'approved' | 'rejected'
    rejection_reason: string
    notes: string
  }>({
    status: 'approved',
    rejection_reason: '',
    notes: ''
  })
  
  // Filters
  const [filters, setFilters] = useState({
    teacher_id: '',
    status: '',
    year: new Date().getFullYear(),
    month: ''
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

  const fetchLeaveRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.teacher_id && filters.teacher_id !== 'all') params.append('teacher_id', filters.teacher_id)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.year) params.append('year', filters.year.toString())
      if (filters.month && filters.month !== 'all') params.append('month', filters.month)
      
      const response = await fetch(`/api/teacher-leave?${params}`)
      const result = await response.json()
      if (result.success) {
        setLeaveRecords(result.data)
      }
    } catch (error) {
      console.error('获取请假记录失败:', error)
      setError('获取请假记录失败')
    }
  }, [filters])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchTeachers(),
        fetchLeaveRecords()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchTeachers, fetchLeaveRecords])

  // 计算请假天数
  const calculateLeaveDays = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const timeDiff = end.getTime() - start.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
  }, [])

  // 处理请假申请表单
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/teacher-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm)
      })
      
      const result = await response.json()
      if (result.success) {
        setLeaveDialogOpen(false)
        setLeaveForm({
          teacher_id: '',
          leave_type: 'annual',
          start_date: '',
          end_date: '',
          reason: '',
          substitute_teacher: '',
          notes: ''
        })
        fetchLeaveRecords()
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('创建请假申请失败')
    }
  }

  // 处理审批表单
  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLeave) return

    try {
      const response = await fetch('/api/teacher-leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLeave.id,
          status: approvalForm.status,
          approved_by: userProfile?.id,
          rejection_reason: approvalForm.status === 'rejected' ? approvalForm.rejection_reason : undefined,
          notes: approvalForm.notes
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setApprovalDialogOpen(false)
        setEditingLeave(null)
        setApprovalForm({
          status: 'approved',
          rejection_reason: '',
          notes: ''
        })
        fetchLeaveRecords()
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('处理审批失败')
    }
  }

  // 统计数据
  const stats = useMemo(() => {
    const totalLeaves = leaveRecords.length
    const pendingLeaves = leaveRecords.filter(record => record.status === 'pending').length
    const approvedLeaves = leaveRecords.filter(record => record.status === 'approved').length
    const rejectedLeaves = leaveRecords.filter(record => record.status === 'rejected').length
    
    const totalDays = leaveRecords.reduce((sum, record) => sum + record.total_days, 0)
    const averageDays = totalLeaves > 0 ? totalDays / totalLeaves : 0
    
    const leaveTypeStats = leaveRecords.reduce((acc, record) => {
      acc[record.leave_type] = (acc[record.leave_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      totalDays,
      averageDays,
      leaveTypeStats
    }
  }, [leaveRecords])

  // 获取请假类型中文名称
  const getLeaveTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'annual': '年假',
      'sick': '病假',
      'emergency': '紧急事假',
      'maternity': '产假',
      'paternity': '陪产假',
      'unpaid': '无薪假'
    }
    return typeMap[type] || type
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  // 获取状态中文名称
  const getStatusName = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待审批',
      'approved': '已批准',
      'rejected': '已拒绝',
      'cancelled': '已取消'
    }
    return statusMap[status] || status
  }

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
          <h1 className="text-3xl font-bold text-gray-900">教师请假管理</h1>
          <p className="text-gray-600">管理教师请假申请和审批流程</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLeaveDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建请假申请
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总请假申请</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">待审批</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">已批准</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedLeaves}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总请假天数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="teacher_filter">教师</Label>
              <Select value={filters.teacher_id} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, teacher_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择教师" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部教师</SelectItem>
                    {Array.isArray(teachers) && teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status_filter">状态</Label>
              <Select value={filters.status} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待审批</SelectItem>
                  <SelectItem value="approved">已批准</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year_filter">年份</Label>
              <Input
                id="year_filter"
                type="number"
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  year: parseInt(e.target.value) || new Date().getFullYear() 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="month_filter">月份</Label>
              <Select value={filters.month} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, month: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择月份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部月份</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 请假记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>请假记录列表</CardTitle>
          <CardDescription>查看和管理教师的请假申请</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>教师</TableHead>
                <TableHead>请假类型</TableHead>
                <TableHead>请假期间</TableHead>
                <TableHead>天数</TableHead>
                <TableHead>原因</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>申请日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.expand?.teacher_id?.name}</p>
                      <p className="text-sm text-gray-500">{record.expand?.teacher_id?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getLeaveTypeName(record.leave_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatDate(record.start_date)}</p>
                      <p className="text-sm text-gray-500">至 {formatDate(record.end_date)}</p>
                    </div>
                  </TableCell>
                  <TableCell>{record.total_days} 天</TableCell>
                  <TableCell className="max-w-xs truncate">{record.reason}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(record.status)}>
                      {getStatusName(record.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(record.applied_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {record.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingLeave(record)
                            setApprovalDialogOpen(true)
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
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

      {/* 请假申请对话框 */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新建请假申请</DialogTitle>
            <DialogDescription>提交教师的请假申请</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teacher_id">选择教师</Label>
                <Select value={leaveForm.teacher_id} onValueChange={(value) => 
                  setLeaveForm(prev => ({ ...prev, teacher_id: value }))
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
                <Label htmlFor="leave_type">请假类型</Label>
                <Select value={leaveForm.leave_type} onValueChange={(value: any) => 
                  setLeaveForm(prev => ({ ...prev, leave_type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">年假</SelectItem>
                    <SelectItem value="sick">病假</SelectItem>
                    <SelectItem value="emergency">紧急事假</SelectItem>
                    <SelectItem value="maternity">产假</SelectItem>
                    <SelectItem value="paternity">陪产假</SelectItem>
                    <SelectItem value="unpaid">无薪假</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">开始日期</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={leaveForm.start_date}
                  onChange={(e) => {
                    const newStartDate = e.target.value
                    setLeaveForm(prev => ({ 
                      ...prev, 
                      start_date: newStartDate,
                      end_date: newStartDate > prev.end_date ? newStartDate : prev.end_date
                    }))
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">结束日期</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm(prev => ({ 
                    ...prev, 
                    end_date: e.target.value 
                  }))}
                  min={leaveForm.start_date}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">请假原因</Label>
              <Textarea
                id="reason"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                rows={3}
                placeholder="请详细说明请假原因..."
              />
            </div>

            <div>
              <Label htmlFor="substitute_teacher">代课教师（可选）</Label>
              <Select value={leaveForm.substitute_teacher} onValueChange={(value) => 
                setLeaveForm(prev => ({ ...prev, substitute_teacher: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="选择代课教师" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无需代课</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} - {teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={leaveForm.notes}
                onChange={(e) => setLeaveForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={2}
                placeholder="其他需要说明的信息..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLeaveDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">提交申请</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 审批对话框 */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>审批请假申请</DialogTitle>
            <DialogDescription>
              审批 {editingLeave?.expand?.teacher_id?.name} 的请假申请
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApprovalSubmit} className="space-y-4">
            <div>
              <Label htmlFor="approval_status">审批结果</Label>
              <Select value={approvalForm.status} onValueChange={(value: any) => 
                setApprovalForm(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">批准</SelectItem>
                  <SelectItem value="rejected">拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {approvalForm.status === 'rejected' && (
              <div>
                <Label htmlFor="rejection_reason">拒绝原因</Label>
                <Textarea
                  id="rejection_reason"
                  value={approvalForm.rejection_reason}
                  onChange={(e) => setApprovalForm(prev => ({ 
                    ...prev, 
                    rejection_reason: e.target.value 
                  }))}
                  rows={3}
                  placeholder="请说明拒绝的原因..."
                />
              </div>
            )}

            <div>
              <Label htmlFor="approval_notes">审批备注</Label>
              <Textarea
                id="approval_notes"
                value={approvalForm.notes}
                onChange={(e) => setApprovalForm(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                rows={2}
                placeholder="审批意见或备注..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" variant={approvalForm.status === 'approved' ? 'default' : 'destructive'}>
                {approvalForm.status === 'approved' ? '批准申请' : '拒绝申请'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
