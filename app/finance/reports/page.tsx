"use client"

import PageLayout from "@/components/layouts/PageLayout"
import FinancialReports from "@/app/components/finance/reports-overview/FinancialReports"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FinanceReportsPage() {
  return (
    <PageLayout
      title="财务报表"
      description="收入支出统计报告"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <FinancialReports />
    </PageLayout>
  )
}
