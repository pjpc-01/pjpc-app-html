"use client"

import { useState, useEffect } from 'react'
import { useCourses, useCourseStats } from '@/hooks/useCourses'
import {
  Course,
  CourseCreateData,
  SUBJECT_OPTIONS,
} from '@/lib/pocketbase-courses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  GraduationCap,
  BookMarked,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  BarChart3,
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

// ============================================================
// 课程卡片视图（手机端）
// ============================================================

function CourseCard({ course, onEdit, onView, onDelete }: {
  course: Course
  onEdit: (c: Course) => void
  onView: (c: Course) => void
  onDelete: (id: string) => void
}) {
  const statusColor = course.status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : course.status === 'inactive'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-600'

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(course)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-base">{course.title}</h3>
          <Badge className={statusColor} variant="secondary">
            {course.status === 'active' ? '进行中' : course.status === 'inactive' ? '已暂停' : '已归档'}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>{course.grade_level || '未设置年级'} · {course.subject}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>最多 {course.max_students || '?'} 人</span>
          </div>
          {course.expand?.teacher_id?.name && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{course.expand.teacher_id.name}</span>
            </div>
          )}
        </div>
        {course.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{course.description}</p>
        )}
        <div className="flex gap-2 mt-3 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); onEdit(course) }}>
            <Edit className="h-3.5 w-3.5 mr-1" /> 编辑
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={(e) => { e.stopPropagation(); onDelete(course.id) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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
  const [form, setForm] = useState<CourseCreateData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // 编辑模式下填充表单
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
              placeholder="例：三年级数学加强班"
            />
          </div>

          {/* 科目 */}
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

          {/* 年级 */}
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

          {/* 授课教师 */}
          <div className="grid gap-2">
            <Label htmlFor="teacher_id">授课教师</Label>
            <Select
              value={form.teacher_id || ''}
              onValueChange={(v) => setForm({ ...form, teacher_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择教师" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
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
                { value: 'active', label: '进行中', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                { value: 'inactive', label: '已暂停', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                { value: 'archived', label: '已归档', color: 'bg-gray-100 text-gray-600 border-gray-300' },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={form.status === opt.value ? 'default' : 'outline'}
                  className={form.status === opt.value ? '' : ''}
                  onClick={() => setForm({ ...form, status: opt.value })}
                  size="sm"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? '保存中...' : editingCourse ? '更新课程' : '创建课程'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// 课程详情视图
// ============================================================

function CourseDetailView({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              {course.title}
              <Badge variant="secondary" className={
                course.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : course.status === 'inactive'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              }>
                {course.status === 'active' ? '进行中' : course.status === 'inactive' ? '已暂停' : '已归档'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {course.subject} · {course.grade_level || '未设定年级'}
              {course.expand?.teacher_id?.name && ` · 教师：${course.expand.teacher_id.name}`}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            返回列表
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 课程信息卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <div className="text-lg font-semibold">{course.duration || '—'}</div>
            <div className="text-xs text-gray-500">分钟/节</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <div className="text-lg font-semibold">{course.max_students || '—'}</div>
            <div className="text-xs text-gray-500">最大学生</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <GraduationCap className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <div className="text-lg font-semibold">{course.grade_level || '—'}</div>
            <div className="text-xs text-gray-500">年级</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <BookMarked className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <div className="text-lg font-semibold">{course.subject}</div>
            <div className="text-xs text-gray-500">科目</div>
          </div>
        </div>

        {/* 课程描述 */}
        {course.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="h-4 w-4" /> 课程大纲/描述
            </h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
              {course.description}
            </p>
          </div>
        )}

        {/* 时间信息 */}
        {(course.start_date || course.end_date) && (
          <div className="text-xs text-gray-400">
            {course.start_date && <span>开始：{course.start_date}</span>}
            {course.end_date && <span>{course.start_date ? ' · ' : ''}结束：{course.end_date}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// 课程统计卡片
// ============================================================

function CourseStatsCards({ stats }: { stats: {
  totalCourses: number
  activeCourses: number
  subjectDistribution: Record<string, number>
}}) {
  const subjectCount = Object.keys(stats.subjectDistribution).length
  const topSubject = Object.entries(stats.subjectDistribution)
    .sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <div className="text-xs text-gray-500">全部课程</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
            <div className="text-xs text-gray-500">进行中</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <BookMarked className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{subjectCount}</div>
            <div className="text-xs text-gray-500">科目种类</div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-lg font-bold truncate max-w-[120px]">{topSubject?.[0] || '—'}</div>
            <div className="text-xs text-gray-500">最多课程科目</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// 主组件 — CourseManagement
// ============================================================

interface CourseManagementProps {
  showTitle?: boolean
}

export default function CourseManagement({ showTitle = true }: CourseManagementProps) {
  const { courses, loading, error, refetch, createCourse, updateCourse, deleteCourse } = useCourses()
  const { stats } = useCourseStats()
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // 对话框状态
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // 教师列表
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [teachersLoading, setTeachersLoading] = useState(false)

  // 加载教师列表
  useEffect(() => {
    const loadTeachers = async () => {
      setTeachersLoading(true)
      try {
        const res = await fetch('/api/teachers?limit=200')
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setTeachers(data.data.map((t: any) => ({ id: t.id, name: t.name || t.teacher_name })))
        } else if (Array.isArray(data)) {
          setTeachers(data.map((t: any) => ({ id: t.id, name: t.name })))
        }
      } catch {
        // 静默失败
      } finally {
        setTeachersLoading(false)
      }
    }
    loadTeachers()
  }, [])

  // 筛选
  const filteredCourses = courses.filter((c) => {
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !c.subject?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (subjectFilter !== 'all' && c.subject !== subjectFilter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  // 可选科目列表（从现有数据 + 预设）
  const subjectOptions = ['all', ...new Set([...courses.map(c => c.subject).filter(Boolean), ...SUBJECT_OPTIONS])]

  // CRUD 操作
  const handleCreate = async (data: CourseCreateData) => {
    await createCourse(data)
  }

  const handleUpdate = async (data: CourseCreateData) => {
    if (!editingCourse) return
    await updateCourse(editingCourse.id, data)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id)
      toast.success('课程已删除')
      setDeleteConfirmId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  // 视图切换
  if (viewingCourse) {
    return (
      <CourseDetailView
        course={viewingCourse}
        onClose={() => setViewingCourse(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {!error && <CourseStatsCards stats={stats} />}

      {/* 搜索和操作栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索课程名称或科目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="科目筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {SUBJECT_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">进行中</SelectItem>
              <SelectItem value="inactive">已暂停</SelectItem>
              <SelectItem value="archived">已归档</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingCourse(null); setAddDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            创建课程
          </Button>
        </div>
      </div>

      {/* 错误状态 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">加载课程失败</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={refetch}>
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">加载课程列表...</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && filteredCourses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">暂无课程</h3>
            <p className="text-sm text-gray-400 mb-4">
              {searchTerm ? '没有符合搜索条件的课程' : '点击"创建课程"开始添加'}
            </p>
            {!searchTerm && (
              <Button onClick={() => { setEditingCourse(null); setAddDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                创建课程
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 桌面端表格 */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="hidden md:block border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程名称</TableHead>
                <TableHead>科目</TableHead>
                <TableHead>年级</TableHead>
                <TableHead>教师</TableHead>
                <TableHead>时长</TableHead>
                <TableHead>人数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow
                  key={course.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setViewingCourse(course)}
                >
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>{course.subject}</TableCell>
                  <TableCell>{course.grade_level || '—'}</TableCell>
                  <TableCell>{course.expand?.teacher_id?.name || '—'}</TableCell>
                  <TableCell>{course.duration ? `${course.duration}分` : '—'}</TableCell>
                  <TableCell>{course.max_students || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      course.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : course.status === 'inactive'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }>
                      {course.status === 'active' ? '进行中' : course.status === 'inactive' ? '已暂停' : '已归档'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingCourse(course); setEditDialogOpen(true) }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleteConfirmId(course.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 手机端卡片视图 */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={(c) => { setEditingCourse(c); setEditDialogOpen(true) }}
              onView={(c) => setViewingCourse(c)}
              onDelete={(id) => setDeleteConfirmId(id)}
            />
          ))}
        </div>
      )}

      {/* 创建/编辑对话框 */}
      <CourseFormDialog
        open={addDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) { setAddDialogOpen(false); setEditDialogOpen(false); setEditingCourse(null) }
        }}
        editingCourse={editingCourse}
        onSave={editingCourse ? handleUpdate : handleCreate}
        teachers={teachers}
      />

      {/* 删除确认 */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              删除后无法恢复，确定要删除这个课程吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
