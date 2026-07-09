"use client"

import PageLayout from "@/components/layouts/PageLayout"
import InvoiceManagement from "@/app/components/finance/invoice-management/InvoiceManagement"

export default function FinanceInvoicesPage() {
  return (
    <PageLayout
      title="发票管理"
      description="管理发票记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <InvoiceManagement />
    </PageLayout>
  )
}
