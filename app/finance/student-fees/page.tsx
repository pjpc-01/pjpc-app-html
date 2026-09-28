"use client"

import PageLayout from "@/components/layouts/PageLayout"
import { StudentFeeMatrix } from "@/app/components/finance/student-fee-matrix/StudentFeeMatrix"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceStudentFeesPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t("学生费用分配")}
      description={t("管理各学生的收费项目")}
      userRole="admin"
      status={t("系统正常")}
      background="bg-gray-50"
    >
      <StudentFeeMatrix />
    </PageLayout>
  )
}
