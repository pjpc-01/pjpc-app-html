'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Users, 
  Clock, 
  BarChart3, 
  Settings,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  BookOpen,
  School,
  RefreshCw
} from 'lucide-react'
import TuitionCenterScheduleManagement from '../components/attendance/TuitionCenterScheduleManagement'
import UnifiedAttendanceSystem from '../components/attendance/UnifiedAttendanceSystem'
import { useAttendanceStats } from '@/hooks/useAttendanceStats'

export default function AttendanceManagementPage() {
  const [activeTab, setActiveTab] = useState('schedule')
  const { todayPresent, todayAbsent, weekSchedules, attendanceRate, loading, error, refetch } = useAttendanceStats()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <School className="h-8 w-8 text-blue-600" />
            考勤管理系统
          </h1>
          <p className="text-gray-600 mt-2">员工考勤、排班管理、出勤统计</p>
        </div>
        <Button
          variant="outline"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    todayPresent
                  )}
                </div>
                <div className="text-sm text-gray-500">今日出勤</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    todayAbsent
                  )}
                </div>
                <div className="text-sm text-gray-500">今日缺勤</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    weekSchedules
                  )}
                </div>
                <div className="text-sm text-gray-500">今日排班</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    `${attendanceRate}%`
                  )}
                </div>
                <div className="text-sm text-gray-500">出勤率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要功能标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            排班管理
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            考勤管理
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            统计报表
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            系统设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <TuitionCenterScheduleManagement />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <UnifiedAttendanceSystem userRole="admin" />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                统计报表
              </CardTitle>
              <CardDescription>
                生成各种考勤和排班统计报表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>统计报表功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系统设置
              </CardTitle>
              <CardDescription>
                配置考勤和排班系统参数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>系统设置功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
