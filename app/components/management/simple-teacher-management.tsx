"use client"

import { useState } from "react"
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
  GraduationCap,
  Brain,
  BarChart3,
  Zap,
  Lightbulb,
  Settings,
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles
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
  const [activeTab, setActiveTab] = useState('management')
  
  // 新教师表单数据
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    department: '',
    experience: 0,
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

  // 处理函数
  const handleAddTeacher = () => {
    if (newTeacher.name && newTeacher.email && newTeacher.subject) {
      const teacher: Teacher = {
        id: Date.now().toString(),
        name: newTeacher.name,
        email: newTeacher.email,
        phone: newTeacher.phone,
        subject: newTeacher.subject,
        department: newTeacher.department,
        experience: newTeacher.experience,
        status: 'active'
      }
      setTeachers([...teachers, teacher])
      setNewTeacher({ name: '', email: '', phone: '', subject: '', department: '', experience: 0 })
      setIsAddDialogOpen(false)
    }
  }

  const handleEditTeacher = () => {
    if (editingTeacher) {
      setTeachers(teachers.map(t => t.id === editingTeacher.id ? editingTeacher : t))
      setEditingTeacher(null)
    }
  }

  const handleDeleteTeacher = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id))
  }

  // 开发中组件
  const DevelopmentInProgress = ({ title, description, icon: Icon }: { 
    title: string, 
    description: string, 
    icon: any 
  }) => (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <Icon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" />
              正在开发中
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* 标题和描述 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* AI功能标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="management">教师管理</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI助手</TabsTrigger>
          <TabsTrigger value="analytics">数据分析</TabsTrigger>
          <TabsTrigger value="automation">自动化</TabsTrigger>
          <TabsTrigger value="communication">智能沟通</TabsTrigger>
          <TabsTrigger value="resources">资源推荐</TabsTrigger>
        </TabsList>

        {/* 教师管理标签页 */}
        <TabsContent value="management" className="space-y-6">
          {/* 搜索和筛选 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                教师列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
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
                <div className="w-48">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">所有科目</option>
                    {subjectOptions.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
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
                      <DialogDescription>
                        填写教师基本信息
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">姓名</Label>
                        <Input
                          id="name"
                          value={newTeacher.name}
                          onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">邮箱</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newTeacher.email}
                          onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">电话</Label>
                        <Input
                          id="phone"
                          value={newTeacher.phone}
                          onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">科目</Label>
                        <Input
                          id="subject"
                          value={newTeacher.subject}
                          onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">部门</Label>
                        <Input
                          id="department"
                          value={newTeacher.department}
                          onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">教龄</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={newTeacher.experience}
                          onChange={(e) => setNewTeacher({...newTeacher, experience: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <Button onClick={handleAddTeacher} className="w-full">
                        添加教师
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 教师表格 */}
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
                      <TableCell>{teacher.experience}年</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                          {teacher.status === 'active' ? '在职' : '离职'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI助手标签页 */}
        <TabsContent value="ai-assistant" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DevelopmentInProgress
              title="智能备课助手"
              description="AI辅助生成教案模板，根据课程大纲自动创建教学计划"
              icon={BookOpen}
            />
            <DevelopmentInProgress
              title="作业自动批改"
              description="AI辅助批改选择题、填空题等标准化题目，提高批改效率"
              icon={CheckCircle}
            />
            <DevelopmentInProgress
              title="个性化学习建议"
              description="基于学生表现生成个性化学习计划和改进建议"
              icon={Brain}
            />
            <DevelopmentInProgress
              title="智能答疑系统"
              description="24/7在线答疑，减轻教师重复性问题解答负担"
              icon={MessageSquare}
            />
          </div>
        </TabsContent>

        {/* 数据分析标签页 */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DevelopmentInProgress
              title="学生学习行为分析"
              description="AI分析学生参与度、学习模式和学习偏好"
              icon={BarChart3}
            />
            <DevelopmentInProgress
              title="成绩趋势预测"
              description="预测学生成绩发展趋势，提前进行教学干预"
              icon={TrendingUp}
            />
            <DevelopmentInProgress
              title="教学效果评估"
              description="AI评估教学方法和内容效果，提供改进建议"
              icon={Sparkles}
            />
            <DevelopmentInProgress
              title="班级整体分析"
              description="班级学习状况智能诊断，识别学习问题"
              icon={Users}
            />
          </div>
        </TabsContent>

        {/* 自动化标签页 */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DevelopmentInProgress
              title="智能排课系统"
              description="AI优化课程安排，考虑教师偏好和资源分配"
              icon={Calendar}
            />
            <DevelopmentInProgress
              title="自动考勤分析"
              description="AI识别出勤模式，自动生成考勤报告"
              icon={CheckCircle}
            />
            <DevelopmentInProgress
              title="智能通知系统"
              description="根据学生表现自动发送个性化通知"
              icon={Mail}
            />
            <DevelopmentInProgress
              title="文档自动生成"
              description="自动生成教学计划、总结报告等文档"
              icon={FileText}
            />
          </div>
        </TabsContent>

        {/* 智能沟通标签页 */}
        <TabsContent value="communication" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DevelopmentInProgress
              title="家长沟通助手"
              description="AI辅助撰写家长沟通内容，提供沟通建议"
              icon={MessageSquare}
            />
            <DevelopmentInProgress
              title="学生反馈分析"
              description="AI分析学生反馈，提取关键信息和改进点"
              icon={BarChart3}
            />
            <DevelopmentInProgress
              title="智能回复建议"
              description="为常见问题提供回复模板和建议"
              icon={Lightbulb}
            />
                         <DevelopmentInProgress
               title="多语言支持"
               description="AI翻译功能，支持国际化教学沟通"
               icon={Settings}
             />
          </div>
        </TabsContent>

        {/* 资源推荐标签页 */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DevelopmentInProgress
              title="教学资源推荐"
              description="基于课程内容推荐相关教学资源和素材"
              icon={BookOpen}
            />
            <DevelopmentInProgress
              title="习题智能推荐"
              description="根据学生水平推荐适合的练习题和作业"
              icon={FileText}
            />
            <DevelopmentInProgress
              title="教学方法推荐"
              description="推荐适合特定学生的教学方法和策略"
              icon={Lightbulb}
            />
            <DevelopmentInProgress
              title="学习工具推荐"
              description="推荐有助于教学的数字化工具和平台"
              icon={Settings}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* 查看教师详情对话框 */}
      <Dialog open={!!viewingTeacher} onOpenChange={() => setViewingTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>教师详情</DialogTitle>
          </DialogHeader>
          {viewingTeacher && (
            <div className="space-y-4">
              <div>
                <Label>姓名</Label>
                <p className="text-sm text-gray-600">{viewingTeacher.name}</p>
              </div>
              <div>
                <Label>邮箱</Label>
                <p className="text-sm text-gray-600">{viewingTeacher.email}</p>
              </div>
              <div>
                <Label>电话</Label>
                <p className="text-sm text-gray-600">{viewingTeacher.phone}</p>
              </div>
              <div>
                <Label>科目</Label>
                <p className="text-sm text-gray-600">{viewingTeacher.subject}</p>
              </div>
              <div>
                <Label>部门</Label>
                <p className="text-sm text-gray-600">{viewingTeacher.department}</p>
              </div>
              <div>
                <Label>教龄</Label>
                <p className="text-sm text-gray-600">{viewingTeacher.experience}年</p>
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">姓名</Label>
                <Input
                  id="edit-name"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">邮箱</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">电话</Label>
                <Input
                  id="edit-phone"
                  value={editingTeacher.phone}
                  onChange={(e) => setEditingTeacher({...editingTeacher, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-subject">科目</Label>
                <Input
                  id="edit-subject"
                  value={editingTeacher.subject}
                  onChange={(e) => setEditingTeacher({...editingTeacher, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-department">部门</Label>
                <Input
                  id="edit-department"
                  value={editingTeacher.department}
                  onChange={(e) => setEditingTeacher({...editingTeacher, department: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-experience">教龄</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  value={editingTeacher.experience}
                  onChange={(e) => setEditingTeacher({...editingTeacher, experience: parseInt(e.target.value) || 0})}
                />
              </div>
              <Button onClick={handleEditTeacher} className="w-full">
                保存更改
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
