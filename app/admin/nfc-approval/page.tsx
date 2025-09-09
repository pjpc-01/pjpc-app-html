"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Calendar,
  MapPin,
  User,
  Clock,
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  Ban,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  status: string
}

interface Teacher {
  id: string
  name: string
  email: string
  position: string
  department: string
}

interface NFCRequest {
  id: string
  student: string
  teacher: string
  card_status: string
  replacement_reason: string
  replacement_lost_date: string
  replacement_lost_location: string
  replacement_urgency: string
  replacement_status: string
  replacement_request_date: string
  replacement_notes: string
  approved_by?: string
  created: string
  updated: string
  expand?: {
    student?: Student
    teacher?: Teacher
  }
}

export default function NFCReplacementApproval() {
  const [requests, setRequests] = useState<NFCRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // 审核对话框状态
  const [selectedRequest, setSelectedRequest] = useState<NFCRequest | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState<string>("")

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      
      const [requestsRes, studentsRes, teachersRes] = await Promise.all([
        fetch('/api/nfc-cards'),
        fetch('/api/students'),
        fetch('/api/teachers')
      ])
      
      const [requestsData, studentsData, teachersData] = await Promise.all([
        requestsRes.json(),
        studentsRes.json(),
        teachersRes.json()
      ])
      
      console.log('🔍 NFC审核页面数据加载调试:')
      console.log('  - 请求数据:', requestsData)
      console.log('  - 学生数据:', studentsData)
      console.log('  - 教师数据:', teachersData)
      
      if (requestsData.success) {
        setRequests(requestsData.data || [])
        console.log('✅ 设置请求数据:', requestsData.data?.length || 0, '条')
      }
      
      if (studentsData.success) {
        setStudents(studentsData.students || [])
        console.log('✅ 设置学生数据:', studentsData.students?.length || 0, '条')
        if (studentsData.students?.length > 0) {
          console.log('📝 第一个学生:', studentsData.students[0])
        }
      }
      
      if (teachersData.success) {
        setTeachers(teachersData.data.items || [])
        console.log('✅ 设置教师数据:', teachersData.data.items?.length || 0, '条')
      }
      
    } catch (err: any) {
      setError(err.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新申请状态
  const updateRequestStatus = async (requestId: string, status: string) => {
    setProcessing(requestId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/nfc-cards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          replacementStatus: status,
          replacementNotes: approvalNotes,
          approvedBy: 'current-admin-id' // 这里应该从认证状态获取
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(data.message)
        setShowApprovalDialog(false)
        setApprovalNotes("")
        loadData()
      } else {
        setError(data.error || '更新申请状态失败')
      }
    } catch (err: any) {
      setError(err.message || '更新申请状态失败')
    } finally {
      setProcessing(null)
    }
  }

  // 打开审核对话框
  const openApprovalDialog = (request: NFCRequest) => {
    setSelectedRequest(request)
    setApprovalNotes(request.replacement_notes || "")
    setShowApprovalDialog(true)
  }

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '待审核', variant: 'secondary' as const, color: 'text-yellow-600' }
      case 'approved':
        return { text: '已批准', variant: 'default' as const, color: 'text-green-600' }
      case 'rejected':
        return { text: '已拒绝', variant: 'destructive' as const, color: 'text-red-600' }
      case 'completed':
        return { text: '已完成', variant: 'default' as const, color: 'text-blue-600' }
      default:
        return { text: '未知', variant: 'secondary' as const, color: 'text-gray-600' }
    }
  }

  // 获取紧急程度显示
  const getUrgencyDisplay = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return { text: '低', variant: 'outline' as const, color: 'text-gray-600' }
      case 'normal':
        return { text: '普通', variant: 'secondary' as const, color: 'text-blue-600' }
      case 'high':
        return { text: '高', variant: 'default' as const, color: 'text-orange-600' }
      case 'urgent':
        return { text: '紧急', variant: 'destructive' as const, color: 'text-red-600' }
      default:
        return { text: '普通', variant: 'secondary' as const, color: 'text-blue-600' }
    }
  }

  // 筛选请求
  const filteredRequests = requests.filter(request => {
    const student = students.find(s => s.id === request.student)
    const teacher = teachers.find(t => t.id === request.teacher)
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || request.replacement_status === statusFilter
    const matchesUrgency = !urgencyFilter || urgencyFilter === 'all' || request.replacement_urgency === urgencyFilter
    const matchesSearch = !searchTerm || 
      (student?.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student?.student_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesStatus && matchesUrgency && matchesSearch
  })

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mr-3" />
            <span>加载中...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回主页
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NFC卡补办审核</h1>
              <p className="text-gray-600">审核和管理学生NFC卡补办申请</p>
            </div>
          </div>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 筛选和搜索 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              筛选和搜索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">搜索学生/教师</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="输入学生姓名、学号或教师姓名"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">申请状态</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="approved">已批准</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="urgency">紧急程度</Label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部紧急程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部紧急程度</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="normal">普通</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setStatusFilter("all")
                    setUrgencyFilter("all")
                    setSearchTerm("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  清除筛选
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 申请列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              补办申请列表
              <Badge variant="outline">{filteredRequests.length} 条记录</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">暂无补办申请记录</p>
                <p className="text-sm">请调整筛选条件或等待新的申请</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  // 优先使用扩展数据，如果没有则从本地数据查找
                  const student = request.expand?.student || students.find(s => s.id === request.student)
                  const teacher = request.expand?.teacher || teachers.find(t => t.id === request.teacher)
                  const statusInfo = getStatusDisplay(request.replacement_status)
                  const urgencyInfo = getUrgencyDisplay(request.replacement_urgency)
                  
                  // 调试信息
                  console.log('🔍 查找学生:', {
                    requestId: request.id,
                    requestStudentId: request.student,
                    hasExpandStudent: !!request.expand?.student,
                    expandStudentName: request.expand?.student?.student_name,
                    studentsCount: students.length,
                    firstStudent: students[0] ? { id: students[0].id, name: students[0].student_name } : null
                  })
                  
                  if (!student) {
                    console.log('❌ 未找到学生:', {
                      requestId: request.id,
                      studentId: request.student,
                      availableStudents: students.map(s => ({ id: s.id, name: s.student_name }))
                    })
                  } else {
                    console.log('✅ 找到学生:', {
                      studentId: student.id,
                      studentName: student.student_name,
                      studentNameType: typeof student.student_name,
                      isExpandData: !!request.expand?.student
                    })
                  }
                  
                  return (
                    <div key={request.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {student?.student_name || '未知学生'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {student?.student_id || '未知学号'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            申请教师: {teacher?.name || '未知教师'}
                          </p>
                          <p className="text-sm text-gray-500">
                            申请时间: {new Date(request.replacement_request_date).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.text}
                          </Badge>
                          <Badge variant={urgencyInfo.variant}>
                            {urgencyInfo.text}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600"><strong>卡片状态:</strong> {request.card_status}</p>
                          <p className="text-sm text-gray-600"><strong>补办原因:</strong> {request.replacement_reason}</p>
                        </div>
                        <div>
                          {request.replacement_lost_date && (
                            <p className="text-sm text-gray-600"><strong>丢失日期:</strong> {new Date(request.replacement_lost_date).toLocaleDateString('zh-CN')}</p>
                          )}
                          {request.replacement_lost_location && (
                            <p className="text-sm text-gray-600"><strong>丢失地点:</strong> {request.replacement_lost_location}</p>
                          )}
                        </div>
                      </div>
                      
                      {request.replacement_notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700"><strong>备注:</strong> {request.replacement_notes}</p>
                        </div>
                      )}
                      
                      {request.replacement_status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openApprovalDialog(request)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            审核
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 审核对话框 */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                审核NFC卡补办申请
              </DialogTitle>
              <DialogDescription>
                审核并决定是否批准该补办申请
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>学生信息</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">
                        {students.find(s => s.id === selectedRequest.student)?.student_name || '未知学生'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {students.find(s => s.id === selectedRequest.student)?.student_id || '未知学号'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>申请教师</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="font-medium">
                        {teachers.find(t => t.id === selectedRequest.teacher)?.name || '未知教师'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>卡片状态</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p>{selectedRequest.card_status}</p>
                    </div>
                  </div>
                  <div>
                    <Label>紧急程度</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <Badge variant={getUrgencyDisplay(selectedRequest.replacement_urgency).variant}>
                        {getUrgencyDisplay(selectedRequest.replacement_urgency).text}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>补办原因</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p>{selectedRequest.replacement_reason}</p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="approvalNotes">审核备注</Label>
                  <Textarea
                    id="approvalNotes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="请输入审核意见或备注"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
              >
                取消
              </Button>
              <Button
                onClick={() => updateRequestStatus(selectedRequest!.id, 'rejected')}
                variant="destructive"
                disabled={processing === selectedRequest?.id}
              >
                {processing === selectedRequest?.id ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                拒绝
              </Button>
              <Button
                onClick={() => updateRequestStatus(selectedRequest!.id, 'approved')}
                className="bg-green-600 hover:bg-green-700"
                disabled={processing === selectedRequest?.id}
              >
                {processing === selectedRequest?.id ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                批准
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
