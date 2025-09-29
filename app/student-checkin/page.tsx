"use client"

import { useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import StudentAttendanceSystem from "../components/attendance/StudentAttendanceSystem"

export default function StudentCheckinPage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')
  const studentId = searchParams.get('studentId')

  return (
    <PageLayout
      title="学生考勤管理"
      description="管理所有学生的考勤记录、统计分析"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-green-50 to-emerald-100"
    >
      <StudentAttendanceSystem 
        centerId={centerId || undefined}
        studentId={studentId || undefined}
      />
    </PageLayout>
  )
}
