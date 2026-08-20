"use client"

import { useState, useEffect } from 'react'
import { useCourses, useCourseStats } from '@/hooks/useCourses'
import { Course, CourseCreateData, SUBJECT_OPTIONS } from '@/lib/pocketbase-courses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useLanguage } from "@/contexts/language-context"
import {
  Users,
  BookOpen,
  GraduationCap,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'

// 年级选项
const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  'Peralihan', 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5',
]

// 默认空课程表单
const EMPTY_FORM: CourseCreateData = {
  title: '',
  description: '',
  subject: '',
  grade_level: '',
  teacher_id: '',
  duration: 60,
  max_students: 30,
  status: 'active',
}

// 颜色映射
const GRADE_COLORS: Record<string, string> = {
  '一年级': 'bg-red-100 text-red-700',
  '二年级': 'bg-orange-100 text-orange-700',
  '三年级': 'bg-amber-100 text-amber-700',
  '四年级': 'bg-yellow-100 text-yellow-700',
  '五年级': 'bg-lime-100 text-lime-700',
  '六年级': 'bg-green-100 text-green-700',
  'Peralihan': 'bg-cyan-100 text-cyan-700',
  'Form 1': 'bg-blue-100 text-blue-700',
  'Form 2': 'bg-indigo-100 text-indigo-700',
  'Form 3': 'bg-violet-100 text-violet-700',
  'Form 4': 'bg-purple-100 text-purple-700',
  'Form 5': 'bg-pink-100 text-pink-700',
}

function getGradeColor(grade: string): string {
  return GRADE_COLORS[grade] || 'bg-gray-100 text-gray-600'
}

function getStatusBadge(status?: string) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'inactive') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

// ============================================================
// 课程表单对话框（创建/编辑共用）
// ============================================================

