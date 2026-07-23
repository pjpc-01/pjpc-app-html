"use client"

import React, { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Search,
  Edit,
  Eye,
  Trash2,
  FileSpreadsheet,
  UserPlus,
  DollarSign,
  UserX,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useTeachers } from "@/hooks/useTeachers"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import TeacherForm from "@/components/teacher/TeacherForm"
import TeacherDetails from "@/components/teacher/TeacherDetails"
import TeacherSalaryManagement from "@/components/teacher/TeacherSalaryManagement"

interface TeachersTabProps {
  setActiveTab: (tab: string) => void
}

export default function TeachersTab({ setActiveTab }: TeachersTabProps) {
  const { t } = useLanguage()
  const { teachers, loading: teachersLoading, refetch: refetchTeachers, addTeacher, updateTeacher, deleteTeacher } = useTeachers()
  const { userProfile } = useAuth()

  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<any>(null)
  const [viewingTeacher, setViewingTeacher] = useState<any>(null)
  const [salaryTeacher, setSalaryTeacher] = useState<any>(null)

  const searchParams = useSearchParams()
  const centerFilter = searchParams.get('center')

  // 筛选教师
  const filteredTeachers = useMemo(() => {
    let filtered = teachers

    if (searchTerm) {
      filtered = filtered.filter(teacher => 
        teacher.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.teacher_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.nric?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(teacher => teacher.department === selectedDepartment)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(teacher => teacher.status === selectedStatus)
    }

    if (centerFilter) {
      filtered = filtered.filter(teacher => teacher.centerId === centerFilter)
    }

    return filtered
  }, [teachers, searchTerm, selectedDepartment, selectedStatus, centerFilter])

  // 获取部门选项
  const departmentOptions = useMemo(() => {
    const departments = Array.from(new Set(teachers.map(t => t.department).filter(Boolean))).sort() as string[]
    return departments
  }, [teachers])

  // 分页逻辑
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredTeachers.slice(startIndex, endIndex)
  }, [filteredTeachers, currentPage, pageSize])

  const totalPages = Math.ceil(filteredTeachers.length / pageSize)

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 当筛选条件改变时，重置到第一页
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  // 处理添加教师
  const handleAddTeacher = async (teacherData: any) => {
    try {
      console.log('TeachersTab 接收到的数据:', teacherData)
      await addTeacher(teacherData)
      setIsAddDialogOpen(false)
      refetchTeachers()
    } catch (error) {
      console.error("Error adding teacher:", error)
    }
  }

  // 处理更新教师
  const handleUpdateTeacher = async (teacherData: any) => {
    if (!editingTeacher) return
    try {
      console.log('准备更新教师:', {
        teacherId: editingTeacher.id,
        teacherData: teacherData,
        editingTeacher: editingTeacher
      })
      await updateTeacher(editingTeacher.id, teacherData)
      setEditingTeacher(null)
      refetchTeachers()
    } catch (error) {
      console.error("Error updating teacher:", error)
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'))
      throw error // re-throw so the dialog stays open
    }
  }

  // 处理删除教师
  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm("确定要删除此教师？此操作不可撤销。")) return
    try {
      await deleteTeacher(teacherId)
      refetchTeachers()
    } catch (error) {
      console.error("Error deleting teacher:", error)
      alert("删除失败: " + (error instanceof Error ? error.message : "未知错误"))
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题和概览 */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
        </div>
      </div>

      {/* 教师列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('teacher.teacher_list')}</CardTitle>
              <CardDescription>查看和管理所有教师信息及教学安排</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => alert("批量导入功能开发中")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                批量导入
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                添加教师
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索教师姓名、工号、NRIC、邮箱、部门、职位或电话..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={(value) => {
              setSelectedDepartment(value)
              handleFilterChange()
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有部门</SelectItem>
                {departmentOptions.map((dept: string) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(value) => {
              setSelectedStatus(value)
              handleFilterChange()
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">{t('teacher.active')}</SelectItem>
                <SelectItem value="on_leave">{t('teacher.leave')}</SelectItem>
                <SelectItem value="inactive">{t('teacher.resigned')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetchTeachers()}>
              刷新
            </Button>
          </div>

          {/* 教师表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>教师信息</TableHead>
                  <TableHead>部门职位</TableHead>
                  <TableHead>{t('teacher.center')}</TableHead>
                  <TableHead>{t('teacher.contact_info')}</TableHead>
                  <TableHead>教龄</TableHead>
                  <TableHead>{t('teacher.status')}</TableHead>
                  <TableHead>{t('teacher.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : paginatedTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      暂无教师数据
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{teacher.teacher_name || '未设置'}</div>
                          <div className="text-sm text-gray-500">工号: {teacher.teacher_id || '未设置'}</div>
                          <div className="text-sm text-gray-500">NRIC: {teacher.nric || '未设置'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{teacher.department || '未设置'}</div>
                          <div className="text-sm text-gray-600">{teacher.position || '未设置'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {teacher.center || teacher.centerId ? (teacher.center || '已分配') : '未分配'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{teacher.email || '未设置'}</div>
                          <div className="text-sm">{teacher.phone || '未设置'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{teacher.experience || 0} 年</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          teacher.status === 'active' ? 'default' : 
                          teacher.status === 'on_leave' ? 'secondary' : 'destructive'
                        }>
                          {teacher.status === 'active' ? '在职' : 
                           teacher.status === 'on_leave' ? '请假' : '离职'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setViewingTeacher(teacher)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingTeacher(teacher)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title={t('teacher.payroll_management')}
                            onClick={() => setSalaryTeacher(teacher)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title={t('teacher.resigned')}
                            onClick={async () => {
                              if (!confirm(`确定要将 ${teacher.teacher_name} 设为离职吗？`)) return
                              try {
                                await updateTeacher(teacher.id, { status: 'inactive' })
                                refetchTeachers()
                              } catch (e: any) {
                                alert('操作失败: ' + (e.message || '未知错误'))
                              }
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页组件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredTeachers.length)} 条，
                共 {filteredTeachers.length} 条记录
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加教师对话框 */}
      <TeacherForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddTeacher}
        title={t('teacher.add_teacher')}
      />

      {/* 编辑教师对话框 */}
      <TeacherForm
        open={!!editingTeacher}
        onOpenChange={(open) => !open && setEditingTeacher(null)}
        onSubmit={handleUpdateTeacher}
        teacher={editingTeacher}
        title={t('teacher.edit_teacher')}
      />

      {/* 查看教师详情对话框 */}
      <TeacherDetails
        open={!!viewingTeacher}
        onOpenChange={(open) => !open && setViewingTeacher(null)}
        teacher={viewingTeacher}
      />

      {/* 薪资管理对话框 */}
      <Dialog open={!!salaryTeacher} onOpenChange={(open) => !open && setSalaryTeacher(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>薪资管理 — {salaryTeacher?.teacher_name || salaryTeacher?.name || '教师'}</DialogTitle>
          </DialogHeader>
          <TeacherSalaryManagement />
        </DialogContent>
      </Dialog>
    </div>
  )
}
