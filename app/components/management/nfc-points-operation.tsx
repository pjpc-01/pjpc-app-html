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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Trophy,
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
  AlertTriangle
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'
import { StudentPoints, PointTransaction, PointTransactionCreateData } from '@/types/points'

type OperationStep = 'scan-student' | 'view-points' | 'scan-teacher' | 'operation' | 'success'

export default function NFCPointsOperation() {
  const { teacher } = useCurrentTeacher()
  const { students } = useStudents()
  const { 
    loading, 
    error, 
    getStudentPoints, 
    createPointTransaction 
  } = usePoints()

  // 状态管理
  const [currentStep, setCurrentStep] = useState<OperationStep>('scan-student')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentPoints, setStudentPoints] = useState<StudentPoints | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [verifiedTeacher, setVerifiedTeacher] = useState<any>(null)
  
  // 积分操作状态
  const [operationType, setOperationType] = useState<'add_points' | 'deduct_points' | 'redeem_gift'>('add_points')
  const [selectedOperationType, setSelectedOperationType] = useState<'add_points' | 'deduct_points' | 'redeem_gift' | null>(null)
  const [pointsChange, setPointsChange] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [giftName, setGiftName] = useState<string>('')
  const [giftPoints, setGiftPoints] = useState<string>('')
  
  // NFC卡号输入
  const [studentCardNumber, setStudentCardNumber] = useState<string>('')
  const [teacherCardNumber, setTeacherCardNumber] = useState<string>('')

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

  // 处理学生NFC卡扫描
  const handleStudentCardScan = async () => {
    if (!studentCardNumber.trim()) {
      alert('请输入学生NFC卡号或URL')
      return
    }

    try {
      let foundStudent = null
      const nfcData = studentCardNumber.trim()

      // 方法1: 通过studentUrl字段直接匹配
      foundStudent = students.find(s => s.studentUrl && s.studentUrl === nfcData)
      
      // 方法2: 通过URL包含关系匹配（处理URL可能略有不同的情况）
      if (!foundStudent) {
        foundStudent = students.find(s => s.studentUrl && nfcData.includes(s.studentUrl.split('/').pop() || ''))
      }
      
      // 方法3: 通过student_id匹配
      if (!foundStudent) {
        foundStudent = students.find(s => s.student_id === nfcData)
      }
      
      // 方法4: 通过cardNumber匹配（备用方案）
      if (!foundStudent) {
        foundStudent = students.find(s => s.cardNumber === nfcData)
      }
      
      // 方法5: 尝试模糊匹配
      if (!foundStudent) {
        console.log('🔍 NFC调试信息:')
        console.log('  NFC读取的数据:', nfcData)
        console.log('  学生总数:', students.length)
        console.log('  有URL的学生数:', students.filter(s => s.studentUrl).length)
        console.log('  有cardNumber的学生数:', students.filter(s => s.cardNumber).length)
        console.log('  可用学生URLs:', students.map(s => ({ id: s.student_id, name: s.student_name, url: s.studentUrl })).filter(s => s.url))
        console.log('  可用学生卡号:', students.map(s => ({ id: s.student_id, name: s.student_name, cardNumber: s.cardNumber })).filter(s => s.cardNumber))
        
        // 尝试模糊匹配
        const fuzzyMatch = students.find(s => 
          (s.studentUrl && 
           (s.studentUrl.includes(nfcData.split('/').pop() || '') || 
            nfcData.includes(s.studentUrl.split('/').pop() || ''))) ||
          (s.cardNumber && s.cardNumber.includes(nfcData)) ||
          (s.student_id && s.student_id.includes(nfcData))
        )
        
        if (fuzzyMatch) {
          console.log('🎯 找到模糊匹配:', fuzzyMatch.student_name, fuzzyMatch.student_id)
          foundStudent = fuzzyMatch
        }
      }

      if (!foundStudent) {
        alert('找不到对应的学生，请检查NFC卡信息或学生名单')
        return
      }

      setSelectedStudent(foundStudent)
      await loadStudentPoints(foundStudent.id)
      setCurrentStep('view-points')
    } catch (error) {
      console.error('扫描学生卡片失败:', error)
      alert('扫描学生卡片失败，请重试')
    }
  }

  // 处理教师NFC卡扫描
  const handleTeacherCardScan = async () => {
    if (!teacherCardNumber.trim()) {
      alert('请输入教师NFC卡号或URL')
      return
    }

    try {
      let foundTeacher = null
      const nfcData = teacherCardNumber.trim()

      // 方法1: 通过teacherUrl字段直接匹配
      if (teacher?.teacherUrl && teacher.teacherUrl === nfcData) {
        foundTeacher = teacher
      }
      
      // 方法2: 通过URL包含关系匹配（处理URL可能略有不同的情况）
      if (!foundTeacher && teacher?.teacherUrl && nfcData.includes(teacher.teacherUrl.split('/').pop() || '')) {
        foundTeacher = teacher
      }
      
      // 方法3: 通过nfc_card_number匹配
      if (!foundTeacher && teacher?.nfc_card_number === nfcData) {
        foundTeacher = teacher
      }
      
      // 方法4: 通过教师ID匹配
      if (!foundTeacher && teacher?.id === nfcData) {
        foundTeacher = teacher
      }
      
      // 方法5: 尝试模糊匹配
      if (!foundTeacher) {
        console.log('🔍 教师NFC调试信息:')
        console.log('  NFC读取的数据:', nfcData)
        console.log('  当前教师信息:', teacher)
        console.log('  教师URL:', teacher?.teacherUrl)
        console.log('  教师NFC卡号:', teacher?.nfc_card_number)
        
        // 尝试模糊匹配
        if (teacher && (
          (teacher.teacherUrl && 
           (teacher.teacherUrl.includes(nfcData.split('/').pop() || '') || 
            nfcData.includes(teacher.teacherUrl.split('/').pop() || ''))) ||
          (teacher.nfc_card_number && teacher.nfc_card_number.includes(nfcData)) ||
          (teacher.id && teacher.id.includes(nfcData))
        )) {
          console.log('🎯 找到教师模糊匹配:', teacher.teacher_name || teacher.name)
          foundTeacher = teacher
        }
      }

      if (!foundTeacher) {
        alert('教师身份验证失败，请检查NFC卡信息或教师信息')
        return
      }

      setVerifiedTeacher(foundTeacher)
      setCurrentStep('operation')
    } catch (error) {
      console.error('教师身份验证失败:', error)
      alert('教师身份验证失败，请重试')
    }
  }

  // 处理积分操作
  const handlePointTransaction = async () => {
    if (!selectedStudent || !verifiedTeacher || !pointsChange || !reason) {
      alert('请填写所有必填字段')
      return
    }

    try {
      const points = operationType === 'add_points' ? parseInt(pointsChange) : -parseInt(pointsChange)
      
      const transactionData: PointTransactionCreateData = {
        student_id: selectedStudent.id,
        teacher_id: verifiedTeacher.id,
        points_change: points,
        transaction_type: operationType,
        reason: reason,
        proof_image: proofImage || undefined,
        gift_name: giftName || undefined,
        gift_points: giftPoints ? parseInt(giftPoints) : undefined
      }

      await createPointTransaction(transactionData)
      setCurrentStep('success')
      
      // 刷新学生积分数据
      await loadStudentPoints(selectedStudent.id)
    } catch (error) {
      console.error('积分操作失败:', error)
      alert('积分操作失败，请重试')
    }
  }

  // 重置操作
  const resetOperation = () => {
    setCurrentStep('scan-student')
    setSelectedStudent(null)
    setStudentPoints(null)
    setTransactions([])
    setVerifiedTeacher(null)
    setStudentCardNumber('')
    setTeacherCardNumber('')
    setPointsChange('')
    setReason('')
    setProofImage(null)
    setGiftName('')
    setGiftPoints('')
    setSelectedOperationType(null)
    setOperationType('add_points')
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NFC积分操作系统</h1>
        <p className="text-gray-600">通过NFC卡片进行安全的积分操作</p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { step: 'scan-student', label: '扫描学生卡', icon: CreditCard },
            { step: 'view-points', label: '查看积分', icon: Trophy },
            { step: 'scan-teacher', label: '验证教师', icon: Shield },
            { 
              step: 'operation', 
              label: selectedOperationType ? 
                (selectedOperationType === 'add_points' ? '添加积分' : 
                 selectedOperationType === 'deduct_points' ? '扣除积分' : 
                 '兑换礼物') : '积分操作', 
              icon: selectedOperationType === 'add_points' ? Plus : 
                    selectedOperationType === 'deduct_points' ? Minus : 
                    selectedOperationType === 'redeem_gift' ? Gift : Plus 
            },
            { step: 'success', label: '操作完成', icon: CheckCircle }
          ].map(({ step, label, icon: Icon }, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                currentStep === step ? 'bg-blue-100 text-blue-700' : 
                ['scan-student', 'view-points', 'scan-teacher', 'operation', 'success'].indexOf(currentStep) > index ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              {index < 4 && <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* 步骤1: 扫描学生NFC卡 */}
      {currentStep === 'scan-student' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              扫描学生NFC卡
            </CardTitle>
            <CardDescription>请扫描学生的NFC卡片以获取学生信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div>
               <Label htmlFor="student-card">学生NFC卡号/URL</Label>
               <Input
                 id="student-card"
                 value={studentCardNumber}
                 onChange={(e) => setStudentCardNumber(e.target.value)}
                 placeholder="请输入或扫描学生NFC卡号、URL或学号"
                 className="mt-1"
               />
               <p className="text-sm text-gray-500 mt-1">
                 支持：NFC卡号、学生URL、学号(student_id)
               </p>
             </div>
            <Button onClick={handleStudentCardScan} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  扫描中...
                </>
              ) : (
                '扫描学生卡片'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 步骤2: 查看学生积分信息 */}
      {currentStep === 'view-points' && selectedStudent && studentPoints && (
        <div className="space-y-6">
          {/* 学生信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                学生信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">姓名</p>
                  <p className="font-semibold text-lg">{selectedStudent.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">学号</p>
                  <p className="font-semibold">{selectedStudent.student_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">班级</p>
                  <p className="font-semibold">{selectedStudent.standard}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">中心</p>
                  <p className="font-semibold">{selectedStudent.center}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 积分统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">当前积分</p>
                <p className="text-2xl font-bold text-blue-600">{studentPoints.current_points}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">历史获得</p>
                <p className="text-2xl font-bold text-green-600">{studentPoints.total_earned}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-sm text-gray-500">历史消费</p>
                <p className="text-2xl font-bold text-red-600">{studentPoints.total_spent}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-sm text-gray-500">剩余天数</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getDaysRemaining(studentPoints.season_end_date)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 积分周期信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                积分周期信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
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
              {getDaysRemaining(studentPoints.season_end_date) <= 7 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    ⚠️ 积分周期即将结束，请及时使用积分！
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 积分操作按钮 */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                setSelectedOperationType('add_points')
                setOperationType('add_points')
                setCurrentStep('scan-teacher')
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              添加积分
            </Button>
            <Button
              onClick={() => {
                setSelectedOperationType('deduct_points')
                setOperationType('deduct_points')
                setCurrentStep('scan-teacher')
              }}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Minus className="h-4 w-4" />
              扣除积分
            </Button>
            <Button
              onClick={() => {
                setSelectedOperationType('redeem_gift')
                setOperationType('redeem_gift')
                setCurrentStep('scan-teacher')
              }}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Gift className="h-4 w-4" />
              兑换礼物
            </Button>
          </div>

          {/* 最近积分记录 */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  最近积分记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {transactions.slice(0, 5).map((transaction) => (
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
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 步骤3: 扫描教师NFC卡 */}
      {currentStep === 'scan-teacher' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              教师身份验证
            </CardTitle>
            <CardDescription>请扫描教师的NFC卡片以验证身份，确保操作安全</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                         <div>
               <Label htmlFor="teacher-card">教师NFC卡号/URL</Label>
               <Input
                 id="teacher-card"
                 value={teacherCardNumber}
                 onChange={(e) => setTeacherCardNumber(e.target.value)}
                 placeholder="请输入或扫描教师NFC卡号、URL或教师ID"
                 className="mt-1"
               />
               <p className="text-sm text-gray-500 mt-1">
                 支持：教师URL、NFC卡号、教师ID
               </p>
             </div>
            <div className="flex gap-4">
              <Button onClick={handleTeacherCardScan} className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    验证中...
                  </>
                ) : (
                  '验证教师身份'
                )}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep('view-points')}>
                返回
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤4: 积分操作 */}
      {currentStep === 'operation' && verifiedTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedOperationType === 'add_points' && <Plus className="h-5 w-5 text-green-500" />}
              {selectedOperationType === 'deduct_points' && <Minus className="h-5 w-5 text-red-500" />}
              {selectedOperationType === 'redeem_gift' && <Gift className="h-5 w-5 text-blue-500" />}
              {!selectedOperationType && <Plus className="h-5 w-5" />}
              积分操作
            </CardTitle>
            <CardDescription>
              教师: {verifiedTeacher.teacher_name || verifiedTeacher.name} | 
              学生: {selectedStudent?.student_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 操作类型 - 如果已选择则显示，否则显示选择器 */}
            {selectedOperationType ? (
              <div>
                <Label>操作类型</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {selectedOperationType === 'add_points' && (
                    <>
                      <Plus className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-green-600">添加积分</span>
                    </>
                  )}
                  {selectedOperationType === 'deduct_points' && (
                    <>
                      <Minus className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-red-600">扣除积分</span>
                    </>
                  )}
                  {selectedOperationType === 'redeem_gift' && (
                    <>
                      <Gift className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold text-blue-600">兑换礼物</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
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
            )}

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

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <Button onClick={handlePointTransaction} className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    处理中...
                  </>
                ) : (
                  '确认操作'
                )}
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep('scan-teacher')}>
                返回
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤5: 操作成功 */}
      {currentStep === 'success' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              操作成功
            </CardTitle>
            <CardDescription>积分操作已完成</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-6xl text-green-500">✅</div>
            <p className="text-lg font-semibold">积分操作成功完成！</p>
            <p className="text-gray-600">
              学生 {selectedStudent?.student_name} 的积分已更新
            </p>
            <Button onClick={resetOperation} className="w-full">
              进行下一次操作
            </Button>
          </CardContent>
        </Card>
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
