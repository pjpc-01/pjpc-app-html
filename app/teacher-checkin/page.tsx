"use client"

import { useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import TeacherAttendanceSystem from "../components/attendance/TeacherAttendanceSystem"

export default function TeacherCheckinPage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')
  const teacherId = searchParams.get('teacherId')

  return (
    <PageLayout
      title="教师考勤管理"
      description="管理所有教师的考勤记录、统计分析"
      backUrl="/"
      userRole="teacher"
      status="系统正常"
      background="from-blue-50 to-indigo-100"
    >
      <TeacherAttendanceSystem 
        centerId={centerId || undefined}
        teacherId={teacherId || undefined}
      />
    </PageLayout>
  )
}
