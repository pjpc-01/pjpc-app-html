"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentFeeMatrix } from "../student-fee-matrix/StudentFeeMatrix"
import FinanceOverview from "./FinanceOverview"
import FeeManagement from "../fee-management/FeeManagement"
import { InvoiceTab } from "../invoice-management/InvoiceTab"
import PaymentManagement from "../payment-management/PaymentManagement"
import ReminderManagement from "../reminders-management/ReminderManagement"
import FinancialReports from "./FinancialReports"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, TrendingUp, DollarSign, BarChart3 } from "lucide-react"

interface FinanceManagementProps {
  defaultTab?: string
}

export default function FinanceManagement({ defaultTab = "overview" }: FinanceManagementProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [financialLoading, setFinancialLoading] = useState(true)
  const [financialStats, setFinancialStats] = useState({
    cashBalance: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0,
  })

  useEffect(() => {
    console.log('FinanceManagement: defaultTab changed to:', defaultTab)
    setActiveTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    const fetchFinancialStats = async () => {
      setFinancialLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setFinancialStats({
          cashBalance: 12345.67,
          monthlyRevenue: 15000.00,
          monthlyExpenses: 12000.00,
          netProfit: 3000.00,
        })
      } catch (error) {
        console.error("Failed to fetch financial stats:", error)
      } finally {
        setFinancialLoading(false)
      }
    }

    fetchFinancialStats()
    const interval = setInterval(fetchFinancialStats, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  console.log('FinanceManagement: current activeTab:', activeTab)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">财务管理系统</h2>
          <p className="text-gray-600">学费管理、缴费记录、收费提醒和财务报表</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">财务概览</TabsTrigger>
          <TabsTrigger value="financial-tracking">财务跟踪</TabsTrigger>
          <TabsTrigger value="student-fees">学生费用分配</TabsTrigger>
          <TabsTrigger value="invoices">发票管理</TabsTrigger>
          <TabsTrigger value="payments">缴费管理</TabsTrigger>
          <TabsTrigger value="reminders">收费提醒</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinanceOverview />
        </TabsContent>

        <TabsContent value="financial-tracking">
          <div className="space-y-6">
            {/* 关键财务指标 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">现金余额</p>
                      {financialLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-green-600">RM {financialStats?.cashBalance?.toLocaleString() || 0}</p>
                          <p className="text-xs text-green-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">月度收入</p>
                      {financialLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-blue-600">RM {financialStats?.monthlyRevenue?.toLocaleString() || 0}</p>
                          <p className="text-xs text-blue-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">月度支出</p>
                      {financialLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-red-600">RM {financialStats?.monthlyExpenses?.toLocaleString() || 0}</p>
                          <p className="text-xs text-red-600 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">净利润</p>
                      {financialLoading ? (
                        <div className="flex items-center mt-2">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">加载中...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-purple-600">RM {financialStats?.netProfit?.toLocaleString() || 0}</p>
                          <p className="text-xs text-purple-600 flex items-center mt-1">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            实时数据
                          </p>
                        </>
                      )}
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 财务跟踪详情 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">收入分析</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">学费收入</span>
                      <span className="font-medium">RM 12,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">其他收入</span>
                      <span className="font-medium">RM 3,000</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>总收入</span>
                        <span className="text-blue-600">RM 15,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">支出分析</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">人员工资</span>
                      <span className="font-medium">RM 8,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">运营费用</span>
                      <span className="font-medium">RM 4,000</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>总支出</span>
                        <span className="text-red-600">RM 12,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="student-fees">
          <StudentFeeMatrix key="student-fee-matrix-page" />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceTab />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentManagement />
        </TabsContent>

        <TabsContent value="reminders">
          <ReminderManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
} 