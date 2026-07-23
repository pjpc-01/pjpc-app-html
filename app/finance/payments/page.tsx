"use client"

import PageLayout from "@/components/layouts/PageLayout"
import PaymentManagement from "@/app/components/finance/PaymentManagement"
import { useLanguage } from "@/contexts/language-context"

export default function FinancePaymentsPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t('finance.payment_management')}
      description="管理付款记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <PaymentManagement />
    </PageLayout>
  )
}
