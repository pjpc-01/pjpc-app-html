"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Calendar, MessageSquare } from "lucide-react"

export default function ParentInteraction() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">家校互动系统</h2>
          <p className="text-gray-600">学习报告推送、家长会预约、请假申请和意见反馈</p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">学习报告</TabsTrigger>
          <TabsTrigger value="meetings">家长会</TabsTrigger>
          <TabsTrigger value="leave">请假管理</TabsTrigger>
          <TabsTrigger value="feedback">意见反馈</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  王小明 - 本周学习报告
                </CardTitle>
                <CardDescription>2024年1月第3周</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>出勤情况</span>
                    <Badge variant="default">5/5天</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>作业完成</span>
                    <Badge variant="default">100%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>课堂表现</span>
                    <Badge variant="default">优秀</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>本周测试</span>
                    <Badge variant="default">数学95分</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>老师评语：</strong>小明这周表现非常好，上课积极发言，作业完成质量高，继续保持！
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  李小红 - 本周学习报告
                </CardTitle>
                <CardDescription>2024年1月第3周</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>出勤情况</span>
                    <Badge variant="default">5/5天</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>作业完成</span>
                    <Badge variant="secondary">80%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>课堂表现</span>
                    <Badge variant="default">良好</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>本周测试</span>
                    <Badge variant="secondary">语文82分</Badge>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>老师评语：</strong>小红学习态度认真，但需要提高作业完成的及时性，建议家长督促。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                家长会安排
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期时间</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>主题</TableHead>
                    <TableHead>地点</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2024-01-22 14:00</TableCell>
                    <TableCell>三年级A班</TableCell>
                    <TableCell>期中总结与寒假安排</TableCell>
                    <TableCell>学校礼堂</TableCell>
                    <TableCell>
                      <Badge variant="default">已安排</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        预约参加
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2024-01-25 15:30</TableCell>
                    <TableCell>四年级B班</TableCell>
                    <TableCell>学习方法交流</TableCell>
                    <TableCell>教室B201</TableCell>
                    <TableCell>
                      <Badge variant="secondary">待确认</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        预约参加
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>请假申请</CardTitle>
                <CardDescription>为孩子申请请假</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">学生姓名</label>
                    <select className="w-full mt-1 p-2 border rounded">
                      <option>王小明</option>
                      <option>李小红</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">请假类型</label>
                    <select className="w-full mt-1 p-2 border rounded">
                      <option>病假</option>
                      <option>事假</option>
                      <option>其他</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">开始日期</label>
                      <input type="date" className="w-full mt-1 p-2 border rounded" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">结束日期</label>
                      <input type="date" className="w-full mt-1 p-2 border rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">请假原因</label>
                    <textarea
                      className="w-full mt-1 p-2 border rounded"
                      rows={3}
                      placeholder="请详细说明请假原因..."
                    ></textarea>
                  </div>
                  <Button className="w-full">提交申请</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>请假记录</CardTitle>
                <CardDescription>历史请假申请记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">王小明 - 病假</div>
                        <div className="text-sm text-gray-500">2024-01-10 至 2024-01-12</div>
                      </div>
                      <Badge variant="default">已批准</Badge>
                    </div>
                    <p className="text-sm text-gray-600">感冒发烧，需要在家休息</p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">李小红 - 事假</div>
                        <div className="text-sm text-gray-500">2024-01-08 至 2024-01-08</div>
                      </div>
                      <Badge variant="secondary">审核中</Badge>
                    </div>
                    <p className="text-sm text-gray-600">家庭聚会，需要请假一天</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  意见反馈
                </CardTitle>
                <CardDescription>向学校提出建议和意见</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">反馈类型</label>
                    <select className="w-full mt-1 p-2 border rounded">
                      <option>教学建议</option>
                      <option>设施改善</option>
                      <option>服务投诉</option>
                      <option>其他建议</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">反馈标题</label>
                    <input type="text" className="w-full mt-1 p-2 border rounded" placeholder="请输入反馈标题" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">详细内容</label>
                    <textarea
                      className="w-full mt-1 p-2 border rounded"
                      rows={4}
                      placeholder="请详细描述您的意见或建议..."
                    ></textarea>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="anonymous" />
                    <label htmlFor="anonymous" className="text-sm">
                      匿名反馈
                    </label>
                  </div>
                  <Button className="w-full">提交反馈</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>反馈记录</CardTitle>
                <CardDescription>您的反馈处理情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">关于课后作业量的建议</div>
                        <div className="text-sm text-gray-500">2024-01-12 10:30</div>
                      </div>
                      <Badge variant="default">已处理</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">希望能适当减少作业量，让孩子有更多时间进行课外活动。</p>
                    <div className="bg-blue-50 p-2 rounded text-sm">
                      <strong>学校回复：</strong>感谢您的建议，我们会与任课老师沟通，合理安排作业量。
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">食堂菜品改善建议</div>
                        <div className="text-sm text-gray-500">2024-01-10 14:20</div>
                      </div>
                      <Badge variant="secondary">处理中</Badge>
                    </div>
                    <p className="text-sm text-gray-600">建议增加一些营养搭配更均衡的菜品选择。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
