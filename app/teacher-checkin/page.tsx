"use client"

import { useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import TeacherMobileCheckin from "@/components/attendance/TeacherMobileCheckin"

export default function TeacherCheckinPage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')
  const teacherId = searchParams.get('teacherId')

  return (
    <PageLayout
      title="教师签到"
      description="手机一键签到/签退"
      backUrl="/"
      userRole="teacher"
      status="系统正常"
      background="from-blue-50 to-indigo-100"
    >
      <TeacherMobileCheckin />
    </PageLayout>
  )
}
