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
import { Calendar, Clock, BookOpen, Plus, Edit, Eye, Play, Upload } from "lucide-react"

export default function CourseManagement() {
  const [courses, setCourses] = useState([
    {
      id: 1,
      name: "三年级数学",
      teacher: "张老师",
      students: 28,
      schedule: "周一、三、五 14:00-15:30",
      status: "active",
      progress: 65,
      materials: 12,
    },
    {
      id: 2,
      name: "四年级语文",
      teacher: "李老师",
      students: 32,
      schedule: "周二、四 15:00-16:30",
      status: "active",
      progress: 78,
      materials: 18,
    },
    {
      id: 3,
      name: "五年级英语",
      teacher: "王老师",
      students: 29,
      schedule: "周一、三 16:00-17:30",
      status: "active",
      progress: 52,
      materials: 15,
    },
  ])

  const [schedule] = useState([
    {
      time: "14:00-15:30",
      monday: "三年级数学",
      tuesday: "四年级语文",
      wednesday: "三年级数学",
      thursday: "四年级语文",
      friday: "三年级数学",
    },
    { time: "15:00-16:30", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
    { time: "16:00-17:30", monday: "五年级英语", tuesday: "", wednesday: "五年级英语", thursday: "", friday: "" },
    { time: "17:30-19:00", monday: "", tuesday: "", wednesday: "", thursday: "", friday: "" },
  ])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">课程管理系统</h2>
          <p className="text-gray-600">管理课程安排、教材资源和教学内容</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加课程
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新课程</DialogTitle>
              <DialogDescription>创建新的课程安排</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="courseName" className="text-right">
                  课程名称
                </Label>
                <Input id="courseName" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teacher" className="text-right">
                  授课老师
                </Label>
                <Input id="teacher" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="schedule" className="text-right">
                  上课时间
                </Label>
                <Input id="schedule" placeholder="如：周一、三、五 14:00-15:30" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  课程描述
                </Label>
                <Textarea id="description" className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>创建课程</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">课程列表</TabsTrigger>
          <TabsTrigger value="schedule">课程表</TabsTrigger>
          <TabsTrigger value="materials">教材管理</TabsTrigger>
          <TabsTrigger value="content">课程内容</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <CardDescription>授课老师：{course.teacher}</CardDescription>
                    </div>
                    <Badge variant={course.status === "active" ? "default" : "secondary"}>
                      {course.status === "active" ? "进行中" : "已结束"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {course.schedule}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">学生人数</span>
                      <Badge variant="outline">{course.students}人</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">教学进度</span>
                      <span className="text-sm">{course.progress}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">教材数量</span>
                      <Badge variant="outline">{course.materials}个</Badge>
                    </div>
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

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                课程时间表
              </CardTitle>
              <CardDescription>本周课程安排</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>周一</TableHead>
                    <TableHead>周二</TableHead>
                    <TableHead>周三</TableHead>
                    <TableHead>周四</TableHead>
                    <TableHead>周五</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((slot, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{slot.time}</TableCell>
                      <TableCell>{slot.monday && <Badge variant="outline">{slot.monday}</Badge>}</TableCell>
                      <TableCell>{slot.tuesday && <Badge variant="outline">{slot.tuesday}</Badge>}</TableCell>
                      <TableCell>{slot.wednesday && <Badge variant="outline">{slot.wednesday}</Badge>}</TableCell>
                      <TableCell>{slot.thursday && <Badge variant="outline">{slot.thursday}</Badge>}</TableCell>
                      <TableCell>{slot.friday && <Badge variant="outline">{slot.friday}</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    教材管理
                  </CardTitle>
                  <CardDescription>管理课程教材和学习资源</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  上传教材
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">三年级数学教材</CardTitle>
                    <CardDescription>第一学期</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>章节数</span>
                        <Badge variant="outline">12章</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>练习题</span>
                        <Badge variant="outline">156题</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>更新时间</span>
                        <span className="text-gray-500">2024-01-10</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                        <Eye className="h-4 w-4 mr-1" />
                        查看内容
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">四年级语文教材</CardTitle>
                    <CardDescription>第一学期</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>课文数</span>
                        <Badge variant="outline">24篇</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>生字词</span>
                        <Badge variant="outline">320个</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>更新时间</span>
                        <span className="text-gray-500">2024-01-08</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                        <Eye className="h-4 w-4 mr-1" />
                        查看内容
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">五年级英语教材</CardTitle>
                    <CardDescription>第一学期</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>单元数</span>
                        <Badge variant="outline">8单元</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>词汇量</span>
                        <Badge variant="outline">200词</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>更新时间</span>
                        <span className="text-gray-500">2024-01-12</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                        <Eye className="h-4 w-4 mr-1" />
                        查看内容
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>直播课程</CardTitle>
                <CardDescription>实时在线教学</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">三年级数学 - 分数运算</div>
                      <div className="text-sm text-gray-500">今天 14:00-15:30</div>
                    </div>
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      开始直播
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">四年级语文 - 古诗词赏析</div>
                      <div className="text-sm text-gray-500">明天 15:00-16:30</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-1" />
                      预约
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>录播课程</CardTitle>
                <CardDescription>课程回放和复习</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">数学基础 - 加减法运算</div>
                      <div className="text-sm text-gray-500">时长：45分钟</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-1" />
                      播放
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">语文阅读 - 理解技巧</div>
                      <div className="text-sm text-gray-500">时长：38分钟</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-1" />
                      播放
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">英语口语 - 日常对话</div>
                      <div className="text-sm text-gray-500">时长：52分钟</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4 mr-1" />
                      播放
                    </Button>
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
