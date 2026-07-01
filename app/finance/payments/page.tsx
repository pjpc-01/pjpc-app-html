"use client"

import { useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import InvoiceManagement from "@/app/components/finance/invoice-management/InvoiceManagement"
import PaymentManagement from "@/app/components/finance/PaymentManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, CreditCard } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FinancePaymentsPage() {
  const [activeTab, setActiveTab] = useState("invoices")

  return (
    <PageLayout
      title="发票付款"
      description="管理发票和付款记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="flex items-center gap-1"><FileText className="h-4 w-4" />发票管理</TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1"><CreditCard className="h-4 w-4" />付款管理</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices"><InvoiceManagement /></TabsContent>
        <TabsContent value="payments"><PaymentManagement /></TabsContent>
      </Tabs>
    </PageLayout>
  )
}
