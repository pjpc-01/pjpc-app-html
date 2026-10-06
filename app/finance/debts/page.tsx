"use client"

import PageLayout from "@/components/layouts/PageLayout"
import DebtManagement from "@/app/components/finance/DebtManagement"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceDebtsPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t("债务管理")}
      description={t("登记债务、每月应还、记录还款")}
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <DebtManagement />
    </PageLayout>
  )
}
