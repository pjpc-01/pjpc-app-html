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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Search, Edit, Users, Trash2, Mail, Phone, Calendar, BookOpen, BarChart3, List } from "lucide-react"

import { useAuth } from "@/contexts/pocketbase-auth-context"
import { getStatusBadge, getStatusText, formatDate } from "@/lib/utils"
import AdvancedTeacherFilters, { TeacherFilterState } from "../teacher/AdvancedTeacherFilters"
import TeacherAnalytics from "../teacher/TeacherAnalytics"
import TeacherBulkOperations from "../teacher/TeacherBulkOperations"

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
  
  // Enterprise-level state
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list')
  const [filters, setFilters] = useState<TeacherFilterState>({
    searchTerm: "",
    selectedSubject: "",
    selectedDepartment: "",
    selectedStatus: "",
    selectedExperience: "",
    experienceRange: [0, 30],
    hasPhone: false,
    hasEmail: false,
    emailVerified: false,
    sortBy: "name",
    sortOrder: 'asc',
    dateRange: { from: undefined, to: undefined },
    quickFilters: []
  })
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: TeacherFilterState }[]>([])

  // Data fetching
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 已迁移到PocketBase
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
      // 已迁移到PocketBase，暂时禁用
      console.log('老师管理已迁移到PocketBase，暂时禁用更新功能')
      await fetchTeachers() // 重新获取数据
    } catch (err) {
      console.error('Error updating teacher:', err)
      setError(err instanceof Error ? err.message : '更新老师信息失败')
    }
  }, [fetchTeachers])

  const deleteTeacher = useCallback(async (uid: string) => {
    try {
      setError(null)
      // 已迁移到PocketBase，暂时禁用
      console.log('老师管理已迁移到PocketBase，暂时禁用删除功能')
      await fetchTeachers() // 重新获取数据
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

  // Advanced filtering and sorting
  const filteredTeachers = useMemo(() => {
    let filtered = teachers

    // Search term filtering
    if (filters.searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        teacher.subject?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        teacher.department?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    // Subject filtering
    if (filters.selectedSubject) {
      filtered = filtered.filter(teacher => teacher.subject === filters.selectedSubject)
    }

    // Department filtering
    if (filters.selectedDepartment) {
      filtered = filtered.filter(teacher => teacher.department === filters.selectedDepartment)
    }

    // Status filtering
    if (filters.selectedStatus) {
      filtered = filtered.filter(teacher => teacher.status === filters.selectedStatus)
    }

    // Experience range filtering
    filtered = filtered.filter(teacher => {
      const experience = teacher.experience || 0
      return experience >= filters.experienceRange[0] && experience <= filters.experienceRange[1]
    })

    // Contact info filtering
    if (filters.hasPhone) {
      filtered = filtered.filter(teacher => teacher.phone)
    }
    if (filters.hasEmail) {
      filtered = filtered.filter(teacher => teacher.email)
    }
    if (filters.emailVerified) {
      filtered = filtered.filter(teacher => teacher.emailVerified)
    }

    // Date range filtering
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(teacher => {
        if (!teacher.createdAt) return false
        const createdDate = new Date(teacher.createdAt)
        if (filters.dateRange.from && createdDate < filters.dateRange.from) return false
        if (filters.dateRange.to && createdDate > filters.dateRange.to) return false
        return true
      })
    }

    // Quick filters
    filters.quickFilters.forEach(filterId => {
      switch (filterId) {
        case 'approved':
          filtered = filtered.filter(teacher => teacher.status === 'approved')
          break
        case 'pending':
          filtered = filtered.filter(teacher => teacher.status === 'pending')
          break
        case 'suspended':
          filtered = filtered.filter(teacher => teacher.status === 'suspended')
          break
        case 'experienced':
          filtered = filtered.filter(teacher => (teacher.experience || 0) >= 10)
          break
        case 'new':
          filtered = filtered.filter(teacher => (teacher.experience || 0) < 3)
          break
        case 'verified':
          filtered = filtered.filter(teacher => teacher.emailVerified)
          break
        case 'has-phone':
          filtered = filtered.filter(teacher => teacher.phone)
          break
        case 'department-heads':
          filtered = filtered.filter(teacher => teacher.department?.includes('组'))
          break
      }
    })

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'experience':
          aValue = a.experience || 0
          bValue = b.experience || 0
          break
        case 'subject':
          aValue = a.subject || ''
          bValue = b.subject || ''
          break
        case 'department':
          aValue = a.department || ''
          bValue = b.department || ''
          break
        case 'createdAt':
          aValue = new Date(a.createdAt || 0)
          bValue = new Date(b.createdAt || 0)
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [teachers, filters])

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

  // Enterprise-level handlers
  const handleSaveFilter = (name: string, filterData: TeacherFilterState) => {
    setSavedFilters(prev => [...prev, { name, filters: filterData }])
  }

  const handleLoadFilter = (name: string) => {
    const savedFilter = savedFilters.find(f => f.name === name)
    if (savedFilter) {
      setFilters(savedFilter.filters)
    }
  }

  const handleBulkUpdate = (updates: Partial<Teacher>) => {
    console.log('Bulk update teachers:', updates)
    // TODO: Implement bulk update logic
  }

  const handleBulkDelete = () => {
    console.log('Bulk delete teachers')
    // TODO: Implement bulk delete logic
  }

  const handleBulkExport = (format: 'csv' | 'excel' | 'pdf') => {
    console.log('Bulk export teachers:', format)
    // TODO: Implement bulk export logic
  }

  const handleBulkImport = (file: File) => {
    console.log('Bulk import teachers:', file)
    // TODO: Implement bulk import logic
  }

  const handleBulkMessage = (message: { subject: string; content: string; type: 'email' | 'sms' }) => {
    console.log('Bulk message teachers:', message)
    // TODO: Implement bulk message logic
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
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">教师管理</h2>
          <p className="text-gray-600">管理学校教师信息和状态</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            列表视图
          </Button>
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analytics')}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            数据分析
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedTeacherFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSaveFilter={handleSaveFilter}
        onLoadFilter={handleLoadFilter}
        savedFilters={savedFilters}
      />

      {/* Bulk Operations */}
      <TeacherBulkOperations
        selectedTeachers={teachers.filter(teacher => selectedTeachers.includes(teacher.uid))}
        onClearSelection={() => setSelectedTeachers([])}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
        onBulkImport={handleBulkImport}
        onBulkMessage={handleBulkMessage}
      />

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <TeacherAnalytics 
          teachers={teachers}
          filteredTeachers={filteredTeachers}
        />
      )}

              {/* Main Content - List View */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle>教师列表</CardTitle>
                  <CardDescription>显示 {filteredTeachers.length} 位教师，共 {teachers.length} 位</CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-1" />
                        添加教师
                      </Button>
                    </DialogTrigger>
                                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>编辑教师信息</DialogTitle>
                      <DialogDescription>
                        更新教师的个人信息和教学信息
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
              {filters.searchTerm || filters.selectedSubject || filters.selectedDepartment || filters.selectedStatus || filters.quickFilters.length > 0 ? '没有找到匹配的教师' : '暂无教师数据'}
            </div>
          )}
        </CardContent>
      </Card>
        )}
    </div>
  )
}
