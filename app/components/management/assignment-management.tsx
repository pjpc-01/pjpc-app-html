"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useAssignments, useAssignmentRecords, useAssignmentStats, getGradesFromRecords } from "@/hooks/useAssignments"
import { useCurrentTeacher } from "@/hooks/useCurrentTeacher"
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
  const { user } = useAuth()
  const { teacher, loading: teacherLoading, error: teacherError } = useCurrentTeacher()
  const { assignments, loading: assignmentsLoading, createAssignment } = useAssignments(teacher?.id)
  const { records, loading: recordsLoading, createOrUpdateRecord } = useAssignmentRecords(undefined, teacher?.id)
  const { stats, loading: statsLoading } = useAssignmentStats(teacher?.id)
  
  // 调试信息
  console.log('AssignmentManagement Debug:', {
    user: user ? { id: user.id, email: user.email } : null,
    teacher: teacher ? { id: teacher.id, name: teacher.name, email: teacher.email } : null,
    teacherLoading,
    teacherError
  })
  
  // 从记录中提取成绩信息
  const grades = getGradesFromRecords(records)

  // 新作业表单状态
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subject: '',
    class_id: '',
    due_date: '',
    max_score: 100
  })

  // 批改状态
  const [gradingData, setGradingData] = useState({
    score: '',
    feedback: ''
  })

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)

  // 处理创建作业
  const handleCreateAssignment = async () => {
    // 验证必需字段
    if (!newAssignment.title.trim()) {
      alert('请输入作业标题')
      return
    }
    
    if (!newAssignment.subject.trim()) {
      alert('请输入科目')
      return
    }
    
    if (!teacher?.id) {
      alert('无法获取教师信息，请刷新页面重试')
      return
    }
    
    const assignmentData = {
      ...newAssignment,
      teacher_id: teacher.id,
      max_score: parseInt(newAssignment.max_score.toString())
    }
    
    console.log('创建作业数据:', assignmentData)
    
    try {
      await createAssignment(assignmentData)
      
      // 重置表单
      setNewAssignment({
        title: '',
        description: '',
        subject: '',
        class_id: '',
        due_date: '',
        max_score: 100
      })
      
      alert('作业创建成功！')
    } catch (error) {
      console.error('创建作业失败:', error)
      alert('创建作业失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 处理批改作业
  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !gradingData.score) {
      alert('请选择作业并输入分数')
      return
    }

    try {
      await createOrUpdateRecord({
        assignment_id: selectedSubmission.assignment_id,
        student_id: selectedSubmission.student_id,
        content: selectedSubmission.content || '',
        score: parseFloat(gradingData.score),
        max_score: 100,
        feedback: gradingData.feedback,
        graded_by: teacher?.id || undefined,
        status: 'graded'
      })
      
      // 重置批改数据
      setGradingData({ score: '', feedback: '' })
      setSelectedSubmission(null)
      
      alert('批改完成！')
    } catch (error) {
      alert('批改失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

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

  // 如果教师信息还在加载中，显示加载状态
  if (teacherLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载教师信息...</p>
          </div>
        </div>
      </div>
    )
  }

  // 如果教师信息加载失败，显示错误信息
  if (teacherError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">无法获取教师信息</p>
            <p className="text-gray-600 text-sm">{teacherError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">作业管理系统</h2>
          <p className="text-gray-600">发布作业、收集提交、在线批改和成绩统计</p>
          {teacher && (
            <p className="text-sm text-gray-500 mt-1">当前教师：{teacher.name}</p>
          )}
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
                <Input 
                  id="title" 
                  className="col-span-3" 
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  科目
                </Label>
                <Select value={newAssignment.subject} onValueChange={(value) => setNewAssignment({...newAssignment, subject: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="数学">数学</SelectItem>
                    <SelectItem value="语文">语文</SelectItem>
                    <SelectItem value="英语">英语</SelectItem>
                    <SelectItem value="科学">科学</SelectItem>
                    <SelectItem value="物理">物理</SelectItem>
                    <SelectItem value="化学">化学</SelectItem>
                    <SelectItem value="生物">生物</SelectItem>
                    <SelectItem value="历史">历史</SelectItem>
                    <SelectItem value="地理">地理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="class" className="text-right">
                  班级
                </Label>
                <Select value={newAssignment.class_id} onValueChange={(value) => setNewAssignment({...newAssignment, class_id: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3a">三年级A班</SelectItem>
                    <SelectItem value="4b">四年级B班</SelectItem>
                    <SelectItem value="5c">五年级C班</SelectItem>
                    <SelectItem value="6a">六年级A班</SelectItem>
                    <SelectItem value="7a">初一A班</SelectItem>
                    <SelectItem value="8a">初二A班</SelectItem>
                    <SelectItem value="9a">初三A班</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  截止日期
                </Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  className="col-span-3" 
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxScore" className="text-right">
                  满分
                </Label>
                <Input 
                  id="maxScore" 
                  type="number" 
                  className="col-span-3" 
                  value={newAssignment.max_score}
                  onChange={(e) => setNewAssignment({...newAssignment, max_score: parseInt(e.target.value) || 100})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  作业描述
                </Label>
                <Textarea 
                  id="description" 
                  className="col-span-3" 
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleCreateAssignment}
                disabled={teacherLoading || !teacher?.id}
              >
                {teacherLoading ? '加载中...' : '发布作业'}
              </Button>
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
          {assignmentsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">加载作业列表中...</div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">还没有发布任何作业</p>
              <p className="text-sm text-gray-500">点击右上角的"发布作业"按钮开始创建</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => {
                // 计算该作业的记录数和平均分
                const assignmentRecords = records.filter(record => record.assignment_id === assignment.id)
                const submittedRecords = assignmentRecords.filter(record => record.status === 'submitted' || record.status === 'graded')
                const gradedRecords = assignmentRecords.filter(record => record.score !== null && record.score !== undefined)
                const avgScore = gradedRecords.length > 0 
                  ? Math.round(gradedRecords.reduce((sum, record) => sum + (record.score || 0), 0) / gradedRecords.length)
                  : 0

                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <CardDescription>
                            {assignment.subject} • {assignment.class_id || '未指定班级'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(assignment.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {assignment.due_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            截止日期：{new Date(assignment.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>提交进度</span>
                            <span>
                              {submittedRecords.length} 份提交
                            </span>
                          </div>
                          <Progress value={submittedRecords.length > 0 ? 100 : 0} />
                        </div>
                        {avgScore > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm">平均分</span>
                            <Badge variant="outline">{avgScore}分</Badge>
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
                )
              })}
            </div>
          )}
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
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.expand?.student_id?.student_name || '未知学生'}</TableCell>
                      <TableCell>{record.expand?.assignment_id?.title || '未知作业'}</TableCell>
                      <TableCell>{record.submitted_at ? new Date(record.submitted_at).toLocaleString() : '未提交'}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.score ? (
                          <Badge variant="default">{record.score}分</Badge>
                        ) : (
                          <span className="text-gray-400">未评分</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {record.status === "pending" && (
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
                {recordsLoading ? (
                  <div className="text-center py-4">
                    <div className="text-gray-600">加载记录列表中...</div>
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">暂无作业记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {records.map((record) => {
                      const isGraded = record.status === 'graded' && record.score !== null
                      
                      return (
                        <div 
                          key={record.id} 
                          className={`border rounded-lg p-4 ${selectedSubmission?.id === record.id ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{record.expand?.student_id?.student_name || '未知学生'}</div>
                              <div className="text-sm text-gray-500">
                                {record.submitted_at ? `提交时间：${new Date(record.submitted_at).toLocaleString()}` : '未提交'}
                              </div>
                            </div>
                            <Badge variant={isGraded ? "default" : record.status === 'submitted' ? "secondary" : "outline"}>
                              {isGraded ? "已批改" : record.status === 'submitted' ? "待批改" : "未提交"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // 这里可以添加查看作业详情的功能
                                alert('查看作业功能待实现')
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              查看作业
                            </Button>
                            {!isGraded && record.status === 'submitted' && (
                              <Button 
                                size="sm"
                                onClick={() => setSelectedSubmission(record)}
                                variant={selectedSubmission?.id === record.id ? "default" : "outline"}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {selectedSubmission?.id === record.id ? "已选择" : "开始批改"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>批改工具</CardTitle>
                <CardDescription>
                  {selectedSubmission ? `正在批改：${selectedSubmission.student_name} 的作业` : '请先选择要批改的作业'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score">分数</Label>
                    <Input 
                      id="score" 
                      type="number" 
                      placeholder="0-100" 
                      className="mt-1" 
                      value={gradingData.score}
                      onChange={(e) => setGradingData({...gradingData, score: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedback">评语反馈</Label>
                    <Textarea 
                      id="feedback" 
                      placeholder="请输入对学生作业的评价和建议..." 
                      className="mt-1" 
                      rows={4}
                      value={gradingData.feedback}
                      onChange={(e) => setGradingData({...gradingData, feedback: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>常用评语</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setGradingData({...gradingData, feedback: '优秀，继续保持！'})}
                      >
                        优秀，继续保持！
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setGradingData({...gradingData, feedback: '基础扎实，表现良好'})}
                      >
                        基础扎实
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setGradingData({...gradingData, feedback: '需要加强练习，继续努力'})}
                      >
                        需要加强练习
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setGradingData({...gradingData, feedback: '注意细节，提高准确性'})}
                      >
                        注意细节
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1" 
                      onClick={handleGradeSubmission}
                      disabled={!selectedSubmission || !gradingData.score}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      提交评分
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setGradingData({ score: '', feedback: '' })
                        setSelectedSubmission(null)
                      }}
                    >
                      重置
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          {statsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">加载统计数据中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总作业数</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAssignments || 0}</div>
                  <p className="text-xs text-muted-foreground">已发布作业</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">提交率</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.submissionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">平均提交率</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均分</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.averageScore || 0}</div>
                  <p className="text-xs text-muted-foreground">全班平均</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">待批改</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats?.totalSubmissions || 0) - (stats?.totalGraded || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">需要处理</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>科目成绩分析</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.subjectStats && Object.keys(stats.subjectStats).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.subjectStats).map(([subject, data]: [string, any]) => (
                      <div key={subject}>
                        <div className="flex justify-between mb-2">
                          <span>{subject}</span>
                          <span>{data.average}分</span>
                        </div>
                        <Progress value={data.average} />
                        <div className="text-xs text-gray-500 mt-1">
                          {data.count} 份作业 • 最高: {data.max}分 • 最低: {data.min}分
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">暂无成绩数据</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>班级排名</CardTitle>
                <CardDescription>按平均分排序</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.classStats && Object.keys(stats.classStats).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(stats.classStats)
                      .sort(([,a], [,b]) => b.average - a.average)
                      .map(([className, data]: [string, any], index) => (
                        <div key={className} className="flex justify-between items-center">
                          <span>{className}</span>
                          <Badge 
                            variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}
                          >
                            {data.average}分
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">暂无班级数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
