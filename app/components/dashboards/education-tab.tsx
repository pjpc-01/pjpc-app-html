"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  FileText,
  Calendar,
  Activity,
  TrendingUp,
  RefreshCw,
  UserPlus,
  ArrowLeft,
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import TeacherManagement from "../management/teacher-management"
import CourseManagement from "../management/course-management"

interface EducationTabProps {
  stats: any
  statsLoading: boolean
  educationDataType: string
  setEducationDataType: (type: string) => void
  setActiveTab: (tab: string) => void
}

export default function EducationTab({ 
  stats, 
  statsLoading, 
  educationDataType, 
  setEducationDataType, 
  setActiveTab 
}: EducationTabProps) {
  const { students, loading: studentsLoading } = useStudents()
  const { userProfile } = useAuth()
  const [activeView, setActiveView] = useState<'overview' | 'teachers' | 'courses'>('overview')

  // 获取教育数据统计
  const educationStats = useMemo(() => {
    const primaryStudents = students.filter(s => {
      const grade = s.grade || ''
      return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
             grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
             grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
    })
    
    const secondaryStudents = students.filter(s => {
      const grade = s.grade || ''
      return grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
             grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
             grade === '7' || grade === '8' || grade === '9' || grade === '10' || grade === '11' || grade === '12'
    })

    return {
      primaryCount: primaryStudents.length,
      secondaryCount: secondaryStudents.length,
      totalStudents: students.length,
      teachersCount: stats?.activeTeachers || 0,
      coursesCount: stats?.totalCourses || 0,
      attendanceCount: stats?.todayAttendance || 0
    }
  }, [students, stats])

  // 渲染概览界面
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 标题和概览 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">教育管理</h2>
        <p className="text-gray-600">统一的教育数据管理平台</p>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">学生总数</p>
                {statsLoading || studentsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-green-600">{educationStats.totalStudents}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      实时数据
                    </p>
                  </>
                )}
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">教师总数</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-blue-600">{educationStats.teachersCount}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      实时数据
                    </p>
                  </>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">课程总数</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-purple-600">{educationStats.coursesCount}</p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      实时数据
                    </p>
                  </>
                )}
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日出勤</p>
                {statsLoading ? (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-orange-600">{educationStats.attendanceCount}</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <Activity className="h-3 w-3 mr-1" />
                      实时数据
                    </p>
                  </>
                )}
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              学生管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              管理学生信息、查看打卡状态、配置专属网址
            </p>
            <Button 
              onClick={() => setActiveTab('students')}
              className="w-full"
            >
              进入学生管理
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              教师管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              管理教师信息、课程分配、教学安排
            </p>
            <Button 
              onClick={() => setActiveView('teachers')}
              variant="outline"
              className="w-full"
            >
              进入教师管理
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              课程管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              管理课程信息、课程安排、教学资源
            </p>
            <Button 
              onClick={() => setActiveView('courses')}
              variant="outline"
              className="w-full"
            >
              进入课程管理
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // 渲染教师管理界面
  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">教师管理</h2>
          <p className="text-gray-600">管理教师信息、课程分配、教学安排</p>
        </div>
        <Button 
          onClick={() => setActiveView('overview')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回教育概览
        </Button>
      </div>
      <TeacherManagement />
    </div>
  )

  // 渲染课程管理界面
  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">课程管理</h2>
          <p className="text-gray-600">管理课程信息、课程安排、教学资源</p>
        </div>
        <Button 
          onClick={() => setActiveView('overview')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回教育概览
        </Button>
      </div>
      <CourseManagement />
    </div>
  )

  return (
    <div>
      {activeView === 'overview' && renderOverview()}
      {activeView === 'teachers' && renderTeachers()}
      {activeView === 'courses' && renderCourses()}
    </div>
  )
}
