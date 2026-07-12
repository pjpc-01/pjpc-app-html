"use client"

import PageLayout from "@/components/layouts/PageLayout"
import ReceiptManagement from "@/app/components/finance/payment-management/ReceiptManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FinanceReceiptsPage() {
  return (
    <PageLayout
      title="收据管理"
      description="管理收据记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <ReceiptManagement />
    </PageLayout>
  )
}
