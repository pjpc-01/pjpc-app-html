"use client"

import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useFinancialStats } from '@/hooks/useFinancialStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

export default function TestRealtimePage() {
  const { stats: dashboardStats, loading: dashboardLoading, error: dashboardError } = useDashboardStats()
  const { stats: financialStats, loading: financialLoading, error: financialError } = useFinancialStats()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">实时数据测试页面</h1>
      
      {/* 仪表板统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            仪表板统计
            {dashboardLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dashboardError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">总用户数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
              <div className="text-sm text-muted-foreground">总学生数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{dashboardStats.pendingApprovals}</div>
              <div className="text-sm text-muted-foreground">待审核用户</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{dashboardStats.activeTeachers}</div>
              <div className="text-sm text-muted-foreground">活跃老师</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 财务统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            财务统计
            {financialLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {financialError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{financialError}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">¥{financialStats.monthlyRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">月度收入</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">¥{financialStats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">总收入</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{financialStats.pendingPayments}</div>
              <div className="text-sm text-muted-foreground">待处理支付</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{financialStats.overduePayments}</div>
              <div className="text-sm text-muted-foreground">逾期支付</div>
            </div>
          </div>

          {/* 最近交易 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">最近交易</h3>
            <div className="space-y-2">
              {financialStats.recentTransactions.length > 0 ? (
                financialStats.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{transaction.studentName}</div>
                      <div className="text-sm text-muted-foreground">{transaction.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">¥{transaction.amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{transaction.status}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">暂无交易记录</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 最近活动 */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboardStats.recentActivities.length > 0 ? (
              dashboardStats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground">{activity.user}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">暂无活动记录</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 