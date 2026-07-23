"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, CreditCard, FileText, TrendingUp, AlertCircle, Loader2, Wallet } from "lucide-react"
import { useFinancialStats } from "@/hooks/useFinancialStats"
import UtilityBillsCard from "./UtilityBillsCard"
import { useLanguage } from "@/contexts/language-context"

export default function FinanceOverview() {
  const { t } = useLanguage()
  const { stats: financialStats, loading: financialLoading, error: financialError } = useFinancialStats()

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {financialError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{financialError}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">{t('teacher.loading')}</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">RM {financialStats.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">本月实时收入</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理支付</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">{t('teacher.loading')}</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{financialStats.pendingPayments}</div>
                <p className="text-xs text-muted-foreground">待处理支付数量</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">逾期支付</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">{t('teacher.loading')}</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{financialStats.overduePayments}</div>
                <p className="text-xs text-muted-foreground">逾期支付数量</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('finance.total_income')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">{t('teacher.loading')}</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">RM {financialStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">累计总收入</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">本月净利润</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">{t('teacher.loading')}</span>
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  RM {financialStats.netProfit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">收入 - 支出</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近交易</CardTitle>
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>加载交易数据...</span>
              </div>
            ) : financialStats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {financialStats.recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{transaction.description}</div>
                      <div className="text-xs text-gray-500">{transaction.studentName}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        transaction.type === 'refund' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'refund' ? '-' : '+'}RM {transaction.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                    </div>
                    <Badge
                      variant={transaction.status === 'completed' ? 'default' : 
                              transaction.status === 'pending' ? 'secondary' : 'destructive'}
                      className="ml-2"
                    >
                      {transaction.status === 'completed' ? '已完成' : 
                       transaction.status === 'pending' ? '处理中' : '失败'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>暂无交易记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>月度收入趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {financialLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>加载趋势数据...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(financialStats.revenueByMonth)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(-6)
                  .map(([month, revenue]) => (
                    <div key={month} className="flex justify-between items-center">
                      <span className="text-sm">{month}</span>
                      <Badge variant="outline">RM {revenue.toLocaleString()}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <UtilityBillsCard />
      </div>
    </div>
  )
}