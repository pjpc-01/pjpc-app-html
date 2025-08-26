"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  FileText,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import FinanceOverview from "../finance/reports-overview/FinanceOverview"
import FeeManagement from "../finance/fee-management/FeeManagement"
import InvoiceManagement from "../finance/invoice-management/InvoiceManagement"
import PaymentManagement from "../finance/payment-management/PaymentManagement"
import ReminderManagement from "../finance/payment-management/ReminderManagement"
import FinancialReports from "../finance/reports-overview/FinancialReports"
import { StudentFeeMatrix } from "../finance/student-fee-matrix/StudentFeeMatrix"
import ReceiptManagement from "../finance/payment-management/ReceiptManagement"

interface FinanceTabProps {
  financialStats: any
  financialLoading: boolean
  setActiveTab: (tab: string) => void
}

export default function FinanceTab({ financialStats, financialLoading, setActiveTab }: FinanceTabProps) {
  const [financeSubTab, setFinanceSubTab] = useState<string>('financial-overview')
  const [financialOverviewSubTab, setFinancialOverviewSubTab] = useState<string>('overview')
  const [studentFeesSubTab, setStudentFeesSubTab] = useState<string>('overview')

  const handleCardClick = (tab: string) => {
    console.log('Finance card clicked, setting financeSubTab to:', tab)
    setFinanceSubTab(tab)
    // Reset financial overview sub-tab when switching to financial overview
    if (tab === "financial-overview") {
      setFinancialOverviewSubTab("overview")
    }
    // Reset student fees sub-tab when switching to student fees
    if (tab === "student-fees") {
      setStudentFeesSubTab("overview")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">财务管理</h2>
        <p className="text-gray-600">全面的财务数据管理和分析</p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <Card className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
           financeSubTab === "financial-overview" 
             ? "border-blue-300 bg-blue-50 shadow-lg" 
             : "hover:border-blue-200"
         }`}>
           <CardContent className="p-6 text-center" onClick={() => handleCardClick("financial-overview")}>
             <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-600" />
             <h3 className="font-semibold mb-2">财务概览</h3>
             <p className="text-sm text-gray-600 mb-3">收入、支出和利润跟踪</p>
             {!financialLoading && (
               <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                 RM {financialStats?.netProfit?.toLocaleString() || 0}
               </Badge>
             )}
           </CardContent>
         </Card>

         <Card className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
           financeSubTab === "student-fees" 
             ? "border-green-300 bg-green-50 shadow-lg" 
             : "hover:border-green-200"
         }`}>
           <CardContent className="p-6 text-center" onClick={() => handleCardClick("student-fees")}>
             <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
             <h3 className="font-semibold mb-2">学生费用分配</h3>
             <p className="text-sm text-gray-600 mb-3">学生费用分配和跟踪</p>
             {!financialLoading && (
               <Badge variant="secondary" className="bg-green-100 text-green-800">
                 学生管理
               </Badge>
             )}
           </CardContent>
         </Card>
      </div>

      {/* Finance Sub-tab Content */}
      {financeSubTab && (
        <div className="mt-8">
          {financeSubTab === "financial-overview" && (
            <div className="space-y-6">
              <div className="flex gap-2 mb-4">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    financialOverviewSubTab === "overview" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFinancialOverviewSubTab("overview")}
                >
                  概览
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    financialOverviewSubTab === "fee-items" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFinancialOverviewSubTab("fee-items")}
                >
                  收费项目
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    financialOverviewSubTab === "reports" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setFinancialOverviewSubTab("reports")}
                >
                  财务报表
                </button>
              </div>
              
              {financialOverviewSubTab === "overview" && (
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
              )}
              
              {financialOverviewSubTab === "fee-items" && <FeeManagement />}
              {financialOverviewSubTab === "reports" && <FinancialReports />}
            </div>
          )}
          
          {financeSubTab === "student-fees" && (
            <div className="space-y-6">
                             <div className="flex gap-2 mb-4">
                                   <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      studentFeesSubTab === "overview" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setStudentFeesSubTab("overview")}
                  >
                    费用分配
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      studentFeesSubTab === "invoices" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setStudentFeesSubTab("invoices")}
                  >
                    发票管理
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      studentFeesSubTab === "payments" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setStudentFeesSubTab("payments")}
                  >
                    支付管理
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      studentFeesSubTab === "reminders" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setStudentFeesSubTab("reminders")}
                  >
                    收费提醒
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      studentFeesSubTab === "receipts" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    onClick={() => setStudentFeesSubTab("receipts")}
                  >
                    收据管理
                  </button>
               </div>
              
              {studentFeesSubTab === "overview" && <StudentFeeMatrix />}
              {studentFeesSubTab === "invoices" && <InvoiceManagement />}
                             {studentFeesSubTab === "receipts" && <ReceiptManagement />}
              {studentFeesSubTab === "payments" && <PaymentManagement />}
              {studentFeesSubTab === "reminders" && <ReminderManagement />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
