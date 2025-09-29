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
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import StatsGrid from "@/components/ui/StatsGrid"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Plus,
  Minus,
  Gift,
  Upload,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CreditCard,
  Calendar,
  Target,
  Zap,
  Crown,
  Medal,
  Activity,
  PieChart,
  LineChart,
  Loader2
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { useTeachers } from '@/hooks/useTeachers'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'
import { StudentPoints, PointTransaction, PointTransactionCreateData } from '@/types/points'
import NFCPointsOperation from '@/app/components/management/nfc-points-operation'

export default function PointsManagement() {
  const { teacher } = useCurrentTeacher()
  const { loading, error, getStudentPoints, getPointsLeaderboard, createPointTransaction } = usePoints()
  const { students, loading: studentsLoading, fetchStudents } = useStudents()
  const { teachers, loading: teachersLoading, fetchTeachers } = useTeachers()

  // 状态管理
  const [leaderboard, setLeaderboard] = useState<StudentPoints[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentPoints, setStudentPoints] = useState<StudentPoints | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [pointsChange, setPointsChange] = useState<string>('')
  const [transactionType, setTransactionType] = useState<'add_points' | 'deduct_points' | 'redeem_gift'>('add_points')
  const [reason, setReason] = useState<string>('')
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [giftName, setGiftName] = useState<string>('')
  const [giftPoints, setGiftPoints] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCenter, setFilterCenter] = useState('all')
  const [filterGrade, setFilterGrade] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [operationMode, setOperationMode] = useState<'manual' | 'nfc'>('nfc')

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

  // 加载学生积分详情
  const loadStudentDetails = async (studentId: string) => {
    try {
      const data = await getStudentPoints(studentId)
      setStudentPoints(data.student_points)
      setTransactions(data.transactions.items || [])
    } catch (error) {
      console.error('加载学生积分详情失败:', error)
    }
  }

  // 获取统计数据
  const getStats = () => {
    const totalStudents = students.length
    const totalPoints = leaderboard.reduce((sum, item) => sum + item.current_points, 0)
    const averagePoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0
    const maxPoints = leaderboard.length > 0 ? leaderboard[0].current_points : 0
    const activeStudents = leaderboard.filter(item => item.current_points > 0).length
    
    return {
      totalStudents,
      totalPoints,
      averagePoints,
      maxPoints,
      activeStudents
    }
  }

  // 处理积分操作
  const handlePointTransaction = async () => {
    if (!selectedStudent || !teacher || !pointsChange || !reason) {
      alert('请填写所有必填字段')
      return
    }

    try {
      const points = transactionType === 'add_points' ? parseInt(pointsChange) : -parseInt(pointsChange)
      
      const transactionData: PointTransactionCreateData = {
        student_id: selectedStudent.id,
        teacher_id: teacher.id,
        points_change: points,
        transaction_type: transactionType,
        reason: reason,
        proof_image: proofImage || undefined,
        gift_name: giftName || undefined,
        gift_points: giftPoints ? parseInt(giftPoints) : undefined
      }

      await createPointTransaction(transactionData)

      // 重置表单
      setSelectedStudent(null)
      setStudentPoints(null)
      setPointsChange('')
      setReason('')
      setProofImage(null)
      setGiftName('')
      setGiftPoints('')
      setDialogOpen(false)

      // 刷新数据
      loadLeaderboard()
      
      alert('积分操作成功！')
    } catch (error) {
      console.error('积分操作失败:', error)
      const errorMessage = error instanceof Error ? error.message : '积分操作失败，请重试'
      alert(`积分操作失败: ${errorMessage}`)
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

  // 过滤学生数据
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCenter = filterCenter === "all" || student.center === filterCenter
    const matchesGrade = filterGrade === "all" || student.standard === filterGrade
    
    return matchesSearch && matchesCenter && matchesGrade
  })

  const stats = getStats()

  // 获取中心列表
  const getCenters = () => {
    return Array.from(new Set(students.map(s => s.center).filter(Boolean)))
  }

  // 获取年级列表
  const getGrades = () => {
    return Array.from(new Set(students.map(s => s.standard).filter(Boolean)))
  }

  const centers = getCenters()
  const grades = getGrades()

  // 统计卡片数据
  const statsCards = [
    {
      title: "总学生数",
      value: stats.totalStudents.toString(),
      icon: Users,
      color: "bg-blue-100",
      trend: `${filteredStudents.length} 名学生`
    },
    {
      title: "平均积分",
      value: stats.averagePoints.toString(),
      icon: BarChart3,
      color: "bg-green-100",
      description: "全校平均"
    },
    {
      title: "最高积分",
      value: stats.maxPoints.toString(),
      icon: Crown,
      color: "bg-yellow-100",
      description: "排行榜第一"
    },
    {
      title: "活跃学生",
      value: stats.activeStudents.toString(),
      icon: Activity,
      color: "bg-purple-100",
      trend: `${Math.round((stats.activeStudents / stats.totalStudents) * 100)}% 参与率`
    },
    {
      title: "总积分",
      value: stats.totalPoints.toString(),
      icon: Trophy,
      color: "bg-pink-100",
      description: "累计发放"
    }
  ]

  const pageActions = (
    <div className="flex gap-3">
      <Button variant="outline" onClick={loadLeaderboard} className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        刷新数据
      </Button>
      <Button variant="outline" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        导出报告
      </Button>
      <div className="flex gap-2">
        <Button
          variant={operationMode === 'nfc' ? 'default' : 'outline'}
          onClick={() => setOperationMode('nfc')}
          className="flex items-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          NFC操作
        </Button>
        <Button
          variant={operationMode === 'manual' ? 'default' : 'outline'}
          onClick={() => setOperationMode('manual')}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          手动操作
        </Button>
      </div>
      {operationMode === 'manual' && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Zap className="h-4 w-4" />
              积分操作
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>积分操作</DialogTitle>
              <DialogDescription>
                为学生进行积分操作，包括加分、扣分和兑换礼物
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* 选择学生 */}
              <div>
                <Label htmlFor="student-select">选择学生</Label>
                <Select onValueChange={(value) => {
                  const student = students.find(s => s.id === value)
                  setSelectedStudent(student)
                  if (student) {
                    loadStudentDetails(student.id)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择学生" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.student_name} ({student.student_id}) - {student.center || '未知中心'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 学生积分信息 */}
              {selectedStudent && studentPoints && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedStudent.student_name}</p>
                        <p className="text-sm text-gray-500">
                          学号: {selectedStudent.student_id} | 班级: {selectedStudent.standard || '未知班级'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {studentPoints.current_points}
                        </p>
                        <p className="text-sm text-gray-500">当前积分</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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

              {/* 礼物信息（兑换礼物时） */}
              {transactionType === 'redeem_gift' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gift-name">礼物名称</Label>
                    <Input
                      id="gift-name"
                      value={giftName}
                      onChange={(e) => setGiftName(e.target.value)}
                      placeholder="请输入礼物名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-points">礼物积分</Label>
                    <Input
                      id="gift-points"
                      type="number"
                      value={giftPoints}
                      onChange={(e) => setGiftPoints(e.target.value)}
                      placeholder="请输入礼物积分"
                    />
                  </div>
                </div>
              )}

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

              {/* 证明照片（兑换礼物时） */}
              {transactionType === 'redeem_gift' && (
                <div>
                  <Label htmlFor="proof-image">证明照片</Label>
                  <div className="mt-2">
                    <Input
                      id="proof-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      兑换礼物时需要上传证明照片
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handlePointTransaction} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    处理中...
                  </>
                ) : (
                  '确认操作'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )

  const tabs = [
    {
      id: 'overview',
      label: '总览',
      icon: PieChart,
      content: (
        <div className="space-y-6">
          {/* 操作模式切换 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                积分操作模式
              </CardTitle>
              <CardDescription>
                选择您偏好的积分操作方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={operationMode === 'nfc' ? 'default' : 'outline'}
                  onClick={() => setOperationMode('nfc')}
                  className="flex items-center gap-2 flex-1 h-20"
                >
                  <CreditCard className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">NFC操作</div>
                    <div className="text-sm opacity-80">通过NFC卡片进行安全操作</div>
                  </div>
                </Button>
                <Button
                  variant={operationMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => setOperationMode('manual')}
                  className="flex items-center gap-2 flex-1 h-20"
                >
                  <Search className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">手动操作</div>
                    <div className="text-sm opacity-80">通过界面直接操作</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NFC操作模式 */}
          {operationMode === 'nfc' && (
            <NFCPointsOperation />
          )}

          {/* 手动操作模式的内容 */}
          {operationMode === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 积分分布图 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    积分分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.slice(0, 5).map((item, index) => {
                      const percentage = stats.maxPoints > 0 ? (item.current_points / stats.maxPoints) * 100 : 0
                      return (
                        <div key={item.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {item.expand?.student_id?.student_name || '未知学生'}
                            </span>
                            <span className="text-sm text-gray-500">{item.current_points} 分</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 最近活动 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    最近活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction: PointTransaction) => (
                      <div key={transaction.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getTransactionTypeIcon(transaction.transaction_type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {transaction.expand?.student_id?.student_name || '未知学生'}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(transaction.created)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                快速操作
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('leaderboard')}
                >
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <span>查看排行榜</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('students')}
                >
                  <Users className="h-6 w-6 text-blue-500" />
                  <span>管理学生</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center gap-2"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-6 w-6 text-green-500" />
                  <span>积分操作</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'leaderboard',
      label: '排行榜',
      icon: Trophy,
      content: (
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
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">暂无积分数据</p>
                <p className="text-gray-400 text-sm">开始为学生添加积分来创建排行榜</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 前三名特殊显示 */}
                {leaderboard.slice(0, 3).map((item, index) => (
                  <div key={item.id} className={`p-4 rounded-lg border-2 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300' :
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300' :
                    'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {item.expand?.student_id?.student_name || '未知学生'}
                          </h3>
                          <p className="text-gray-600">
                            {item.expand?.student_id?.student_id} • {item.expand?.student_id?.standard}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{item.current_points}</p>
                        <p className="text-sm text-gray-500">当前积分</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 其余学生表格显示 */}
                {leaderboard.length > 3 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4">其他学生</h4>
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
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboard.slice(3).map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{index + 4}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.expand?.student_id?.student_name || '未知'}
                            </TableCell>
                            <TableCell>{item.expand?.student_id?.student_id || '未知'}</TableCell>
                            <TableCell>{item.expand?.student_id?.standard || '未知'}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-blue-100 text-blue-700">
                                {item.current_points}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-green-600">{item.total_earned}</TableCell>
                            <TableCell className="text-red-600">{item.total_spent}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(item.student_id)
                                  setDialogOpen(true)
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                操作
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )
    },
    {
      id: 'students',
      label: '学生管理',
      icon: Users,
      content: (
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
            {/* 搜索和过滤 */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索学生姓名或学号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterCenter} onValueChange={setFilterCenter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="选择中心" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有中心</SelectItem>
                  {centers.map((center) => (
                    <SelectItem key={center} value={center || ''}>{center}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有年级</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade || ''}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">没有找到学生</p>
                <p className="text-gray-400 text-sm">尝试调整搜索条件或过滤器</p>
              </div>
            ) : viewMode === 'table' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>学号</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>中心</TableHead>
                    <TableHead>NFC卡号</TableHead>
                    <TableHead>积分状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const studentPoints = leaderboard.find(item => item.student_id === student.id)
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>{student.standard}</TableCell>
                        <TableCell>{student.center}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.cardNumber || '未设置'}</Badge>
                        </TableCell>
                        <TableCell>
                          {studentPoints ? (
                            <Badge variant="default" className="bg-blue-100 text-blue-700">
                              {studentPoints.current_points} 分
                            </Badge>
                          ) : (
                            <Badge variant="secondary">无积分记录</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(student)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              积分操作
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadStudentDetails(student.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              详情
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => {
                  const studentPoints = leaderboard.find(item => item.student_id === student.id)
                  return (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{student.student_name}</h3>
                            <p className="text-sm text-gray-500">{student.student_id}</p>
                          </div>
                          {studentPoints && (
                            <Badge variant="default" className="bg-blue-100 text-blue-700">
                              {studentPoints.current_points} 分
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium">班级:</span> {student.standard}</p>
                          <p><span className="font-medium">中心:</span> {student.center}</p>
                          <p><span className="font-medium">NFC卡:</span> {student.cardNumber || '未设置'}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedStudent(student)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            积分操作
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadStudentDetails(student.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )
    },
    {
      id: 'analytics',
      label: '数据分析',
      icon: LineChart,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 积分趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  积分趋势分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <LineChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">积分趋势图表</p>
                    <p className="text-gray-400 text-sm">即将推出详细的数据分析功能</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 中心分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  中心积分分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {centers.map((center) => {
                    const centerStudents = students.filter(s => s.center === center)
                    const centerPoints = leaderboard.filter(item => 
                      centerStudents.some(s => s.id === item.student_id)
                    )
                    const totalPoints = centerPoints.reduce((sum, item) => sum + item.current_points, 0)
                    const avgPoints = centerStudents.length > 0 ? Math.round(totalPoints / centerStudents.length) : 0
                    
                    return (
                      <div key={center} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{center}</span>
                          <span className="text-sm text-gray-500">{centerStudents.length} 学生</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={avgPoints} max={stats.maxPoints} className="flex-1 h-2" />
                          <span className="text-sm font-semibold">{avgPoints} 分</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 年级分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                年级积分分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grades.map((grade) => {
                  const gradeStudents = students.filter(s => s.standard === grade)
                  const gradePoints = leaderboard.filter(item => 
                    gradeStudents.some(s => s.id === item.student_id)
                  )
                  const totalPoints = gradePoints.reduce((sum, item) => sum + item.current_points, 0)
                  const avgPoints = gradeStudents.length > 0 ? Math.round(totalPoints / gradeStudents.length) : 0
                  const maxPoints = gradePoints.length > 0 ? Math.max(...gradePoints.map(p => p.current_points)) : 0
                  
                  return (
                    <div key={grade} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">{grade}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>学生数:</span>
                          <span className="font-medium">{gradeStudents.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>平均积分:</span>
                          <span className="font-medium text-blue-600">{avgPoints}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>最高积分:</span>
                          <span className="font-medium text-green-600">{maxPoints}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>总积分:</span>
                          <span className="font-medium text-purple-600">{totalPoints}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <PageLayout
      title="积分管理系统"
      description="管理学生积分、排行榜和奖励系统"
      backUrl="/"
      userRole="admin"
      status="系统正常"
      background="from-yellow-50 to-orange-100"
      actions={pageActions}
    >
      {/* 统计卡片 */}
      <StatsGrid stats={statsCards} columns={5} />

      {/* 主要内容 */}
      <TabbedPage
        tabs={tabs}
        defaultTab={activeTab}
        onTabChange={setActiveTab}
      />
    </PageLayout>
  )
}