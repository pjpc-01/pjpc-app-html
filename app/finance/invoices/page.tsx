"use client"

import PageLayout from "@/components/layouts/PageLayout"
import InvoiceManagement from "@/app/components/finance/invoice-management/InvoiceManagement"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceInvoicesPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t('finance.invoice_management')}
      description="管理发票记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
    >
      <InvoiceManagement />
    </PageLayout>
  )
}
