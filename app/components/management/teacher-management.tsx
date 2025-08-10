"use client"

import { useState, useCallback, useEffect } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Search, Edit, Users, Trash2, Mail, Phone, Calendar, BookOpen } from "lucide-react"
// import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
// import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { getStatusBadge, getStatusText, formatDate } from "@/lib/utils"

// Types
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

interface TeacherFormData {
  name: string
  email: string
  phone: string
  subject: string
  department: string
  experience: string
}



export default function TeacherManagement() {
  const { userProfile } = useAuth()
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [newTeacher, setNewTeacher] = useState<TeacherFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    department: "",
    experience: ""
  })

  // Data fetching
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 已迁移到PocketBase，暂时禁用Firebase
      console.log('老师管理已迁移到PocketBase，暂时禁用')
      setTeachers([])
    } catch (err) {
      console.error('Error fetching teachers:', err)
      setError(err instanceof Error ? err.message : '获取老师数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // CRUD operations
  const updateTeacher = useCallback(async (uid: string, updates: Partial<Teacher>) => {
    try {
      setError(null)
<<<<<<< HEAD:app/components/management/teacher-management.tsx
      await updateDoc(doc(db, "users", uid), updates)
      await fetchTeachers()
=======
      // 已迁移到PocketBase，暂时禁用
      console.log('老师管理已迁移到PocketBase，暂时禁用更新功能')
      await fetchTeachers() // 重新获取数据
>>>>>>> 377d27e310acbc445ced2f1204f55ad3b973e3b9:app/components/teacher-management.tsx
    } catch (err) {
      console.error('Error updating teacher:', err)
      setError(err instanceof Error ? err.message : '更新老师信息失败')
    }
  }, [fetchTeachers])

  const deleteTeacher = useCallback(async (uid: string) => {
    try {
      setError(null)
<<<<<<< HEAD:app/components/management/teacher-management.tsx
      await deleteDoc(doc(db, "users", uid))
      await fetchTeachers()
=======
      // 已迁移到PocketBase，暂时禁用
      console.log('老师管理已迁移到PocketBase，暂时禁用删除功能')
      await fetchTeachers() // 重新获取数据
>>>>>>> 377d27e310acbc445ced2f1204f55ad3b973e3b9:app/components/teacher-management.tsx
    } catch (err) {
      console.error('Error deleting teacher:', err)
      setError(err instanceof Error ? err.message : '删除老师失败')
    }
  }, [fetchTeachers])

  const handleBulkDelete = useCallback(async () => {
    if (selectedTeachers.length === 0) return
    
    try {
      setError(null)
      // 已迁移到PocketBase，暂时禁用
      console.log('老师管理已迁移到PocketBase，暂时禁用批量删除功能')
      setSelectedTeachers([])
      await fetchTeachers()
    } catch (err) {
      console.error('Error bulk deleting teachers:', err)
      setError(err instanceof Error ? err.message : '批量删除失败')
    }
  }, [selectedTeachers, fetchTeachers])

  // Filtering and selection
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBulkSelect = (uid: string, checked: boolean) => {
    if (checked) {
      setSelectedTeachers(prev => [...prev, uid])
    } else {
      setSelectedTeachers(prev => prev.filter(id => id !== uid))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeachers(filteredTeachers.map(t => t.uid))
    } else {
      setSelectedTeachers([])
    }
  }

  // Form handling
  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setNewTeacher({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || "",
      subject: teacher.subject || "",
      department: teacher.department || "",
      experience: teacher.experience?.toString() || ""
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingTeacher) return

    try {
      await updateTeacher(editingTeacher.uid, {
        name: newTeacher.name,
        phone: newTeacher.phone,
        subject: newTeacher.subject,
        department: newTeacher.department,
        experience: newTeacher.experience ? parseInt(newTeacher.experience) : undefined
      })
      setDialogOpen(false)
      setEditingTeacher(null)
    } catch (err) {
      console.error('Error saving teacher:', err)
    }
  }

  // Statistics
  const stats = {
    total: teachers.length,
    approved: teachers.filter(t => t.status === 'approved').length,
    pending: teachers.filter(t => t.status === 'pending').length,
    verified: teachers.filter(t => t.emailVerified).length
  }

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
          <p className="text-gray-500">加载老师数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>错误: {error}</p>
            <Button onClick={fetchTeachers} className="mt-2">重试</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">总老师数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">已批准</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">待审核</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">已验证邮箱</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>老师管理</CardTitle>
              <CardDescription>管理学校教师信息和状态</CardDescription>
            </div>
            
            <div className="flex gap-2">
              {selectedTeachers.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除选中 ({selectedTeachers.length})
                </Button>
              )}
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    添加老师
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>编辑老师信息</DialogTitle>
                    <DialogDescription>
                      更新老师的个人信息和教学信息
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">姓名</Label>
                        <Input
                          id="name"
                          value={newTeacher.name}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">邮箱</Label>
                        <Input
                          id="email"
                          value={newTeacher.email}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">电话</Label>
                        <Input
                          id="phone"
                          value={newTeacher.phone}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">任教科目</Label>
                        <Input
                          id="subject"
                          value={newTeacher.subject}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, subject: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="department">部门</Label>
                        <Input
                          id="department"
                          value={newTeacher.department}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, department: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">教龄(年)</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={newTeacher.experience}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, experience: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSave}>
                      保存
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索老师姓名、邮箱、科目或部门..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead>老师信息</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>教学信息</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后登录</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.uid}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.uid)}
                        onChange={(e) => handleBulkSelect(teacher.uid, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={teacher.avatar} />
                          <AvatarFallback>
                            {teacher.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {teacher.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {teacher.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {teacher.emailVerified ? '已验证' : '未验证'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {teacher.subject && (
                          <p className="text-sm font-medium">{teacher.subject}</p>
                        )}
                        {teacher.department && (
                          <p className="text-xs text-gray-500">{teacher.department}</p>
                        )}
                        {teacher.experience && (
                          <p className="text-xs text-gray-500">{teacher.experience}年教龄</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(teacher.status)}>
                        {getStatusText(teacher.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-500">
                        {formatDate(teacher.lastLogin)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTeacher(teacher.uid)}
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
              {searchTerm ? '没有找到匹配的老师' : '暂无老师数据'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
