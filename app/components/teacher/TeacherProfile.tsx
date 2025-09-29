"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  User,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Users,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Heart,
  Shield,
  Car,
  Star,
  BarChart3,
  Activity,
  Eye,
  Edit
} from "lucide-react"

interface TeacherProfileProps {
  teacherId: string
}

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string
  checkOut?: string
  status: 'present' | 'late' | 'absent' | 'half_day'
  notes?: string
}

interface LeaveRecord {
  id: string
  type: 'annual' | 'sick' | 'personal' | 'emergency'
  startDate: string
  endDate: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  reason: string
}

interface ClassAssignment {
  id: string
  className: string
  subject: string
  grade: string
  students: number
  center: string
  schedule: string
}

export default function TeacherProfile({ teacherId }: TeacherProfileProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([])
  const [classAssignments, setClassAssignments] = useState<ClassAssignment[]>([])
  const [loading, setLoading] = useState(true)

  // 加载教师数据
  useEffect(() => {
    const loadTeacherData = async () => {
      setLoading(true)
      
      try {
        // 加载考勤记录
        const attendanceResponse = await fetch(`/api/teacher-profile?teacherId=${teacherId}&type=attendance`)
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json()
          if (attendanceData.success) {
            setAttendanceRecords(attendanceData.records || [])
          }
        }

        // 加载请假记录
        const leaveResponse = await fetch(`/api/teacher-profile?teacherId=${teacherId}&type=leave`)
        if (leaveResponse.ok) {
          const leaveData = await leaveResponse.json()
          if (leaveData.success) {
            setLeaveRecords(leaveData.records || [])
          }
        }

        // 加载班级分配
        const classesResponse = await fetch(`/api/teacher-profile?teacherId=${teacherId}&type=classes`)
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          if (classesData.success) {
            setClassAssignments(classesData.records || [])
          }
        }

      } catch (error) {
        console.error('加载教师数据失败:', error)
        
        // 如果API失败，使用模拟数据作为后备
        const mockAttendance: AttendanceRecord[] = [
          {
            id: "1",
            date: "2024-01-15",
            checkIn: "08:00",
            checkOut: "17:30",
            status: 'present',
            notes: "正常出勤"
          }
        ]

        const mockLeave: LeaveRecord[] = [
          {
            id: "1",
            type: 'annual',
            startDate: "2024-02-01",
            endDate: "2024-02-03",
            days: 3,
            status: 'approved',
            reason: "家庭旅行"
          }
        ]

        const mockClasses: ClassAssignment[] = [
          {
            id: "1",
            className: "三年级A班",
            subject: "数学",
            grade: "三年级",
            students: 25,
            center: "WX 01",
            schedule: "周一至周五 09:00-10:30"
          }
        ]

        setAttendanceRecords(mockAttendance)
        setLeaveRecords(mockLeave)
        setClassAssignments(mockClasses)
      } finally {
        setLoading(false)
      }
    }

    loadTeacherData()
  }, [teacherId])

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'half_day': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />
      case 'late': return <Clock className="h-4 w-4" />
      case 'absent': return <XCircle className="h-4 w-4" />
      case 'half_day': return <AlertCircle className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  // 计算剩余请假天数
  const calculateRemainingLeave = () => {
    const totalAnnualLeave = 21 // 年假总数
    const usedAnnualLeave = leaveRecords
      .filter(leave => leave.type === 'annual' && leave.status === 'approved')
      .reduce((total, leave) => total + leave.days, 0)
    
    return totalAnnualLeave - usedAnnualLeave
  }

  // 处理请假申请
  const handleLeaveApplication = async () => {
    const startDate = prompt('请输入开始日期 (YYYY-MM-DD):')
    const endDate = prompt('请输入结束日期 (YYYY-MM-DD):')
    const reason = prompt('请输入请假原因:')
    const leaveType = prompt('请输入请假类型 (annual/sick/personal/emergency):')

    if (!startDate || !endDate || !reason || !leaveType) {
      alert('请填写所有必填字段')
      return
    }

    try {
      const response = await fetch('/api/teacher-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId,
          leaveType,
          startDate,
          endDate,
          reason,
          days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert('请假申请提交成功！')
        // 重新加载数据
        window.location.reload()
      } else {
        alert('请假申请提交失败: ' + result.error)
      }
    } catch (error) {
      console.error('请假申请失败:', error)
      alert('请假申请提交失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载个人档案中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">个人档案</h2>
        <p className="text-gray-600">查看您的个人信息、考勤记录、请假情况和负责班级</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            基本信息
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            考勤记录
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            请假管理
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            负责班级
          </TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 个人信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  个人信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">张老师</h3>
                    <p className="text-gray-600">数学教师</p>
                    <Badge variant="outline" className="mt-1">在职</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">+60 12-345-6789</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">zhang.teacher@school.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">WX 01 分行</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 统计概览 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  统计概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">47</p>
                    <p className="text-sm text-gray-600">负责学生</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">2</p>
                    <p className="text-sm text-gray-600">负责班级</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-600">5</p>
                    <p className="text-sm text-gray-600">教学年数</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold text-orange-600">{calculateRemainingLeave()}</p>
                    <p className="text-sm text-gray-600">剩余年假</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 考勤记录 */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                考勤记录
              </CardTitle>
              <CardDescription>查看您的出勤情况和考勤历史</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>签到时间</TableHead>
                    <TableHead>签退时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{record.checkIn}</TableCell>
                      <TableCell>{record.checkOut || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            {record.status === 'present' ? '正常' :
                             record.status === 'late' ? '迟到' :
                             record.status === 'absent' ? '缺勤' : '半天'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{record.notes}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 请假管理 */}
        <TabsContent value="leave" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 请假统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  请假统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">年假余额</span>
                    <span className="text-lg font-bold text-blue-600">{calculateRemainingLeave()} 天</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">病假余额</span>
                    <span className="text-lg font-bold text-green-600">14 天</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">事假余额</span>
                    <span className="text-lg font-bold text-purple-600">5 天</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 请假记录 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  请假记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveRecords.map((leave) => (
                    <div key={leave.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{leave.reason}</p>
                          <p className="text-sm text-gray-600">
                            {leave.startDate} 至 {leave.endDate} ({leave.days}天)
                          </p>
                        </div>
                        <Badge className={getStatusColor(leave.status)}>
                          {leave.status === 'approved' ? '已批准' :
                           leave.status === 'pending' ? '待审批' : '已拒绝'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {leave.type === 'annual' ? '年假' :
                         leave.type === 'sick' ? '病假' :
                         leave.type === 'personal' ? '事假' : '紧急假'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 申请请假按钮 */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full"
                onClick={() => handleLeaveApplication()}
              >
                <Calendar className="h-4 w-4 mr-2" />
                申请请假
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 负责班级 */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                负责班级
              </CardTitle>
              <CardDescription>查看您负责的班级和教学安排</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classAssignments.map((classItem) => (
                  <div key={classItem.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{classItem.className}</h3>
                        <p className="text-gray-600">{classItem.subject} - {classItem.grade}</p>
                      </div>
                      <Badge variant="outline">{classItem.center}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{classItem.students} 名学生</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{classItem.schedule}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
