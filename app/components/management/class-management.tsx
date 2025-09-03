'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Users, MapPin, Calendar, Edit, Trash2, UserPlus } from 'lucide-react'
import { useClasses, useClassEnrollments, Class } from '@/hooks/useClasses'
import { useCourses } from '@/hooks/useCourses'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'
import { useStudents } from '@/hooks/useStudents'

export default function ClassManagement() {
  const { teacher, loading: teacherLoading } = useCurrentTeacher()
  const { classes, loading: classesLoading, createClass, updateClass, deleteClass } = useClasses(teacher?.id)
  const { courses } = useCourses(teacher?.id)
  const { students } = useStudents()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [newClass, setNewClass] = useState<Partial<Class>>({
    name: '',
    course_id: '',
    center: '',
    room: '',
    max_capacity: 30,
    status: 'active'
  })

  const handleCreateClass = async () => {
    if (!teacher?.id) return

    // 验证必填字段
    if (!newClass.name || !newClass.course_id) {
      alert('请填写班级名称和选择关联课程')
      return
    }

    const classData = {
      ...newClass,
      teacher_id: teacher.id
    }

    const result = await createClass(classData)
    if (result) {
      setShowCreateDialog(false)
      setNewClass({
        name: '',
        course_id: '',
        center: '',
        room: '',
        max_capacity: 30,
        status: 'active'
      })
      alert('班级创建成功！')
    }
  }

  const handleUpdateClass = async () => {
    if (!editingClass?.id) return

    const result = await updateClass(editingClass.id, newClass)
    if (result) {
      setShowCreateDialog(false)
      setEditingClass(null)
      setNewClass({
        name: '',
        course_id: '',
        center: '',
        room: '',
        max_capacity: 30,
        status: 'active'
      })
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (confirm('确定要删除这个班级吗？')) {
      await deleteClass(classId)
    }
  }

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem)
    setNewClass({
      name: classItem.name,
      course_id: classItem.course_id,
      center: classItem.center,
      room: classItem.room,
      max_capacity: classItem.max_capacity,
      status: classItem.status
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
        <h2 className="text-2xl font-bold">班级管理</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建班级
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingClass ? '编辑班级' : '创建新班级'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">班级名称 <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="输入班级名称"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="course_id">关联课程 <span className="text-red-500">*</span></Label>
                  <Select value={newClass.course_id} onValueChange={(value) => setNewClass({ ...newClass, course_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择课程" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title} ({course.subject})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="center">所属中心</Label>
                  <Input
                    id="center"
                    value={newClass.center}
                    onChange={(e) => setNewClass({ ...newClass, center: e.target.value })}
                    placeholder="输入所属中心"
                  />
                </div>
                <div>
                  <Label htmlFor="room">教室</Label>
                  <Input
                    id="room"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    placeholder="输入教室"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="max_capacity">最大容量</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  value={newClass.max_capacity}
                  onChange={(e) => setNewClass({ ...newClass, max_capacity: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setEditingClass(null)
                  setNewClass({
                    name: '',
                    course_id: '',
                    center: '',
                    room: '',
                    max_capacity: 30,
                    status: 'active'
                  })
                }}>
                  取消
                </Button>
                <Button onClick={editingClass ? handleUpdateClass : handleCreateClass}>
                  {editingClass ? '更新班级' : '创建班级'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 班级列表 */}
      <Card>
        <CardHeader>
          <CardTitle>我的班级</CardTitle>
        </CardHeader>
        <CardContent>
          {classesLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无班级，点击上方按钮创建第一个班级
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>班级名称</TableHead>
                  <TableHead>关联课程</TableHead>
                  <TableHead>中心</TableHead>
                  <TableHead>教室</TableHead>
                  <TableHead>学生数</TableHead>
                  <TableHead>容量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>
                      {classItem.expand?.course_id?.title || '未知课程'}
                    </TableCell>
                    <TableCell>{classItem.center}</TableCell>
                    <TableCell>{classItem.room}</TableCell>
                    <TableCell>{classItem.current_students}</TableCell>
                    <TableCell>{classItem.max_capacity}</TableCell>
                    <TableCell>
                      <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                        {classItem.status === 'active' ? '活跃' : '非活跃'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedClass(classItem)
                            setShowEnrollDialog(true)
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClass(classItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteClass(classItem.id)}
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

      {/* 学生注册对话框 */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>注册学生到班级</DialogTitle>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                班级: {selectedClass.name} ({selectedClass.expand?.course_id?.title})
              </p>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>学号</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.student_name}</TableCell>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status === 'active' ? '活跃' : '非活跃'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            注册
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
