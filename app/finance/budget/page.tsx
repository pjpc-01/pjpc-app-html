"use client"

import PageLayout from "@/components/layouts/PageLayout"
import BudgetManagement from "@/app/components/finance/BudgetManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FinanceBudgetPage() {
  return (
    <PageLayout
      title="预算管理"
      description="设置和跟踪月度预算"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <BudgetManagement />
    </PageLayout>
  )
}
