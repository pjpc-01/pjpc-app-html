"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  BookOpen,
  Award,
  Clock,
  Mail,
  Phone,
  Building,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  GraduationCap,
  Calendar,
  MapPin,
  Star,
  Activity,
  BarChart3,
  PieChart,
  Target,
  CheckCircle,
} from "lucide-react"

interface Teacher {
  uid: string
  email: string
  name: string
  role: "teacher"
  status: "pending" | "approved" | "suspended"
  emailVerified: boolean
  createdAt: any
  lastLogin: any
  phone?: string
  subject?: string
  department?: string
  experience?: number
  avatar?: string
}

interface TeacherAnalyticsProps {
  teachers: Teacher[]
  filteredTeachers: Teacher[]
}

export default function TeacherAnalytics({ teachers, filteredTeachers }: TeacherAnalyticsProps) {
  const analytics = useMemo(() => {
    const total = teachers.length
    const filtered = filteredTeachers.length
    
    // 状态统计
    const approvedCount = teachers.filter(teacher => teacher.status === 'approved').length
    const pendingCount = teachers.filter(teacher => teacher.status === 'pending').length
    const suspendedCount = teachers.filter(teacher => teacher.status === 'suspended').length
    
    // 科目分布
    const subjectDistribution = teachers.reduce((acc, teacher) => {
      const subject = teacher.subject || '未设置'
      acc[subject] = (acc[subject] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 部门分布
    const departmentDistribution = teachers.reduce((acc, teacher) => {
      const department = teacher.department || '未设置'
      acc[department] = (acc[department] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 教龄分布
    const experienceDistribution = teachers.reduce((acc, teacher) => {
      const experience = teacher.experience || 0
      if (experience < 3) acc['0-2年'] = (acc['0-2年'] || 0) + 1
      else if (experience < 6) acc['3-5年'] = (acc['3-5年'] || 0) + 1
      else if (experience < 11) acc['6-10年'] = (acc['6-10年'] || 0) + 1
      else if (experience < 16) acc['11-15年'] = (acc['11-15年'] || 0) + 1
      else acc['16年以上'] = (acc['16年以上'] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 联系信息完整性
    const hasPhoneCount = teachers.filter(teacher => teacher.phone).length
    const hasEmailCount = teachers.filter(teacher => teacher.email).length
    const emailVerifiedCount = teachers.filter(teacher => teacher.emailVerified).length
    
    // 平均教龄
    const totalExperience = teachers.reduce((sum, teacher) => sum + (teacher.experience || 0), 0)
    const averageExperience = total > 0 ? Math.round(totalExperience / total) : 0
    
    // 最近活跃
    const recentActiveCount = teachers.filter(teacher => {
      if (!teacher.lastLogin) return false
      const lastLogin = new Date(teacher.lastLogin)
      const now = new Date()
      const diffDays = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 7
    }).length
    
    // 入职时间分布
    const currentYear = new Date().getFullYear()
    const thisYearCount = teachers.filter(teacher => {
      if (!teacher.createdAt) return false
      const createdYear = new Date(teacher.createdAt).getFullYear()
      return createdYear === currentYear
    }).length
    
    return {
      total,
      filtered,
      approvedCount,
      pendingCount,
      suspendedCount,
      subjectDistribution,
      departmentDistribution,
      experienceDistribution,
      hasPhoneCount,
      hasEmailCount,
      emailVerifiedCount,
      averageExperience,
      recentActiveCount,
      thisYearCount
    }
  }, [teachers, filteredTeachers])

  const topSubjects = Object.entries(analytics.subjectDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  const topDepartments = Object.entries(analytics.departmentDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总教师数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground">
              筛选显示 {analytics.filtered} 位
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已批准教师</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.total > 0 ? Math.round((analytics.approvedCount / analytics.total) * 100) : 0}% 的教师
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均教龄</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.averageExperience}年</div>
            <p className="text-xs text-muted-foreground">
              资深教师比例高
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近活跃</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics.recentActiveCount}</div>
            <p className="text-xs text-muted-foreground">
              过去7天内登录
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 教师状态分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              教师状态分析
            </CardTitle>
            <CardDescription>教师审批和活跃状态分布</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm">已批准</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.approvedCount}</span>
                  <Progress 
                    value={analytics.total > 0 ? (analytics.approvedCount / analytics.total) * 100 : 0} 
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">待审核</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.pendingCount}</span>
                  <Progress 
                    value={analytics.total > 0 ? (analytics.pendingCount / analytics.total) * 100 : 0} 
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-600" />
                  <span className="text-sm">已暂停</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.suspendedCount}</span>
                  <Progress 
                    value={analytics.total > 0 ? (analytics.suspendedCount / analytics.total) * 100 : 0} 
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 联系信息完整性 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              联系信息完整性
            </CardTitle>
            <CardDescription>教师联系方式的完善程度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">有联系电话</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.hasPhoneCount}</span>
                  <Badge variant="outline">
                    {analytics.total > 0 ? Math.round((analytics.hasPhoneCount / analytics.total) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="text-sm">有邮箱地址</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.hasEmailCount}</span>
                  <Badge variant="outline">
                    {analytics.total > 0 ? Math.round((analytics.hasEmailCount / analytics.total) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">邮箱已验证</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.emailVerifiedCount}</span>
                  <Badge variant="outline">
                    {analytics.total > 0 ? Math.round((analytics.emailVerifiedCount / analytics.total) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 科目和部门分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 科目分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              科目分布
            </CardTitle>
            <CardDescription>教师任教科目的分布情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSubjects.map(([subject, count]) => (
                <div key={subject} className="flex items-center justify-between">
                  <span className="text-sm">{subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <Progress 
                      value={analytics.total > 0 ? (count / analytics.total) * 100 : 0} 
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 部门分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              部门分布
            </CardTitle>
            <CardDescription>教师所属部门的分布情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDepartments.map(([department, count]) => (
                <div key={department} className="flex items-center justify-between">
                  <span className="text-sm">{department}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <Progress 
                      value={analytics.total > 0 ? (count / analytics.total) * 100 : 0} 
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 教龄分布和入职趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 教龄分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              教龄分布
            </CardTitle>
            <CardDescription>教师教学经验年限分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.experienceDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center justify-between">
                  <span className="text-sm">{range}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <Progress 
                      value={analytics.total > 0 ? (count / analytics.total) * 100 : 0} 
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 入职趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              入职趋势
            </CardTitle>
            <CardDescription>教师入职时间分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">今年入职</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.thisYearCount}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {analytics.total > 0 ? Math.round((analytics.thisYearCount / analytics.total) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">往年入职</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.total - analytics.thisYearCount}</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {analytics.total > 0 ? Math.round(((analytics.total - analytics.thisYearCount) / analytics.total) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-xs text-muted-foreground mb-2">入职趋势分析</div>
                <div className="flex items-center gap-2">
                  {analytics.thisYearCount > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">今年新增 {analytics.thisYearCount} 位教师</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">今年暂无新教师入职</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
