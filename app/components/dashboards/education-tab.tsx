"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import EducationDropdown, { EducationDataType } from "../features/education-dropdown"
import StudentManagementPage from "../management/student-management-page"
import TeacherManagement from "../management/teacher-management"
import AssignmentManagement from "../management/assignment-management"
import CourseManagement from "../management/course-management"
import AttendanceSystem from "../systems/attendance-system"
import ExamSystem from "../systems/exam-system"
import ResourceLibrary from "../features/resource-library"
import ScheduleManagement from "../features/schedule-management"
import LearningAnalytics from "../features/learning-analytics"
import { useStudents } from "@/hooks/useStudents"

interface EducationTabProps {
  stats: any
  statsLoading: boolean
  educationDataType: EducationDataType
  setEducationDataType: (type: EducationDataType) => void
  setActiveTab: (tab: string) => void
}

export default function EducationTab({ 
  stats, 
  statsLoading, 
  educationDataType, 
  setEducationDataType, 
  setActiveTab 
}: EducationTabProps) {
  const [educationSubTab, setEducationSubTab] = useState<string>('')
  
  // Use the actual student data from useStudents hook
  // Map educationDataType to student dataType (teachers is not a student type)
  const studentDataType = educationDataType === 'teachers' ? 'primary' : educationDataType
  const { students, loading: studentsLoading } = useStudents({ dataType: studentDataType })

  const handleCardClick = (tab: string) => {
    console.log('Education card clicked, setting educationSubTab to:', tab)
    setEducationSubTab(tab)
  }

  // 获取教育数据统计 - use useMemo to prevent unnecessary recalculations
  const educationStats = useMemo(() => {
    return {
      primaryCount: students.length,
      secondaryCount: students.length,
      teachersCount: stats?.activeTeachers || 0
    }
  }, [students.length, stats?.activeTeachers])

  return (
    <div className="space-y-6">
      {/* 教育管理概览 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">教育管理</h2>
        <p className="text-gray-600">全面的教育数据管理和分析</p>
      </div>

      {/* 教育数据选择器 */}
      <div className="mb-6">
        <EducationDropdown
          selectedType={educationDataType}
          onTypeChange={setEducationDataType}
        />
      </div>

      {/* 关键教育指标 */}
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
                    <p className="text-2xl font-bold text-green-600">{educationStats.primaryCount}</p>
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
                    <p className="text-2xl font-bold text-purple-600">{stats?.totalCourses || 0}</p>
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
                    <p className="text-2xl font-bold text-orange-600">{stats?.todayAttendance || 0}</p>
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

      {/* 教育子标签内容 */}
      {educationSubTab && (
        <div className="mt-8">
          {educationSubTab === "student-management" && <StudentManagementPage />}
          {educationSubTab === "teacher-management" && <TeacherManagement />}
          {educationSubTab === "course-management" && <CourseManagement />}
          {educationSubTab === "assignment-management" && <AssignmentManagement />}
          {educationSubTab === "attendance-system" && <AttendanceSystem />}
          {educationSubTab === "exam-system" && <ExamSystem />}
          {educationSubTab === "resource-library" && <ResourceLibrary />}
          {educationSubTab === "schedule-management" && <ScheduleManagement />}
          {educationSubTab === "learning-analytics" && <LearningAnalytics />}
        </div>
      )}

      {/* 教育功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("student-management")}>
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold mb-2">学生管理</h3>
            <p className="text-sm text-gray-600 mb-3">学生信息管理</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {educationStats.primaryCount} 学生
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("teacher-management")}>
            <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold mb-2">教师管理</h3>
            <p className="text-sm text-gray-600 mb-3">教师信息管理</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {educationStats.teachersCount} 教师
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("course-management")}>
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold mb-2">课程管理</h3>
            <p className="text-sm text-gray-600 mb-3">课程设置和管理</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {stats?.totalCourses || 0} 课程
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("assignment-management")}>
            <FileText className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h3 className="font-semibold mb-2">作业管理</h3>
            <p className="text-sm text-gray-600 mb-3">作业分配和跟踪</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {stats?.totalAssignments || 0} 作业
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("attendance-system")}>
            <Clock className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h3 className="font-semibold mb-2">出勤系统</h3>
            <p className="text-sm text-gray-600 mb-3">学生出勤记录</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {stats?.todayAttendance || 0} 今日出勤
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("exam-system")}>
            <FileText className="h-12 w-12 mx-auto mb-4 text-indigo-600" />
            <h3 className="font-semibold mb-2">考试系统</h3>
            <p className="text-sm text-gray-600 mb-3">考试安排和成绩</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                {stats?.totalExams || 0} 考试
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-emerald-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("resource-library")}>
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-emerald-600" />
            <h3 className="font-semibold mb-2">资源库</h3>
            <p className="text-sm text-gray-600 mb-3">教学资源管理</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {stats?.totalResources || 0} 资源
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-teal-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("schedule-management")}>
            <Calendar className="h-12 w-12 mx-auto mb-4 text-teal-600" />
            <h3 className="font-semibold mb-2">课程安排</h3>
            <p className="text-sm text-gray-600 mb-3">课程时间表管理</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                {stats?.totalSchedules || 0} 安排
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-pink-200">
          <CardContent className="p-6 text-center" onClick={() => handleCardClick("learning-analytics")}>
            <Activity className="h-12 w-12 mx-auto mb-4 text-pink-600" />
            <h3 className="font-semibold mb-2">学习分析</h3>
            <p className="text-sm text-gray-600 mb-3">学习数据和分析</p>
            {!statsLoading && (
              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                实时数据
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
