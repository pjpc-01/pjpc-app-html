"use client"

import { useState, useMemo } from "react"
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
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  UserPlus,
  Mail,
  Phone,
  GraduationCap,
  Users,
  Filter
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { Student } from "@/hooks/useStudents"

interface SimpleStudentManagementProps {
  title?: string
  description?: string
}

export default function SimpleStudentManagement({ 
  title = "学生管理", 
  description = "管理学生信息和学习进度" 
}: SimpleStudentManagementProps) {
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents()
  
  // 简化的状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  
  // 新学生表单数据
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    grade: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    status: 'active'
  })

  // 筛选学生
  const filteredStudents = useMemo(() => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.grade?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.grade === selectedGrade)
    }

    return filtered
  }, [students, searchTerm, selectedGrade])

  // 获取年级选项
  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort()
    return grades
  }, [students])

  // 处理添加学生
  const handleAddStudent = async () => {
    try {
      await addStudent(newStudent)
      setIsAddDialogOpen(false)
      setNewStudent({
        name: '',
        studentId: '',
        grade: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        status: 'active'
      })
    } catch (error) {
      console.error('添加学生失败:', error)
    }
  }

  // 处理编辑学生
  const handleEditStudent = async () => {
    if (!editingStudent) return
    
    try {
      await updateStudent(editingStudent.id, editingStudent)
      setEditingStudent(null)
    } catch (error) {
      console.error('更新学生失败:', error)
    }
  }

  // 处理删除学生
  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('确定要删除这个学生吗？')) {
      try {
        await deleteStudent(studentId)
      } catch (error) {
        console.error('删除学生失败:', error)
      }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
              <p className="text-gray-500">加载学生数据中...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>错误: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索学生姓名、学号或年级..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有年级</option>
              {gradeOptions.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加学生
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新学生</DialogTitle>
                  <DialogDescription>填写学生基本信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">姓名</Label>
                    <Input
                      id="name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="studentId" className="text-right">学号</Label>
                    <Input
                      id="studentId"
                      value={newStudent.studentId}
                      onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="grade" className="text-right">年级</Label>
                    <Input
                      id="grade"
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent({...newStudent, grade: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parentName" className="text-right">家长姓名</Label>
                    <Input
                      id="parentName"
                      value={newStudent.parentName}
                      onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parentPhone" className="text-right">家长电话</Label>
                    <Input
                      id="parentPhone"
                      value={newStudent.parentPhone}
                      onChange={(e) => setNewStudent({...newStudent, parentPhone: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parentEmail" className="text-right">家长邮箱</Label>
                    <Input
                      id="parentEmail"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({...newStudent, parentEmail: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddStudent}>
                    添加学生
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 学生列表 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>学号</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead>家长姓名</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>{student.parentName}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {student.parentPhone && (
                          <Phone className="h-4 w-4 text-gray-400" />
                        )}
                        {student.parentEmail && (
                          <Mail className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status === 'active' ? '在读' : '休学'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setViewingStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无学生数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看学生详情对话框 */}
      <Dialog open={!!viewingStudent} onOpenChange={() => setViewingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>学生详情</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">姓名</Label>
                  <p className="text-sm">{viewingStudent.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">学号</Label>
                  <p className="text-sm">{viewingStudent.studentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">年级</Label>
                  <p className="text-sm">{viewingStudent.grade}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">状态</Label>
                  <Badge variant={viewingStudent.status === 'active' ? 'default' : 'secondary'}>
                    {viewingStudent.status === 'active' ? '在读' : '休学'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">家长信息</Label>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">姓名: {viewingStudent.parentName}</p>
                  <p className="text-sm">电话: {viewingStudent.parentPhone}</p>
                  <p className="text-sm">邮箱: {viewingStudent.parentEmail}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑学生对话框 */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑学生信息</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">姓名</Label>
                <Input
                  id="edit-name"
                  value={editingStudent.name || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-studentId" className="text-right">学号</Label>
                <Input
                  id="edit-studentId"
                  value={editingStudent.studentId || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-grade" className="text-right">年级</Label>
                <Input
                  id="edit-grade"
                  value={editingStudent.grade || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, grade: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parentName" className="text-right">家长姓名</Label>
                <Input
                  id="edit-parentName"
                  value={editingStudent.parentName || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, parentName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parentPhone" className="text-right">家长电话</Label>
                <Input
                  id="edit-parentPhone"
                  value={editingStudent.parentPhone || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, parentPhone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-parentEmail" className="text-right">家长邮箱</Label>
                <Input
                  id="edit-parentEmail"
                  value={editingStudent.parentEmail || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, parentEmail: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingStudent(null)}>
              取消
            </Button>
            <Button onClick={handleEditStudent}>
              保存修改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
