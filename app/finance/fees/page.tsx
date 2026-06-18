"use client"

import { useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import FeeManagement from "@/app/components/finance/FeeManagement"
import { StudentFeeMatrix } from "@/app/components/finance/student-fee-matrix/StudentFeeMatrix"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DollarSign, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FinanceFeesPage() {
  const [activeTab, setActiveTab] = useState("fees")

  return (
    <PageLayout
      title="收费管理"
      description="管理收费项目和学生的费用分配"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fees" className="flex items-center gap-1"><DollarSign className="h-4 w-4" />费用管理</TabsTrigger>
          <TabsTrigger value="student-fees" className="flex items-center gap-1"><Users className="h-4 w-4" />学生费用分配</TabsTrigger>
        </TabsList>
        <TabsContent value="fees"><FeeManagement /></TabsContent>
        <TabsContent value="student-fees"><StudentFeeMatrix /></TabsContent>
      </Tabs>
    </PageLayout>
  )
}