function CourseFormDialog({
  open,
  onOpenChange,
  editingCourse,
  onSave,
  teachers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCourse: Course | null
  onSave: (data: CourseCreateData) => Promise<void>
  teachers: { id: string; name: string }[]
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState<CourseCreateData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingCourse) {
      setForm({
        title: editingCourse.title,
        description: editingCourse.description || '',
        subject: editingCourse.subject,
        grade_level: editingCourse.grade_level || '',
        teacher_id: editingCourse.teacher_id || '',
        duration: editingCourse.duration || 60,
        max_students: editingCourse.max_students || 30,
        status: editingCourse.status || 'active',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [editingCourse, open])

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('请输入课程名称')
      return
    }
    if (!form.subject) {
      toast.error('请选择科目')
      return
    }
    try {
      setSaving(true)
      await onSave(form)
      toast.success(editingCourse ? '课程已更新' : '课程已创建')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCourse ? '编辑课程' : '创建新课程'}</DialogTitle>
          <DialogDescription>
            {editingCourse ? '修改课程设置和安排' : '填写课程基本信息'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 课程名称 */}
          <div className="grid gap-2">
            <Label htmlFor="title">课程名称 <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="如：一年级华文"
            />
          </div>

          {/* 科目 + 年级 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">科目 <span className="text-red-500">*</span></Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade_level">年级</Label>
              <Select value={form.grade_level || ''} onValueChange={(v) => setForm({ ...form, grade_level: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 授课教师 */}
          <div className="grid gap-2">
            <Label htmlFor="teacher_id">授课教师 <span className="text-xs text-gray-400 font-normal">(可选，可在排课时指定)</span></Label>
            <Select
              value={form.teacher_id || ''}
              onValueChange={(v) => setForm({ ...form, teacher_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择授课教师" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 双列：时长 + 最大人数 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">每节课时长（分钟）</Label>
              <Input
                id="duration"
                type="number"
                value={form.duration || 60}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_students">最大学生数</Label>
              <Input
                id="max_students"
                type="number"
                value={form.max_students || 30}
                onChange={(e) => setForm({ ...form, max_students: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          {/* 课程描述 */}
          <div className="grid gap-2">
            <Label htmlFor="description">课程描述 / 大纲</Label>
            <Textarea
              id="description"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="课程内容简介、教学目标、教材说明..."
              rows={3}
            />
          </div>

          {/* 状态 */}
          <div className="grid gap-2">
            <Label>状态</Label>
            <div className="flex gap-3">
              {[
                { value: 'active', label: '进行中' },
                { value: 'inactive', label: '已暂停' },
                { value: 'archived', label: '已归档' },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={form.status === opt.value ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, status: opt.value })}
                  className={form.status === opt.value ? '' : ''}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {editingCourse ? '保存修改' : '创建课程'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// ClassManagement 主组件 —— 卡片式课程管理（含创建/编辑/删除）
// ============================================================

export default function ClassManagement({ showTitle = true }: { showTitle?: boolean }) {
  const { t } = useLanguage()
  const { courses, loading, error, refetch, createCourse, updateCourse, deleteCourse } = useCourses()
  const { stats } = useCourseStats()
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')

  // 对话框状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)

  // 教师列表
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])

  // 加载教师列表
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const res = await fetch('/api/teachers?limit=200')
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setTeachers(data.data.map((tt: any) => ({ id: tt.id, name: tt.name || tt.teacher_name })))
        } else if (Array.isArray(data)) {
          setTeachers(data.map((tt: any) => ({ id: tt.id, name: tt.name })))
        }
      } catch {
        // 静默失败
      }
    }
    loadTeachers()
  }, [])

  // 有效课程（不含已归档）
  const activeCourses = courses.filter(c => c.status !== 'archived')

  // 筛选
  const filteredCourses = activeCourses.filter((c) => {
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !c.subject?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (gradeFilter !== 'all' && c.grade_level !== gradeFilter) return false
    return true
  })

  // 按年级分组显示
  const groupedByGrade = filteredCourses.reduce((acc, c) => {
    const grade = c.grade_level || '未分组'
    if (!acc[grade]) acc[grade] = []
    acc[grade].push(c)
    return acc
  }, {} as Record<string, Course[]>)

  // 统计
  const gradeDistribution = activeCourses.reduce((acc, c) => {
    acc[c.grade_level || ''] = (acc[c.grade_level || ''] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // CRUD
  const handleCreate = async (data: CourseCreateData) => {
    await createCourse(data)
    refetch()
  }
  const handleUpdate = async (data: CourseCreateData) => {
    if (!editingCourse) return
    await updateCourse(editingCourse.id, data)
    refetch()
  }
  const handleDelete = async (course: Course) => {
    try {
      await deleteCourse(course.id)
      toast.success('课程已删除')
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const teacherNameFor = (course: Course) => {
    if (course.expand?.teacher_id?.name) return course.expand.teacher_id.name
    if (course.teacher_id) {
      const tt = teachers.find(tt => tt.id === course.teacher_id)
      return tt?.name
    }
    return ''
  }

  // 加载状态
  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-gray-400" />
        <p className="text-sm text-gray-500 mt-3">加载课程数据...</p>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
          <h3 className="text-lg font-medium text-red-700 mb-1">{t('course.load_failed')}</h3>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" /> 重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计行 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalCourses ?? activeCourses.length}</div>
              <div className="text-xs text-gray-500">课程总数</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(gradeDistribution).length}</div>
              <div className="text-xs text-gray-500">年级覆盖</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <UserCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.activeCourses ?? activeCourses.filter(c => c.status === 'active').length}</div>
              <div className="text-xs text-gray-500">进行中</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(stats.subjectDistribution || {}).length || new Set(activeCourses.map(c => c.subject).filter(Boolean)).size}</div>
              <div className="text-xs text-gray-500">科目种类</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索筛选栏 + 创建按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索课程或科目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('course.grade_filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('course.all_grades')}</SelectItem>
            {GRADE_OPTIONS.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditingCourse(null); setAddDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          创建课程
        </Button>
      </div>

      {/* 空状态 */}
      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">暂无课程数据</h3>
            <p className="text-sm text-gray-400">
              {searchTerm || gradeFilter !== 'all' ? '没有符合筛选条件的课程' : '点击右上角「创建课程」开始'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 卡片视图 — 按年级分组 */}
      {filteredCourses.length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByGrade).map(([grade, gradeCourses]) => (
            <div key={grade}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getGradeColor(grade) + ' text-sm px-3 py-1'}>
                  {grade}
                </Badge>
                <span className="text-xs text-gray-400">{gradeCourses.length} 个班级</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gradeCourses.map((course) => {
                  const teacherName = teacherNameFor(course)
                  return (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
                            {course.title}
                          </CardTitle>
                          <Badge variant="secondary" className={getStatusBadge(course.status)}>
                            {course.status === 'active' ? '进行中' : course.status === 'inactive' ? '已暂停' : '已归档'}
                          </Badge>
                        </div>
                        <CardDescription>{course.subject}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                          {course.grade_level || '未设置年级'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {course.duration ? `${course.duration}分/节` : '时长未设'}
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 shrink-0" />
                            {teacherName || '未分配教师'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {course.max_students || '?'}人
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline" size="sm" className="flex-1"
                            onClick={() => { setEditingCourse(course); setAddDialogOpen(true) }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" /> 编辑
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="text-red-500"
                            onClick={() => setDeleteTarget(course)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建/编辑对话框 */}
      <CourseFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        editingCourse={editingCourse}
        onSave={editingCourse ? handleUpdate : handleCreate}
        teachers={teachers}
      />

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>删除课程</DialogTitle>
            <DialogDescription>
              确定要删除「{deleteTarget?.title}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
