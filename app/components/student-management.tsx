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
import { UserPlus, Search, Edit, Eye, Calendar, TrendingUp, Users } from "lucide-react"

export default function StudentManagement() {
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "王小明",
      grade: "三年级",
      class: "A班",
      parent: "王爸爸",
      phone: "138****1234",
      attendance: 95,
      progress: 85,
      status: "active",
    },
    {
      id: 2,
      name: "李小红",
      grade: "四年级",
      class: "B班",
      parent: "李妈妈",
      phone: "139****5678",
      attendance: 98,
      progress: 92,
      status: "active",
    },
    {
      id: 3,
      name: "张小华",
      grade: "三年级",
      class: "A班",
      parent: "张妈妈",
      phone: "137****9012",
      attendance: 88,
      progress: 78,
      status: "active",
    },
  ])

  const [attendanceRecords] = useState([
    { date: "2024-01-15", present: 85, absent: 4, late: 0 },
    { date: "2024-01-14", present: 87, absent: 2, late: 0 },
    { date: "2024-01-13", present: 89, absent: 0, late: 0 },
    { date: "2024-01-12", present: 86, absent: 2, late: 1 },
    { date: "2024-01-11", present: 88, absent: 1, late: 0 },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("all")

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = selectedGrade === "all" || student.grade === selectedGrade
    return matchesSearch && matchesGrade
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">学生管理系统</h2>
          <p className="text-gray-600">管理学生档案、班级分组、出勤记录和学习进度</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              添加学生
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新学生</DialogTitle>
              <DialogDescription>录入新学生的基本信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studentName" className="text-right">
                  姓名
                </Label>
                <Input id="studentName" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-right">
                  年级
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="一年级">一年级</SelectItem>
                    <SelectItem value="二年级">二年级</SelectItem>
                    <SelectItem value="三年级">三年级</SelectItem>
                    <SelectItem value="四年级">四年级</SelectItem>
                    <SelectItem value="五年级">五年级</SelectItem>
                    <SelectItem value="六年级">六年级</SelectItem>
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
                    <SelectItem value="A班">A班</SelectItem>
                    <SelectItem value="B班">B班</SelectItem>
                    <SelectItem value="C班">C班</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parent" className="text-right">
                  家长姓名
                </Label>
                <Input id="parent" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  联系电话
                </Label>
                <Input id="phone" className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>添加学生</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList>
          <TabsTrigger value="students">学生档案</TabsTrigger>
          <TabsTrigger value="classes">班级管理</TabsTrigger>
          <TabsTrigger value="attendance">出勤记录</TabsTrigger>
          <TabsTrigger value="progress">学习进度</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>学生搜索</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索学生姓名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    <SelectItem value="一年级">一年级</SelectItem>
                    <SelectItem value="二年级">二年级</SelectItem>
                    <SelectItem value="三年级">三年级</SelectItem>
                    <SelectItem value="四年级">四年级</SelectItem>
                    <SelectItem value="五年级">五年级</SelectItem>
                    <SelectItem value="六年级">六年级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>学生列表 ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>家长</TableHead>
                    <TableHead>联系电话</TableHead>
                    <TableHead>出勤率</TableHead>
                    <TableHead>学习进度</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell>{student.parent}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={student.attendance} className="w-16" />
                          <span className="text-sm">{student.attendance}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="w-16" />
                          <span className="text-sm">{student.progress}%</span>
                        </div>
                      </TableCell>
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

        <TabsContent value="classes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  三年级A班
                </CardTitle>
                <CardDescription>班主任：张老师</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>学生人数</span>
                    <Badge>28人</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>平均出勤率</span>
                    <Badge variant="outline">94%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>平均成绩</span>
                    <Badge variant="outline">85分</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  四年级B班
                </CardTitle>
                <CardDescription>班主任：李老师</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>学生人数</span>
                    <Badge>32人</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>平均出勤率</span>
                    <Badge variant="outline">96%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>平均成绩</span>
                    <Badge variant="outline">88分</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  五年级C班
                </CardTitle>
                <CardDescription>班主任：王老师</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>学生人数</span>
                    <Badge>29人</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>平均出勤率</span>
                    <Badge variant="outline">92%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>平均成绩</span>
                    <Badge variant="outline">82分</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                出勤统计
              </CardTitle>
              <CardDescription>最近5天的出勤情况</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>出勤人数</TableHead>
                    <TableHead>缺勤人数</TableHead>
                    <TableHead>迟到人数</TableHead>
                    <TableHead>出勤率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record, index) => {
                    const total = record.present + record.absent + record.late
                    const rate = Math.round((record.present / total) * 100)
                    return (
                      <TableRow key={index}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          <Badge variant="default">{record.present}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{record.absent}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.late}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={rate} className="w-16" />
                            <span className="text-sm">{rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  学习进度概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>数学</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>语文</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>英语</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>科学</span>
                      <span>88%</span>
                    </div>
                    <Progress value={88} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学习表现分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>优秀学生</span>
                    <Badge variant="default">23人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>良好学生</span>
                    <Badge variant="secondary">45人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>需要帮助</span>
                    <Badge variant="outline">12人</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>进步显著</span>
                    <Badge variant="default">18人</Badge>
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
