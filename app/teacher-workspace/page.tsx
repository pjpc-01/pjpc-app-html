"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useStudents } from "@/hooks/useStudents"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
import { useCourses } from "@/hooks/useCourses"
import { useClasses } from "@/hooks/useClasses"
import { useAnnouncements, useNotifications } from "@/hooks/useAnnouncements"
import TeacherNavigation from "@/components/shared/TeacherNavigation"
import AssignmentManagement from "@/app/components/management/assignment-management"
import CourseManagement from "@/app/components/management/course-management"
import ClassManagement from "@/app/components/management/class-management"
import AnnouncementManagement from "@/app/components/management/announcement-management"
import PointsManagement from "@/app/components/management/points-management"
import NFCReplacementCard from "@/components/teacher/NFCReplacementCard"
import StudentForm from "@/app/components/student/StudentForm"
// import StudentProfileView from "@/components/student/StudentProfileView"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  BookOpen,
  MessageSquare,
  TrendingUp,
  LogOut,
  Bell,
  Search,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Activity,
  Clock,
  Award,
  Star,
  RefreshCw,
  Smartphone,
  MapPin,
  Shield,
  Globe,
  User, 
  ArrowLeft, 
  ArrowRight,
  Filter,
  Phone,
  Mail,
  Heart,
  Car,
  FileText,
  Megaphone,
  Trophy,
  CreditCard
} from "lucide-react"

interface TeacherStats {
  totalStudents: number
  todayAttendance: number
  attendanceRate: number
  pendingAssignments: number
  completedAssignments: number
  todayClasses: number
  averageGrade: number
  recentMessages: number
}

interface RecentActivity {
  id: string
  time: string
  action: string
  detail: string
  type: string
  status: string
}

interface ClassSchedule {
  id: string
  time: string
  duration: string
  subject: string
  className: string
  room: string
  students: number
  status: string
}

