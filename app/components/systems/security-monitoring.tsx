"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import StatsGrid from "@/components/ui/StatsGrid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Users } from "lucide-react"

export default function SecurityMonitoring() {
  const pickupRecords = [
    { id: 1, student: "王小明", guardian: "王爸爸", time: "17:30", status: "completed", date: "2024-01-15" },
    { id: 2, student: "李小红", guardian: "李妈妈", time: "18:00", status: "pending", date: "2024-01-15" },
    { id: 3, student: "张小华", guardian: "张妈妈", time: "17:45", status: "completed", date: "2024-01-15" },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">已接走</Badge>
      case "pending":
        return <Badge variant="secondary">等待接送</Badge>
      case "late":
        return <Badge variant="destructive">逾期</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">安全监控系统</h2>
          <p className="text-gray-600">学生接送记录、安全监控提醒和紧急联系功能</p>
        </div>
        <Button variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          紧急联系
        </Button>
      </div>

      <Tabs defaultValue="pickup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pickup">接送记录</TabsTrigger>
          <TabsTrigger value="monitoring">安全监控</TabsTrigger>
          <TabsTrigger value="emergency">紧急联系</TabsTrigger>
          <TabsTrigger value="location">位置服务</TabsTrigger>
        </TabsList>

        <TabsContent value="pickup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今日接送</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85/89</div>
                <p className="text-xs text-muted-foreground">4人等待接送</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">安全状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">正常</div>
                <p className="text-xs text-muted-foreground">系统运行正常</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">紧急事件</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">今日无紧急事件</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>学生接送记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pickupRecords.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{record.student}</div>
                      <div className="text-sm text-gray-500">
                        接送人：{record.guardian} | {record.time}
                      </div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>安全监控提醒</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">门禁系统</div>
                      <div className="text-sm text-gray-500">运行状态正常</div>
                    </div>
                    <Badge variant="default">正常</Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">监控摄像</div>
                      <div className="text-sm text-gray-500">8个摄像头在线</div>
                    </div>
                    <Badge variant="default">正常</Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">消防系统</div>
                      <div className="text-sm text-gray-500">设备检查正常</div>
                    </div>
                    <Badge variant="default">正常</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>紧急联系人</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="destructive" className="w-full">
                    报警电话：110
                  </Button>
                  <Button variant="destructive" className="w-full">
                    火警电话：119
                  </Button>
                  <Button variant="destructive" className="w-full">
                    急救电话：120
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    学校保安：138****1234
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>应急预案</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="p-2 border rounded">
                    <div className="font-medium">火灾应急</div>
                    <div className="text-gray-600">立即疏散学生，拨打119</div>
                  </div>
                  <div className="p-2 border rounded">
                    <div className="font-medium">医疗急救</div>
                    <div className="text-gray-600">联系校医，必要时拨打120</div>
                  </div>
                  <div className="p-2 border rounded">
                    <div className="font-medium">安全事故</div>
                    <div className="text-gray-600">保护现场，立即报告</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>位置定位服务</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-2">学校位置</div>
                  <div className="text-sm text-gray-600">
                    地址：XX市XX区XX街道123号
                    <br />
                    坐标：116.397°E, 39.916°N
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                    查看地图
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-2">安全区域设置</div>
                  <div className="text-sm text-gray-600">
                    已设置500米安全半径
                    <br />
                    学生离开安全区域将自动提醒
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                    设置区域
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
