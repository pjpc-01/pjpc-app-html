'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  User,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

interface ReplacementRequest {
  id: string
  studentId: string
  studentName: string
  studentCenter: string
  oldCardNumber: string
  newCardNumber?: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  urgency: 'low' | 'medium' | 'high'
  submittedDate: string
  processedDate?: string
  notes?: string
  teacherId: string
  teacherName: string
}

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  cardNumber?: string
}

interface CardReplacementManagerProps {
  center?: string
  onReplacementCreated?: (replacement: ReplacementRequest) => void
  onError?: (error: string) => void
}

export default function CardReplacementManager({
  center = "WX 01",
  onReplacementCreated,
  onError
}: CardReplacementManagerProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("requests")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // 数据状态
  const [requests, setRequests] = useState<ReplacementRequest[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ReplacementRequest[]>([])
  
  // 对话框状态
  const [requestDialog, setRequestDialog] = useState(false)
  const [newRequest, setNewRequest] = useState({
    studentId: "",
    studentName: "",
    studentCenter: "",
    oldCardNumber: "",
    reason: "",
    urgency: "medium" as "low" | "medium" | "high",
    notes: "",
    teacherId: "default-teacher", // 可以从用户上下文获取
    teacherName: "系统管理员"
  })
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      // 加载学生数据
      const studentsResponse = await fetch('/api/students')
      const studentsData = await studentsResponse.json()
      
      if (studentsData.success) {
        const studentsList = studentsData.students || studentsData.data || []
        setStudents(studentsList)
        console.log('✅ 学生数据加载成功:', studentsList.length, '个学生')
      } else {
        console.warn('⚠️ 学生数据加载失败:', studentsData.error)
        setStudents([])
      }
      
      // 加载补办申请数据
      const response = await fetch('/api/nfc-card-replacements')
      const data = await response.json()
      
      if (data.success) {
        // 转换数据格式以匹配前端期望的结构
        const transformedData = (data.data || []).map((item: any) => ({
          id: item.id,
          studentId: item.expand?.student?.student_id || item.student || '',
          studentName: item.expand?.student?.student_name || '未知学生',
          studentCenter: item.expand?.student?.center || '未知分行',
          oldCardNumber: item.old_card_number || item.cardNumber || '',
          newCardNumber: item.new_card_number || '',
          reason: item.replacement_reason || item.reason || '',
          status: item.replacement_status || item.status || 'pending',
          urgency: item.urgency || 'medium',
          submittedDate: item.replacement_request_date || item.created || new Date().toISOString(),
          processedDate: item.replacement_process_date || '',
          notes: item.notes || '',
          teacherId: item.expand?.teacher?.id || item.teacher || '',
          teacherName: item.expand?.teacher?.name || '未知教师'
        }))
        
        setRequests(transformedData)
        console.log('✅ 补办申请数据加载成功:', transformedData.length, '个申请')
        console.log('📊 转换后的数据示例:', transformedData.slice(0, 2))
      } else {
        throw new Error(data.error || '加载数据失败')
      }
      
    } catch (error) {
      console.error('加载数据失败:', error)
      setError('加载数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 筛选数据
  useEffect(() => {
    let filtered = requests

    // 按状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.oldCardNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRequests(filtered)
  }, [requests, statusFilter, searchTerm])

  // 提交补办申请
  const handleSubmitRequest = async () => {
    if (!newRequest.studentId || !newRequest.oldCardNumber || !newRequest.reason) {
      setError('请填写所有必填字段')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/nfc-card-replacements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: newRequest.studentId,
          teacherId: newRequest.teacherId,
          cardStatus: 'lost', // 默认状态
          replacementReason: newRequest.reason,
          lostDate: new Date().toISOString().split('T')[0],
          lostLocation: '未知',
          urgency: newRequest.urgency,
          notes: newRequest.notes,
          oldCardNumber: newRequest.oldCardNumber
        })
      })

      const data = await response.json()
      if (data.success) {
        setRequestDialog(false)
        setNewRequest({
          studentId: "",
          studentName: "",
          studentCenter: "",
          oldCardNumber: "",
          reason: "",
          urgency: "medium",
          notes: "",
          teacherId: "default-teacher",
          teacherName: "系统管理员"
        })
        loadData()
        showMessage('success', '补办申请提交成功！')
        onReplacementCreated?.(data.data)
      } else {
        throw new Error(data.error || '提交申请失败')
      }
    } catch (error) {
      console.error('提交申请失败:', error)
      setError(`提交申请失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 处理申请
  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject', newCardNumber?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/nfc-card-replacements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          replacementStatus: action === 'approve' ? 'approved' : 'rejected',
          newCardNumber: newCardNumber,
          notes: action === 'approve' ? '申请已批准' : '申请已拒绝'
        })
      })

      const data = await response.json()
      if (data.success) {
        loadData()
        showMessage('success', `申请已${action === 'approve' ? '批准' : '拒绝'}`)
      } else {
        throw new Error(data.error || '处理申请失败')
      }
    } catch (error) {
      console.error('处理申请失败:', error)
      setError(`处理申请失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">卡片补办管理</h2>
          <p className="text-gray-600">管理NFC/RFID卡片补办申请</p>
        </div>
        <Button onClick={() => setRequestDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          提交补办申请
        </Button>
      </div>

      {/* 消息提示 */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>{t('common.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索学生姓名、学号或卡号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label>{t('common.status_filter')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all_status')}</SelectItem>
                  <SelectItem value="pending">{t('common.pending')}</SelectItem>
                  <SelectItem value="approved">{t('attendance.approved')}</SelectItem>
                  <SelectItem value="rejected">{t('attendance.rejected')}</SelectItem>
                  <SelectItem value="completed">{t('assignment.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            补办申请列表 ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('teacher.loading')}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无补办申请</div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{request.studentName}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status === 'pending' && '待处理'}
                            {request.status === 'approved' && '已批准'}
                            {request.status === 'rejected' && '已拒绝'}
                            {request.status === 'completed' && '已完成'}
                          </Badge>
                          <Badge className={getUrgencyColor(request.urgency)}>
                            {request.urgency === 'high' && '紧急'}
                            {request.urgency === 'medium' && '一般'}
                            {request.urgency === 'low' && '不急'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-1">
                            <p><strong>学号:</strong> {request.studentId}</p>
                            <p><strong>分行:</strong> {request.studentCenter}</p>
                            <p><strong>原卡号:</strong> {request.oldCardNumber}</p>
                            {request.newCardNumber && (
                              <p><strong>新卡号:</strong> {request.newCardNumber}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p><strong>申请原因:</strong> {request.reason}</p>
                            <p><strong>提交时间:</strong> {request.submittedDate ? new Date(request.submittedDate).toLocaleString() : '未知时间'}</p>
                            {request.processedDate && (
                              <p><strong>处理时间:</strong> {new Date(request.processedDate).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                        
                        {request.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700"><strong>备注:</strong> {request.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              const newCardNumber = prompt('请输入新卡号:')
                              if (newCardNumber) {
                                handleProcessRequest(request.id, 'approve', newCardNumber)
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            批准
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleProcessRequest(request.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提交补办申请对话框 */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              提交卡片补办申请
            </DialogTitle>
            <DialogDescription>
              为学生申请新的NFC/RFID卡片
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t('common.select_student')}</Label>
                <Select value={newRequest.studentId} onValueChange={(value) => {
                  const student = students.find(s => s.id === value)
                  setNewRequest({
                    ...newRequest,
                    studentId: value,
                    studentName: student?.student_name || '',
                    studentCenter: student?.center || '',
                    oldCardNumber: student?.cardNumber || ''
                  })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.select_student')} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.student_id} - {student.student_name} ({student.center})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>紧急程度</Label>
                <Select value={newRequest.urgency} onValueChange={(value: any) => setNewRequest({...newRequest, urgency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">不急</SelectItem>
                    <SelectItem value="medium">{t('common.average')}</SelectItem>
                    <SelectItem value="high">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>原卡号</Label>
              <Input
                value={newRequest.oldCardNumber}
                onChange={(e) => setNewRequest({...newRequest, oldCardNumber: e.target.value})}
                placeholder="请输入原卡号"
              />
            </div>

            <div>
              <Label>补办原因 *</Label>
              <Textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                placeholder="请详细说明补办原因..."
                rows={3}
              />
            </div>

            <div>
              <Label>{t('teacher.notes')}</Label>
              <Textarea
                value={newRequest.notes}
                onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
                placeholder="其他需要说明的信息..."
                rows={2}
              />
            </div>

            {newRequest.studentId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800">申请信息确认：</div>
                <div className="text-sm text-blue-700">
                  <p>学生：{newRequest.studentName} ({newRequest.studentId})</p>
                  <p>分行：{newRequest.studentCenter}</p>
                  <p>原卡号：{newRequest.oldCardNumber}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequestDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSubmitRequest} disabled={loading}>
                {loading ? '提交中...' : '提交申请'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