// StudentProfileView component
function StudentProfileView({ teacherId }: { teacherId?: string }) {
  const { students, loading, error } = useStudents()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCenter, setSelectedCenter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])

  // 过滤学生数据
  useEffect(() => {
    let filtered = students

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter((student: any) => 
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.school?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 按中心过滤
    if (selectedCenter !== "all") {
      filtered = filtered.filter((student: any) => student.center === selectedCenter)
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, selectedCenter])

  // 获取中心列表
  const centers = Array.from(new Set(students.map((s: any) => s.center).filter(Boolean)))

  // 获取学生姓名首字母
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "未设置"
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'lost': return 'bg-red-100 text-red-800'
      case 'graduated': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取服务类型颜色
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'afterschool': return 'bg-purple-100 text-purple-800'
      case 'tuition': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载学生档案中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">加载学生档案失败: {error}</p>
        <Button onClick={() => window.location.reload()}>重新加载</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">学生档案查看</h2>
        <p className="text-gray-600">查看学生详细信息、紧急联络、健康状况等档案资料</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：学生列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                学生列表 ({filteredStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 搜索和过滤 */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索学生姓名、学号或学校..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">所有中心</option>
                    {centers.map((center: any) => (
                      <option key={center} value={center}>{center}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 学生列表 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedStudent?.id === student.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(student.student_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {student.student_name || '未设置姓名'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {student.student_id || '无学号'} • {student.center || '未分配中心'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(student.status || 'inactive')}`}
                          >
                            {student.status === 'active' ? '活跃' : 
                             student.status === 'inactive' ? '非活跃' :
                             student.status === 'lost' ? '丢失' : '已毕业'}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getServiceTypeColor(student.serviceType || 'afterschool')}`}
                          >
                            {student.serviceType === 'afterschool' ? '课后班' : '补习班'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>没有找到匹配的学生</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：学生档案详情 */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudent.avatar || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {getInitials(selectedStudent.student_name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">
                        {selectedStudent.student_name || '未设置姓名'}
                      </CardTitle>
                      <CardDescription>
                        {selectedStudent.student_id || '无学号'} • {selectedStudent.center || '未分配中心'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(selectedStudent.status || 'inactive')}
                    >
                      {selectedStudent.status === 'active' ? '活跃' : 
                       selectedStudent.status === 'inactive' ? '非活跃' :
                       selectedStudent.status === 'lost' ? '丢失' : '已毕业'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getServiceTypeColor(selectedStudent.serviceType || 'afterschool')}
                    >
                      {selectedStudent.serviceType === 'afterschool' ? '课后班' : '补习班'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">基本信息</TabsTrigger>
                    <TabsTrigger value="contact">紧急联络</TabsTrigger>
                    <TabsTrigger value="health">健康状况</TabsTrigger>
                    <TabsTrigger value="pickup">接送安排</TabsTrigger>
                  </TabsList>

                  {/* 基本信息 */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">姓名</p>
                            <p className="text-gray-900">{selectedStudent.student_name || '未设置'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">出生日期</p>
                            <p className="text-gray-900">{formatDate(selectedStudent.dob || '')}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">性别</p>
                            <p className="text-gray-900">
                              {selectedStudent.gender === 'male' ? '男' : 
                               selectedStudent.gender === 'female' ? '女' : '未设置'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">年级</p>
                            <p className="text-gray-900">{selectedStudent.standard || '未设置'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">学校</p>
                            <p className="text-gray-900">{selectedStudent.school || '未设置'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">家庭地址</p>
                            <p className="text-gray-900">{selectedStudent.home_address || '未设置'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">注册日期</p>
                            <p className="text-gray-900">{formatDate(selectedStudent.registrationDate || '')}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">NRIC/护照</p>
                            <p className="text-gray-900">{selectedStudent.nric || '未设置'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 紧急联络 */}
                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">父亲电话</p>
                            <p className="text-gray-900">{selectedStudent.father_phone || '未设置'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">母亲电话</p>
                            <p className="text-gray-900">{selectedStudent.mother_phone || '未设置'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">家长电话</p>
                            <p className="text-gray-900">{selectedStudent.parentPhone || '未设置'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">紧急联络人</p>
                            <p className="text-gray-900">{selectedStudent.emergencyContact || '未设置'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">紧急联络电话</p>
                            <p className="text-gray-900">{selectedStudent.emergencyPhone || '未设置'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">邮箱</p>
                            <p className="text-gray-900">{selectedStudent.email || '未设置'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 健康状况 */}
                  <TabsContent value="health" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Heart className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 mb-2">健康信息</p>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {selectedStudent.healthInfo || '暂无健康信息记录'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Heart className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 mb-2">医疗信息</p>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {selectedStudent.medicalInfo || '暂无医疗信息记录'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 mb-2">备注</p>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {selectedStudent.notes || '暂无备注信息'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* 接送安排 */}
                  <TabsContent value="pickup" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Car className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">接送方式</p>
                          <p className="text-gray-900">
                            {selectedStudent.pickupMethod === 'parent' ? '家长接送' :
                             selectedStudent.pickupMethod === 'guardian' ? '监护人接送' :
                             selectedStudent.pickupMethod === 'authorized' ? '授权人接送' :
                             selectedStudent.pickupMethod === 'public' ? '公共交通' :
                             selectedStudent.pickupMethod === 'walking' ? '步行' : '未设置'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">授权接送人</h4>
                        
                        {selectedStudent.authorizedPickup1Name && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">接送人 1</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">姓名：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup1Name}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">电话：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup1Phone || '未设置'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">关系：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup1Relation || '未设置'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedStudent.authorizedPickup2Name && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">接送人 2</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">姓名：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup2Name}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">电话：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup2Phone || '未设置'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">关系：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup2Relation || '未设置'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedStudent.authorizedPickup3Name && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">接送人 3</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">姓名：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup3Name}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">电话：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup3Phone || '未设置'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">关系：</span>
                                <span className="text-gray-900">{selectedStudent.authorizedPickup3Relation || '未设置'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {!selectedStudent.authorizedPickup1Name && 
                         !selectedStudent.authorizedPickup2Name && 
                         !selectedStudent.authorizedPickup3Name && (
                          <div className="text-center py-8 text-gray-500">
                            <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>暂无授权接送人信息</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>请从左侧列表选择一个学生查看档案</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// OverviewTab component
function OverviewTab({ students, onShowNFCReplacement, onTabChange }: { students: any[], onShowNFCReplacement: (show: boolean) => void, onTabChange: (tab: string) => void }) {
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // 获取教师信息和相关数据
  const { teacher, loading: teacherLoading } = useCurrentTeacher()
  const { courses } = useCourses(teacher?.id)
  const { classes } = useClasses(teacher?.id)
  const { announcements } = useAnnouncements(teacher?.id)
  const { notifications } = useNotifications(teacher?.id)

  // 获取考勤数据
  const fetchAttendanceData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/student-attendance')
      if (response.ok) {
        const data = await response.json()
        setAttendanceData(data.data || [])
      }
    } catch (error) {
      console.error('获取考勤数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceData()
  }, [])

  // 计算统计数据
  const stats = useMemo(() => {
    const totalStudents = students.length
    
    // 按中心统计学生数量
    const centerStats = students.reduce((acc, student) => {
      const center = student.center || 'WX 01'
      if (!acc[center]) {
        acc[center] = { total: 0, active: 0 }
      }
      acc[center].total++
      if (student.status === 'active') {
        acc[center].active++
      }
      return acc
    }, {} as Record<string, { total: number; active: number }>)

    // 今日考勤统计
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = attendanceData.filter(record => {
      const recordDate = record.date ? record.date.split('T')[0] : ''
      return recordDate === today
    })

    const presentCount = todayAttendance.filter(r => r.status === 'present').length
    const lateCount = todayAttendance.filter(r => r.status === 'late').length
    const absentCount = todayAttendance.filter(r => r.status === 'absent').length
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

    // 最近7天考勤趋势
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const attendanceTrend = last7Days.map(date => {
      const dayAttendance = attendanceData.filter(record => {
        const recordDate = record.date ? record.date.split('T')[0] : ''
        return recordDate === date
      })
      const dayPresent = dayAttendance.filter(r => r.status === 'present').length
      const dayRate = totalStudents > 0 ? Math.round((dayPresent / totalStudents) * 100) : 0
      
      return {
        date,
        present: dayPresent,
        rate: dayRate,
        label: new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      }
    })

    // 课程和班级统计
    const totalCourses = courses?.length || 0
    const totalClasses = classes?.length || 0
    const totalAnnouncements = announcements?.length || 0
    const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0

    return {
      totalStudents,
      centerStats,
      todayAttendance: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        rate: attendanceRate
      },
      attendanceTrend,
      courses: {
        total: totalCourses,
        active: courses?.filter(c => c.status === 'active').length || 0
      },
      classes: {
        total: totalClasses,
        active: classes?.filter(c => c.status === 'active').length || 0
      },
      announcements: {
        total: totalAnnouncements,
        published: announcements?.filter(a => a.status === 'published').length || 0
      },
      notifications: {
        total: notifications?.length || 0,
        unread: unreadNotifications
      }
    }
  }, [students, attendanceData, courses, classes, announcements, notifications])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">工作台总览</h2>
        <p className="text-gray-600">查看整体教学情况和关键指标</p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
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
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">今日出勤</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance.present}</p>
                <p className="text-xs text-green-600">{stats.todayAttendance.rate}% 出勤率</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">活跃课程</p>
                <p className="text-2xl font-bold text-gray-900">{stats.courses.active}</p>
                <p className="text-xs text-purple-600">共 {stats.courses.total} 门课程</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">活跃班级</p>
                <p className="text-2xl font-bold text-gray-900">{stats.classes.active}</p>
                <p className="text-xs text-orange-600">共 {stats.classes.total} 个班级</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 第二行指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">迟到人数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">缺席人数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">未读通知</p>
                <p className="text-2xl font-bold text-gray-900">{stats.notifications.unread}</p>
                <p className="text-xs text-indigo-600">共 {stats.notifications.total} 条通知</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">已发布公告</p>
                <p className="text-2xl font-bold text-gray-900">{stats.announcements.published}</p>
                <p className="text-xs text-teal-600">共 {stats.announcements.total} 条公告</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 中心分布和考勤趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 中心分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              中心分布
            </CardTitle>
            <CardDescription>各中心学生数量和活跃状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.centerStats).map(([center, data]) => (
                <div key={center} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{center}</p>
                      <p className="text-sm text-gray-500">{(data as any).active}/{(data as any).total} 活跃</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{(data as any).total}</p>
                    <p className="text-xs text-gray-500">学生</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 考勤趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              考勤趋势
            </CardTitle>
            <CardDescription>最近7天出勤率变化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.attendanceTrend.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{day.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{day.present}人</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${day.rate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{day.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            快速操作
          </CardTitle>
          <CardDescription>常用功能快速访问</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => window.open('/mobile-checkin', '_blank')}
            >
              <Smartphone className="h-6 w-6" />
              <span>移动端考勤</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => window.open('/teacher-checkin', '_blank')}
            >
              <User className="h-6 w-6" />
              <span>教师打卡</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                console.log('课程与作业按钮被点击')
                onTabChange("teaching")
              }}
            >
              <BookOpen className="h-6 w-6" />
              <span>课程与作业</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                console.log('发布公告按钮被点击')
                onTabChange("announcements")
              }}
            >
              <Bell className="h-6 w-6" />
              <span>发布公告</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => onShowNFCReplacement(true)}
            >
              <CreditCard className="h-6 w-6" />
              <span>NFC卡补办</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                console.log('学生与考勤按钮被点击')
                onTabChange("students")
              }}
            >
              <Users className="h-6 w-6" />
              <span>学生与考勤</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                console.log('积分管理按钮被点击')
                onTabChange("students")
                // 延迟切换到积分管理子标签页
                setTimeout(() => {
                  const subTabs = document.querySelectorAll('[role="tablist"]')[1]
                  const pointsTab = subTabs?.querySelector('[value="points"]') as HTMLElement
                  pointsTab?.click()
                }, 100)
              }}
            >
              <Trophy className="h-6 w-6" />
              <span>积分管理</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => {
                console.log('刷新数据按钮被点击')
                fetchAttendanceData()
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新数据</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// StudentManagement component
function StudentManagement({ teacherId }: { teacherId?: string }) {
  const { students, loading, error, refetch, addStudent } = useStudents()
  
  // 分页状态管理
  const [currentPage, setCurrentPage] = useState(1)
  const studentsPerPage = 10
  
  // 学生档案查看状态
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCenter, setSelectedCenter] = useState("all")
  
  // 添加学生对话框状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // 处理添加学生
  const handleAddStudent = async (studentData: any) => {
    try {
      await addStudent(studentData)
      setIsAddDialogOpen(false)
      refetch()
    } catch (error) {
      console.error("Error adding student:", error)
    }
  }
  
  // 计算分页数据
  const totalPages = Math.ceil(students.length / studentsPerPage)
  const startIndex = (currentPage - 1) * studentsPerPage
  const endIndex = startIndex + studentsPerPage
  const currentStudents = students.slice(startIndex, endIndex)
  
  // 过滤学生数据
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = !searchTerm || 
      student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCenter = selectedCenter === "all" || student.center === selectedCenter
    
    return matchesSearch && matchesCenter
  })
  
  // 分页控制函数
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  // 查看学生档案
  const handleViewProfile = (student: any) => {
    setSelectedStudent(student)
    setShowProfile(true)
  }
  
  // 关闭档案查看
  const handleCloseProfile = () => {
    setShowProfile(false)
    setSelectedStudent(null)
  }
  
  // 获取中心列表
  const centers = Array.from(new Set(students.map((s: any) => s.center).filter(Boolean)))
  
  // 获取学生姓名首字母
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "未设置"
    return new Date(dateString).toLocaleDateString('zh-CN')
  }
  
  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'lost': return 'bg-red-100 text-red-800'
      case 'graduated': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  // 获取服务类型颜色
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'afterschool': return 'bg-purple-100 text-purple-800'
      case 'tuition': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-600">
              学生管理
            </h3>
            <p className="text-sm text-gray-600">管理您的学生信息、查看学习进度和考勤记录</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载学生数据...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-600">
              学生管理
            </h3>
            <p className="text-sm text-gray-600">管理您的学生信息、查看学习进度和考勤记录</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-2">加载学生数据失败</p>
              <p className="text-gray-600 text-sm">{error}</p>
              <Button onClick={refetch} className="mt-4" variant="outline">
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-blue-600">
          学生管理
        </h3>
        <p className="text-sm text-gray-600">管理您的学生信息、查看学习进度和考勤记录</p>
      </div>

      {/* 学生统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">在线学生</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">活跃学生</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>学生列表</CardTitle>
              <CardDescription>管理您的学生信息和状态</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加学生
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和过滤 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名、学号或学校..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">所有中心</option>
                {centers.map((center: any) => (
                  <option key={center} value={center}>{center}</option>
                ))}
              </select>
            </div>
          </div>
          {/* 分页信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              显示第 {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} 条，共 {filteredStudents.length} 条记录
            </div>
            <div className="text-sm text-gray-600">
              第 {currentPage} 页，共 {Math.ceil(filteredStudents.length / studentsPerPage)} 页
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredStudents.slice(startIndex, endIndex).map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(student.student_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                    <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                    <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(student.status || 'inactive')}`}
                      >
                        {student.status === 'active' ? '活跃' : 
                         student.status === 'inactive' ? '非活跃' :
                         student.status === 'lost' ? '丢失' : '已毕业'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getServiceTypeColor(student.serviceType || 'afterschool')}`}
                      >
                        {student.serviceType === 'afterschool' ? '课后班' : '补习班'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewProfile(student)}
                    title="查看档案"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="编辑">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* 如果没有学生数据 */}
            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">没有找到匹配的学生</p>
              </div>
            )}
          </div>
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  上一页
                </Button>
                
                {/* 页码按钮 */}
                <div className="flex items-center space-x-1">
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
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              {/* 跳转到指定页面 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">跳转到:</span>
                <Select
                  value={currentPage.toString()}
                  onValueChange={(value) => handlePageChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">页</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 学生档案查看模态框 */}
      {showProfile && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 模态框头部 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedStudent.avatar || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                      {getInitials(selectedStudent.student_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedStudent.student_name || '未设置姓名'}
                    </h2>
                    <p className="text-gray-600">
                      {selectedStudent.student_id || '无学号'} • {selectedStudent.center || '未分配中心'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(selectedStudent.status || 'inactive')}
                  >
                    {selectedStudent.status === 'active' ? '活跃' : 
                     selectedStudent.status === 'inactive' ? '非活跃' :
                     selectedStudent.status === 'lost' ? '丢失' : '已毕业'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={getServiceTypeColor(selectedStudent.serviceType || 'afterschool')}
                  >
                    {selectedStudent.serviceType === 'afterschool' ? '课后班' : '补习班'}
                  </Badge>
                  <Button variant="ghost" onClick={handleCloseProfile}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* 档案内容 */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="contact">紧急联络</TabsTrigger>
                  <TabsTrigger value="health">健康状况</TabsTrigger>
                  <TabsTrigger value="pickup">接送安排</TabsTrigger>
                </TabsList>

                {/* 基本信息 */}
                <TabsContent value="basic" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">姓名</p>
                          <p className="text-gray-900">{selectedStudent.student_name || '未设置'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">出生日期</p>
                          <p className="text-gray-900">{formatDate(selectedStudent.dob || '')}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">性别</p>
                          <p className="text-gray-900">
                            {selectedStudent.gender === 'male' ? '男' : 
                             selectedStudent.gender === 'female' ? '女' : '未设置'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">年级</p>
                          <p className="text-gray-900">{selectedStudent.standard || '未设置'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">学校</p>
                          <p className="text-gray-900">{selectedStudent.school || '未设置'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">家庭地址</p>
                          <p className="text-gray-900">{selectedStudent.home_address || '未设置'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">注册日期</p>
                          <p className="text-gray-900">{formatDate(selectedStudent.registrationDate || '')}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">NRIC/护照</p>
                          <p className="text-gray-900">{selectedStudent.nric || '未设置'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 紧急联络 */}
                <TabsContent value="contact" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">父亲电话</p>
                          <p className="text-gray-900">{selectedStudent.father_phone || '未设置'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">母亲电话</p>
                          <p className="text-gray-900">{selectedStudent.mother_phone || '未设置'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">家长电话</p>
                          <p className="text-gray-900">{selectedStudent.parentPhone || '未设置'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">紧急联络人</p>
                          <p className="text-gray-900">{selectedStudent.emergencyContact || '未设置'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">紧急联络电话</p>
                          <p className="text-gray-900">{selectedStudent.emergencyPhone || '未设置'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">邮箱</p>
                          <p className="text-gray-900">{selectedStudent.email || '未设置'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 健康状况 */}
                <TabsContent value="health" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Heart className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">健康信息</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedStudent.healthInfo || '暂无健康信息记录'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Heart className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">医疗信息</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedStudent.medicalInfo || '暂无医疗信息记录'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">备注</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedStudent.notes || '暂无备注信息'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* 接送安排 */}
                <TabsContent value="pickup" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Car className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">接送方式</p>
                        <p className="text-gray-900">
                          {selectedStudent.pickupMethod === 'parent' ? '家长接送' :
                           selectedStudent.pickupMethod === 'guardian' ? '监护人接送' :
                           selectedStudent.pickupMethod === 'authorized' ? '授权人接送' :
                           selectedStudent.pickupMethod === 'public' ? '公共交通' :
                           selectedStudent.pickupMethod === 'walking' ? '步行' : '未设置'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">授权接送人</h4>
                      
                      {selectedStudent.authorizedPickup1Name && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">接送人 1</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">姓名：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup1Name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">电话：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup1Phone || '未设置'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">关系：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup1Relation || '未设置'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStudent.authorizedPickup2Name && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">接送人 2</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">姓名：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup2Name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">电话：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup2Phone || '未设置'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">关系：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup2Relation || '未设置'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedStudent.authorizedPickup3Name && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">接送人 3</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">姓名：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup3Name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">电话：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup3Phone || '未设置'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">关系：</span>
                              <span className="text-gray-900">{selectedStudent.authorizedPickup3Relation || '未设置'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {!selectedStudent.authorizedPickup1Name && 
                       !selectedStudent.authorizedPickup2Name && 
                       !selectedStudent.authorizedPickup3Name && (
                        <div className="text-center py-8 text-gray-500">
                          <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>暂无授权接送人信息</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* 添加学生对话框 */}
      <StudentForm
        open={isAddDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsAddDialogOpen(false)
          }
        }}
        onSubmit={handleAddStudent}
        existingStudents={students}
      />
    </>
  )
}

// AttendanceManagement component
function AttendanceManagement({ 
  teacherId,
  showAbsenceModal,
  setShowAbsenceModal,
  selectedStudent,
  setSelectedStudent,
  absenceReason,
  setAbsenceReason,
  absenceDetail,
  setAbsenceDetail,
  selectedDate,
  setSelectedDate,
  isMarkingAbsence
}: { 
  teacherId?: string
  showAbsenceModal: boolean
  setShowAbsenceModal: (show: boolean) => void
  selectedStudent: any
  setSelectedStudent: (student: any) => void
  absenceReason: string
  setAbsenceReason: (reason: string) => void
  absenceDetail: string
  setAbsenceDetail: (detail: string) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  isMarkingAbsence: boolean
}) {
  const { students } = useStudents()
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // 分行考勤管理状态
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null)
  const [showCenterDetail, setShowCenterDetail] = useState(false)
  
  // 分页状态
  const [unmarkedStudentsPage, setUnmarkedStudentsPage] = useState(1)

  // 考勤统计
  const [attendanceStats, setAttendanceStats] = useState({
    totalDays: 0,
    averageRate: 0,
    bestDay: '',
    worstDay: ''
  })



  // 动态计算中心信息 - 基于真实的 students 数据
  const centers = useMemo(() => {
    console.log('🔍 AttendanceManagement: 计算中心信息，学生数量:', students?.length || 0)
    console.log('🔍 AttendanceManagement: 学生数据:', students?.slice(0, 3))
    console.log('🔍 AttendanceManagement: 考勤数据数量:', attendanceData?.length || 0)
    
    if (!students || students.length === 0) {
      console.log('⚠️ AttendanceManagement: 没有学生数据，返回默认中心')
      return [
        { 
          id: 'wx01', 
          name: 'WX 01', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        },
        { 
          id: 'wx02', 
          name: 'WX 02', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        },
        { 
          id: 'wx03', 
          name: 'WX 03', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        },
        { 
          id: 'wx04', 
          name: 'WX 04', 
          status: 'active', 
          studentCount: 0, 
          lastActivity: '无数据',
          todayAttendance: 0,
          attendanceRate: 0,
          lateCount: 0,
          absentCount: 0
        }
      ]
    }

    // 计算每个中心的学生数量
    const centerCounts = students.reduce((acc, student) => {
      const center = student.center || 'WX 01' // 默认分配到 WX 01
      if (!acc[center]) {
        acc[center] = 0
      }
      acc[center]++
      return acc
    }, {} as Record<string, number>)

    console.log('📊 AttendanceManagement: 中心分布:', centerCounts)

    // 基于真实考勤数据计算每个中心的考勤情况
    const calculateCenterAttendance = (centerName: string, studentCount: number) => {
      if (studentCount === 0) return { todayAttendance: 0, attendanceRate: 0, lateCount: 0, absentCount: 0 }
      
      // 获取今天的日期
      const today = new Date().toISOString().split('T')[0]
      
      // 从真实考勤数据中筛选该中心的数据
      const centerAttendance = attendanceData.filter(record => {
        // 直接使用考勤记录的 center 字段匹配
        const centerMatch = record.center === centerName
        
        // 使用今天的日期
        const dateMatch = record.date && record.date.includes(today)
        
        const result = centerMatch && dateMatch
        console.log(`🔍 考勤匹配 - 中心: ${centerName}, 记录中心: ${record.center}, 日期匹配: ${dateMatch}, 结果: ${result}`)
        
        return result
      })
      
      console.log(`📊 ${centerName} 中心考勤数据:`, centerAttendance.length, '条记录')
      
      const presentCount = centerAttendance.filter(r => r.status === 'present').length
      const lateCount = centerAttendance.filter(r => r.status === 'late').length
      const absentCount = centerAttendance.filter(r => r.status === 'absent').length
      
      const attendanceRate = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 0
      
      console.log(`📊 ${centerName} 统计: 出勤${presentCount}, 迟到${lateCount}, 缺席${absentCount}, 出勤率${attendanceRate}%`)
      
      return {
        todayAttendance: presentCount,
        attendanceRate: Math.max(0, Math.min(100, attendanceRate)),
        lateCount: lateCount,
        absentCount: absentCount
      }
    }

    // 生成中心列表
    const centerList = [
      { id: 'wx01', name: 'WX 01', status: 'active' },
      { id: 'wx02', name: 'WX 02', status: 'active' },
      { id: 'wx03', name: 'WX 03', status: 'active' },
      { id: 'wx04', name: 'WX 04', status: 'active' }
    ]

    return centerList.map(center => {
      const studentCount = centerCounts[center.name] || 0
      const attendance = calculateCenterAttendance(center.name, studentCount)
      
      // 基于真实考勤数据计算最后活动时间
      const getLastActivity = () => {
        if (studentCount === 0) return '无活动'
        
        const centerAttendance = attendanceData.filter(record => {
          // 直接使用考勤记录的 center 字段匹配
          return record.center === center.name
        })
        
        if (centerAttendance.length === 0) return '无考勤记录'
        
        // 找到最新的考勤记录
        const latestRecord = centerAttendance.sort((a, b) => 
          new Date(b.timestamp || b.created || b.updated).getTime() - 
          new Date(a.timestamp || a.created || a.updated).getTime()
        )[0]
        
        if (!latestRecord) return '无时间记录'
        
        const timeDiff = Date.now() - new Date(latestRecord.timestamp || latestRecord.created || latestRecord.updated).getTime()
        const minutes = Math.floor(timeDiff / (1000 * 60))
        
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes}分钟前`
        if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
        return `${Math.floor(minutes / 1440)}天前`
      }

      return {
        ...center,
        studentCount,
        lastActivity: getLastActivity(),
        ...attendance
      }
    })
  }, [students, attendanceData, selectedDate])

  // 获取考勤数据
  const fetchAttendanceData = async () => {
    if (!teacherId) return
    
    console.log('📊 开始获取考勤数据...')
    setLoading(true)
    try {
      const response = await fetch('/api/student-attendance')
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json()
            console.log('📊 获取到考勤数据:', data.data?.length || 0, '条记录')
            
            // 转换数据格式以匹配组件期望的结构
            const formattedData = (data.data || []).map((record: any) => {
              // 处理日期格式：如果 date 字段是 ISO 8601 格式，转换为 YYYY-MM-DD
              let processedDate = record.date
              if (record.date && (record.date.includes('T') || record.date.includes('Z'))) {
                processedDate = record.date.split('T')[0]
              } else if (!record.date && record.timestamp) {
                processedDate = new Date(record.timestamp).toISOString().split('T')[0]
              } else if (!record.date && !record.timestamp) {
                processedDate = new Date().toISOString().split('T')[0]
              }
              
              return {
                ...record,
                // 使用处理后的日期
                date: processedDate,
                // 确保状态值正确
                status: record.status === 'present' ? 'present' : 
                       record.status === 'late' ? 'late' : 
                       record.status === 'absent' ? 'absent' : 'present'
              }
            })
            
            console.log('📊 格式化后的考勤数据:', formattedData.length, '条记录')
            console.log('📊 缺席记录:', formattedData.filter((r: any) => r.status === 'absent').length, '条')
            setAttendanceData(formattedData)
          } catch (jsonError) {
            console.error('❌ 解析考勤数据失败:', jsonError)
            setAttendanceData([])
          }
        } else {
          console.error('❌ 响应不是JSON格式')
          setAttendanceData([])
        }
      } else {
        console.error('❌ 获取考勤数据失败:', response.status, response.statusText)
        setAttendanceData([])
      }
    } catch (error) {
      console.error('❌ 获取考勤数据异常:', error)
      setAttendanceData([])
    } finally {
      setLoading(false)
      console.log('📊 考勤数据获取完成')
    }
  }



  // 处理分行卡片点击
  const handleCenterClick = (centerId: string) => {
    setSelectedCenter(centerId)
    setShowCenterDetail(true)
  }

  // 返回分行概览
  const handleBackToOverview = () => {
    setShowCenterDetail(false)
    setSelectedCenter(null)
  }

  // 组件挂载时获取数据
  useEffect(() => {
    if (teacherId) {
      fetchAttendanceData()
    }
  }, [teacherId])

  // 监听刷新考勤数据事件
  useEffect(() => {
    const handleRefreshAttendance = () => {
      console.log('🔄 收到刷新考勤数据事件，开始刷新...')
      fetchAttendanceData()
    }

    window.addEventListener('refreshAttendanceData', handleRefreshAttendance)
    
    return () => {
      window.removeEventListener('refreshAttendanceData', handleRefreshAttendance)
    }
  }, [])

  // 通用的日期处理函数
  const processDate = (dateValue: any): string => {
    if (typeof dateValue === 'string') {
      // 处理ISO 8601格式：2025-08-30 09:36:20.489Z
      if (dateValue.includes(' ') || dateValue.includes('T') || dateValue.includes('Z')) {
        // 先按空格分割，再按T分割，取第一部分
        return dateValue.split(' ')[0].split('T')[0]
      } else {
        return dateValue
      }
    } else if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0]
    } else if (dateValue?.timestamp) {
      return new Date(dateValue.timestamp).toISOString().split('T')[0]
    }
    return ''
  }





  // 刷新键变化时重新获取数据
  useEffect(() => {
    if (teacherId && refreshKey > 0) {
      fetchAttendanceData()
    }
  }, [refreshKey, teacherId])



  // 如果显示中心详情，则显示详细内容
  if (showCenterDetail && selectedCenter) {
    const center = centers.find(c => c.id === selectedCenter)
    if (!center) return null

  return (
    <>
        {/* 返回按钮和中心标题 */}
      <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToOverview}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回分行概览
          </Button>
          <h3 className="text-xl font-semibold text-blue-600">
            {center.name} 中心 - 考勤详情
        </h3>
          <p className="text-sm text-gray-600">查看该中心的详细考勤信息和学生状态</p>
      </div>

        {/* 中心统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-600">总学生数</p>
                  <p className="text-2xl font-bold text-gray-900">{center.studentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-600">今日出勤</p>
                  <p className="text-2xl font-bold text-gray-900">{center.todayAttendance}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">迟到</p>
                  <p className="text-2xl font-bold text-gray-900">{center.lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                  <p className="text-sm font-medium text-gray-600">缺席</p>
                  <p className="text-2xl font-bold text-gray-900">{center.absentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中心学生列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{center.name} 中心学生列表</CardTitle>
                <CardDescription>该中心的所有学生及其考勤状态</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            </div>
          </CardHeader>
          

          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载学生数据...</p>
              </div>
            ) : (
              <div className="space-y-6">
                                 {/* 未考勤学生列表 */}
                 <div>
                   <div className="flex items-center justify-between mb-4">
                     <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                       <XCircle className="h-5 w-5" />
                       未考勤学生 ({students.filter(student => student.center === center.name && !attendanceData.some(att => {
                         // 更安全的日期处理
                         let attDate = ''
                         if (typeof att.date === 'string') {
                           if (att.date.includes('T') || att.date.includes('Z')) {
                             attDate = att.date.split('T')[0]
                           } else {
                             attDate = att.date
                           }
                         } else if (att.date instanceof Date) {
                           attDate = att.date.toISOString().split('T')[0]
                         } else if (att.timestamp) {
                           attDate = new Date(att.timestamp).toISOString().split('T')[0]
                         }
                         
                         const selDate = selectedDate
                         const dateMatch = attDate === selDate
                         
                         return (att.student_id === student.student_id || att.student_id === student.id) && 
                                att.center === center.name && 
                                dateMatch
                       })).length})
                     </h4>
                     <Badge variant="destructive" className="text-xs">
                       需要处理
                     </Badge>
                   </div>
                   
                   {(() => {
                     const unmarkedStudents = students
                       .filter(student => student.center === center.name && !attendanceData.some(att => {
                         // 更安全的日期处理 - 支持多种日期字段
                         let attDate = ''
                         const dateField = att.date || att.check_in || att.created
                         
                         if (typeof dateField === 'string') {
                           if (dateField.includes(' ')) {
                             attDate = dateField.split(' ')[0]
                           } else if (dateField.includes('T') || dateField.includes('Z')) {
                             attDate = dateField.split('T')[0]
                           } else {
                             attDate = dateField
                           }
                         } else if (dateField instanceof Date) {
                           attDate = dateField.toISOString().split('T')[0]
                         }
                         
                         const selDate = selectedDate
                         const dateMatch = attDate === selDate
                         
                         return (att.student_id === student.student_id || att.student_id === student.id) && 
                                att.center === center.name && 
                                dateMatch
                       }))
                     
                     // 分页逻辑
                     const itemsPerPage = 10
                     const totalPages = Math.ceil(unmarkedStudents.length / itemsPerPage)
                     const currentPage = 1 // 默认第一页
                     const startIndex = (currentPage - 1) * itemsPerPage
                     const endIndex = startIndex + itemsPerPage
                     const currentStudents = unmarkedStudents.slice(startIndex, endIndex)
                     
                     return (
                       <>
                         <div className="space-y-3">
                           {currentStudents.map((student) => (
                             <div key={student.id} className="flex items-center justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                               <div className="flex items-center space-x-3">
                                 <Avatar className="h-10 w-10">
                                   <AvatarFallback className="bg-red-100 text-red-600">
                                     {student.student_name?.charAt(0) || '?'}
                                   </AvatarFallback>
                                 </Avatar>
                                 <div>
                                   <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                                   <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                                   <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                                 </div>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <Badge variant="destructive" className="text-xs">
                                   未考勤
                                 </Badge>
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   onClick={() => {
                                     setSelectedStudent(student)
                                     setShowAbsenceModal(true)
                                   }}
                                   className="border-red-300 text-red-700 hover:bg-red-100"
                                 >
                                   <XCircle className="h-4 w-4 mr-2" />
                                   标记缺席
                                 </Button>
                               </div>
                             </div>
                           ))}
                           
                           {/* 如果没有未考勤学生，显示提示 */}
                           {unmarkedStudents.length === 0 && (
                             <div className="text-center py-6 text-green-600">
                               <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                               <p>所有学生都已考勤！</p>
                             </div>
                           )}
                         </div>
                         
                         {/* 分页控件 */}
                         {totalPages > 1 && (
                           <div className="flex items-center justify-center space-x-2 mt-6">
                             <Button
                               variant="outline"
                               size="sm"
                               disabled={currentPage === 1}
                               onClick={() => {
                                 // 分页功能待实现
                               }}
                             >
                               ← 上一页
                             </Button>
                             
                             <span className="text-sm text-gray-600">
                               第 {currentPage} 页，共 {totalPages} 页
                             </span>
                             
                             <Button
                               variant="outline"
                               size="sm"
                               disabled={currentPage === totalPages}
                               onClick={() => {
                                 // 分页功能待实现
                               }}
                             >
                               下一页 →
                             </Button>
                           </div>
                         )}
                       </>
                     )
                   })()}
                 </div>

                {/* 缺席学生列表 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      缺席学生 ({students.filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理 - 支持多种日期字段
                        let attDate = ''
                        // 优先使用 check_in 字段，如果没有则使用 date 字段
                        const dateField = att.check_in || att.date || att.timestamp
                        
                        if (typeof dateField === 'string') {
                          // 处理 YYYY-MM-DD HH:MM:SS 格式
                          if (dateField.includes(' ')) {
                            attDate = dateField.split(' ')[0]
                          } else if (dateField.includes('T') || dateField.includes('Z')) {
                            attDate = dateField.split('T')[0]
                          } else {
                            attDate = dateField
                          }
                        } else if (dateField instanceof Date) {
                          attDate = dateField.toISOString().split('T')[0]
                        } else if (att.timestamp) {
                          attDate = new Date(att.timestamp).toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               att.status === 'absent'
                      })).length})
                    </h4>
                    <Badge variant="destructive" className="text-xs">
                      缺席
                    </Badge>
                  </div>
                  

                  
                  <div className="space-y-3">
                    {students
                      .filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理 - 支持多种日期字段
                        let attDate = ''
                        const dateField = att.date || att.check_in || att.created
                        
                        if (typeof dateField === 'string') {
                          if (dateField.includes(' ')) {
                            attDate = dateField.split(' ')[0]
                          } else if (dateField.includes('T') || dateField.includes('Z')) {
                            attDate = dateField.split('T')[0]
                          } else {
                            attDate = dateField
                          }
                        } else if (dateField instanceof Date) {
                          attDate = dateField.toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               att.status === 'absent'
                      }))
                      .map((student) => {
                        const attendanceRecord = attendanceData.find(att => {
                          // 更安全的日期处理 - 支持多种日期字段
                          let attDate = ''
                          // 优先使用 check_in 字段，如果没有则使用 date 字段
                          const dateField = att.check_in || att.date || att.timestamp
                          
                          if (typeof dateField === 'string') {
                            // 处理 YYYY-MM-DD HH:MM:SS 格式
                            if (dateField.includes(' ')) {
                              attDate = dateField.split(' ')[0]
                            } else if (dateField.includes('T') || dateField.includes('Z')) {
                              attDate = dateField.split('T')[0]
                            } else {
                              attDate = dateField
                            }
                          } else if (dateField instanceof Date) {
                            attDate = dateField.toISOString().split('T')[0]
                          } else if (att.timestamp) {
                            attDate = new Date(att.timestamp).toISOString().split('T')[0]
                          }
                          
                          const selDate = selectedDate
                          const dateMatch = attDate === selDate
                          
                          return (att.student_id === student.student_id || att.student_id === student.id) && 
                                 att.center === center.name && 
                                 dateMatch && 
                                 att.status === 'absent'
                        })
                        
                        return (
                          <div key={student.id} className="flex items-center justify-between p-4 border-2 border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-red-100 text-red-600">
                                  {student.student_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                                <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                                <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                                {attendanceRecord && (
                                  <div className="mt-1 space-y-1">
                                    <p className="text-xs text-red-600">
                                      缺席原因: {attendanceRecord.reason || '未指定'}
                                    </p>
                                    {attendanceRecord.detail && (
                                      <p className="text-xs text-red-500">
                                        详细说明: {attendanceRecord.detail}
                                      </p>
                                    )}
              </div>
                                )}
            </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="destructive" className="text-xs">
                                缺席
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setShowAbsenceModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    {students.filter(student => student.center === center.name && attendanceData.some(att => {
                        // 处理日期匹配：支持多种日期格式
                        const attDate = att.date ? att.date.split('T')[0] : ''
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               att.status === 'absent'
                      })).length === 0 && (
                      <div className="text-center py-6 text-green-600">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>没有缺席学生</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 已考勤学生列表（出勤和迟到） */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      已考勤学生 ({students.filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理
                        let attDate = ''
                        if (typeof att.date === 'string') {
                          if (att.date.includes('T') || att.date.includes('Z')) {
                            attDate = att.date.split('T')[0]
                          } else {
                            attDate = att.date
                          }
                        } else if (att.date instanceof Date) {
                          attDate = att.date.toISOString().split('T')[0]
                        } else if (att.timestamp) {
                          attDate = new Date(att.timestamp).toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               (att.status === 'present' || att.status === 'late')
                      })).length})
                    </h4>
                    <Badge variant="default" className="text-xs">
                      已完成
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {students
                      .filter(student => student.center === center.name && attendanceData.some(att => {
                        // 更安全的日期处理 - 支持多种日期字段
                        let attDate = ''
                        const dateField = att.date || att.check_in || att.created
                        
                        if (typeof dateField === 'string') {
                          if (dateField.includes(' ')) {
                            attDate = dateField.split(' ')[0]
                          } else if (dateField.includes('T') || dateField.includes('Z')) {
                            attDate = dateField.split('T')[0]
                          } else {
                            attDate = dateField
                          }
                        } else if (dateField instanceof Date) {
                          attDate = dateField.toISOString().split('T')[0]
                        }
                        
                        const selDate = selectedDate
                        const dateMatch = attDate === selDate
                        
                        return (att.student_id === student.student_id || att.student_id === student.id) && 
                               att.center === center.name && 
                               dateMatch && 
                               (att.status === 'present' || att.status === 'late')
                      }))
                      .map((student) => {
                        const attendanceRecord = attendanceData.find(att => {
                          // 更安全的日期处理 - 支持多种日期字段
                          let attDate = ''
                          const dateField = att.date || att.check_in || att.created
                          
                          if (typeof dateField === 'string') {
                            if (dateField.includes(' ')) {
                              attDate = dateField.split(' ')[0]
                            } else if (dateField.includes('T') || dateField.includes('Z')) {
                              attDate = dateField.split('T')[0]
                            } else {
                              attDate = dateField
                            }
                          } else if (dateField instanceof Date) {
                            attDate = dateField.toISOString().split('T')[0]
                          }
                          
                          const selDate = selectedDate
                          const dateMatch = attDate === selDate
                          
                          return (att.student_id === student.student_id || att.student_id === student.id) && 
                                 att.center === center.name && 
                                 dateMatch && 
                                 (att.status === 'present' || att.status === 'late')
                        })
                        const status = attendanceRecord?.status || 'unknown'
                        
                        return (
                          <div key={student.id} className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                            status === 'present' ? 'border-green-200 bg-green-50 hover:bg-green-100' :
                            status === 'late' ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100' :
                            'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${
                                  status === 'present' ? 'bg-green-100 text-green-600' :
                                  status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {student.student_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{student.student_name || '未知姓名'}</p>
                                <p className="text-sm text-gray-500">学号: {student.student_id || '无学号'}</p>
                                <p className="text-sm text-gray-500">中心: {student.center || '未指定'}</p>
                                {attendanceRecord && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    考勤时间: {attendanceRecord.check_in ? 
                                      new Date(attendanceRecord.check_in).toLocaleTimeString('zh-CN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      }) : '未记录'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                status === 'present' ? 'default' :
                                status === 'late' ? 'secondary' :
                                'outline'
                              }>
                                {status === 'present' ? '出勤' :
                                 status === 'late' ? '迟到' : '未知'}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setShowAbsenceModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快速操作按钮 */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <Button 
            onClick={() => window.open(`/mobile-checkin/${center.id}`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            学生打卡入口
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open(`/teacher-checkin?center=${center.id}`, '_blank')}
          >
            <User className="h-4 w-4 mr-2" />
            教师打卡入口
          </Button>
      </div>
      </>
    )
  }

  // 显示分行概览界面
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-600">
            考勤管理
          </h3>
          <p className="text-sm text-gray-600">
            点击分行卡片查看详细考勤信息，未考勤学生可手动标记缺席原因
          </p>
        </div>
        <Button 
          onClick={fetchAttendanceData} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '刷新中...' : '刷新考勤数据'}
        </Button>
      </div>

      {/* 分行考勤概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {centers.map((center) => (
          <Card 
            key={center.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              center.status === 'active' 
                ? 'border-2 border-green-200 hover:border-green-300 bg-green-50' 
                : 'border-2 border-gray-200 bg-gray-50'
            }`}
            onClick={() => center.status === 'active' && handleCenterClick(center.id)}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                {/* 中心名称和状态 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-bold text-gray-900">{center.name}</h4>
                  <Badge variant={center.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {center.status === 'active' ? '可用' : '维护中'}
                  </Badge>
                </div>
                
                {/* 考勤人数显示 */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {center.todayAttendance}/{center.studentCount}
                  </div>
                  <div className="text-sm text-gray-600">今日出勤/总人数</div>

                </div>
                
                {/* 出勤率 */}
                <div className="mb-4">
                  <div className="text-lg font-semibold text-green-600">
                    {center.attendanceRate}%
                  </div>
                  <div className="text-sm text-gray-600">出勤率</div>
                </div>
                
                {/* 迟到和缺席统计 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-yellow-100 rounded p-2">
                    <div className="font-semibold text-yellow-700">{center.lateCount}</div>
                    <div className="text-yellow-600">迟到</div>
                  </div>
                  <div className="bg-red-100 rounded p-2">
                    <div className="font-semibold text-red-700">{center.absentCount}</div>
                    <div className="text-red-600">缺席</div>
                  </div>
                </div>
                
                {/* 最后活动时间 */}
                <div className="mt-4 text-xs text-gray-500">
                  {center.lastActivity}
                </div>
                
                {/* 点击提示 */}
                {center.status === 'active' && (
                  <div className="mt-3 text-xs text-blue-600 font-medium">
                    点击查看详情 →
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>





      {/* 移动端考勤中心管理 */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Smartphone className="h-5 w-5" />
                移动端考勤中心
              </CardTitle>
              <CardDescription className="text-blue-700">管理各中心的移动端考勤状态和快速访问</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>实时更新</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open('/mobile-checkin', '_blank')}>
                <Globe className="h-4 w-4 mr-2" />
                移动端入口
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/teacher-checkin', '_blank')}>
                <User className="h-4 w-4 mr-2" />
                教师打卡
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {centers.map((center) => (
              <div
                key={center.id}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                  center.status === 'active' 
                    ? 'border-green-200 hover:border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
                onClick={() => center.status === 'active' && window.open(`/mobile-checkin/${center.id}`, '_blank')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">{center.name}</h4>
                  </div>
                  <Badge variant={center.status === 'active' ? 'default' : 'secondary'}>
                    {center.status === 'active' ? '可用' : '维护中'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>学生数:</span>
                    <span className="font-medium">{center.studentCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span className="font-medium">{center.lastActivity}</span>
                  </div>
                </div>
                
                {center.status === 'active' && (
                  <div className="mt-3 space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/mobile-checkin/${center.id}`, '_blank')
                      }}
                    >
                      <Smartphone className="h-3 w-3 mr-1" />
                      学生打卡
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/teacher-checkin?center=${center.id}`, '_blank')
                      }}
                    >
                      <User className="h-4 w-4 mr-1" />
                      教师打卡
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 考勤记录表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>考勤记录</CardTitle>
              <CardDescription>查看和管理学生的考勤情况</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button size="sm" onClick={() => {
                setShowAbsenceModal(true)
              }}>
                <XCircle className="h-4 w-4 mr-2" />
                标记缺席
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载考勤数据...</p>
            </div>
          ) : attendanceData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>学号</TableHead>
                  <TableHead>中心</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.student_name}</TableCell>
                    <TableCell>{record.student_id}</TableCell>
                    <TableCell>{record.center}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Badge variant={
                        record.status === 'present' ? 'default' :
                        record.status === 'absent' ? 'destructive' :
                        record.status === 'late' ? 'secondary' : 'outline'
                      }>
                        {record.status === 'present' ? '出勤' :
                         record.status === 'absent' ? '缺席' :
                         record.status === 'late' ? '迟到' : record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.check_in ? 
                        new Date(record.check_in).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">暂无考勤记录</p>
              <p className="text-gray-500 text-sm">请等待学生签到或手动添加考勤记录</p>
            </div>
          )}
        </CardContent>
      </Card>



    </>
  )
}

export default function TeacherWorkspace() {
  const router = useRouter()
  const { user, userProfile, loading, logout } = useAuth()
  const { students } = useStudents()
  const [activeTab, setActiveTab] = useState("dashboard")

  // 调试学生数据
  useEffect(() => {
    console.log('🔍 TeacherWorkspace: 学生数据更新:', students?.length || 0)
    if (students && students.length > 0) {
      console.log('🔍 TeacherWorkspace: 前3个学生:', students.slice(0, 3))
      const centerCounts = students.reduce((acc, student) => {
        const center = student.center || 'WX 01'
        acc[center] = (acc[center] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      console.log('📊 TeacherWorkspace: 中心分布:', centerCounts)
    }
  }, [students])

  // 缺席管理状态 - 移动到主组件层级
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceDetail, setAbsenceDetail] = useState('')
  const [isMarkingAbsence, setIsMarkingAbsence] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // NFC卡补办申请状态
  const [showNFCReplacement, setShowNFCReplacement] = useState(false)

  // 基于真实数据计算统计信息
  const stats = useMemo(() => {
    const totalStudents = students.length
    const todayAttendance = students.filter(s => s.status === 'active').length // 这里应该基于真实考勤数据
    const attendanceRate = totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0
    
    return {
      totalStudents,
      todayAttendance,
      attendanceRate,
      pendingAssignments: 0, // 需要从作业API获取
      completedAssignments: 0, // 需要从作业API获取
      todayClasses: 0, // 需要从课程API获取
      averageGrade: 0, // 需要从成绩API获取
      recentMessages: 0 // 需要从消息API获取
    }
  }, [students])

  // 基于真实数据计算最近活动
  const recentActivities = useMemo(() => {
    if (!students || students.length === 0) {
      return []
    }
    
    // 等待真实数据API集成
    return []
  }, [students])

  // 基于真实数据计算即将开始的课程
  const upcomingClasses = useMemo(() => {
    // 等待真实数据API集成
    return []
  }, [])

  // 当用户数据加载完成后更新统计信息
  useEffect(() => {
    if (userProfile) {
      // 用户资料已加载，可以在这里添加额外的初始化逻辑
    }
  }, [userProfile])

  // 标记学生缺席 - 移动到主组件层级
  const handleMarkAbsence = async () => {
    if (!selectedStudent || !absenceReason || !user?.id) {
      return
    }
    
    setIsMarkingAbsence(true)
    try {
      const response = await fetch('/api/student-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: selectedStudent.student_id || '',
          student_name: selectedStudent.student_name || '',
          center: selectedStudent.center || '',
          date: selectedDate,
          status: 'absent',
          reason: absenceReason,
          detail: absenceDetail,
          teacher_id: user.id,
          method: 'manual'
        }),
      })

      if (response.ok) {
        // 显示成功提示
        alert(`✅ 成功标记学生 ${selectedStudent.student_name} 缺席`)
        
        // 关闭模态框并清空状态
        setShowAbsenceModal(false)
        setSelectedStudent(null)
        setAbsenceReason('')
        setAbsenceDetail('')
        
        // 立即刷新考勤数据
        console.log('✅ 缺席标记成功，立即刷新考勤数据...')
        window.dispatchEvent(new CustomEvent('refreshAttendanceData'))
        
        // 额外延迟刷新以确保数据同步
        setTimeout(() => {
          console.log('🔄 延迟刷新考勤数据...')
          window.dispatchEvent(new CustomEvent('refreshAttendanceData'))
        }, 1000)
      } else {
        alert(`❌ 标记缺席失败: ${response.status} ${response.statusText}`)
      }
         } catch (error) {
       // 标记缺席失败
     } finally {
      setIsMarkingAbsence(false)
    }
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载教师工作台...</p>
        </div>
      </div>
    )
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    router.push('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <TeacherNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 主内容区域 */}
        <main className="w-full">
          {/* Tab导航 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                总览
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                学生与考勤
              </TabsTrigger>
              <TabsTrigger value="teaching" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                课程与作业
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                通知公告
              </TabsTrigger>
            </TabsList>

            {/* 总览标签页 */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab students={students} onShowNFCReplacement={setShowNFCReplacement} onTabChange={setActiveTab} />
            </TabsContent>

            {/* 学生与考勤管理标签页 */}
            <TabsContent value="students" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">学生与考勤管理</h2>
                <p className="text-gray-600">管理学生信息、考勤记录和积分系统</p>
              </div>
              
              {/* 内部子标签页 */}
              <Tabs defaultValue="student-list" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="student-list" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    学生管理
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    考勤管理
                  </TabsTrigger>
                  <TabsTrigger value="points" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    积分管理
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="student-list" className="space-y-6">
                  <StudentManagement teacherId={user?.id} />
                </TabsContent>
                
                <TabsContent value="attendance" className="space-y-6">
                  <AttendanceManagement 
                    teacherId={user?.id}
                    showAbsenceModal={showAbsenceModal}
                    setShowAbsenceModal={setShowAbsenceModal}
                    selectedStudent={selectedStudent}
                    setSelectedStudent={setSelectedStudent}
                    absenceReason={absenceReason}
                    setAbsenceReason={setAbsenceReason}
                    absenceDetail={absenceDetail}
                    setAbsenceDetail={setAbsenceDetail}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    isMarkingAbsence={isMarkingAbsence}
                  />
                </TabsContent>
                
                <TabsContent value="points" className="space-y-6">
                  <PointsManagement />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* 课程与作业管理标签页 */}
            <TabsContent value="teaching" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">课程与作业管理</h2>
                <p className="text-gray-600">管理课程、班级和作业成绩</p>
              </div>
              
              {/* 内部子标签页 */}
              <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="courses" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    课程管理
                  </TabsTrigger>
                  <TabsTrigger value="classes" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    班级管理
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    作业与成绩
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="courses" className="space-y-6">
                  <CourseManagement />
                </TabsContent>
                
                <TabsContent value="classes" className="space-y-6">
                  <ClassManagement />
                </TabsContent>
                
                <TabsContent value="assignments" className="space-y-6">
                  <AssignmentManagement />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* 通知公告标签页 */}
            <TabsContent value="announcements" className="space-y-6">
              <AnnouncementManagement />
            </TabsContent>

            {/* 数据概览标签页 */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">数据概览</h2>
                <p className="text-gray-600">查看教学数据和统计信息</p>
              </div>
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
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
                        <div className="p-2 bg-green-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">今日出勤</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}</p>
                          <div className="flex items-center mt-1">
                            <Progress value={stats.attendanceRate} className="w-16 h-2 mr-2" />
                            <span className="text-xs text-green-600">{stats.attendanceRate}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">待批作业</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.pendingAssignments}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <BookOpen className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">今日课程</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.todayClasses}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 最近活动和即将开始的课程 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        最近活动
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentActivities.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivities.map((activity: any) => (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              activity.status === 'success' ? 'bg-green-500' :
                              activity.status === 'pending' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                              <p className="text-sm text-gray-600">{activity.detail}</p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      ) : (
                        <div className="text-center py-8">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">暂无活动记录</p>
                          <p className="text-gray-500 text-sm">等待真实数据加载</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        即将开始的课程
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upcomingClasses.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingClasses.map((classItem: any) => (
                          <div key={classItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{classItem.subject}</p>
                              <p className="text-sm text-gray-600">{classItem.className} • {classItem.room}</p>
                              <p className="text-xs text-gray-500">{classItem.students} 名学生</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-blue-600">{classItem.time}</p>
                              <p className="text-xs text-gray-500">{classItem.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      ) : (
                        <div className="text-center py-8">
                          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">暂无课程安排</p>
                          <p className="text-gray-500 text-sm">等待真实数据加载</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>


              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* 全局缺席标记模态框 - 移动到主组件层级确保始终显示在最前面 */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-800">标记学生缺席</h3>
                <p className="text-sm text-red-600 mt-1">标记后学生将归类到缺席位置</p>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* 如果已经有选中的学生，显示学生信息；否则显示选择器 */}
              {selectedStudent ? (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">👤 选中的学生</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {selectedStudent.student_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedStudent.student_name}</p>
                        <p className="text-sm text-gray-500">学号: {selectedStudent.student_id}</p>
                        <p className="text-sm text-gray-500">中心: {selectedStudent.center}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedStudent(null)}
                    className="mt-2 text-xs"
                  >
                    更换学生
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">👤 选择学生</label>
                  <Select onValueChange={(value) => {
                    // 解析复合key来找到正确的学生
                    const [studentId, center, id] = value.split('-')
                    const student = students.find(s => 
                      s.student_id === studentId && 
                      s.center === center && 
                      s.id === id
                    )
                    setSelectedStudent(student)
                  }}>
                    <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="请选择缺席的学生" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {students?.map((student) => (
                        <SelectItem key={`${student.student_id}-${student.center}-${student.id}`} value={`${student.student_id}-${student.center}-${student.id}`}>
                          <div className="flex items-center gap-2">
                            <span>👨‍🎓</span>
                            <span>{student.student_name}</span>
                            <span className="text-gray-500">({student.student_id})</span>
                            <span className="text-blue-500 text-xs">[{student.center}]</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">🚨 缺席原因</label>
                <Select onValueChange={setAbsenceReason}>
                  <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="请选择缺席原因" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="sick">🤒 生病</SelectItem>
                    <SelectItem value="leave">📝 请假</SelectItem>
                    <SelectItem value="personal">👤 个人事务</SelectItem>
                    <SelectItem value="family">👨‍👩‍👧‍👦 家庭事务</SelectItem>
                    <SelectItem value="transportation">🚗 交通问题</SelectItem>
                    <SelectItem value="weather">🌧️ 天气原因</SelectItem>
                    <SelectItem value="emergency">🚨 紧急情况</SelectItem>
                    <SelectItem value="other">❓ 其他原因</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">📝 详细说明</label>
                <Input
                  value={absenceDetail}
                  onChange={(e) => setAbsenceDetail(e.target.value)}
                  placeholder="请输入详细说明（可选）"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">📅 缺席日期</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={handleMarkAbsence}
                disabled={!selectedStudent || !absenceReason || isMarkingAbsence}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isMarkingAbsence ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    标记中...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    确认标记缺席
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowAbsenceModal(false)
                  setSelectedStudent(null)
                  setAbsenceReason('')
                  setAbsenceDetail('')
                }}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ❌ 取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* NFC卡补办申请对话框 */}
      {showNFCReplacement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <NFCReplacementCard />
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowNFCReplacement(false)}
                variant="outline"
                className="w-full"
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
