"use client"

import PageLayout from "@/components/layouts/PageLayout"
import MonthlyClosing from "@/app/components/finance/MonthlyClosing"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceMonthlyClosingPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t("月度结账")}
      description={t("按月结账并存档；结账后该月数据锁定，改动需先反结账")}
      userRole="admin"
      status={t("系统正常")}
      background="bg-gray-50"
    >
      <MonthlyClosing />
    </PageLayout>
  )
}
