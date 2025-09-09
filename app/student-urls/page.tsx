"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  Zap,
  Users,
  Link,
  ArrowLeft,
  Search,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
} from "lucide-react"
import { useStudentCards } from "@/hooks/useStudentCards"
import { StudentCard } from "@/lib/pocketbase-students-card"
import { StudentCardDialog } from "../components/student-card-dialog"
import { GoogleSheetsImport } from "../components/google-sheets-import"
import Link from "next/link"

export default function StudentUrlsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [addDialog, setAddDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentCard | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedCenter, setSelectedCenter] = useState<'all' | 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04'>('all')

  const { 
    cards, 
    loading, 
    error, 
    stats, 
    addCard, 
    batchImportCards,
    updateCard, 
    removeCard, 
    accessStudentUrl,
    fetchCards,
    searchCards
  } = useStudentCards()

  // 过滤学生列表
  const filteredStudents = cards.filter(student =>
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 复制网址到剪贴板
  const copyToClipboard = async (url: string, studentId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(studentId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 访问学生网址
  const visitStudentUrl = async (studentId: string, center: string) => {
    try {
      // 暂时直接打开学生URL，后续可以更新accessStudentUrl函数
      const student = cards.find(c => c.studentId === studentId)
      if (student?.studentUrl) {
        window.open(student.studentUrl, '_blank')
      }
    } catch (err) {
      console.error('访问失败:', err)
    }
  }

  // 自动生成网址
  const generateUrl = (studentId: string) => {
    return `https://school.com/student/${studentId}`
  }

  // 处理中心筛选
  const handleCenterFilter = (center: 'all' | 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04') => {
    setSelectedCenter(center)
    if (center === 'all') {
      fetchCards()
    } else {
      // 暂时使用 fetchCards，后续可以添加按中心筛选的功能
      fetchCards()
    }
  }

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchTerm(query)
    if (query.trim()) {
      searchCards(query)
    } else {
      handleCenterFilter(selectedCenter)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回主页
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Globe className="h-8 w-8 text-blue-600" />
              学生专属网址管理
            </h1>
            <p className="text-gray-600">
              为每个学生创建和管理专属的个人网址，方便访问个人信息和相关资源
            </p>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCards}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">小学</p>
                <p className="text-2xl font-bold text-green-600">{stats.primaryCards}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">中学</p>
                <p className="text-2xl font-bold text-purple-600">{stats.secondaryCards}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃卡片</p>
                <p className="text-2xl font-bold text-orange-600">{stats.activeCards}</p>
              </div>
              <Link className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-center w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索学生姓名或ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCenter} onValueChange={(value: 'all' | 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04') => handleCenterFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部中心</SelectItem>
                  <SelectItem value="WX 01">WX 01</SelectItem>
                  <SelectItem value="WX 02">WX 02</SelectItem>
                  <SelectItem value="WX 03">WX 03</SelectItem>
                  <SelectItem value="WX 04">WX 04</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
                         <div className="flex gap-2">
               <Button 
                 onClick={() => setAddDialog(true)}
                 className="flex items-center gap-2"
               >
                 <Plus className="h-4 w-4" />
                 添加学生卡片
               </Button>
               <Button 
                 variant="outline"
                 onClick={() => setImportDialog(true)}
                 className="flex items-center gap-2"
               >
                 <FileSpreadsheet className="h-4 w-4" />
                 批量导入
               </Button>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生网址列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            学生网址列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学号</TableHead>
                  <TableHead>中心</TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>专属网址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>使用次数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono">{student.studentId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.center || '未设置'}</Badge>
                    </TableCell>
                    <TableCell>{student.studentName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a 
                          href={student.studentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm truncate max-w-48"
                        >
                          {student.studentUrl}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(student.studentUrl, student.studentId)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedId === student.studentId ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        student.status === 'active' 
                          ? "bg-green-100 text-green-800" 
                          : student.status === 'inactive'
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }>
                        {student.status === 'active' ? '活跃' : 
                         student.status === 'inactive' ? '停用' :
                         student.status === 'lost' ? '丢失' : '毕业'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{student.usageCount || 0}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => visitStudentUrl(student.studentId, student.center)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          访问
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingStudent(student)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCard(student.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

             {/* 错误提示 */}
       {error && (
         <Alert variant="destructive" className="mt-6">
           <AlertTriangle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

       {/* 添加/编辑学生卡片对话框 */}
       <StudentCardDialog
         open={addDialog || !!editingStudent}
         onOpenChange={(open) => {
           if (!open) {
             setAddDialog(false)
             setEditingStudent(null)
           }
         }}
         student={editingStudent}
         onSave={async (data) => {
           if (editingStudent) {
             await updateCard(editingStudent.id, data)
           } else {
             await addCard(data)
           }
         }}
         loading={loading}
       />

       {/* Google Sheets 导入对话框 */}
       <Dialog open={importDialog} onOpenChange={setImportDialog}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <FileSpreadsheet className="h-5 w-5" />
               批量导入学生数据
             </DialogTitle>
             <DialogDescription>
               从 Google Sheets 或 CSV 数据批量导入学生信息
             </DialogDescription>
           </DialogHeader>
           <GoogleSheetsImport
             onImport={async (students) => {
               await batchImportCards(students)
             }}
             loading={loading}
           />
         </DialogContent>
       </Dialog>
     </div>
   )
 }
