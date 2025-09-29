'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PageLayout from '@/components/layouts/PageLayout'
import UnifiedAttendanceSystem from '../components/systems/unified-attendance-system'

export default function UnifiedAttendancePage() {
  return (
    <PageLayout
      title="统一考勤系统"
      description="NFC/RFID卡片考勤管理、设备监控、打卡记录"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-blue-50 to-purple-50"
    >
      {/* 系统说明卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>系统功能说明</CardTitle>
          <CardDescription>
            统一考勤系统提供完整的NFC/RFID考勤解决方案
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium mb-2">卡片管理</h3>
              <p className="text-sm text-gray-600">管理学生NFC/RFID卡片，支持批量导入导出</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium mb-2">设备监控</h3>
              <p className="text-sm text-gray-600">实时监控读卡器设备状态，确保系统稳定运行</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-medium mb-2">打卡记录</h3>
              <p className="text-sm text-gray-600">查看和管理学生打卡记录，生成考勤报表</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统一考勤系统组件 */}
      <UnifiedAttendanceSystem />
    </PageLayout>
  )
}

