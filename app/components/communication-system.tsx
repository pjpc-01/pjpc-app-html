"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send, Phone, Video, Users, Bell } from "lucide-react"

export default function CommunicationSystem() {
  const [messages] = useState([
    {
      id: 1,
      from: "张老师",
      to: "王妈妈",
      content: "王小明今天表现很好，数学测试得了95分！",
      time: "14:30",
      type: "private",
    },
    {
      id: 2,
      from: "李老师",
      to: "三年级A班群",
      content: "明天的语文课请大家带好课本和练习册",
      time: "16:20",
      type: "group",
    },
    {
      id: 3,
      from: "管理员",
      to: "全体家长",
      content: "下周一学校将举行家长会，请各位家长准时参加",
      time: "09:15",
      type: "announcement",
    },
  ])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">通讯系统</h2>
          <p className="text-gray-600">师生即时通讯、家长群组聊天和公告通知</p>
        </div>
        <Button>
          <MessageCircle className="h-4 w-4 mr-2" />
          新建对话
        </Button>
      </div>

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="messages">消息中心</TabsTrigger>
          <TabsTrigger value="groups">群组管理</TabsTrigger>
          <TabsTrigger value="announcements">公告通知</TabsTrigger>
          <TabsTrigger value="calls">语音视频</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>对话列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{msg.from}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{msg.content}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {msg.type === "private" ? "私聊" : msg.type === "group" ? "群聊" : "公告"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>聊天窗口</CardTitle>
                <CardDescription>与王妈妈的对话</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 h-64 overflow-y-auto border rounded p-4">
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white p-2 rounded-lg max-w-xs">
                      王小明今天表现很好，数学测试得了95分！
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-200 p-2 rounded-lg max-w-xs">太好了！谢谢老师的用心教导</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="输入消息..." className="flex-1" rows={2} />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  三年级A班家长群
                </CardTitle>
                <CardDescription>28位成员</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>群主</span>
                    <span>张老师</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>今日消息</span>
                    <Badge variant="outline">12条</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                    进入群聊
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  四年级B班家长群
                </CardTitle>
                <CardDescription>32位成员</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>群主</span>
                    <span>李老师</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>今日消息</span>
                    <Badge variant="outline">8条</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                    进入群聊
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  公告通知
                </CardTitle>
                <Button>发布公告</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">家长会通知</h3>
                    <Badge variant="default">重要</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    下周一（1月22日）下午2点将在学校礼堂举行家长会，请各位家长准时参加。
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>发布者：管理员</span>
                    <span>2024-01-15 09:15</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">寒假作业安排</h3>
                    <Badge variant="secondary">通知</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">寒假期间请督促孩子完成各科作业，开学后将进行检查。</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>发布者：教务处</span>
                    <span>2024-01-14 16:30</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  语音通话
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Phone className="h-4 w-4 mr-2" />
                    呼叫王妈妈
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Phone className="h-4 w-4 mr-2" />
                    呼叫李妈妈
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  视频通话
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Video className="h-4 w-4 mr-2" />
                    视频通话王妈妈
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Video className="h-4 w-4 mr-2" />
                    发起群视频会议
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
