"use client"

import PageLayout from "@/components/layouts/PageLayout"
import BankReconciliation from "@/app/components/finance/BankReconciliation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceBankPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t('finance.bank_reconciliation')}
      description="管理银行账户、导入流水、自动对账"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />{t('inventory.back')}</Button>}
    >
      <BankReconciliation />
    </PageLayout>
  )
}
