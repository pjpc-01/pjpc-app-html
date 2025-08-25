"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Edit,
  Trash2,
  Download,
  Upload,
  Mail,
  MessageSquare,
  Settings,
  UserCheck,
  UserX,
  Building,
  BookOpen,
  Award,
  Phone,
  Calendar,
  FileText,
  Send,
  Copy,
  CheckCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
} from "lucide-react"

interface Teacher {
  uid: string
  email: string
  name: string
  role: "teacher"
  status: "pending" | "approved" | "suspended"
  emailVerified: boolean
  createdAt: any
  lastLogin: any
  phone?: string
  subject?: string
  department?: string
  experience?: number
  avatar?: string
}

interface TeacherBulkOperationsProps {
  selectedTeachers: Teacher[]
  onClearSelection: () => void
  onBulkUpdate?: (updates: Partial<Teacher>) => void
  onBulkDelete?: () => void
  onBulkExport?: (format: 'csv' | 'excel' | 'pdf') => void
  onBulkImport?: (file: File) => void
  onBulkMessage?: (message: { subject: string; content: string; type: 'email' | 'sms' }) => void
}

export default function TeacherBulkOperations({
  selectedTeachers,
  onClearSelection,
  onBulkUpdate,
  onBulkDelete,
  onBulkExport,
  onBulkImport,
  onBulkMessage
}: TeacherBulkOperationsProps) {
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showBulkMessage, setShowBulkMessage] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    status: "",
    department: "",
    subject: "",
    experience: ""
  })
  const [messageData, setMessageData] = useState({
    subject: "",
    content: "",
    type: "email" as 'email' | 'sms'
  })
  const [importFile, setImportFile] = useState<File | null>(null)

  const handleBulkEdit = () => {
    const updates: Partial<Teacher> = {}
    if (bulkEditData.status && bulkEditData.status !== "no-change") updates.status = bulkEditData.status as any
    if (bulkEditData.department && bulkEditData.department !== "no-change") updates.department = bulkEditData.department
    if (bulkEditData.subject && bulkEditData.subject !== "no-change") updates.subject = bulkEditData.subject
    if (bulkEditData.experience) updates.experience = parseInt(bulkEditData.experience)
    
    onBulkUpdate?.(updates)
    setShowBulkEdit(false)
    setBulkEditData({ status: "", department: "", subject: "", experience: "" })
  }

  const handleBulkMessage = () => {
    if (messageData.subject && messageData.content) {
      onBulkMessage?.(messageData)
      setShowBulkMessage(false)
      setMessageData({ subject: "", content: "", type: "email" })
    }
  }

  const handleBulkImport = () => {
    if (importFile) {
      onBulkImport?.(importFile)
      setShowBulkImport(false)
      setImportFile(null)
    }
  }

  const stats = {
    total: selectedTeachers.length,
    approved: selectedTeachers.filter(t => t.status === 'approved').length,
    pending: selectedTeachers.filter(t => t.status === 'pending').length,
    suspended: selectedTeachers.filter(t => t.status === 'suspended').length,
    hasPhone: selectedTeachers.filter(t => t.phone).length,
    hasEmail: selectedTeachers.filter(t => t.email).length,
    emailVerified: selectedTeachers.filter(t => t.emailVerified).length,
    averageExperience: selectedTeachers.length > 0 
      ? Math.round(selectedTeachers.reduce((sum, t) => sum + (t.experience || 0), 0) / selectedTeachers.length)
      : 0
  }

  if (selectedTeachers.length === 0) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">批量操作</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              已选择 {selectedTeachers.length} 位教师
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            清除选择
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 选择统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">总教师数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-xs text-gray-600">已批准</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">待审核</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.averageExperience}</div>
            <div className="text-xs text-gray-600">平均教龄</div>
          </div>
        </div>

        {/* 批量操作按钮 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 批量编辑 */}
          <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-2">
                <Edit className="h-4 w-4" />
                <span className="text-xs">批量编辑</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>批量编辑教师信息</DialogTitle>
                <DialogDescription>
                  为选中的 {selectedTeachers.length} 位教师批量更新信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select value={bulkEditData.status} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">保持不变</SelectItem>
                      <SelectItem value="approved">已批准</SelectItem>
                      <SelectItem value="pending">待审核</SelectItem>
                      <SelectItem value="suspended">已暂停</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="department">部门</Label>
                  <Select value={bulkEditData.department} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">保持不变</SelectItem>
                      <SelectItem value="数学组">数学组</SelectItem>
                      <SelectItem value="语文组">语文组</SelectItem>
                      <SelectItem value="英语组">英语组</SelectItem>
                      <SelectItem value="理科组">理科组</SelectItem>
                      <SelectItem value="文科组">文科组</SelectItem>
                      <SelectItem value="艺术组">艺术组</SelectItem>
                      <SelectItem value="体育组">体育组</SelectItem>
                      <SelectItem value="行政组">行政组</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subject">任教科目</Label>
                  <Select value={bulkEditData.subject} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">保持不变</SelectItem>
                      <SelectItem value="数学">数学</SelectItem>
                      <SelectItem value="语文">语文</SelectItem>
                      <SelectItem value="英语">英语</SelectItem>
                      <SelectItem value="科学">科学</SelectItem>
                      <SelectItem value="历史">历史</SelectItem>
                      <SelectItem value="地理">地理</SelectItem>
                      <SelectItem value="物理">物理</SelectItem>
                      <SelectItem value="化学">化学</SelectItem>
                      <SelectItem value="生物">生物</SelectItem>
                      <SelectItem value="艺术">艺术</SelectItem>
                      <SelectItem value="体育">体育</SelectItem>
                      <SelectItem value="音乐">音乐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="experience">教龄(年)</Label>
                  <Input
                    id="experience"
                    type="number"
                    placeholder="输入教龄"
                    value={bulkEditData.experience}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, experience: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
                  取消
                </Button>
                <Button onClick={handleBulkEdit}>
                  应用更改
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 批量删除 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-2 text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">批量删除</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要删除选中的 {selectedTeachers.length} 位教师吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={onBulkDelete} className="bg-red-600 hover:bg-red-700">
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 批量导出 */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-2 w-full">
              <Download className="h-4 w-4" />
              <span className="text-xs">批量导出</span>
            </Button>
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkExport?.('csv')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  导出为 CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkExport?.('excel')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  导出为 Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkExport?.('pdf')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  导出为 PDF
                </Button>
              </div>
            </div>
          </div>

          {/* 批量导入 */}
          <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-2">
                <Upload className="h-4 w-4" />
                <span className="text-xs">批量导入</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>批量导入教师</DialogTitle>
                <DialogDescription>
                  从 CSV 或 Excel 文件批量导入教师信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="importFile">选择文件</Label>
                  <Input
                    id="importFile"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>支持的文件格式：CSV, Excel (.xlsx, .xls)</p>
                  <p>请确保文件包含必要的列：姓名、邮箱、科目、部门等</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                  取消
                </Button>
                <Button onClick={handleBulkImport} disabled={!importFile}>
                  开始导入
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 批量消息 */}
          <Dialog open={showBulkMessage} onOpenChange={setShowBulkMessage}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">批量消息</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>发送批量消息</DialogTitle>
                <DialogDescription>
                  向选中的 {selectedTeachers.length} 位教师发送消息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="messageType">消息类型</Label>
                  <Select value={messageData.type} onValueChange={(value: 'email' | 'sms') => setMessageData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">邮件</SelectItem>
                      <SelectItem value="sms">短信</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="messageSubject">主题</Label>
                  <Input
                    id="messageSubject"
                    placeholder="消息主题"
                    value={messageData.subject}
                    onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="messageContent">内容</Label>
                  <Textarea
                    id="messageContent"
                    placeholder="消息内容..."
                    rows={4}
                    value={messageData.content}
                    onChange={(e) => setMessageData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>将发送给 {stats.hasEmail} 位有邮箱的教师</p>
                  {messageData.type === 'sms' && (
                    <p>将发送给 {stats.hasPhone} 位有电话的教师</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBulkMessage(false)}>
                  取消
                </Button>
                <Button onClick={handleBulkMessage} disabled={!messageData.subject || !messageData.content}>
                  <Send className="h-4 w-4 mr-1" />
                  发送消息
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 快速操作 */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-2 w-full">
              <Settings className="h-4 w-4" />
              <span className="text-xs">快速操作</span>
            </Button>
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[150px]">
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkUpdate?.({ status: 'approved' })}
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  批量批准
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkUpdate?.({ status: 'suspended' })}
                >
                  <UserX className="h-3 w-3 mr-1" />
                  批量暂停
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkExport?.('csv')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  复制邮箱
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 操作统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">有邮箱</div>
            <div className="text-lg font-bold text-green-600">{stats.hasEmail}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">有电话</div>
            <div className="text-lg font-bold text-blue-600">{stats.hasPhone}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">已验证</div>
            <div className="text-lg font-bold text-purple-600">{stats.emailVerified}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">待审核</div>
            <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
