'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  BarChart3, 
  Settings,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react'
import PageLayout from '@/components/layouts/PageLayout'
import TabbedPage from '@/components/layouts/TabbedPage'
import StatsGrid from '@/components/ui/StatsGrid'
import SimpleScheduleManager from '../components/attendance/SimpleScheduleManager'
import ScheduleTemplateManager from '../components/attendance/ScheduleTemplateManager'
import { useAttendanceStats } from '@/hooks/useAttendanceStats'

export default function ScheduleManagementPage() {
  const [activeTab, setActiveTab] = useState('schedule')
  const { todayPresent, todayAbsent, weekSchedules, attendanceRate, loading, error, refetch } = useAttendanceStats()

  const stats = [
    {
      title: "今日出勤",
      value: loading ? "..." : todayPresent,
      icon: UserCheck,
      color: "bg-green-100",
      description: "出勤人数"
    },
    {
      title: "今日缺勤",
      value: loading ? "..." : todayAbsent,
      icon: UserX,
      color: "bg-red-100",
      description: "缺勤人数"
    },
    {
      title: "今日排班",
      value: loading ? "..." : weekSchedules,
      icon: Calendar,
      color: "bg-blue-100",
      description: "排班数量"
    },
    {
      title: "出勤率",
      value: loading ? "..." : `${attendanceRate}%`,
      icon: BarChart3,
      color: "bg-purple-100",
      description: "整体出勤率"
    }
  ]

  const tabs = [
    {
      id: 'schedule',
      label: '排班管理',
      icon: Calendar,
      content: (
        <SimpleScheduleManager 
          onSaveSchedule={async (schedule) => {
            console.log('保存排班:', schedule)
          }}
          onDeleteSchedule={async (id) => {
            console.log('删除排班:', id)
          }}
          onUpdateSchedule={async (id, schedule) => {
            console.log('更新排班:', id, schedule)
          }}
        />
      )
    },
    {
      id: 'templates',
      label: '时间模板',
      icon: Clock,
      content: <ScheduleTemplateManager />
    },
    {
      id: 'reports',
      label: '统计报表',
      icon: BarChart3,
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              统计报表
            </CardTitle>
            <CardDescription>
              生成各种排班统计报表
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>统计报表功能开发中...</p>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'settings',
      label: '系统设置',
      icon: Settings,
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              系统设置
            </CardTitle>
            <CardDescription>
              配置排班系统参数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>系统设置功能开发中...</p>
            </div>
          </CardContent>
        </Card>
      )
    }
  ]

  return (
    <PageLayout
      title="排班管理系统"
      description="员工排班、时间模板、出勤统计"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-blue-50 to-purple-50"
      actions={
        <Button
          variant="outline"
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      }
    >
      {/* 统计卡片 */}
      <StatsGrid stats={stats} columns={4} />

      {/* 主要功能标签页 */}
      <TabbedPage 
        tabs={tabs}
        defaultTab={activeTab}
        onTabChange={setActiveTab}
      />
    </PageLayout>
  )
}
