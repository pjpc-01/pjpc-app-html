"use client"

import PageLayout from "@/components/layouts/PageLayout"
import PaymentManagement from "@/app/components/finance/PaymentManagement"

export default function FinancePaymentsPage() {
  return (
    <PageLayout
      title="付款管理"
      description="管理付款记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <PaymentManagement />
    </PageLayout>
  )
}
