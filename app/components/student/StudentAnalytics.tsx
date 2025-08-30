"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GraduationCap, 
  Phone, 
  Activity,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"
import { Student } from "@/hooks/useStudents"

interface StudentAnalyticsProps {
  students: Student[]
  filteredStudents: Student[]
}



export default function StudentAnalytics({ students, filteredStudents }: StudentAnalyticsProps) {
  const analytics = useMemo(() => {
    const total = students.length
    const filtered = filteredStudents.length
    
    // 基础统计
    const active = students.filter(s => s.status === 'active').length
    const inactive = students.filter(s => s.status !== 'active').length
    
    // 年级分布
    const gradeDistribution = students.reduce((acc, student) => {
      const grade = student.standard || '未知年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 小学/中学分布
    const primaryCount = students.filter(student => {
      const grade = student.standard || ''
      return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
             grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
             grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
    }).length

    const secondaryCount = students.filter(student => {
      const grade = student.standard || ''
      return grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
             grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
             grade === '7' || grade === '8' || grade === '9' || grade === '10' || grade === '11' || grade === '12'
    }).length

    // 联系信息统计
    const hasPhone = students.filter(s => s.parentName && s.parentName.trim() !== '').length
    const hasEmail = students.filter(s => s.email && s.email.trim() !== '').length

    // 中心分布
    const centerDistribution = students.reduce((acc, student) => {
      const center = student.parentName || '未知中心'
      acc[center] = (acc[center] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 趋势分析（模拟数据）
    const monthlyGrowth = [
      { month: '1月', count: 120 },
      { month: '2月', count: 135 },
      { month: '3月', count: 142 },
      { month: '4月', count: 158 },
      { month: '5月', count: 165 },
      { month: '6月', count: 172 }
    ]

    return {
      total,
      filtered,
      active,
      inactive,
      primaryCount,
      secondaryCount,
      hasPhone,
      hasEmail,
      gradeDistribution,
      centerDistribution,
      monthlyGrowth,
      activeRate: total > 0 ? (active / total) * 100 : 0,
      primaryRate: total > 0 ? (primaryCount / total) * 100 : 0,
      secondaryRate: total > 0 ? (secondaryCount / total) * 100 : 0,
      phoneRate: total > 0 ? (hasPhone / total) * 100 : 0,
      emailRate: total > 0 ? (hasEmail / total) * 100 : 0
    }
  }, [students, filteredStudents])

  const topGrades = useMemo(() => {
    return Object.entries(analytics.gradeDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }, [analytics.gradeDistribution])

  const topCenters = useMemo(() => {
    return Object.entries(analytics.centerDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }, [analytics.centerDistribution])

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总学生数</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.total}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  较上月 +{analytics.monthlyGrowth[analytics.monthlyGrowth.length - 1].count - analytics.monthlyGrowth[analytics.monthlyGrowth.length - 2].count}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">在读学生</p>
                <p className="text-2xl font-bold text-green-600">{analytics.active}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <className="h-3 w-3 mr-1" />
                  {analytics.activeRate.toFixed(1)}% 在读率
                </p>
              </div>
              <className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">小学生</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.primaryCount}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {analytics.primaryRate.toFixed(1)}% 占比
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">中学生</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.secondaryCount}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {analytics.secondaryRate.toFixed(1)}% 占比
                </p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 年级分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              年级分布
            </CardTitle>
            <CardDescription>各年级学生数量分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topGrades.map(([grade, count], index) => (
                <div key={grade} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-16 text-center">
                      {grade}
                    </Badge>
                    <span className="text-sm font-medium">{count} 人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(count / analytics.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-12">
                      {((count / analytics.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 中心分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <className="h-5 w-5" />
              中心分布
            </CardTitle>
            <CardDescription>各中心学生数量分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCenters.map(([center, count], index) => (
                <div key={center} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium truncate max-w-24">{center}</span>
                    <span className="text-sm text-gray-500">{count} 人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(count / analytics.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-12">
                      {((count / analytics.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 联系信息统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              联系信息完整度
            </CardTitle>
            <CardDescription>学生家长联系信息统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">联系电话</span>
                  <span className="text-sm text-gray-500">{analytics.hasPhone} / {analytics.total}</span>
                </div>
                <Progress value={analytics.phoneRate} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  完整度: {analytics.phoneRate.toFixed(1)}%
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">邮箱地址</span>
                  <span className="text-sm text-gray-500">{analytics.hasEmail} / {analytics.total}</span>
                </div>
                <Progress value={analytics.emailRate} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  完整度: {analytics.emailRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              学生状态分析
            </CardTitle>
            <CardDescription>学生状态分布统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">在读学生</p>
                    <p className="text-sm text-green-600">正常学习状态</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{analytics.active}</p>
                  <p className="text-sm text-green-600">{analytics.activeRate.toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">离校学生</p>
                    <p className="text-sm text-red-600">已毕业或转学</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">{analytics.inactive}</p>
                  <p className="text-sm text-red-600">{((analytics.inactive / analytics.total) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 增长趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            学生增长趋势
          </CardTitle>
          <CardDescription>近6个月学生数量变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {analytics.monthlyGrowth.map((item, index) => {
              const prevCount = index > 0 ? analytics.monthlyGrowth[index - 1].count : item.count
              const growth = item.count - prevCount
              const growthRate = prevCount > 0 ? (growth / prevCount) * 100 : 0
              
              return (
                <div key={item.month} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                  <div className="text-sm text-gray-500">{item.month}</div>
                  <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                    growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {growth >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(growthRate).toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 筛选结果统计 */}
      {analytics.filtered !== analytics.total && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">筛选结果</p>
                  <p className="text-sm text-blue-600">
                    当前显示 {analytics.filtered} 个学生，共 {analytics.total} 个学生
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600">
                {((analytics.filtered / analytics.total) * 100).toFixed(1)}% 匹配
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
