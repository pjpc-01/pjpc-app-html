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
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  CreditCard, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Calendar,
  MapPin,
  User,
  Clock,
  FileText
} from "lucide-react"
import SmartStudentSelector from "./SmartStudentSelector"

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  status: string
}

interface NFCRequest {
  id: string
  student_id: string
  teacher_id: string
  card_status: string
  replacement_reason: string
  replacement_lost_date: string
  replacement_lost_location: string
  replacement_urgency: string
  replacement_status: string
  replacement_request_date: string
  replacement_notes: string
  created: string
  updated: string
}

export default function NFCReplacementCard() {
  const [students, setStudents] = useState<Student[]>([])
  const [requests, setRequests] = useState<NFCRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  
  // 表单状态
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [cardStatus, setCardStatus] = useState<string>("")
  const [replacementReason, setReplacementReason] = useState<string>("")
  const [lostDate, setLostDate] = useState<string>("")
  const [lostLocation, setLostLocation] = useState<string>("")
  const [urgency, setUrgency] = useState<string>("normal")
  const [notes, setNotes] = useState<string>("")

  // 加载学生列表
  const loadStudents = async () => {
    try {
      setLoading(true)
      console.log('🔄 开始加载学生列表...')
      
      const response = await fetch('/api/students')
      const data = await response.json()
      
      console.log('📊 API响应数据:', data)
      
      if (data.success) {
        // 根据API实际返回的数据结构调整
        const studentsData = data.students || data.data?.items || data.data || []
        console.log('✅ 成功加载学生数据:', studentsData.length, '个学生')
        setStudents(studentsData)
      } else {
        console.error('❌ API返回失败:', data.error)
        setError(data.error || '加载学生列表失败')
      }
    } catch (err: any) {
      console.error('❌ 加载学生列表异常:', err)
      setError(err.message || '加载学生列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载补办申请列表
  const loadRequests = async () => {
    try {
      console.log('🔄 开始加载补办申请列表...')
      
      const response = await fetch('/api/nfc-cards')
      const data = await response.json()
      
      console.log('📊 补办申请API响应:', data)
      
      if (data.success) {
        const requestsData = data.data || []
        console.log('✅ 成功加载补办申请:', requestsData.length, '个申请')
        setRequests(requestsData)
      } else {
        console.error('❌ 补办申请API返回失败:', data.error)
        setError(data.error || '加载补办申请失败')
      }
    } catch (err: any) {
      console.error('❌ 加载补办申请异常:', err)
      setError(err.message || '加载补办申请失败')
    }
  }

  // 提交补办申请
  const submitRequest = async () => {
    if (!selectedStudent || !cardStatus || !replacementReason) {
      setError('请填写所有必需字段')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/nfc-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          teacherId: 'current-teacher-id', // 这里应该从认证状态获取
          cardStatus,
          replacementReason,
          lostDate: lostDate || null,
          lostLocation,
          urgency,
          notes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(data.message)
        resetForm()
        setShowDialog(false)
        loadRequests()
      } else {
        setError(data.error || '提交补办申请失败')
      }
    } catch (err: any) {
      setError(err.message || '提交补办申请失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setSelectedStudent("")
    setCardStatus("")
    setReplacementReason("")
    setLostDate("")
    setLostLocation("")
    setUrgency("normal")
    setNotes("")
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

  useEffect(() => {
    loadStudents()
    loadRequests()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          NFC卡补办申请
        </CardTitle>
        <CardDescription>
          为学生申请NFC卡补办
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 错误和成功提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              调试信息: 已加载 {students.length} 个学生，{requests.length} 个申请
              {loading && " (正在加载...)"}
              {students.length > 0 && (
                <div className="mt-2 text-xs">
                  第一个学生: {students[0].student_name || '无姓名'} (ID: {students[0].student_id || '无ID'})
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 申请按钮 */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              提交补办申请
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>NFC卡补办申请</DialogTitle>
              <DialogDescription>
                填写学生NFC卡补办申请信息
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <SmartStudentSelector
                students={students}
                selectedStudent={selectedStudent}
                onStudentSelect={setSelectedStudent}
                placeholder="搜索并选择需要补办NFC卡的学生..."
                label="选择学生"
                required={true}
              />

              <div>
                <Label htmlFor="cardStatus">卡片状态 *</Label>
                <Select value={cardStatus} onValueChange={setCardStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择卡片状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lost">丢失</SelectItem>
                    <SelectItem value="damaged">损坏</SelectItem>
                    <SelectItem value="replace">更换</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">补办原因 *</Label>
                <Textarea
                  id="reason"
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  placeholder="请详细说明补办原因"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="lostDate">丢失日期</Label>
                <Input
                  id="lostDate"
                  type="date"
                  value={lostDate}
                  onChange={(e) => setLostDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="location">丢失地点</Label>
                <Input
                  id="location"
                  value={lostLocation}
                  onChange={(e) => setLostLocation(e.target.value)}
                  placeholder="请填写丢失地点"
                />
              </div>

              <div>
                <Label htmlFor="urgency">紧急程度</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择紧急程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="normal">普通</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="其他需要说明的信息"
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false)
                  resetForm()
                }}
              >
                取消
              </Button>
              <Button
                onClick={submitRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    提交申请
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 申请记录 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">申请记录</h3>
            <Badge variant="outline">{requests.length} 条记录</Badge>
          </div>
          
          {requests.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">暂无补办申请记录</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {requests.slice(0, 5).map((request) => {
                const student = students.find(s => s.id === request.student_id)
                const statusInfo = getStatusDisplay(request.replacement_status)
                const urgencyInfo = getUrgencyDisplay(request.replacement_urgency)
                
                return (
                  <div key={request.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">
                          {student?.student_name || '未知学生'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {student?.student_id || '未知学号'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.text}
                        </Badge>
                        <Badge variant={urgencyInfo.variant} className="text-xs">
                          {urgencyInfo.text}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>状态:</strong> {request.card_status}</p>
                      <p><strong>原因:</strong> {request.replacement_reason}</p>
                      <p><strong>申请时间:</strong> {new Date(request.replacement_request_date).toLocaleDateString('zh-CN')}</p>
                    </div>
                  </div>
                )
              })}
              
              {requests.length > 5 && (
                <div className="text-center py-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    查看全部 {requests.length} 条记录
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
