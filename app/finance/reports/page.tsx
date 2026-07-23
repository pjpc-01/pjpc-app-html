"use client"

import PageLayout from "@/components/layouts/PageLayout"
import FinancialReports from "@/app/components/finance/reports-overview/FinancialReports"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceReportsPage() {
  const { t } = useLanguage()
  return (
    <PageLayout
      title={t('dashboard.financial_report')}
      description="收入支出统计报告"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />{t('inventory.back')}</Button>}
    >
      <FinancialReports />
    </PageLayout>
  )
}
