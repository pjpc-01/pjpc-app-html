"use client"

import PageLayout from "@/components/layouts/PageLayout"
import UnifiedAttendanceHub from "@/components/attendance/UnifiedAttendanceHub"
import AttendanceSettingsPanel from "@/components/attendance/AttendanceSettingsPanel"
import { useLanguage } from "@/contexts/language-context"

export default function AttendancePage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t('teacher.attendance_management')}
      description="统一考勤打卡与记录 — 学生与教师"
      backUrl="/"
      userRole="admin"
      background="from-slate-50 to-blue-50"
    >
      <AttendanceSettingsPanel />
      <UnifiedAttendanceHub />
    </PageLayout>
  )
}
