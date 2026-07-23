"use client"

import PageLayout from "@/components/layouts/PageLayout"
import FeeManagement from "@/app/components/finance/FeeManagement"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceFeesPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t('finance.fee_management')}
      description="管理收费项目"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <FeeManagement />
    </PageLayout>
  )
}
