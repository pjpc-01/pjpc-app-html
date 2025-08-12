"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import StudentManagement from "../management/student-management-page"
import CourseManagement from "../management/course-management"
import AssignmentManagement from "../management/assignment-management"
import ExamSystem from "../systems/exam-system"
import CommunicationSystem from "../systems/communication-system"
import LearningAnalytics from "../features/learning-analytics"
import ScheduleManagement from "../features/schedule-management"
import ResourceLibrary from "../features/resource-library"
import AttendanceSystem from "../systems/attendance-system"
import {
  GraduationCap,
  FileText,
  MessageSquare,
  Calendar,
  UserCheck,
  BookOpen,
  BarChart3,
  Settings,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react"

interface TeacherDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function TeacherDashboard({ activeTab, setActiveTab }: TeacherDashboardProps) {
  const [stats] = useState({
    myStudents: 28,
    todayAttendance: 26,
    pendingAssignments: 12,
    todayClasses: 3,
    completedAssignments: 45,
    averageGrade: 87,
    attendanceRate: 93,
  })

  const todaySchedule = [
    { time: "09:00", subject: "数学", class: "三年级A班", status: "completed", students: 24 },
    { time: "14:00", subject: "英语", class: "四年级B班", status: "ongoing", students: 22 },
    { time: "16:00", subject: "科学", class: "五年级C班", status: "upcoming", students: 26 },
  ]

  const recentActivities = [
    { time: "10:30", action: "批改作业", detail: "数学练习册 - 三年级A班", type: "assignment" },
    { time: "09:45", action: "学生签到", detail: "小明已到校", type: "attendance" },
    { time: "09:20", action: "课程准备", detail: "英语课件已上传", type: "course" },
    { time: "08:50", action: "家长沟通", detail: "与李家长讨论学习进度", type: "communication" },
  ]

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            教育
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">我的学生</p>
                      <p className="text-2xl font-bold">{stats.myStudents}</p>
                      <p className="text-xs text-blue-600 flex items-center mt-1">
                        <Activity className="h-3 w-3 mr-1" />
                        活跃学生
                      </p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">今日出勤</p>
                      <p className="text-2xl font-bold">
                        {stats.todayAttendance}/{stats.myStudents}
                      </p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stats.attendanceRate}% 出勤率
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">待批作业</p>
                      <p className="text-2xl font-bold">{stats.pendingAssignments}</p>
                      <p className="text-xs text-orange-600 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        需要处理
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">今日课程</p>
                      <p className="text-2xl font-bold">{stats.todayClasses}</p>
                      <p className="text-xs text-purple-600 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        教学安排
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule and Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    今日课程安排
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todaySchedule.map((schedule, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-medium text-blue-600">{schedule.time}</div>
                          <div>
                            <div className="font-medium">{schedule.subject}</div>
                            <div className="text-sm text-gray-500">
                              {schedule.class} • {schedule.students} 学生
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            schedule.status === "completed"
                              ? "default"
                              : schedule.status === "ongoing"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            schedule.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : schedule.status === "ongoing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {schedule.status === "completed"
                            ? "已完成"
                            : schedule.status === "ongoing"
                              ? "进行中"
                              : "待开始"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    最近活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="text-xs text-gray-500 w-12">{activity.time}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.action}</div>
                          <div className="text-xs text-gray-500">{activity.detail}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            activity.type === "assignment"
                              ? "border-orange-200 text-orange-700"
                              : activity.type === "attendance"
                                ? "border-green-200 text-green-700"
                                : activity.type === "course"
                                  ? "border-blue-200 text-blue-700"
                                  : "border-purple-200 text-purple-700"
                          }
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>教学概况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">{stats.completedAssignments}</div>
                    <div className="text-sm text-gray-600 mb-2">已批改作业</div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{stats.averageGrade}</div>
                    <div className="text-sm text-gray-600 mb-2">班级平均分</div>
                    <Progress value={87} className="h-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">{stats.attendanceRate}%</div>
                    <div className="text-sm text-gray-600 mb-2">出勤率</div>
                    <Progress value={93} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-green-50"
                    onClick={() => setActiveTab("education")}
                  >
                    <BookOpen className="h-6 w-6 text-green-600" />
                    <span className="text-sm">教育管理</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-blue-50"
                    onClick={() => setActiveTab("attendance")}
                  >
                    <UserCheck className="h-6 w-6 text-blue-600" />
                    <span className="text-sm">学生点名</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-orange-50"
                    onClick={() => setActiveTab("assignments")}
                  >
                    <FileText className="h-6 w-6 text-orange-600" />
                    <span className="text-sm">批改作业</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-purple-50"
                    onClick={() => setActiveTab("communication")}
                  >
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <span className="text-sm">家长沟通</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("students")}>
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">我的学生</h3>
                  <p className="text-sm text-gray-600 mb-3">管理班级学生信息</p>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {stats.myStudents} 学生
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("attendance")}>
                  <Clock className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="font-semibold mb-2">出勤管理</h3>
                  <p className="text-sm text-gray-600 mb-3">课堂点名和出勤记录</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.attendanceRate}% 出勤率
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("courses")}>
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold mb-2">课程管理</h3>
                  <p className="text-sm text-gray-600 mb-3">我的课程和教学计划</p>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    活跃课程
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("assignments")}>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="font-semibold mb-2">作业管理</h3>
                  <p className="text-sm text-gray-600 mb-3">布置和批改作业</p>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {stats.pendingAssignments} 待批改
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("exams")}>
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-red-600" />
                  <h3 className="font-semibold mb-2">考试管理</h3>
                  <p className="text-sm text-gray-600 mb-3">考试安排和成绩录入</p>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    考试系统
                  </Badge>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
                <CardContent className="p-6 text-center" onClick={() => setActiveTab("analytics")}>
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
                  <h3 className="font-semibold mb-2">学习分析</h3>
                  <p className="text-sm text-gray-600 mb-3">学生学习数据分析</p>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                    数据报告
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Individual feature pages */}
        <TabsContent value="students" className="mt-6">
          <StudentManagement />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceSystem />
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <AssignmentManagement />
        </TabsContent>

        <TabsContent value="exams" className="mt-6">
          <ExamSystem />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <LearningAnalytics />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <ScheduleManagement />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <ResourceLibrary />
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <CommunicationSystem />
        </TabsContent>
      </Tabs>
    </div>
  )
}
