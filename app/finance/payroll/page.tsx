"use client"

import PageLayout from "@/components/layouts/PageLayout"
import TeacherSalaryManagement from "@/components/teacher/TeacherSalaryManagement"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FinancePayrollPage() {
  return (
    <PageLayout
      title="薪资管理"
      description="管理教师薪资结构和发薪记录"
      userRole="admin"
      status="系统正常"
      background="bg-gray-50"
      actions={<Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />返回</Button>}
    >
      <TeacherSalaryManagement />
    </PageLayout>
  )
}
