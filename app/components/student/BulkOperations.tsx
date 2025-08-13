"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  FileText, 
  Send, 
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  Settings,
  Archive,
  UserCheck,
  UserX,
  GraduationCap,
  Calendar,
  MapPin
} from "lucide-react"
import { Student } from "@/hooks/useStudents"

interface BulkOperationsProps {
  selectedStudents: Student[]
  onClearSelection: () => void
  onBulkUpdate: (updates: Partial<Student>) => Promise<void>
  onBulkDelete: () => Promise<void>
  onBulkExport: (format: 'csv' | 'excel' | 'pdf') => void
  onBulkImport: (file: File) => Promise<void>
  onBulkMessage: (message: string, type: 'email' | 'sms') => Promise<void>
}

export default function BulkOperations({
  selectedStudents,
  onClearSelection,
  onBulkUpdate,
  onBulkDelete,
  onBulkExport,
  onBulkImport,
  onBulkMessage
}: BulkOperationsProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [updateData, setUpdateData] = useState<Partial<Student>>({})
  const [messageData, setMessageData] = useState({ message: '', type: 'email' as 'email' | 'sms' })
  const [importFile, setImportFile] = useState<File | null>(null)

  const handleBulkUpdate = async () => {
    try {
      await onBulkUpdate(updateData)
      setIsUpdateDialogOpen(false)
      setUpdateData({})
    } catch (error) {
      console.error("Error updating students:", error)
    }
  }

  const handleBulkMessage = async () => {
    try {
      await onBulkMessage(messageData.message, messageData.type)
      setIsMessageDialogOpen(false)
      setMessageData({ message: '', type: 'email' })
    } catch (error) {
      console.error("Error sending messages:", error)
    }
  }

  const handleBulkImport = async () => {
    if (!importFile) return
    try {
      await onBulkImport(importFile)
      setIsImportDialogOpen(false)
      setImportFile(null)
    } catch (error) {
      console.error("Error importing students:", error)
    }
  }

  const getGradeDistribution = () => {
    const distribution = selectedStudents.reduce((acc, student) => {
      const grade = student.grade || '未知年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
  }

  const getStatusDistribution = () => {
    const active = selectedStudents.filter(s => s.status === 'active').length
    const inactive = selectedStudents.length - active
    return { active, inactive }
  }

  if (selectedStudents.length === 0) {
    return null
  }

  const gradeDistribution = getGradeDistribution()
  const statusDistribution = getStatusDistribution()

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Users className="h-5 w-5" />
              批量操作
            </CardTitle>
            <CardDescription className="text-blue-700">
              已选择 {selectedStudents.length} 个学生，可以进行批量操作
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClearSelection}>
            取消选择
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 选择统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">年级分布</span>
            </div>
            <div className="space-y-1">
              {gradeDistribution.map(([grade, count]) => (
                <div key={grade} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{grade}</span>
                  <Badge variant="outline" className="text-xs">
                    {count} 人
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">状态分布</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">在读</span>
                <Badge variant="outline" className="text-xs text-green-600">
                  {statusDistribution.active} 人
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">离校</span>
                <Badge variant="outline" className="text-xs text-red-600">
                  {statusDistribution.inactive} 人
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">操作提示</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• 批量操作将影响所有选中的学生</p>
              <p>• 操作前请仔细确认信息</p>
              <p>• 删除操作不可撤销</p>
            </div>
          </div>
        </div>

        {/* 批量操作按钮 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* 批量编辑 */}
          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-3">
                <Edit className="h-4 w-4" />
                <span className="text-xs">批量编辑</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>批量编辑学生信息</DialogTitle>
                <DialogDescription>
                  为选中的 {selectedStudents.length} 个学生批量更新信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>年级</Label>
                  <Select value={updateData.grade || ''} onValueChange={(value) => setUpdateData(prev => ({ ...prev, grade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择年级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不修改</SelectItem>
                      <SelectItem value="一年级">一年级</SelectItem>
                      <SelectItem value="二年级">二年级</SelectItem>
                      <SelectItem value="三年级">三年级</SelectItem>
                      <SelectItem value="四年级">四年级</SelectItem>
                      <SelectItem value="五年级">五年级</SelectItem>
                      <SelectItem value="六年级">六年级</SelectItem>
                      <SelectItem value="初一">初一</SelectItem>
                      <SelectItem value="初二">初二</SelectItem>
                      <SelectItem value="初三">初三</SelectItem>
                      <SelectItem value="高一">高一</SelectItem>
                      <SelectItem value="高二">高二</SelectItem>
                      <SelectItem value="高三">高三</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>状态</Label>
                  <Select value={updateData.status || ''} onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不修改</SelectItem>
                      <SelectItem value="active">在读</SelectItem>
                      <SelectItem value="graduated">已毕业</SelectItem>
                      <SelectItem value="transferred">已转学</SelectItem>
                      <SelectItem value="inactive">非活跃</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleBulkUpdate}>
                    确认更新
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 批量删除 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-3 border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">批量删除</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要删除选中的 {selectedStudents.length} 个学生吗？此操作不可撤销。
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
            <Button variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-3 w-full">
              <Download className="h-4 w-4" />
              <span className="text-xs">批量导出</span>
            </Button>
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-32">
              <div className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkExport('csv')}
                >
                  <FileText className="h-3 w-3 mr-2" />
                  导出为 CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkExport('excel')}
                >
                  <FileText className="h-3 w-3 mr-2" />
                  导出为 Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => onBulkExport('pdf')}
                >
                  <FileText className="h-3 w-3 mr-2" />
                  导出为 PDF
                </Button>
              </div>
            </div>
          </div>

          {/* 批量导入 */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-3">
                <Upload className="h-4 w-4" />
                <span className="text-xs">批量导入</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>批量导入学生</DialogTitle>
                <DialogDescription>
                  从文件导入学生信息，支持 CSV 和 Excel 格式
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>选择文件</Label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleBulkImport} disabled={!importFile}>
                    开始导入
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 批量消息 */}
          <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-3">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">批量消息</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>发送批量消息</DialogTitle>
                <DialogDescription>
                  向选中的 {selectedStudents.length} 个学生的家长发送消息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>消息类型</Label>
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
                  <Label>消息内容</Label>
                  <textarea
                    className="w-full min-h-32 p-3 border rounded-md resize-none"
                    placeholder="输入要发送的消息内容..."
                    value={messageData.message}
                    onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleBulkMessage} disabled={!messageData.message.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    发送消息
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 复制信息 */}
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={() => {
              const studentInfo = selectedStudents.map(s => 
                `${s.name} (${s.studentId}) - ${s.grade}`
              ).join('\n')
              navigator.clipboard.writeText(studentInfo)
            }}
          >
            <Copy className="h-4 w-4" />
            <span className="text-xs">复制信息</span>
          </Button>
        </div>

        {/* 操作进度提示 */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">操作说明</span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• <strong>批量编辑：</strong>同时修改多个学生的年级或状态</p>
            <p>• <strong>批量删除：</strong>永久删除选中的学生记录</p>
            <p>• <strong>批量导出：</strong>将学生数据导出为不同格式</p>
            <p>• <strong>批量导入：</strong>从文件导入新的学生数据</p>
            <p>• <strong>批量消息：</strong>向家长发送邮件或短信通知</p>
            <p>• <strong>复制信息：</strong>复制选中学生的基本信息到剪贴板</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
