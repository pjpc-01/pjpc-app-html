"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Trophy,
  Star,
  TrendingUp,
  TrendingDown,
  Gift,
  Clock,
  Calendar,
  User,
  Award,
  Plus,
  Minus,
  Loader2
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { StudentPoints, PointTransaction } from '@/types/points'

export default function StudentPointsPage() {
  const params = useParams()
  const cardNumber = params.cardNumber as string
  const { getStudentPoints, loading, error } = usePoints()
  const { students } = useStudents()

  const [studentPoints, setStudentPoints] = useState<StudentPoints | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [student, setStudent] = useState<any>(null)

  useEffect(() => {
    if (cardNumber) {
      loadStudentData()
    }
  }, [cardNumber])

  const loadStudentData = async () => {
    try {
      // 根据NFC卡号找到学生
      const foundStudent = students.find(s => s.cardNumber === cardNumber)
      if (!foundStudent) {
        console.error('找不到对应的学生')
        return
      }

      setStudent(foundStudent)

      // 获取学生积分数据
      const data = await getStudentPoints(foundStudent.id)
      setStudentPoints(data.student_points)
      setTransactions(data.transactions.items || [])
    } catch (error) {
      console.error('加载学生数据失败:', error)
    }
  }

  const getTransactionIcon = (type: string) => {
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

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!student || !studentPoints) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>找不到学生信息或积分数据</AlertDescription>
        </Alert>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(studentPoints.season_end_date)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 学生信息头部 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-6 w-6" />
                  {student.student_name}
                </CardTitle>
                <CardDescription>
                  学号: {student.student_id} | 班级: {student.standard} | 中心: {student.center}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 flex items-center gap-2">
                  <Trophy className="h-8 w-8" />
                  {studentPoints.current_points}
                </div>
                <p className="text-sm text-gray-500">当前积分</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 积分统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">历史获得</p>
                  <p className="text-2xl font-bold text-green-600">{studentPoints.total_earned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">历史消费</p>
                  <p className="text-2xl font-bold text-red-600">{studentPoints.total_spent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">剩余天数</p>
                  <p className="text-2xl font-bold text-blue-600">{daysRemaining}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 积分周期信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              积分周期信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">周期编号</p>
                <p className="font-semibold">第 {studentPoints.season_number} 期</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">开始日期</p>
                <p className="font-semibold">{formatDate(studentPoints.season_start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">结束日期</p>
                <p className="font-semibold">{formatDate(studentPoints.season_end_date)}</p>
              </div>
            </div>
            {daysRemaining <= 7 && (
              <Alert className="mt-4">
                <AlertDescription>
                  ⚠️ 积分周期即将结束，请及时使用积分！
                </AlertDescription>
              </Alert>
            )}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>积分变化</TableHead>
                    <TableHead>理由</TableHead>
                    <TableHead>操作老师</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.created)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.transaction_type)}
                          {getTransactionTypeBadge(transaction.transaction_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.reason}</TableCell>
                      <TableCell>
                        {transaction.expand?.teacher_id?.teacher_name || 
                         transaction.expand?.teacher_id?.name || 
                         '未知老师'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
