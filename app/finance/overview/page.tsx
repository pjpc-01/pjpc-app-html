"use client"

import { Suspense } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import FinanceOverview from "@/app/components/finance/FinanceOverview"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceOverviewPage() {
  const { t } = useLanguage()
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">系统加载中...</p>
        </div>
      </div>
    }>
      <PageLayout
        title={t('finance.finance_overview')}
        description="财务数据总览和关键指标"
        userRole="admin"
        status="系统正常"
        background="bg-gray-50"
        actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />{t('inventory.back')}</Button>}
      >
        <FinanceOverview />
      </PageLayout>
    </Suspense>
  )
}
