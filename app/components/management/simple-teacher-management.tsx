"use client"

import { useState } from "react"
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
  Users,
  Mail,
  Phone,
  BookOpen,
  GraduationCap
} from "lucide-react"

interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  department: string
  experience: number
  status: 'active' | 'inactive'
  avatar?: string
}

interface SimpleTeacherManagementProps {
  title?: string
  description?: string
}

export default function SimpleTeacherManagement({ 
  title = "教师管理", 
  description = "管理教师信息和教学安排" 
}: SimpleTeacherManagementProps) {
  // 模拟教师数据
  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: '1',
      name: '张老师',
      email: 'zhang@school.com',
      phone: '13800138001',
      subject: '数学',
      department: '理科组',
      experience: 5,
      status: 'active'
    },
    {
      id: '2',
      name: '李老师',
      email: 'li@school.com',
      phone: '13800138002',
      subject: '语文',
      department: '文科组',
      experience: 8,
      status: 'active'
    },
    {
      id: '3',
      name: '王老师',
      email: 'wang@school.com',
      phone: '13800138003',
      subject: '英语',
      department: '外语组',
      experience: 3,
      status: 'active'
    }
  ])
  
  // 简化的状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null)
  
  // 新教师表单数据
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    department: '',
    experience: 0,
    status: 'active' as const
  })

  // 筛选教师
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === 'all' || teacher.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  // 获取科目选项
  const subjectOptions = Array.from(new Set(teachers.map(t => t.subject)))

  // 处理添加教师
  const handleAddTeacher = () => {
    const teacher: Teacher = {
      id: Date.now().toString(),
      ...newTeacher
    }
    setTeachers([...teachers, teacher])
    setIsAddDialogOpen(false)
    setNewTeacher({
      name: '',
      email: '',
      phone: '',
      subject: '',
      department: '',
      experience: 0,
      status: 'active'
    })
  }

  // 处理编辑教师
  const handleEditTeacher = () => {
    if (!editingTeacher) return
    
    setTeachers(teachers.map(t => 
      t.id === editingTeacher.id ? editingTeacher : t
    ))
    setEditingTeacher(null)
  }

  // 处理删除教师
  const handleDeleteTeacher = (teacherId: string) => {
    if (confirm('确定要删除这个教师吗？')) {
      setTeachers(teachers.filter(t => t.id !== teacherId))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
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
                  placeholder="搜索教师姓名、邮箱或科目..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有科目</option>
              {subjectOptions.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加教师
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新教师</DialogTitle>
                  <DialogDescription>填写教师基本信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">姓名</Label>
                    <Input
                      id="name"
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">电话</Label>
                    <Input
                      id="phone"
                      value={newTeacher.phone}
                      onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">科目</Label>
                    <Input
                      id="subject"
                      value={newTeacher.subject}
                      onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="department" className="text-right">部门</Label>
                    <Input
                      id="department"
                      value={newTeacher.department}
                      onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="experience" className="text-right">教龄</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={newTeacher.experience}
                      onChange={(e) => setNewTeacher({...newTeacher, experience: parseInt(e.target.value) || 0})}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddTeacher}>
                    添加教师
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 教师列表 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>教龄</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.phone}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>{teacher.experience} 年</TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                        {teacher.status === 'active' ? '在职' : '离职'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setViewingTeacher(teacher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingTeacher(teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteTeacher(teacher.id)}
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

          {filteredTeachers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无教师数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看教师详情对话框 */}
      <Dialog open={!!viewingTeacher} onOpenChange={() => setViewingTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>教师详情</DialogTitle>
          </DialogHeader>
          {viewingTeacher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">姓名</Label>
                  <p className="text-sm">{viewingTeacher.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">邮箱</Label>
                  <p className="text-sm">{viewingTeacher.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">电话</Label>
                  <p className="text-sm">{viewingTeacher.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">科目</Label>
                  <p className="text-sm">{viewingTeacher.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">部门</Label>
                  <p className="text-sm">{viewingTeacher.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">教龄</Label>
                  <p className="text-sm">{viewingTeacher.experience} 年</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">状态</Label>
                  <Badge variant={viewingTeacher.status === 'active' ? 'default' : 'secondary'}>
                    {viewingTeacher.status === 'active' ? '在职' : '离职'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑教师对话框 */}
      <Dialog open={!!editingTeacher} onOpenChange={() => setEditingTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑教师信息</DialogTitle>
          </DialogHeader>
          {editingTeacher && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">姓名</Label>
                <Input
                  id="edit-name"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">邮箱</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">电话</Label>
                <Input
                  id="edit-phone"
                  value={editingTeacher.phone}
                  onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-subject" className="text-right">科目</Label>
                <Input
                  id="edit-subject"
                  value={editingTeacher.subject}
                  onChange={(e) => setEditingTeacher({...editingTeacher, subject: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-department" className="text-right">部门</Label>
                <Input
                  id="edit-department"
                  value={editingTeacher.department}
                  onChange={(e) => setEditingTeacher({...editingTeacher, department: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-experience" className="text-right">教龄</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  value={editingTeacher.experience}
                  onChange={(e) => setEditingTeacher({...editingTeacher, experience: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingTeacher(null)}>
              取消
            </Button>
            <Button onClick={handleEditTeacher}>
              保存修改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
