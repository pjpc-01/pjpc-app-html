"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
  Camera
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { useTeachers } from '@/hooks/useTeachers'
import { StudentPoints, PointTransactionCreateData } from '@/types/points'

export default function TeacherPointsPage() {
  const params = useParams()
  const cardNumber = params.cardNumber as string
  const { validateTeacherNFC, createPointTransaction, loading, error } = usePoints()
  const { students } = useStudents()
  const { teachers } = useTeachers()

  const [teacher, setTeacher] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [studentPoints, setStudentPoints] = useState<any>(null)
  const [step, setStep] = useState<'scan-student' | 'scan-teacher' | 'operation'>('scan-student')
  const [operationType, setOperationType] = useState<'add_points' | 'deduct_points' | 'redeem_gift'>('add_points')
  const [pointsChange, setPointsChange] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    if (cardNumber) {
      // 根据NFC卡号找到教师
      const foundTeacher = teachers.find(t => t.nfc_card_number === cardNumber)
      if (foundTeacher) {
        setTeacher(foundTeacher)
        setStep('scan-student')
      } else {
        setError('无效的教师NFC卡')
      }
    }
  }, [cardNumber])

  const handleStudentScan = async (studentCardNumber: string) => {
    try {
      const foundStudent = students.find(s => s.cardNumber === studentCardNumber)
      if (!foundStudent) {
        setError('找不到对应的学生')
        return
      }

      setStudent(foundStudent)
      
      // 获取学生积分数据
      const data = await validateTeacherNFC(cardNumber)
      if (data.valid) {
        setStep('operation')
      } else {
        setError('教师身份验证失败')
      }
    } catch (error) {
      setError('扫描学生卡片失败')
    }
  }

  const handleOperation = async () => {
    if (!student || !teacher || !pointsChange || !reason) {
      setError('请填写所有必填字段')
      return
    }

    try {
      const points = operationType === 'add_points' ? parseInt(pointsChange) : -parseInt(pointsChange)
      
      const transactionData: PointTransactionCreateData = {
        student_id: student.id,
        teacher_id: teacher.id,
        points_change: points,
        transaction_type: operationType,
        reason: reason,
        proof_image: proofImage || undefined
      }

      await createPointTransaction(transactionData)

      // 重置表单
      setPointsChange('')
      setReason('')
      setProofImage(null)
      setSuccess('积分操作成功！')
      
      // 刷新学生积分数据
      setTimeout(() => {
        setStep('scan-student')
        setStudent(null)
        setStudentPoints(null)
        setSuccess('')
      }, 2000)

    } catch (error) {
      console.error('积分操作失败:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
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

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>无效的教师NFC卡</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 教师信息头部 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              教师积分操作系统
            </CardTitle>
            <CardDescription>
              教师: {teacher.teacher_name || teacher.name} | 权限: {teacher.permissions}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'scan-student' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <CreditCard className="h-4 w-4" />
              <span>扫描学生卡</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === 'operation' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <Star className="h-4 w-4" />
              <span>积分操作</span>
            </div>
          </div>
        </div>

        {step === 'scan-student' && (
          <Card>
            <CardHeader>
              <CardTitle>扫描学生NFC卡</CardTitle>
              <CardDescription>请扫描学生的NFC卡片以获取学生信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">等待扫描学生NFC卡...</p>
                <p className="text-sm text-gray-500">
                  请将学生的NFC卡片靠近设备进行扫描
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'operation' && student && (
          <div className="space-y-6">
            {/* 学生信息 */}
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
                    <p className="font-semibold">{student.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">学号</p>
                    <p className="font-semibold">{student.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">班级</p>
                    <p className="font-semibold">{student.standard}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">当前积分</p>
                    <p className="font-semibold text-blue-600">{studentPoints?.current_points || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作表单 */}
            <Card>
              <CardHeader>
                <CardTitle>积分操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleOperation}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        处理中...
                      </>
                    ) : (
                      '确认操作'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('scan-student')
                      setStudent(null)
                      setStudentPoints(null)
                    }}
                  >
                    重新扫描
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
