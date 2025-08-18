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
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  BookOpen,
  Users,
  Clock,
  Calendar,
  GraduationCap
} from "lucide-react"

interface Course {
  id: string
  name: string
  teacher: string
  students: number
  schedule: string
  status: 'active' | 'inactive'
  progress: number
  materials: number
  description: string
}

interface SimpleCourseManagementProps {
  title?: string
  description?: string
}

export default function SimpleCourseManagement({ 
  title = "课程管理", 
  description = "管理课程设置和教学安排" 
}: SimpleCourseManagementProps) {
  // 模拟课程数据
  const [courses, setCourses] = useState<Course[]>([
    {
      id: '1',
      name: '三年级数学',
      teacher: '张老师',
      students: 28,
      schedule: '周一、三、五 14:00-15:30',
      status: 'active',
      progress: 65,
      materials: 12,
      description: '基础数学课程，涵盖加减乘除和简单应用题'
    },
    {
      id: '2',
      name: '四年级语文',
      teacher: '李老师',
      students: 32,
      schedule: '周二、四 15:00-16:30',
      status: 'active',
      progress: 78,
      materials: 18,
      description: '语文阅读与写作课程，提高学生的语言表达能力'
    },
    {
      id: '3',
      name: '五年级英语',
      teacher: '王老师',
      students: 29,
      schedule: '周一、三 16:00-17:30',
      status: 'active',
      progress: 52,
      materials: 15,
      description: '英语口语和语法课程，培养学生的英语交流能力'
    }
  ])
  
  // 简化的状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)
  
  // 新课程表单数据
  const [newCourse, setNewCourse] = useState({
    name: '',
    teacher: '',
    students: 0,
    schedule: '',
    status: 'active' as const,
    progress: 0,
    materials: 0,
    description: ''
  })

  // 筛选课程
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeacher = selectedTeacher === 'all' || course.teacher === selectedTeacher
    return matchesSearch && matchesTeacher
  })

  // 获取教师选项
  const teacherOptions = Array.from(new Set(courses.map(c => c.teacher)))

  // 处理添加课程
  const handleAddCourse = () => {
    const course: Course = {
      id: Date.now().toString(),
      ...newCourse
    }
    setCourses([...courses, course])
    setIsAddDialogOpen(false)
    setNewCourse({
      name: '',
      teacher: '',
      students: 0,
      schedule: '',
      status: 'active',
      progress: 0,
      materials: 0,
      description: ''
    })
  }

  // 处理编辑课程
  const handleEditCourse = () => {
    if (!editingCourse) return
    
    setCourses(courses.map(c => 
      c.id === editingCourse.id ? editingCourse : c
    ))
    setEditingCourse(null)
  }

  // 处理删除课程
  const handleDeleteCourse = (courseId: string) => {
    if (confirm('确定要删除这个课程吗？')) {
      setCourses(courses.filter(c => c.id !== courseId))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
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
                  placeholder="搜索课程名称或教师..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有教师</option>
              {teacherOptions.map(teacher => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建课程
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新课程</DialogTitle>
                  <DialogDescription>填写课程基本信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">课程名称</Label>
                    <Input
                      id="name"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="teacher" className="text-right">授课教师</Label>
                    <Input
                      id="teacher"
                      value={newCourse.teacher}
                      onChange={(e) => setNewCourse({...newCourse, teacher: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="students" className="text-right">学生人数</Label>
                    <Input
                      id="students"
                      type="number"
                      value={newCourse.students}
                      onChange={(e) => setNewCourse({...newCourse, students: parseInt(e.target.value) || 0})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="schedule" className="text-right">课程时间</Label>
                    <Input
                      id="schedule"
                      value={newCourse.schedule}
                      onChange={(e) => setNewCourse({...newCourse, schedule: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="materials" className="text-right">教材数量</Label>
                    <Input
                      id="materials"
                      type="number"
                      value={newCourse.materials}
                      onChange={(e) => setNewCourse({...newCourse, materials: parseInt(e.target.value) || 0})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">课程描述</Label>
                    <Textarea
                      id="description"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddCourse}>
                    创建课程
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 课程列表 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>课程名称</TableHead>
                  <TableHead>授课教师</TableHead>
                  <TableHead>学生人数</TableHead>
                  <TableHead>课程时间</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>教材</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.teacher}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {course.students}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {course.schedule}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{course.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                        {course.materials}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                        {course.status === 'active' ? '进行中' : '已结束'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setViewingCourse(course)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingCourse(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
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
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无课程数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看课程详情对话框 */}
      <Dialog open={!!viewingCourse} onOpenChange={() => setViewingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>课程详情</DialogTitle>
          </DialogHeader>
          {viewingCourse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">课程名称</Label>
                  <p className="text-sm">{viewingCourse.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">授课教师</Label>
                  <p className="text-sm">{viewingCourse.teacher}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">学生人数</Label>
                  <p className="text-sm">{viewingCourse.students} 人</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">课程时间</Label>
                  <p className="text-sm">{viewingCourse.schedule}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">进度</Label>
                  <p className="text-sm">{viewingCourse.progress}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">教材数量</Label>
                  <p className="text-sm">{viewingCourse.materials} 本</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">状态</Label>
                  <Badge variant={viewingCourse.status === 'active' ? 'default' : 'secondary'}>
                    {viewingCourse.status === 'active' ? '进行中' : '已结束'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">课程描述</Label>
                <p className="text-sm mt-1">{viewingCourse.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑课程对话框 */}
      <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑课程信息</DialogTitle>
          </DialogHeader>
          {editingCourse && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">课程名称</Label>
                <Input
                  id="edit-name"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-teacher" className="text-right">授课教师</Label>
                <Input
                  id="edit-teacher"
                  value={editingCourse.teacher}
                  onChange={(e) => setEditingCourse({...editingCourse, teacher: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-students" className="text-right">学生人数</Label>
                <Input
                  id="edit-students"
                  type="number"
                  value={editingCourse.students}
                  onChange={(e) => setEditingCourse({...editingCourse, students: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-schedule" className="text-right">课程时间</Label>
                <Input
                  id="edit-schedule"
                  value={editingCourse.schedule}
                  onChange={(e) => setEditingCourse({...editingCourse, schedule: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-progress" className="text-right">进度</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editingCourse.progress}
                  onChange={(e) => setEditingCourse({...editingCourse, progress: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-materials" className="text-right">教材数量</Label>
                <Input
                  id="edit-materials"
                  type="number"
                  value={editingCourse.materials}
                  onChange={(e) => setEditingCourse({...editingCourse, materials: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">课程描述</Label>
                <Textarea
                  id="edit-description"
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingCourse(null)}>
              取消
            </Button>
            <Button onClick={handleEditCourse}>
              保存修改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
