"use client"

import PageLayout from "@/components/layouts/PageLayout"
import ExpenseManagement from "@/app/components/finance/ExpenseManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FinanceExpensesPage() {
  return (
    <PageLayout
      title="支出管理"
      description="记录中心所有经营支出"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <ExpenseManagement />
    </PageLayout>
  )
}
