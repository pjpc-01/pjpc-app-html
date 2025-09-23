'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users,
  Calendar,
  Download,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'

interface AttendanceAnalytics {
  totalEmployees: number
  averageAttendanceRate: number
  lateArrivals: number
  earlyDepartures: number
  overtimeHours: number
  absentDays: number
  topPerformers: Array<{
    name: string
    attendanceRate: number
    department: string
  }>
  departmentStats: Array<{
    department: string
    attendanceRate: number
    totalEmployees: number
  }>
  monthlyTrend: Array<{
    month: string
    attendanceRate: number
    totalHours: number
  }>
  timeDistribution: Array<{
    timeSlot: string
    checkIns: number
    checkOuts: number
  }>
}

interface AttendanceInsight {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

export function AttendanceAnalytics() {
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null)
  const [insights, setInsights] = useState<AttendanceInsight[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  // 模拟数据
  useEffect(() => {
    const mockAnalytics: AttendanceAnalytics = {
      totalEmployees: 25,
      averageAttendanceRate: 87.5,
      lateArrivals: 12,
      earlyDepartures: 8,
      overtimeHours: 45,
      absentDays: 15,
      topPerformers: [
        { name: 'Ahmad Rahman', attendanceRate: 98.5, department: '教学部' },
        { name: 'Siti Aminah', attendanceRate: 96.2, department: '行政部' },
        { name: 'Muhammad Ali', attendanceRate: 94.8, department: '教学部' },
        { name: 'Fatimah Zahra', attendanceRate: 92.1, department: '支持部' }
      ],
      departmentStats: [
        { department: '教学部', attendanceRate: 89.2, totalEmployees: 12 },
        { department: '行政部', attendanceRate: 85.7, totalEmployees: 6 },
        { department: '支持部', attendanceRate: 88.9, totalEmployees: 7 }
      ],
      monthlyTrend: [
        { month: '2023-10', attendanceRate: 85.2, totalHours: 1680 },
        { month: '2023-11', attendanceRate: 87.1, totalHours: 1720 },
        { month: '2023-12', attendanceRate: 86.8, totalHours: 1690 },
        { month: '2024-01', attendanceRate: 87.5, totalHours: 1750 }
      ],
      timeDistribution: [
        { timeSlot: '07:00-08:00', checkIns: 5, checkOuts: 0 },
        { timeSlot: '08:00-09:00', checkIns: 15, checkOuts: 0 },
        { timeSlot: '09:00-10:00', checkIns: 5, checkOuts: 0 },
        { timeSlot: '17:00-18:00', checkIns: 0, checkOuts: 12 },
        { timeSlot: '18:00-19:00', checkIns: 0, checkOuts: 8 },
        { timeSlot: '19:00-20:00', checkIns: 0, checkOuts: 5 }
      ]
    }

    const mockInsights: AttendanceInsight[] = [
      {
        type: 'positive',
        title: '出勤率持续改善',
        description: '本月平均出勤率比上月提升了1.2%，达到87.5%',
        impact: 'high'
      },
      {
        type: 'negative',
        title: '迟到现象需要关注',
        description: '本周有12次迟到记录，主要集中在周一和周二',
        impact: 'medium'
      },
      {
        type: 'neutral',
        title: '加班时间合理',
        description: '本月总加班时间45小时，平均每人1.8小时，在合理范围内',
        impact: 'low'
      },
      {
        type: 'positive',
        title: '教学部表现优秀',
        description: '教学部平均出勤率89.2%，在所有部门中排名第一',
        impact: 'high'
      }
    ]

    setAnalytics(mockAnalytics)
    setInsights(mockInsights)
  }, [])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'neutral':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      case 'neutral':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImpactText = (impact: string) => {
    switch (impact) {
      case 'high':
        return '高影响'
      case 'medium':
        return '中影响'
      case 'low':
        return '低影响'
      default:
        return '未知'
    }
  }

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">平均出勤率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.averageAttendanceRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                比上月 +1.2%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">迟到次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {analytics.lateArrivals}
              </div>
              <p className="text-xs text-muted-foreground">
                本周总计
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">加班时间</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.overtimeHours}h
              </div>
              <p className="text-xs text-muted-foreground">
                本月总计
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">缺勤天数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analytics.absentDays}
              </div>
              <p className="text-xs text-muted-foreground">
                本月总计
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要分析区域 */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="departments">部门对比</TabsTrigger>
          <TabsTrigger value="insights">智能洞察</TabsTrigger>
        </TabsList>

        {/* 总览 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 表现最佳员工 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  表现最佳员工
                </CardTitle>
                <CardDescription>出勤率最高的员工</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{performer.name}</div>
                          <div className="text-sm text-gray-500">{performer.department}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {performer.attendanceRate}%
                        </div>
                        <div className="text-xs text-gray-500">出勤率</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 部门表现 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  部门表现对比
                </CardTitle>
                <CardDescription>各部门出勤率对比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.departmentStats.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{dept.department}</span>
                        <span className="text-sm text-gray-500">
                          {dept.totalEmployees} 人
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${dept.attendanceRate}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm font-medium text-blue-600">
                        {dept.attendanceRate}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 时间分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                上下班时间分布
              </CardTitle>
              <CardDescription>员工上下班时间统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">签到时间分布</h4>
                  <div className="space-y-2">
                    {analytics?.timeDistribution.filter(t => t.checkIns > 0).map((time, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{time.timeSlot}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(time.checkIns / 20) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{time.checkIns}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">签退时间分布</h4>
                  <div className="space-y-2">
                    {analytics?.timeDistribution.filter(t => t.checkOuts > 0).map((time, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{time.timeSlot}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(time.checkOuts / 20) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{time.checkOuts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 趋势分析 */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                出勤趋势分析
              </CardTitle>
              <CardDescription>过去几个月的出勤率变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">出勤率趋势</h4>
                    <div className="space-y-2">
                      {analytics?.monthlyTrend.map((month, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{month.month}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${month.attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {month.attendanceRate}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">总工时趋势</h4>
                    <div className="space-y-2">
                      {analytics?.monthlyTrend.map((month, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{month.month}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(month.totalHours / 2000) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {month.totalHours}h
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 部门对比 */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                部门详细对比
              </CardTitle>
              <CardDescription>各部门详细出勤数据对比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">部门</th>
                      <th className="text-left py-3 px-4">员工数</th>
                      <th className="text-left py-3 px-4">出勤率</th>
                      <th className="text-left py-3 px-4">平均工时</th>
                      <th className="text-left py-3 px-4">迟到次数</th>
                      <th className="text-left py-3 px-4">排名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.departmentStats
                      .sort((a, b) => b.attendanceRate - a.attendanceRate)
                      .map((dept, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{dept.department}</td>
                        <td className="py-3 px-4">{dept.totalEmployees}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${dept.attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className="font-medium">{dept.attendanceRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">8.2h</td>
                        <td className="py-3 px-4">
                          <span className="text-yellow-600 font-medium">
                            {Math.floor(Math.random() * 5) + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                            #{index + 1}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 智能洞察 */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                AI 智能洞察
              </CardTitle>
              <CardDescription>基于数据分析的智能建议和洞察</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium">{insight.title}</h3>
                          <Badge className={getImpactColor(insight.impact)}>
                            {getImpactText(insight.impact)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
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
