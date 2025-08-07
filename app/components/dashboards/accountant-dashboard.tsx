"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import FinanceManagement from "../finance/finance-management-page"
import {
  DollarSign,
  Calculator,
  Receipt,
  TrendingUp,
  FileText,
  BarChart3,
  Calendar,
  Users,
  CreditCard,
  Banknote,
} from "lucide-react"

interface AccountantDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function AccountantDashboard({ activeTab, setActiveTab }: AccountantDashboardProps) {
  const [stats] = useState({
    totalRevenue: 156000,
    monthlyRevenue: 45600,
    pendingPayments: 8,
    overduePayments: 3,
    totalStudents: 89,
    totalParents: 67,
    thisMonthIncome: 45600,
    lastMonthIncome: 42300,
  })

  const recentTransactions = [
    { time: "10:30", action: "学费缴纳", user: "张家长", amount: 2000, type: "income" },
    { time: "09:45", action: "退款处理", user: "李家长", amount: -500, type: "refund" },
    { time: "09:20", action: "月费收取", user: "王家长", amount: 1500, type: "income" },
    { time: "08:50", action: "杂费缴纳", user: "赵家长", amount: 300, type: "income" },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Key Financial Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">本月收入</p>
                      <p className="text-2xl font-bold">RM {stats.monthlyRevenue.toLocaleString()}</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +7.8% 较上月
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">待处理付款</p>
                      <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                      <p className="text-xs text-orange-600 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        需要处理
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">逾期付款</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overduePayments}</p>
                      <p className="text-xs text-red-600 flex items-center mt-1">
                        <FileText className="h-3 w-3 mr-1" />
                        需要催收
                      </p>
                    </div>
                    <Receipt className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">总学生数</p>
                      <p className="text-2xl font-bold">{stats.totalStudents}</p>
                      <p className="text-xs text-blue-600 flex items-center mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        活跃账户
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary and Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    财务概览
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">总收入</span>
                    <span className="font-medium text-green-600">RM {stats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">本月收入</span>
                    <span className="font-medium">RM {stats.thisMonthIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">上月收入</span>
                    <span className="font-medium">RM {stats.lastMonthIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">注册家长</span>
                    <span className="font-medium">{stats.totalParents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">待处理付款</span>
                    <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                      {stats.pendingPayments}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    最近交易
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="text-xs text-gray-500 w-12">{transaction.time}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{transaction.action}</div>
                          <div className="text-xs text-gray-500">{transaction.user}</div>
                        </div>
                        <div className={`font-medium ${
                          transaction.type === "income" ? "text-green-600" : "text-red-600"
                        }`}>
                          RM {transaction.amount.toLocaleString()}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            transaction.type === "income"
                              ? "border-green-200 text-green-700"
                              : "border-red-200 text-red-700"
                          }
                        >
                          {transaction.type === "income" ? "收入" : "退款"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-green-50"
                    onClick={() => setActiveTab("finance")}
                  >
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span className="text-sm">财务管理</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-blue-50"
                    onClick={() => setActiveTab("reports")}
                  >
                    <FileText className="h-6 w-6 text-blue-600" />
                    <span className="text-sm">财务报表</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-purple-50"
                    onClick={() => setActiveTab("billing")}
                  >
                    <Receipt className="h-6 w-6 text-purple-600" />
                    <span className="text-sm">账单管理</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col gap-2 bg-transparent hover:bg-orange-50"
                    onClick={() => setActiveTab("analytics")}
                  >
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                    <span className="text-sm">财务分析</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "finance":
        return <FinanceManagement />

      case "reports":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  财务报表
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">月度报表</h3>
                      <p className="text-sm text-gray-600 mb-3">生成月度财务报告</p>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        本月数据
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                    <CardContent className="p-6 text-center">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">年度报表</h3>
                      <p className="text-sm text-gray-600 mb-3">年度财务汇总报告</p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        2024年度
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                      <h3 className="font-semibold mb-2">趋势分析</h3>
                      <p className="text-sm text-gray-600 mb-3">收入趋势分析报告</p>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        数据分析
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "billing":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  账单管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                    <CardContent className="p-6 text-center">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">待处理付款</h3>
                      <p className="text-sm text-gray-600 mb-3">处理待确认的付款</p>
                      <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                        {stats.pendingPayments} 待处理
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-red-600" />
                      <h3 className="font-semibold mb-2">逾期催收</h3>
                      <p className="text-sm text-gray-600 mb-3">处理逾期付款催收</p>
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        {stats.overduePayments} 逾期
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                    <CardContent className="p-6 text-center">
                      <Banknote className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">退款处理</h3>
                      <p className="text-sm text-gray-600 mb-3">处理退款申请</p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        退款管理
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "analytics":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  财务分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">收入分析</h3>
                      <p className="text-sm text-gray-600 mb-3">收入趋势和预测</p>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        增长分析
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">客户分析</h3>
                      <p className="text-sm text-gray-600 mb-3">客户付费行为分析</p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        行为分析
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200">
                    <CardContent className="p-6 text-center">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                      <h3 className="font-semibold mb-2">成本分析</h3>
                      <p className="text-sm text-gray-600 mb-3">运营成本分析</p>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        成本控制
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return <div className="text-center py-12 text-gray-500">请选择一个功能模块</div>
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            财务
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            报表
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4" />
            账单
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
} 