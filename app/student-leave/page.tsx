"use client"

import PageLayout from "@/components/layouts/PageLayout"
import StudentLeaveManagement from "@/components/students/StudentLeaveManagement"
import { useLanguage } from "@/contexts/language-context"

/**
 * 学生请假页
 * 结构对齐「教师排班」页里的请假管理；录入即生效（默认已批准），
 * 已批准的学生当天不计入考勤缺勤。
 */
export default function StudentLeavePage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t("学生请假")}
      description={t("学生请假记录管理，已批准的学生当天不计入缺勤")}
      backUrl="/"
      userRole="admin"
      status={t("系统正常")}
      background="from-blue-50 to-sky-100"
    >
      <StudentLeaveManagement />
    </PageLayout>
  )
}
