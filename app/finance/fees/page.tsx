"use client"

import PageLayout from "@/components/layouts/PageLayout"
import FeeManagement from "@/app/components/finance/FeeManagement"

export default function FinanceFeesPage() {
  return (
    <PageLayout
      title="收费管理"
      description="管理收费项目"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <FeeManagement />
    </PageLayout>
  )
}
