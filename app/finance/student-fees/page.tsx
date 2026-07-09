"use client"

import PageLayout from "@/components/layouts/PageLayout"
import { StudentFeeMatrix } from "@/app/components/finance/student-fee-matrix/StudentFeeMatrix"

export default function FinanceStudentFeesPage() {
  return (
    <PageLayout
      title="学生费用分配"
      description="管理各学生的收费项目"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <StudentFeeMatrix />
    </PageLayout>
  )
}
