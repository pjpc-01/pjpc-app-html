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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  GraduationCap,
  Users,
  Phone,
  User,
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
  const { t } = useLanguage()
  const { students, loading, error, addStudent, updateStudent, deleteStudent } = useStudents()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emptyForm = {
    student_name: '',
    student_id: '',
    dob: '',
    standard: '',
    father_name: '',
    mother_name: '',
    father_phone: '',
    mother_phone: '',
    status: 'active' as const,
  }
  const [newStudent, setNewStudent] = useState(emptyForm)

  // 根据出生日期自动计算建议年级
  const calculateGradeFromDob = (dob: string): string => {
    if (!dob) return ''
    const birthYear = new Date(dob).getFullYear()
    const currentYear = new Date().getFullYear()
    const age = currentYear - birthYear
    
    const gradeMap: Record<number, string> = {
      7: '一年级', 8: '二年级', 9: '三年级',
      10: '四年级', 11: '五年级', 12: '六年级',
      13: '中一', 14: '中二', 15: '中三',
      16: '中四', 17: '中五',
    }
    return gradeMap[age] || ''
  }

  const handleDobChange = (value: string) => {
    const suggestedGrade = calculateGradeFromDob(value)
    setNewStudent(prev => ({ 
      ...prev, 
      dob: value, 
      standard: suggestedGrade || prev.standard 
    }))
  }

  // 筛选学生
  const filteredStudents = useMemo(() => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.father_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.mother_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.standard === selectedGrade)
    }

    return filtered
  }, [students, searchTerm, selectedGrade])

  // 获取年级选项
  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.standard).filter(Boolean))).sort()
    return grades
  }, [students])

  // 处理添加学生
  const handleAddStudent = async () => {
    if (!newStudent.student_name?.trim()) return
    try {
      setIsSubmitting(true)
      await addStudent(newStudent)
      setIsAddDialogOpen(false)
      setNewStudent(emptyForm)
    } catch (error) {
      console.error('添加学生失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理编辑学生
  const handleEditStudent = async () => {
    if (!editingStudent) return
    try {
      setIsSubmitting(true)
      await updateStudent(editingStudent.id, editingStudent)
      setEditingStudent(null)
    } catch (error) {
      console.error('更新学生失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理删除学生
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('确定要删除这个学生吗？此操作不可撤销。')) return
    try {
      await deleteStudent(studentId)
      alert('学生已删除')
    } catch (error: any) {
      const msg = error?.message || String(error)
      console.error('删除学生失败:', error)
      // Check if it's a related records issue
      if (msg.includes('related') || msg.includes('relation') || msg.includes('500') || msg.includes('400')) {
        alert('删除失败：该学生可能有相关的发票、考勤或费用记录。请先删除相关记录或将学生状态改为"离校"。')
      } else {
        alert('删除失败：' + msg)
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
                  placeholder="搜索学生姓名、学号、年级或家长..."
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
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>添加新学生</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">{t('student.name')}</Label>
                    <Input
                      value={newStudent.student_name}
                      onChange={(e) => setNewStudent({...newStudent, student_name: e.target.value})}
                      className="col-span-3"
                      placeholder={t('student.student_name')}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">{t('student.student_no')}</Label>
                    <Input
                      value={newStudent.student_id}
                      onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                      className="col-span-3"
                      placeholder="例: B10"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">{t('student.date_of_birth')}</Label>
                    <Input
                      type="date"
                      value={newStudent.dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">{t('student.grade')}</Label>
                    <div className="col-span-3">
                      <Input
                        value={newStudent.standard}
                        onChange={(e) => setNewStudent({...newStudent, standard: e.target.value})}
                        placeholder="例: 一年级"
                      />
                      {newStudent.dob && calculateGradeFromDob(newStudent.dob) && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 根据出生日期建议: {calculateGradeFromDob(newStudent.dob)}（可手动修改）
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-500 mb-3">家长信息</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>父亲姓名</Label>
                        <Input
                          value={newStudent.father_name}
                          onChange={(e) => setNewStudent({...newStudent, father_name: e.target.value})}
                          placeholder="父亲姓名"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>母亲姓名</Label>
                        <Input
                          value={newStudent.mother_name}
                          onChange={(e) => setNewStudent({...newStudent, mother_name: e.target.value})}
                          placeholder="母亲姓名"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>父亲电话</Label>
                        <Input
                          value={newStudent.father_phone}
                          onChange={(e) => setNewStudent({...newStudent, father_phone: e.target.value})}
                          placeholder="父亲电话"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>母亲电话</Label>
                        <Input
                          value={newStudent.mother_phone}
                          onChange={(e) => setNewStudent({...newStudent, mother_phone: e.target.value})}
                          placeholder="母亲电话"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddStudent} disabled={isSubmitting}>
                    {isSubmitting ? '添加中...' : '添加学生'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 学生列表 */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">{t('student.name')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('student.student_no')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('student.grade')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('student.father')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('student.mother')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('student.contact_phone')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('teacher.status')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('teacher.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.student_name || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{student.student_id || '-'}</TableCell>
                    <TableCell>{student.standard || '-'}</TableCell>
                    <TableCell>{student.father_name || '-'}</TableCell>
                    <TableCell>{student.mother_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {student.father_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> 父: {student.father_phone}
                          </span>
                        )}
                        {student.mother_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> 母: {student.mother_phone}
                          </span>
                        )}
                        {!student.father_phone && !student.mother_phone && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="whitespace-nowrap text-xs">
                        {student.status === 'active' ? '在读' : 
                         student.status === 'graduated' ? '毕业' : 
                         student.status === 'withdrawn' ? '已停学' : '休学'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('student.student_details')}</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('student.name')}</Label>
                  <p>{viewingStudent.student_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('student.student_no')}</Label>
                  <p className="font-mono">{viewingStudent.student_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('student.grade')}</Label>
                  <p>{viewingStudent.standard || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('teacher.status')}</Label>
                  <Badge variant={viewingStudent.status === 'active' ? 'default' : 'secondary'}>
                    {viewingStudent.status === 'active' ? '在读' : viewingStudent.status === 'graduated' ? '毕业' : '休学'}
                  </Badge>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-3">家长信息</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-400">父亲姓名</Label>
                    <p className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {viewingStudent.father_name || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">母亲姓名</Label>
                    <p className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {viewingStudent.mother_name || '-'}
                    </p>
                  </div>
                  {viewingStudent.father_phone && (
                    <div>
                      <Label className="text-xs text-gray-400">父亲电话</Label>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {viewingStudent.father_phone}
                      </p>
                    </div>
                  )}
                  {viewingStudent.mother_phone && (
                    <div>
                      <Label className="text-xs text-gray-400">母亲电话</Label>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {viewingStudent.mother_phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑学生对话框 */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑学生信息</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t('student.name')}</Label>
                <Input
                  value={editingStudent.student_name || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, student_name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t('student.student_no')}</Label>
                <Input
                  value={editingStudent.student_id || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, student_id: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t('student.date_of_birth')}</Label>
                <Input
                  type="date"
                  value={editingStudent.dob || ''}
                  onChange={(e) => {
                    const dob = e.target.value
                    const suggested = calculateGradeFromDob(dob)
                    setEditingStudent({
                      ...editingStudent, 
                      dob, 
                      standard: suggested || editingStudent.standard 
                    })
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t('student.grade')}</Label>
                <div className="col-span-3">
                  <Input
                    value={editingStudent.standard || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, standard: e.target.value})}
                  />
                  {editingStudent.dob && calculateGradeFromDob(editingStudent.dob) && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 根据出生日期建议: {calculateGradeFromDob(editingStudent.dob)}（可手动修改）
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-3">家长信息</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>父亲姓名</Label>
                    <Input
                      value={editingStudent.father_name || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, father_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>母亲姓名</Label>
                    <Input
                      value={editingStudent.mother_name || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, mother_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>父亲电话</Label>
                    <Input
                      value={editingStudent.father_phone || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, father_phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>母亲电话</Label>
                    <Input
                      value={editingStudent.mother_phone || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, mother_phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingStudent(null)}>
              取消
            </Button>
            <Button onClick={handleEditStudent} disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存修改'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
