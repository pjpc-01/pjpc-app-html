'use client'

import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, UserCheck, GraduationCap } from 'lucide-react'

export default function TestStudentCount() {
  const { stats, loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载学生数据中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          <h2 className="text-xl font-bold">错误</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">学生数据测试页面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总学生数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              实时数据来自所有学生集合
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日出勤</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayAttendance || 0}</div>
            <p className="text-xs text-muted-foreground">
              基于出勤率计算
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              包括所有用户类型
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>数据详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">总学生数</Badge>
                <span className="font-mono">{stats?.totalStudents || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">今日出勤</Badge>
                <span className="font-mono">{stats?.todayAttendance || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">总用户数</Badge>
                <span className="font-mono">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">待审核用户</Badge>
                <span className="font-mono">{stats?.pendingApprovals || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">活跃教师</Badge>
                <span className="font-mono">{stats?.activeTeachers || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">总家长数</Badge>
                <span className="font-mono">{stats?.totalParents || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>预期结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>✅ 总学生数应该显示 <strong>607</strong> (600 + 2 + 2 + 其他集合)</p>
              <p>✅ 今日出勤应该显示 <strong>558</strong> (607 × 92%)</p>
              <p>✅ 数据应该实时更新</p>
              <p>✅ 没有权限错误</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 