"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import PageLayout from "@/components/layouts/PageLayout"
import FinanceOverview from "@/app/components/finance/FinanceOverview"
import FeeManagement from "@/app/components/finance/FeeManagement"
import ExpenseManagement from "@/app/components/finance/ExpenseManagement"
import InvoiceManagement from "@/app/components/finance/InvoiceManagement"
import PaymentManagement from "@/app/components/finance/PaymentManagement"
import FinancialReports from "@/app/components/finance/FinancialReports"
import { StudentFeeMatrix } from "@/app/components/finance/student-fee-matrix/StudentFeeMatrix"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DollarSign, FileText, CreditCard, BarChart3, Receipt, ArrowDownCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FinanceManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <PageLayout
      title="财务管理"
      description="统一管理学费、发票、付款和财务报表"
      userRole={userProfile?.role || "admin"}
      status="系统正常"
      background="bg-gray-50"
      actions={
        <Button 
          variant="outline" 
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回仪表板
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">财务管理系统</h1>
          <p className="text-gray-600">统一管理学费收取、发票开具、付款记录和财务报表</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="student-fees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            学生费用分配
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            费用管理
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            发票管理
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            付款管理
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            支出管理
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            财务报表
          </TabsTrigger>
        </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <FinanceOverview />
          </TabsContent>

          <TabsContent value="fees" className="space-y-6">
            <FeeManagement />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <ExpenseManagement />
          </TabsContent>

          <TabsContent value="student-fees" className="space-y-6">
            <StudentFeeMatrix />
          </TabsContent>
          
          <TabsContent value="invoices" className="space-y-6">
            <InvoiceManagement />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <FinancialReports />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
