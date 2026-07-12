"use client"

import PageLayout from "@/components/layouts/PageLayout"
import BankReconciliation from "@/app/components/finance/BankReconciliation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FinanceBankPage() {
  return (
    <PageLayout
      title="银行对账"
      description="管理银行账户、导入流水、自动对账"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <BankReconciliation />
    </PageLayout>
  )
}
