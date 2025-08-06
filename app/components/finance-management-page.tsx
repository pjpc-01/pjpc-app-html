"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentFeeMatrix } from "../../components/features/StudentFeeMatrix"
import FinanceOverview from "./finance/FinanceOverview"
import FeeManagement from "./finance/FeeManagement"
import InvoiceManagement from "./finance/InvoiceManagement"
import PaymentManagement from "./finance/PaymentManagement"
import ReminderManagement from "./finance/ReminderManagement"
import FinancialReports from "./finance/FinancialReports"

export default function FinanceManagement() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">财务管理系统</h2>
          <p className="text-gray-600">学费管理、缴费记录、收费提醒和财务报表</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">财务概览</TabsTrigger>
          <TabsTrigger value="fee-items">收费项目</TabsTrigger>
          <TabsTrigger value="student-fees">学生费用分配</TabsTrigger>
          <TabsTrigger value="invoices">发票管理</TabsTrigger>
          <TabsTrigger value="payments">缴费管理</TabsTrigger>
          <TabsTrigger value="reminders">收费提醒</TabsTrigger>
          <TabsTrigger value="reports">财务报表</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinanceOverview />
        </TabsContent>

        <TabsContent value="fee-items">
          <FeeManagement />
        </TabsContent>

        <TabsContent value="student-fees">
          <StudentFeeMatrix />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentManagement />
        </TabsContent>

        <TabsContent value="reminders">
          <ReminderManagement />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  )
} 