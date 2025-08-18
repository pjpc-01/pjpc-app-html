"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import SimpleStudentManagement from "../management/simple-student-management"
import SimpleTeacherManagement from "../management/simple-teacher-management"
import SimpleCourseManagement from "../management/simple-course-management"

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
  
  // 简化的状态管理
  const [educationActiveTab, setEducationActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState('all')

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

  // 筛选学生
  const filteredStudents = useMemo(() => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.grade?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedGrade !== 'all') {
      filtered = filtered.filter(student => student.grade === selectedGrade)
    }

    return filtered.slice(0, 10) // 只显示前10个
  }, [students, searchTerm, selectedGrade])

  // 获取年级选项
  const gradeOptions = useMemo(() => {
    const grades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort()
    return grades
  }, [students])

  return (
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

      {/* 主要功能标签页 */}
      <Tabs value={educationActiveTab} onValueChange={setEducationActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="students">学生管理</TabsTrigger>
          <TabsTrigger value="teachers">教师管理</TabsTrigger>
          <TabsTrigger value="courses">课程管理</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 学生分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  学生分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">小学生</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {educationStats.primaryCount} 人
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">中学生</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {educationStats.secondaryCount} 人
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    添加学生
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    添加教师
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    创建课程
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 学生管理标签页 */}
        <TabsContent value="students" className="space-y-6">
          <SimpleStudentManagement />
        </TabsContent>

        {/* 教师管理标签页 */}
        <TabsContent value="teachers" className="space-y-6">
          <SimpleTeacherManagement />
        </TabsContent>

        {/* 课程管理标签页 */}
        <TabsContent value="courses" className="space-y-6">
          <SimpleCourseManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
