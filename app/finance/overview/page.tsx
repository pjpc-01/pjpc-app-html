"use client"

import PageLayout from "@/components/layouts/PageLayout"
import FinanceOverview from "@/app/components/finance/FinanceOverview"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FinanceOverviewPage() {
  return (
    <PageLayout
      title="财务概览"
      description="财务数据总览和关键指标"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <FinanceOverview />
    </PageLayout>
  )
}
