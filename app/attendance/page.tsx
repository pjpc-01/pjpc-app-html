"use client"

import PageLayout from "@/components/layouts/PageLayout"
import UnifiedAttendanceHub from "@/components/attendance/UnifiedAttendanceHub"

export default function AttendancePage() {
  return (
    <PageLayout
      title="考勤管理"
      description="统一考勤打卡与记录 — 学生与教师"
      backUrl="/"
      userRole="admin"
      background="from-slate-50 to-blue-50"
    >
      <UnifiedAttendanceHub />
    </PageLayout>
  )
}
