"use client"

import { useState, useEffect, useRef } from 'react'
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
  AlertTriangle,
  AlertCircle
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'
import { StudentPoints, PointTransaction, PointTransactionCreateData } from '@/types/points'
import HIDCardReader from '@/components/hid-reader/HIDCardReader'

type OperationStep = 'scan-student' | 'view-points' | 'scan-teacher' | 'operation' | 'success'

export default function NFCPointsEmbedded() {
  const { teacher } = useCurrentTeacher()
  const { students } = useStudents()
  const { 
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
  const [loading, setLoading] = useState(false)
  
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
  
  // HID读卡器状态
  const [isHIDReady, setIsHIDReady] = useState<boolean>(true)
  const [lastCardNumber, setLastCardNumber] = useState<string>('')
  
  // NFC状态
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)
  const [nfcScanning, setNfcScanning] = useState<boolean>(false)
  
  // 防重复扫描
  const lastProcessedCard = useRef<string>('')
  const lastProcessTime = useRef<number>(0)

  // 检查NFC支持
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true)
    } else {
      setNfcSupported(false)
    }
  }, [])

  // HID读卡器处理函数 - 添加防重复和延迟处理
  const handleHIDCardRead = (cardNumber: string) => {
    console.log('HID读卡器原始读取到卡号:', cardNumber)
    
    // 清理卡号：只保留数字
    const cleanedCardNumber = cardNumber.replace(/\D/g, '')
    console.log('HID读卡器清理后卡号:', cleanedCardNumber)
    
    if (!cleanedCardNumber) {
      console.log('❌ 清理后卡号为空，忽略')
      return
    }
    
    const now = Date.now()
    
    // 防重复扫描：同一张卡在3秒内重复扫描，忽略
    if (now - lastProcessTime.current < 3000 && lastProcessedCard.current === cleanedCardNumber) {
      console.log('防重复扫描：忽略重复卡片')
      return
    }
    
    // 更新防重复状态
    lastProcessedCard.current = cleanedCardNumber
    lastProcessTime.current = now
    
    setLastCardNumber(cleanedCardNumber)
    setStudentCardNumber(cleanedCardNumber)
    
    // 添加延迟，让用户有时间看到扫描结果
    setTimeout(() => {
      processStudentData(cleanedCardNumber)
    }, 1000) // 1秒延迟
  }

  const handleHIDCardError = (error: string) => {
    console.error('HID读卡器错误:', error)
    alert('读卡器错误: ' + error)
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

  // 处理NFC扫描
  const handleNFCScan = async () => {
    console.log('NFC扫描按钮被点击')
    console.log('NFC支持状态:', nfcSupported)
    
    if (!nfcSupported) {
      alert('您的浏览器不支持NFC功能')
      return
    }

    try {
      console.log('开始NFC扫描...')
      // 使用Web NFC API
      const ndef = new (window as any).NDEFReader()
      await ndef.scan()
      
      setNfcScanning(true)
      setLoading(true)
      console.log('NFC扫描已启动，等待卡片...')
      
      ndef.addEventListener('reading', async (event: any) => {
        try {
          const { message } = event
          let nfcData = ""
          let tagId = ""
          
          // 提取标签ID
          if (event.serialNumber) {
            tagId = event.serialNumber
          }
          
          // 解析NDEF记录
          for (const record of message.records) {
            if (record.recordType === "url") {
              nfcData = record.data ? new TextDecoder().decode(record.data) : ""
            } else if (record.recordType === "text") {
              nfcData = record.data ? new TextDecoder().decode(record.data) : ""
            } else if (record.recordType === "empty") {
              // 空记录，尝试从标签ID获取数据
              nfcData = tagId
            }
          }
          
          // 如果没有从记录中获取到数据，使用标签ID
          if (!nfcData && tagId) {
            nfcData = tagId
          }
          
          console.log('NFC扫描到数据:', nfcData)
          setNfcScanning(false)
          await processStudentData(nfcData)
        } catch (error) {
          console.error('NFC数据解析失败:', error)
          setNfcScanning(false)
          setLoading(false)
          alert('NFC数据解析失败，请重试')
        }
      })
      
      // 超时处理
      setTimeout(() => {
        if (nfcScanning) {
          console.log('NFC扫描超时')
          setNfcScanning(false)
          setLoading(false)
          alert('NFC扫描超时，请重试')
        }
      }, 10000) // 10秒超时
      
    } catch (error) {
      console.error('NFC扫描启动失败:', error)
      setNfcScanning(false)
      setLoading(false)
      alert('NFC扫描启动失败，请检查设备权限或使用手动输入')
    }
  }

  // 处理手动输入
  const handleManualInput = async () => {
    console.log('手动输入按钮被点击')
    console.log('输入内容:', studentCardNumber)
    
    if (!studentCardNumber.trim()) {
      alert('请输入学生NFC卡号、URL或学号')
      return
    }

    setLoading(true)
    console.log('开始处理手动输入数据...')
    await processStudentData(studentCardNumber.trim())
  }

  // 根据卡号查找学生 - 使用与考勤系统相同的逻辑
  const findStudentByCard = (cardNumber: string) => {
    const trimmed = cardNumber.trim()
    console.log('🔍 查找学生，原始卡号:', cardNumber)
    console.log('🔍 查找学生，清理后卡号:', trimmed)
    console.log('🔍 卡号长度:', trimmed.length)
    console.log('🔍 学生总数:', students.length)
    
    // 显示前几个学生的卡号用于调试
    console.log('🔍 前5个学生的卡号:', students.slice(0, 5).map(s => ({
      name: s.student_name,
      cardNumber: s.cardNumber,
      student_id: s.student_id
    })))
    
    // 查找学生 - 精确匹配
    let student = students.find(s => s.cardNumber === trimmed)
    if (student) {
      console.log('✅ 精确匹配找到学生:', student.student_name, student.cardNumber)
      return student
    }
    
    // 查找学生 - 去除前导零后匹配
    const trimmedNoLeadingZeros = trimmed.replace(/^0+/, '')
    if (trimmedNoLeadingZeros !== trimmed) {
      console.log('🔍 尝试去除前导零后匹配:', trimmedNoLeadingZeros)
      student = students.find(s => s.cardNumber === trimmedNoLeadingZeros)
      if (student) {
        console.log('✅ 去除前导零后找到学生:', student.student_name, student.cardNumber)
        return student
      }
    }
    
    // 查找学生 - 添加前导零后匹配
    if (trimmed.length < 10) {
      const paddedCardNumber = trimmed.padStart(10, '0')
      console.log('🔍 尝试添加前导零后匹配:', paddedCardNumber)
      student = students.find(s => s.cardNumber === paddedCardNumber)
      if (student) {
        console.log('✅ 添加前导零后找到学生:', student.student_name, student.cardNumber)
        return student
      }
    }
    
    // 查找学生 - 通过student_id匹配
    student = students.find(s => s.student_id === trimmed)
    if (student) {
      console.log('✅ 通过student_id找到学生:', student.student_name, student.student_id)
      return student
    }
    
    console.log('❌ 未找到学生')
    return null
  }

  // 处理学生数据（HID读卡器扫描或手动输入）
  const processStudentData = async (cardNumber: string) => {
    try {
      console.log('🔍 开始处理学生数据:', cardNumber)
      setLoading(true)

      // 等待一下，确保数据完全加载
      await new Promise(resolve => setTimeout(resolve, 500))

      // 检查学生数据是否已加载
      if (students.length === 0) {
        console.log('⚠️ 学生数据尚未加载，等待数据加载...')
        // 等待学生数据加载，最多等待3秒
        let attempts = 0
        while (students.length === 0 && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        
        if (students.length === 0) {
          alert('学生数据尚未加载完成，请稍后再试')
          setLoading(false)
          return
        }
      }

      console.log('✅ 学生数据已加载，总数:', students.length)

      // 直接通过卡号查找学生
      const foundStudent = findStudentByCard(cardNumber)

      if (!foundStudent) {
        alert('未找到对应的学生信息，请检查卡片是否正确')
        setLoading(false)
        return
      }

      setSelectedStudent(foundStudent)
      await loadStudentPoints(foundStudent.id)
      setCurrentStep('view-points')
      setLoading(false)
    } catch (error) {
      console.error('处理学生数据失败:', error)
      alert('处理失败: ' + (error as Error).message)
      setLoading(false)
    }
  }

  // 处理教师NFC卡扫描
  const handleTeacherCardScan = async () => {
    if (!teacherCardNumber.trim()) {
      alert('请输入教师NFC卡号')
      return
    }

    try {
      // 这里应该实现教师NFC卡验证逻辑
      // 暂时使用当前登录的教师信息
      if (teacher) {
        setVerifiedTeacher(teacher)
        setCurrentStep('operation')
      } else {
        alert('未找到教师信息，请重新登录')
      }
    } catch (error) {
      console.error('验证教师NFC卡失败:', error)
      alert('验证失败，请重试')
    }
  }

  // 处理积分操作
  const handlePointOperation = async () => {
    if (!selectedStudent || !verifiedTeacher) {
      alert('请先完成学生和教师验证')
      return
    }

    try {
      const transactionData: PointTransactionCreateData = {
        student_id: selectedStudent.id,
        teacher_id: verifiedTeacher.id,
        transaction_type: selectedOperationType || 'add_points',
        points_change: parseInt(pointsChange),
        reason: reason,
        status: 'approved', // 默认状态为已批准
        season_number: 1, // 默认赛季为1
        gift_name: selectedOperationType === 'redeem_gift' ? giftName : undefined,
        gift_points: selectedOperationType === 'redeem_gift' ? parseInt(giftPoints) : undefined
      }

      await createPointTransaction(transactionData)
      setCurrentStep('success')
      
      // 重新加载学生积分
      await loadStudentPoints(selectedStudent.id)
    } catch (error) {
      console.error('积分操作失败:', error)
      alert('操作失败，请重试')
    }
  }

  // 重置操作
  const resetOperation = () => {
    setCurrentStep('scan-student')
    setSelectedStudent(null)
    setStudentPoints(null)
    setVerifiedTeacher(null)
    setStudentCardNumber('')
    setTeacherCardNumber('')
    setPointsChange('')
    setReason('')
    setSelectedOperationType(null)
  }

  return (
    <div className="space-y-4">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          {[
            { step: 'scan-student', label: '扫描学生', icon: CreditCard },
            { step: 'view-points', label: '查看积分', icon: Trophy },
            { step: 'scan-teacher', label: '验证教师', icon: Shield },
            { step: 'operation', label: '积分操作', icon: Plus },
            { step: 'success', label: '完成', icon: CheckCircle }
          ].map(({ step, label, icon: Icon }, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                currentStep === step ? 'bg-blue-100 text-blue-700' : 
                ['scan-student', 'view-points', 'scan-teacher', 'operation', 'success'].indexOf(currentStep) > index ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{label}</span>
              </div>
              {index < 4 && <div className="w-4 h-0.5 bg-gray-300 mx-1"></div>}
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
              学生信息识别
            </CardTitle>
            <CardDescription>通过NFC扫描或手动输入获取学生信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="student-card">学生信息输入</Label>
              <Input
                id="student-card"
                value={studentCardNumber}
                onChange={(e) => setStudentCardNumber(e.target.value)}
                placeholder="输入学生学号、URL或NFC卡号"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                支持格式：学号(S001)、学生URL、NFC卡号
              </p>
            </div>
            <div className="space-y-3">
              {/* NFC支持状态 */}
              {nfcSupported !== null && (
                <div className={`p-2 rounded-lg text-sm ${
                  nfcSupported 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {nfcSupported ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span>
                      {nfcSupported 
                        ? 'NFC功能可用，可以选择扫描或手动输入' 
                        : 'NFC功能不可用，请使用手动输入'
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* 两个独立的按钮 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NFC扫描按钮 */}
                <Button 
                  onClick={handleNFCScan} 
                  disabled={!nfcSupported || loading || nfcScanning}
                  className="flex items-center justify-center gap-2"
                  variant={nfcSupported ? "default" : "outline"}
                >
                  {nfcScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">扫描中...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span className="hidden sm:inline">NFC扫描</span>
                    </>
                  )}
                </Button>

                {/* 手动输入按钮 */}
                <Button 
                  onClick={handleManualInput} 
                  disabled={loading}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">手动输入</span>
                </Button>
              </div>
              
              {/* 状态提示 */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {nfcScanning 
                    ? '请将NFC卡片贴近设备' 
                    : nfcSupported 
                      ? '点击NFC扫描按钮扫描卡片，或点击手动输入按钮输入信息' 
                      : '请使用手动输入功能'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 如果不在扫描步骤，显示返回扫描的按钮 */}
      {currentStep !== 'scan-student' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">NFC扫描功能</h3>
                  <p className="text-sm text-blue-700">点击按钮开始扫描新的学生NFC卡片</p>
                </div>
              </div>
              <Button 
                onClick={resetOperation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                重新扫描
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤2: 查看学生积分信息 */}
      {currentStep === 'view-points' && selectedStudent && studentPoints && (
        <div className="space-y-4">
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
                  <p className="font-semibold text-lg">{selectedStudent.student_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">当前积分</p>
                  <p className="font-semibold text-2xl text-blue-600">{studentPoints.current_points}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">总积分</p>
                  <p className="font-semibold text-lg">{studentPoints.total_earned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作选择 */}
          <Card>
            <CardHeader>
              <CardTitle>选择操作类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={selectedOperationType === 'add_points' ? 'default' : 'outline'}
                  onClick={() => setSelectedOperationType('add_points')}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Plus className="h-6 w-6" />
                  <span>添加积分</span>
                </Button>
                <Button
                  variant={selectedOperationType === 'deduct_points' ? 'default' : 'outline'}
                  onClick={() => setSelectedOperationType('deduct_points')}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Minus className="h-6 w-6" />
                  <span>扣除积分</span>
                </Button>
                <Button
                  variant={selectedOperationType === 'redeem_gift' ? 'default' : 'outline'}
                  onClick={() => setSelectedOperationType('redeem_gift')}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Gift className="h-6 w-6" />
                  <span>兑换礼品</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 继续按钮 */}
          <Button 
            onClick={() => setCurrentStep('scan-teacher')}
            disabled={!selectedOperationType}
            className="w-full"
          >
            继续操作
          </Button>
        </div>
      )}

      {/* 步骤3: 扫描教师NFC卡 */}
      {currentStep === 'scan-teacher' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              验证教师身份
            </CardTitle>
            <CardDescription>请扫描教师NFC卡片以验证身份</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="teacher-card">教师NFC卡号</Label>
              <Input
                id="teacher-card"
                value={teacherCardNumber}
                onChange={(e) => setTeacherCardNumber(e.target.value)}
                placeholder="请输入教师NFC卡号"
                className="mt-1"
              />
            </div>
            <Button onClick={handleTeacherCardScan} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  验证中...
                </>
              ) : (
                '验证教师身份'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 步骤4: 积分操作 */}
      {currentStep === 'operation' && selectedOperationType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedOperationType === 'add_points' ? <Plus className="h-5 w-5" /> :
               selectedOperationType === 'deduct_points' ? <Minus className="h-5 w-5" /> :
               <Gift className="h-5 w-5" />}
              {selectedOperationType === 'add_points' ? '添加积分' :
               selectedOperationType === 'deduct_points' ? '扣除积分' : '兑换礼品'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedOperationType !== 'redeem_gift' && (
              <div>
                <Label htmlFor="points-change">积分数量</Label>
                <Input
                  id="points-change"
                  type="number"
                  value={pointsChange}
                  onChange={(e) => setPointsChange(e.target.value)}
                  placeholder="请输入积分数量"
                  className="mt-1"
                />
              </div>
            )}

            {selectedOperationType === 'redeem_gift' && (
              <>
                <div>
                  <Label htmlFor="gift-name">礼品名称</Label>
                  <Input
                    id="gift-name"
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                    placeholder="请输入礼品名称"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gift-points">所需积分</Label>
                  <Input
                    id="gift-points"
                    type="number"
                    value={giftPoints}
                    onChange={(e) => setGiftPoints(e.target.value)}
                    placeholder="请输入所需积分"
                    className="mt-1"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="reason">操作原因</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请输入操作原因"
                className="mt-1"
              />
            </div>

            <Button onClick={handlePointOperation} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  处理中...
                </>
              ) : (
                '确认操作'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 步骤5: 操作完成 */}
      {currentStep === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">操作完成</h3>
            <p className="text-green-700 mb-4">积分操作已成功完成</p>
            <Button onClick={resetOperation} className="bg-green-600 hover:bg-green-700 text-white">
              继续操作
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
