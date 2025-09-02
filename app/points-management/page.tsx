"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Trophy,
  Plus,
  Minus,
  Gift,
  Upload,
  Star,
  Award,
  TrendingUp,
  Users,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  RefreshCw
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { useTeachers } from '@/hooks/useTeachers'
import { StudentPoints, PointTransaction } from '@/types/points'

export default function PointsManagement() {
  const { loading, error, getStudentPoints, getPointsLeaderboard, createPointTransaction } = usePoints()
  const { students, loading: studentsLoading, fetchStudents } = useStudents()
  const { teachers, loading: teachersLoading, fetchTeachers } = useTeachers()

  // 状态管理
  const [leaderboard, setLeaderboard] = useState<StudentPoints[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedTeacher, setSelectedTeacher] = useState<string>('')
  const [pointsChange, setPointsChange] = useState<string>('')
  const [transactionType, setTransactionType] = useState<'add_points' | 'deduct_points' | 'redeem_gift'>('add_points')
  const [reason, setReason] = useState<string>('')
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [searchTerm, setSearchTerm] = useState('')

  // 加载数据
  useEffect(() => {
    loadLeaderboard()
    fetchStudents()
    fetchTeachers()
  }, [])

  const loadLeaderboard = async () => {
    try {
      const data = await getPointsLeaderboard()
      setLeaderboard(data.items || [])
    } catch (error) {
      console.error('加载积分排行榜失败:', error)
    }
  }

  // 处理积分操作
  const handlePointTransaction = async () => {
    if (!selectedStudent || !selectedTeacher || !pointsChange || !reason) {
      alert('请填写所有必填字段')
      return
    }

    const teacher = teachers.find(t => t.id === selectedTeacher)
    if (!teacher) {
      alert('找不到老师信息')
      return
    }

    try {
      const points = transactionType === 'add_points' ? parseInt(pointsChange) : -parseInt(pointsChange)
      
      await createPointTransaction({
        student_id: selectedStudent,
        teacher_id: selectedTeacher,
        points_change: points,
        transaction_type: transactionType,
        reason: reason,
        proof_image: proofImage || undefined
      })

      // 重置表单
      setSelectedStudent('')
      setSelectedTeacher('')
      setPointsChange('')
      setReason('')
      setProofImage(null)
      setDialogOpen(false)

      // 刷新数据
      loadLeaderboard()
      
      alert('积分操作成功！')
    } catch (error) {
      console.error('积分操作失败:', error)
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'add_points': return <Plus className="h-4 w-4 text-green-500" />
      case 'deduct_points': return <Minus className="h-4 w-4 text-red-500" />
      case 'redeem_gift': return <Gift className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  const getTransactionTypeBadge = (type: string) => {
    const configs = {
      add_points: { label: '加分', variant: 'default' as const },
      deduct_points: { label: '扣分', variant: 'destructive' as const },
      redeem_gift: { label: '兑换礼物', variant: 'secondary' as const }
    }
    const config = configs[type as keyof typeof configs]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredStudents = students.filter(student =>
    student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">积分管理系统</h1>
              <p className="text-gray-600">管理学生积分，激励优秀表现</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadLeaderboard}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新数据
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    积分操作
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>积分操作</DialogTitle>
                    <DialogDescription>
                      为学生添加或扣除积分，需要提供理由
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* 选择学生 */}
                    <div>
                      <Label htmlFor="student">选择学生</Label>
                      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择学生" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.student_name} ({student.student_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 选择老师 */}
                    <div>
                      <Label htmlFor="teacher">操作老师</Label>
                      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择老师" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.teacher_name || teacher.name} ({teacher.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 操作类型 */}
                    <div>
                      <Label htmlFor="operation-type">操作类型</Label>
                      <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择操作类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add_points">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4 text-green-500" />
                              加分
                            </div>
                          </SelectItem>
                          <SelectItem value="deduct_points">
                            <div className="flex items-center gap-2">
                              <Minus className="h-4 w-4 text-red-500" />
                              扣分
                            </div>
                          </SelectItem>
                          <SelectItem value="redeem_gift">
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-blue-500" />
                              兑换礼物
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 积分数量 */}
                    <div>
                      <Label htmlFor="points">积分数量</Label>
                      <Input
                        id="points"
                        type="number"
                        value={pointsChange}
                        onChange={(e) => setPointsChange(e.target.value)}
                        placeholder="请输入积分数量"
                      />
                    </div>

                    {/* 操作理由 */}
                    <div>
                      <Label htmlFor="reason">操作理由</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="请输入操作理由"
                        rows={3}
                      />
                    </div>

                    {/* 证明照片 */}
                    {transactionType === 'redeem_gift' && (
                      <div>
                        <Label htmlFor="proof-image">证明照片</Label>
                        <Input
                          id="proof-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                        />
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button onClick={handlePointTransaction} className="flex-1">
                        确认操作
                      </Button>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">总学生数</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">平均积分</p>
                  <p className="text-2xl font-bold">
                    {leaderboard.length > 0 
                      ? Math.round(leaderboard.reduce((sum, item) => sum + item.current_points, 0) / leaderboard.length)
                      : 0
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">最高积分</p>
                  <p className="text-2xl font-bold">
                    {leaderboard.length > 0 ? leaderboard[0].current_points : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">活跃教师</p>
                  <p className="text-2xl font-bold">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">积分排行榜</TabsTrigger>
            <TabsTrigger value="students">学生管理</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  积分排行榜
                </CardTitle>
                <CardDescription>
                  按当前积分排序的学生排行榜
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无积分数据</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>排名</TableHead>
                        <TableHead>学生姓名</TableHead>
                        <TableHead>学号</TableHead>
                        <TableHead>班级</TableHead>
                        <TableHead>当前积分</TableHead>
                        <TableHead>历史获得</TableHead>
                        <TableHead>历史消费</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {index < 3 && (
                                <Trophy className={`h-4 w-4 ${
                                  index === 0 ? 'text-yellow-500' :
                                  index === 1 ? 'text-gray-400' :
                                  'text-orange-500'
                                }`} />
                              )}
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>{item.expand?.student_id?.student_name || '未知'}</TableCell>
                          <TableCell>{item.expand?.student_id?.student_id || '未知'}</TableCell>
                          <TableCell>{item.expand?.student_id?.standard || '未知'}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-blue-100 text-blue-700">
                              {item.current_points}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-600">{item.total_earned}</TableCell>
                          <TableCell className="text-red-600">{item.total_spent}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  学生积分管理
                </CardTitle>
                <CardDescription>
                  查看和管理所有学生的积分情况
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="搜索学生姓名或学号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">没有找到学生</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>学生姓名</TableHead>
                        <TableHead>学号</TableHead>
                        <TableHead>班级</TableHead>
                        <TableHead>中心</TableHead>
                        <TableHead>NFC卡号</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.student_name}</TableCell>
                          <TableCell>{student.student_id}</TableCell>
                          <TableCell>{student.standard}</TableCell>
                          <TableCell>{student.center}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.cardNumber || '未设置'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student.id)
                                setDialogOpen(true)
                              }}
                            >
                              积分操作
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
