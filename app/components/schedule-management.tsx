"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Bell, Plus, CheckCircle } from "lucide-react"

export default function ScheduleManagement() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">日程管理系统</h2>
          <p className="text-gray-600">课程日历、重要事件提醒和个人待办事项</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          添加日程
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">课程日历</TabsTrigger>
          <TabsTrigger value="events">重要事件</TabsTrigger>
          <TabsTrigger value="todos">待办事项</TabsTrigger>
          <TabsTrigger value="holidays">节假日</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                本周课程安排
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                <div className="text-center">
                  <div className="font-medium mb-2">周一</div>
                  <div className="space-y-2">
                    <div className="bg-blue-100 p-2 rounded text-xs">
                      <div>14:00-15:30</div>
                      <div>三年级数学</div>
                    </div>
                    <div className="bg-green-100 p-2 rounded text-xs">
                      <div>16:00-17:30</div>
                      <div>五年级英语</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium mb-2">周二</div>
                  <div className="space-y-2">
                    <div className="bg-purple-100 p-2 rounded text-xs">
                      <div>15:00-16:30</div>
                      <div>四年级语文</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium mb-2">周三</div>
                  <div className="space-y-2">
                    <div className="bg-blue-100 p-2 rounded text-xs">
                      <div>14:00-15:30</div>
                      <div>三年级数学</div>
                    </div>
                    <div className="bg-green-100 p-2 rounded text-xs">
                      <div>16:00-17:30</div>
                      <div>五年级英语</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium mb-2">周四</div>
                  <div className="space-y-2">
                    <div className="bg-purple-100 p-2 rounded text-xs">
                      <div>15:00-16:30</div>
                      <div>四年级语文</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium mb-2">周五</div>
                  <div className="space-y-2">
                    <div className="bg-blue-100 p-2 rounded text-xs">
                      <div>14:00-15:30</div>
                      <div>三年级数学</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium mb-2">周六</div>
                  <div className="text-gray-400 text-xs">休息</div>
                </div>
                <div className="text-center">
                  <div className="font-medium mb-2">周日</div>
                  <div className="text-gray-400 text-xs">休息</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                重要事件提醒
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">家长会</div>
                      <div className="text-sm text-gray-500">2024-01-22 14:00</div>
                    </div>
                    <Badge variant="destructive">重要</Badge>
                  </div>
                  <p className="text-sm text-gray-600">三年级A班家长会，讨论期中总结和寒假安排</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">期末考试</div>
                      <div className="text-sm text-gray-500">2024-01-25 09:00</div>
                    </div>
                    <Badge variant="default">考试</Badge>
                  </div>
                  <p className="text-sm text-gray-600">全校期末考试，请提前准备考场和监考安排</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">教师培训</div>
                      <div className="text-sm text-gray-500">2024-01-28 10:00</div>
                    </div>
                    <Badge variant="secondary">培训</Badge>
                  </div>
                  <p className="text-sm text-gray-600">新学期教学方法培训，全体教师参加</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                个人待办事项
              </CardTitle>
              <CardDescription>今日需要完成的任务</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1">
                    <div className="font-medium">批改三年级数学作业</div>
                    <div className="text-sm text-gray-500">截止时间：今天 18:00</div>
                  </div>
                  <Badge variant="destructive">紧急</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1">
                    <div className="font-medium">准备明天的课件</div>
                    <div className="text-sm text-gray-500">截止时间：明天 08:00</div>
                  </div>
                  <Badge variant="secondary">重要</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div className="flex-1 opacity-50">
                    <div className="font-medium line-through">联系王小明家长</div>
                    <div className="text-sm text-gray-500">已完成</div>
                  </div>
                  <Badge variant="outline">已完成</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1">
                    <div className="font-medium">更新学生成绩</div>
                    <div className="text-sm text-gray-500">截止时间：本周五</div>
                  </div>
                  <Badge variant="outline">普通</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>节假日管理</CardTitle>
              <CardDescription>学校节假日和特殊安排</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">寒假</div>
                    <Badge variant="secondary">假期</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>开始时间：2024-01-29</div>
                    <div>结束时间：2024-02-25</div>
                    <div>共计：28天</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">春节</div>
                    <Badge variant="destructive">法定节假日</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>日期：2024-02-10</div>
                    <div>说明：农历新年，学校放假</div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">开学日</div>
                    <Badge variant="default">重要</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>日期：2024-02-26</div>
                    <div>说明：新学期开学，请提前做好准备</div>
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
