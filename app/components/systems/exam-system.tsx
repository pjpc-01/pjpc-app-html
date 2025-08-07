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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Plus, Edit, Eye, Clock, Users, BarChart3, FileText, CheckCircle } from "lucide-react"

export default function ExamSystem() {
  const [exams, setExams] = useState([
    {
      id: 1,
      title: "三年级数学期中考试",
      subject: "数学",
      class: "三年级A班",
      date: "2024-01-25",
      duration: 90,
      totalQuestions: 20,
      participants: 28,
      completed: 0,
      status: "scheduled",
    },
    {
      id: 2,
      title: "四年级语文单元测试",
      subject: "语文",
      class: "四年级B班",
      date: "2024-01-20",
      duration: 60,
      totalQuestions: 15,
      participants: 32,
      completed: 32,
      status: "completed",
    },
  ])

  const [questionBank] = useState([
    {
      id: 1,
      subject: "数学",
      grade: "三年级",
      type: "选择题",
      question: "3 + 5 = ?",
      options: ["6", "7", "8", "9"],
      answer: "8",
      difficulty: "easy",
    },
    {
      id: 2,
      subject: "语文",
      grade: "四年级",
      type: "填空题",
      question: "《静夜思》的作者是____",
      answer: "李白",
      difficulty: "medium",
    },
  ])

  const [results] = useState([
    {
      studentName: "王小明",
      exam: "四年级语文单元测试",
      score: 92,
      totalScore: 100,
      completedTime: 45,
      rank: 1,
    },
    {
      studentName: "李小红",
      exam: "四年级语文单元测试",
      score: 88,
      totalScore: 100,
      completedTime: 52,
      rank: 2,
    },
    {
      studentName: "张小华",
      exam: "四年级语文单元测试",
      score: 85,
      totalScore: 100,
      completedTime: 58,
      rank: 3,
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary">已安排</Badge>
      case "ongoing":
        return <Badge variant="default">进行中</Badge>
      case "completed":
        return <Badge variant="outline">已完成</Badge>
      case "graded":
        return <Badge variant="default">已评分</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="default">简单</Badge>
      case "medium":
        return <Badge variant="secondary">中等</Badge>
      case "hard":
        return <Badge variant="destructive">困难</Badge>
      default:
        return <Badge variant="outline">{difficulty}</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">考试测验系统</h2>
          <p className="text-gray-600">在线考试、题库管理、自动评分和成绩分析</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建考试
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新考试</DialogTitle>
              <DialogDescription>设置考试基本信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="examTitle" className="text-right">
                  考试标题
                </Label>
                <Input id="examTitle" className="col-span-3" />
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
                <Label htmlFor="examDate" className="text-right">
                  考试日期
                </Label>
                <Input id="examDate" type="datetime-local" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  考试时长(分钟)
                </Label>
                <Input id="duration" type="number" className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>创建考试</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="exams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="exams">考试管理</TabsTrigger>
          <TabsTrigger value="questions">题库管理</TabsTrigger>
          <TabsTrigger value="results">成绩管理</TabsTrigger>
          <TabsTrigger value="analysis">数据分析</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      <CardDescription>
                        {exam.subject} • {exam.class}
                      </CardDescription>
                    </div>
                    {getStatusBadge(exam.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{exam.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{exam.participants}人</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>考试时长</span>
                      <Badge variant="outline">{exam.duration}分钟</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>题目数量</span>
                      <Badge variant="outline">{exam.totalQuestions}题</Badge>
                    </div>
                    {exam.status === "completed" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>完成进度</span>
                          <span>
                            {exam.completed}/{exam.participants}
                          </span>
                        </div>
                        <Progress value={(exam.completed / exam.participants) * 100} />
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

        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    题库管理
                  </CardTitle>
                  <CardDescription>管理考试题目和答案</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加题目
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>科目</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>题型</TableHead>
                    <TableHead>题目</TableHead>
                    <TableHead>难度</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionBank.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Badge variant="outline">{question.subject}</Badge>
                      </TableCell>
                      <TableCell>{question.grade}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{question.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{question.question}</TableCell>
                      <TableCell>{getDifficultyBadge(question.difficulty)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                考试成绩
              </CardTitle>
              <CardDescription>查看学生考试成绩和排名</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>考试名称</TableHead>
                    <TableHead>得分</TableHead>
                    <TableHead>完成时间</TableHead>
                    <TableHead>排名</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.studentName}</TableCell>
                      <TableCell>{result.exam}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {result.score}/{result.totalScore}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            ({Math.round((result.score / result.totalScore) * 100)}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{result.completedTime}分钟</TableCell>
                      <TableCell>
                        <Badge variant={result.rank <= 3 ? "default" : "outline"}>第{result.rank}名</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总考试数</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">本学期</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">参考人次</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-muted-foreground">累计参考</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均分</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">84.2</div>
                <p className="text-xs text-muted-foreground">全校平均</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">及格率</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.8%</div>
                <p className="text-xs text-muted-foreground">60分以上</p>
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
                      <span>86.5分</span>
                    </div>
                    <Progress value={86.5} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>语文</span>
                      <span>82.1分</span>
                    </div>
                    <Progress value={82.1} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>英语</span>
                      <span>78.9分</span>
                    </div>
                    <Progress value={78.9} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>科学</span>
                      <span>84.3分</span>
                    </div>
                    <Progress value={84.3} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>成绩分布</CardTitle>
                <CardDescription>按分数段统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>90-100分</span>
                    <Badge variant="default">28人 (31%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>80-89分</span>
                    <Badge variant="secondary">35人 (39%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>70-79分</span>
                    <Badge variant="outline">18人 (20%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>60-69分</span>
                    <Badge variant="outline">6人 (7%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>60分以下</span>
                    <Badge variant="destructive">3人 (3%)</Badge>
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
