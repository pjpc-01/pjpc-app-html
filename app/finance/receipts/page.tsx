"use client"

import PageLayout from "@/components/layouts/PageLayout"
import ReceiptManagement from "@/app/components/finance/payment-management/ReceiptManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceReceiptsPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t('finance.receipt_management')}
      description="管理收据记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />{t('inventory.back')}</Button>}
    >
      <ReceiptManagement />
    </PageLayout>
  )
}
