"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Trophy,
  Star,
  Plus,
  Minus,
  Gift,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Camera,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Award,
  Search,
  Filter
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'
import { StudentPoints, PointTransaction, PointTransactionCreateData } from '@/types/points'
import NFCPointsOperation from './nfc-points-operation'

export default function PointsManagement() {
  const { teacher } = useCurrentTeacher()
  const { students } = useStudents()
  const { 
    loading, 
    error, 
    getStudentPoints, 
    getPointsLeaderboard, 
    createPointTransaction 
  } = usePoints()

  // 状态管理
  const [leaderboard, setLeaderboard] = useState<StudentPoints[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentPoints, setStudentPoints] = useState<StudentPoints | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCenter, setFilterCenter] = useState("all")
  const [operationMode, setOperationMode] = useState<'manual' | 'nfc'>('nfc')
  
  // 积分操作状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [operationType, setOperationType] = useState<'add_points' | 'deduct_points' | 'redeem_gift'>('add_points')
  const [pointsChange, setPointsChange] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [giftName, setGiftName] = useState<string>('')
  const [giftPoints, setGiftPoints] = useState<string>('')

  // 加载积分排行榜
  const loadLeaderboard = async () => {
    try {
      const data = await getPointsLeaderboard(1, 100)
      setLeaderboard(data.items || [])
    } catch (error) {
      console.error('加载积分排行榜失败:', error)
    }
  }

  // 加载学生积分详情
  const loadStudentPoints = async (studentId: string) => {
    try {
      const data = await getStudentPoints(studentId)
      setStudentPoints(data.student_points)
      setTransactions(data.transactions.items || [])
    } catch (error) {
      console.error('加载学生积分失败:', error)
    }
  }

  // 处理积分操作
  const handlePointTransaction = async () => {
    console.log('🔍 积分操作调试信息:')
    console.log('  选中学生:', selectedStudent)
    console.log('  当前教师:', teacher)
    console.log('  积分变化:', pointsChange)
    console.log('  操作理由:', reason)
    console.log('  操作类型:', operationType)

    if (!selectedStudent || !teacher || !pointsChange || !reason) {
      console.log('❌ 缺少必填字段')
      alert('请填写所有必填字段')
      return
    }

    try {
      const points = operationType === 'add_points' ? parseInt(pointsChange) : -parseInt(pointsChange)
      
      const transactionData: PointTransactionCreateData = {
        student_id: selectedStudent.id,
        teacher_id: teacher.id,
        points_change: points,
        transaction_type: operationType,
        reason: reason,
        proof_image: proofImage || undefined,
        gift_name: giftName || undefined,
        gift_points: giftPoints ? parseInt(giftPoints) : undefined
      }

      console.log('📋 发送积分交易数据:', transactionData)
      console.log('🔍 选中的学生详情:', {
        id: selectedStudent.id,
        name: selectedStudent.student_name,
        student_id: selectedStudent.student_id
      })
      await createPointTransaction(transactionData)

      // 重置表单
      setSelectedStudent(null)
      setPointsChange('')
      setReason('')
      setProofImage(null)
      setGiftName('')
      setGiftPoints('')
      setDialogOpen(false)

      // 刷新数据
      loadLeaderboard()
      if (selectedStudent) {
        loadStudentPoints(selectedStudent.id)
      }
      
      alert('积分操作成功！')
    } catch (error) {
      console.error('积分操作失败:', error)
      const errorMessage = error instanceof Error ? error.message : '积分操作失败，请重试'
      alert(`积分操作失败: ${errorMessage}`)
    }
  }

  // 获取交易类型图标
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'add_points': return <Plus className="h-4 w-4 text-green-500" />
      case 'deduct_points': return <Minus className="h-4 w-4 text-red-500" />
      case 'redeem_gift': return <Gift className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  // 获取交易类型徽章
  const getTransactionTypeBadge = (type: string) => {
    const configs = {
      add_points: { label: '加分', variant: 'default' as const },
      deduct_points: { label: '扣分', variant: 'destructive' as const },
      redeem_gift: { label: '兑换礼物', variant: 'secondary' as const }
    }
    const config = configs[type as keyof typeof configs]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取剩余天数
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // 过滤学生数据
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = !searchTerm || 
      student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCenter = filterCenter === "all" || student.center === filterCenter
    
    return matchesSearch && matchesCenter
  })

  // 获取中心列表
  const centers = Array.from(new Set(students.map((s: any) => s.center).filter(Boolean)))

  useEffect(() => {
    loadLeaderboard()
  }, [])

  // 如果选择NFC模式，直接返回NFC操作组件
  if (operationMode === 'nfc') {
    return (
      <div className="space-y-6">
        {/* 模式切换 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">积分管理系统</h2>
            <p className="text-gray-600">通过NFC卡片进行安全的积分操作</p>
          </div>
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
        </div>
        
        <NFCPointsOperation />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">积分管理系统</h2>
          <p className="text-gray-600">管理学生积分，查看积分排行榜和操作记录</p>
          {teacher && (
            <p className="text-sm text-blue-600 mt-1">
              当前教师: {teacher.teacher_name || teacher.name} ({teacher.id})
            </p>
          )}
          {!teacher && !loading && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ 未找到教师信息，请检查登录状态
            </p>
          )}
        </div>
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
      </div>

      {/* 积分操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
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
                      loadStudentPoints(student.id)
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择学生" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudents.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.student_name} ({student.student_id}) - {student.center}
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
                            学号: {selectedStudent.student_id} | 班级: {selectedStudent.standard}
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
                  <Select value={operationType} onValueChange={(value: any) => setOperationType(value)}>
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
                {operationType === 'redeem_gift' && (
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
                {operationType === 'redeem_gift' && (
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
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="搜索学生..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterCenter} onValueChange={setFilterCenter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有中心</SelectItem>
              {centers.map(center => (
                <SelectItem key={center} value={center}>{center}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 积分排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            积分排行榜
          </CardTitle>
          <CardDescription>学生积分排名和统计信息</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>学号</TableHead>
                  <TableHead>中心</TableHead>
                  <TableHead>当前积分</TableHead>
                  <TableHead>历史获得</TableHead>
                  <TableHead>历史消费</TableHead>
                  <TableHead>剩余天数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((item, index) => {
                  const student = students.find(s => s.id === item.student_id)
                  const daysRemaining = getDaysRemaining(item.season_end_date)
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Trophy className={`h-4 w-4 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-gray-400' : 'text-orange-500'
                            }`} />
                          )}
                          <span className="font-semibold">#{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>{student?.student_name || '未知'}</TableCell>
                      <TableCell>{student?.student_id || '未知'}</TableCell>
                      <TableCell>{student?.center || '未知'}</TableCell>
                      <TableCell>
                        <span className="font-bold text-blue-600">
                          {item.current_points}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600">{item.total_earned}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600">{item.total_spent}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`${daysRemaining <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                          {daysRemaining}天
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student)
                            if (student) {
                              loadStudentPoints(student.id)
                            }
                          }}
                        >
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 学生积分详情 */}
      {selectedStudent && studentPoints && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 积分统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedStudent.student_name} 的积分信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">当前积分</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {studentPoints.current_points}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">历史获得</p>
                  <p className="text-2xl font-bold text-green-600">
                    {studentPoints.total_earned}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-500">历史消费</p>
                  <p className="text-2xl font-bold text-red-600">
                    {studentPoints.total_spent}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-500">剩余天数</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {getDaysRemaining(studentPoints.season_end_date)}
                  </p>
                </div>
              </div>
              
              {/* 积分周期信息 */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">积分周期信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">周期编号</p>
                    <p className="font-semibold">第 {studentPoints.season_number} 期</p>
                  </div>
                  <div>
                    <p className="text-gray-500">结束日期</p>
                    <p className="font-semibold">{formatDate(studentPoints.season_end_date)}</p>
                  </div>
                </div>
                {getDaysRemaining(studentPoints.season_end_date) <= 7 && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      ⚠️ 积分周期即将结束，请及时使用积分！
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 积分历史记录 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                积分历史记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无积分记录</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionTypeIcon(transaction.transaction_type)}
                        <div>
                          <div className="flex items-center gap-2">
                            {getTransactionTypeBadge(transaction.transaction_type)}
                            <span className={`font-semibold ${
                              transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{transaction.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.created)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {transaction.expand?.teacher_id?.teacher_name || 
                           transaction.expand?.teacher_id?.name || 
                           '未知老师'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
