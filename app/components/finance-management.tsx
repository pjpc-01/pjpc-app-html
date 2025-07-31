"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, CreditCard, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"

export default function FinanceManagement() {
  const payments = [
    { id: 1, student: "王小明", amount: 1200, type: "学费", status: "paid", date: "2024-01-15", method: "支付宝" },
    { id: 2, student: "李小红", amount: 1200, type: "学费", status: "pending", date: "2024-01-10", method: "微信" },
    { id: 3, student: "张小华", amount: 300, type: "餐费", status: "paid", date: "2024-01-12", method: "银行卡" },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">已缴费</Badge>
      case "pending":
        return <Badge variant="secondary">待缴费</Badge>
      case "overdue":
        return <Badge variant="destructive">逾期</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">财务管理系统</h2>
          <p className="text-gray-600">学费管理、缴费记录、收费提醒和财务报表</p>
        </div>
        <Button>
          <DollarSign className="h-4 w-4 mr-2" />
          添加收费项目
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">财务概览</TabsTrigger>
          <TabsTrigger value="payments">缴费管理</TabsTrigger>
          <TabsTrigger value="reminders">收费提醒</TabsTrigger>
          <TabsTrigger value="reports">财务报表</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本月收入</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥45,600</div>
                <p className="text-xs text-muted-foreground">+12% 较上月</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待收款</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥8,400</div>
                <p className="text-xs text-muted-foreground">7笔未缴费</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">缴费率</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.1%</div>
                <p className="text-xs text-muted-foreground">本月缴费率</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">年度收入</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥425,800</div>
                <p className="text-xs text-muted-foreground">累计收入</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>收入构成</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>学费收入</span>
                    <Badge variant="default">¥38,400 (84%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>餐费收入</span>
                    <Badge variant="secondary">¥5,200 (11%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>教材费</span>
                    <Badge variant="outline">¥1,800 (4%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>其他费用</span>
                    <Badge variant="outline">¥200 (1%)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>支付方式统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>微信支付</span>
                    <Badge variant="default">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>支付宝</span>
                    <Badge variant="secondary">32%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>银行转账</span>
                    <Badge variant="outline">18%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>现金</span>
                    <Badge variant="outline">5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                缴费记录
              </CardTitle>
              <CardDescription>学生缴费情况管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>费用类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>缴费状态</TableHead>
                    <TableHead>缴费日期</TableHead>
                    <TableHead>支付方式</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.student}</TableCell>
                      <TableCell>{payment.type}</TableCell>
                      <TableCell>¥{payment.amount}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            查看
                          </Button>
                          {payment.status === "pending" && (
                            <Button variant="ghost" size="sm">
                              催缴
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                收费提醒
              </CardTitle>
              <CardDescription>自动发送缴费提醒通知</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">李小红 - 1月学费</div>
                      <div className="text-sm text-gray-500">应缴金额：¥1,200</div>
                    </div>
                    <Badge variant="destructive">逾期3天</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      发送提醒
                    </Button>
                    <Button size="sm" variant="outline">
                      电话联系
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">陈小军 - 餐费充值</div>
                      <div className="text-sm text-gray-500">应缴金额：¥300</div>
                    </div>
                    <Badge variant="secondary">即将到期</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      发送提醒
                    </Button>
                    <Button size="sm" variant="outline">
                      电话联系
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                财务报表
              </CardTitle>
              <CardDescription>收入支出统计报告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">月度收入报告</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>2024年1月</span>
                      <span>¥45,600</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2023年12月</span>
                      <span>¥42,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2023年11月</span>
                      <span>¥41,200</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">班级收费统计</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>三年级A班</span>
                      <span>¥16,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span>四年级B班</span>
                      <span>¥19,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>五年级C班</span>
                      <span>¥14,400</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
