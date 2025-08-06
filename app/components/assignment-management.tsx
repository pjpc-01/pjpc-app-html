"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { FileText, Plus, Edit, Eye, CheckCircle, Clock, AlertCircle, BarChart3 } from "lucide-react"

export default function AssignmentManagement() {
  const [assignments, setAssignments] = useState([
    {
      id: 1,
      title: "数学练习册第3章",
      subject: "数学",
      class: "三年级A班",
      dueDate: "2024-01-20",
      submitted: 25,
      total: 28,
      status: "active",
      avgScore: 85,
    },
    {
      id: 2,
      title: "语文作文：我的家乡",
      subject: "语文",
      class: "四年级B班",
      dueDate: "2024-01-18",
      submitted: 30,
      total: 32,
      status: "grading",
      avgScore: 78,
    },
    {
      id: 3,
      title: "英语单词背诵",
      subject: "英语",
      class: "五年级C班",
      dueDate: "2024-01-22",
      submitted: 15,
      total: 29,
      status: "active",
      avgScore: 0,
    },
  ])

  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      studentName: "王小明",
      assignment: "数学练习册第3章",
      submitTime: "2024-01-15 16:30",
      status: "graded",
      score: 92,
      feedback: "计算准确，步骤清晰，继续保持！",
    },
    {
      id: 2,
      studentName: "李小红",
      assignment: "语文作文：我的家乡",
      submitTime: "2024-01-16 14:20",
      status: "pending",
      score: null,
      feedback: "",
    },
    {
      id: 3,
      studentName: "张小华",
      assignment: "数学练习册第3章",
      submitTime: "2024-01-17 18:45",
      status: "graded",
      score: 78,
      feedback: "基础掌握良好，但需要注意计算细节。",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">进行中</Badge>
      case "grading":
        return <Badge variant="secondary">批改中</Badge>
      case "completed":
        return <Badge variant="outline">已完成</Badge>
      case "graded":
        return <Badge variant="default">已批改</Badge>
      case "pending":
        return <Badge variant="secondary">待批改</Badge>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">作业管理系统</h2>
          <p className="text-gray-600">发布作业、收集提交、在线批改和成绩统计</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              发布作业
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>发布新作业</DialogTitle>
              <DialogDescription>创建新的作业任务</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  作业标题
                </Label>
                <Input id="title" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  科目
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">数学</SelectItem>
                    <SelectItem value="chinese">语文</SelectItem>
                    <SelectItem value="english">英语</SelectItem>
                    <SelectItem value="science">科学</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  班级
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3a">三年级A班</SelectItem>
                    <SelectItem value="4b">四年级B班</SelectItem>
                    <SelectItem value="5c">五年级C班</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  截止日期
                </Label>
                <Input id="dueDate" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  作业描述
                </Label>
                <Textarea id="description" className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>发布作业</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assignments">作业列表</TabsTrigger>
          <TabsTrigger value="submissions">提交管理</TabsTrigger>
          <TabsTrigger value="grading">在线批改</TabsTrigger>
          <TabsTrigger value="statistics">成绩统计</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription>
                        {assignment.subject} • {assignment.class}
                      </CardDescription>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      截止日期：{assignment.dueDate}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>提交进度</span>
                        <span>
                          {assignment.submitted}/{assignment.total}
                        </span>
                      </div>
                      <Progress value={(assignment.submitted / assignment.total) * 100} />
                    </div>
                    {assignment.avgScore > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">平均分</span>
                        <Badge variant="outline">{assignment.avgScore}分</Badge>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                作业提交管理
              </CardTitle>
              <CardDescription>查看和管理学生作业提交情况</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>作业标题</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>分数</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.studentName}</TableCell>
                      <TableCell>{submission.assignment}</TableCell>
                      <TableCell>{submission.submitTime}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>
                        {submission.score ? (
                          <Badge variant="default">{submission.score}分</Badge>
                        ) : (
                          <span className="text-gray-400">未评分</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {submission.status === "pending" && (
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
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

        <TabsContent value="grading" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>待批改作业</CardTitle>
                <CardDescription>需要评分和反馈的作业</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">李小红 - 语文作文</div>
                        <div className="text-sm text-gray-500">提交时间：2024-01-16 14:20</div>
                      </div>
                      <Badge variant="secondary">待批改</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        查看作业
                      </Button>
                      <Button size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        开始批改
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">陈小军 - 数学练习</div>
                        <div className="text-sm text-gray-500">提交时间：2024-01-17 09:15</div>
                      </div>
                      <Badge variant="secondary">待批改</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        查看作业
                      </Button>
                      <Button size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        开始批改
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>批改工具</CardTitle>
                <CardDescription>快速批改和评分</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score">分数</Label>
                    <Input id="score" type="number" placeholder="0-100" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="feedback">评语反馈</Label>
                    <Textarea id="feedback" placeholder="请输入对学生作业的评价和建议..." className="mt-1" rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>常用评语</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        优秀，继续保持！
                      </Button>
                      <Button variant="outline" size="sm">
                        基础扎实
                      </Button>
                      <Button variant="outline" size="sm">
                        需要加强练习
                      </Button>
                      <Button variant="outline" size="sm">
                        注意细节
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      提交评分
                    </Button>
                    <Button variant="outline">保存草稿</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总作业数</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">本月发布</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">提交率</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">平均提交率</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均分</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82.5</div>
                <p className="text-xs text-muted-foreground">全班平均</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待批改</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">需要处理</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>科目成绩分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>数学</span>
                      <span>85.2分</span>
                    </div>
                    <Progress value={85.2} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>语文</span>
                      <span>78.6分</span>
                    </div>
                    <Progress value={78.6} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>英语</span>
                      <span>82.1分</span>
                    </div>
                    <Progress value={82.1} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>科学</span>
                      <span>79.8分</span>
                    </div>
                    <Progress value={79.8} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>班级排名</CardTitle>
                <CardDescription>按平均分排序</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>四年级B班</span>
                    <Badge variant="default">88.5分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>三年级A班</span>
                    <Badge variant="secondary">85.2分</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>五年级C班</span>
                    <Badge variant="outline">79.8分</Badge>
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
