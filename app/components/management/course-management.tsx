'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import PageLayout from '@/components/layouts/PageLayout'
import TabbedPage from '@/components/layouts/TabbedPage'
import StatsGrid from '@/components/ui/StatsGrid'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, BookOpen, Users, Clock, Calendar, Edit, Trash2 } from 'lucide-react'
import { useCourses, useCourseStats, Course } from '@/hooks/useCourses'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'
import { useStudents } from '@/hooks/useStudents'

export default function CourseManagement() {
  const { teacher, loading: teacherLoading } = useCurrentTeacher()
  const { courses, loading: coursesLoading, createCourse, updateCourse, deleteCourse } = useCourses(teacher?.id)
  const { stats, loading: statsLoading } = useCourseStats(teacher?.id)
  const { students } = useStudents()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    subject: '',
    grade_level: '',
    duration: 60,
    max_students: 30,
    status: 'active'
  })

  const handleCreateCourse = async () => {
    if (!teacher?.id) return

    // 验证必填字段
    if (!newCourse.title || !newCourse.subject) {
      alert('请填写课程名称和科目')
      return
    }

    const courseData = {
      ...newCourse,
      teacher_id: teacher.id
    }

    const result = await createCourse(courseData)
    if (result) {
      setShowCreateDialog(false)
      setNewCourse({
        title: '',
        description: '',
        subject: '',
        grade_level: '',
        duration: 60,
        max_students: 30,
        status: 'active'
      })
      alert('课程创建成功！')
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse?.id) return

    // 验证必填字段
    if (!newCourse.title || !newCourse.subject) {
      alert('请填写课程名称和科目')
      return
    }

    const result = await updateCourse(editingCourse.id, newCourse)
    if (result) {
      setShowCreateDialog(false)
      setEditingCourse(null)
      setNewCourse({
        title: '',
        description: '',
        subject: '',
        grade_level: '',
        duration: 60,
        max_students: 30,
        status: 'active'
      })
      alert('课程更新成功！')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('确定要删除这个课程吗？删除后无法恢复！')) {
      const result = await deleteCourse(courseId)
      if (result) {
        alert('课程删除成功！')
      }
    }
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setNewCourse({
      title: course.title,
      description: course.description,
      subject: course.subject,
      grade_level: course.grade_level,
      duration: course.duration,
      max_students: course.max_students,
      status: course.status
    })
    setShowCreateDialog(true)
  }

  if (teacherLoading) {
    return <div className="p-6">加载教师信息中...</div>
  }

  if (!teacher) {
    return <div className="p-6">未找到教师信息</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">课程管理</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建课程
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCourse ? '编辑课程' : '创建新课程'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">课程名称 <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="输入课程名称"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subject">科目 <span className="text-red-500">*</span></Label>
                  <Input
                    id="subject"
                    value={newCourse.subject}
                    onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
                    placeholder="输入科目"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade_level">年级</Label>
                  <Input
                    id="grade_level"
                    value={newCourse.grade_level}
                    onChange={(e) => setNewCourse({ ...newCourse, grade_level: e.target.value })}
                    placeholder="输入年级"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">课程时长(分钟)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="max_students">最大学生数</Label>
                <Input
                  id="max_students"
                  type="number"
                  value={newCourse.max_students}
                  onChange={(e) => setNewCourse({ ...newCourse, max_students: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div>
                <Label htmlFor="description">课程描述</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="输入课程描述"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setEditingCourse(null)
                  setNewCourse({
                    title: '',
                    description: '',
                    subject: '',
                    grade_level: '',
                    duration: 60,
                    max_students: 30,
                    status: 'active'
                  })
                }}>
                  取消
                </Button>
                <Button onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                  {editingCourse ? '更新课程' : '创建课程'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">总课程数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">活跃课程</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">总学生数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">平均班级大小</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageClassSize}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 课程列表 */}
      <Card>
        <CardHeader>
          <CardTitle>我的课程</CardTitle>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无课程，点击上方按钮创建第一个课程
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>课程名称</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>最大学生数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.subject}</TableCell>
                    <TableCell>{course.grade_level}</TableCell>
                    <TableCell>{course.duration}分钟</TableCell>
                    <TableCell>{course.max_students}</TableCell>
                    <TableCell>
                      <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                        {course.status === 'active' ? '活跃' : '非活跃'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  )
}