"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
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
  AlertCircle,
  Wifi,
  WifiOff,
  Smartphone,
  Info
} from "lucide-react"
import { usePoints } from '@/hooks/usePoints'
import { useStudents } from '@/hooks/useStudents'
import { useTeachers } from '@/hooks/useTeachers'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'
import { StudentPoints, PointTransaction, PointTransactionCreateData } from '@/types/points'

type OperationStep = 'scan-student' | 'view-points' | 'scan-teacher' | 'operation' | 'success'

export default function NFCPointsOperation() {
  const { teacher } = useCurrentTeacher()
  const { students } = useStudents()
  const { teachers } = useTeachers()
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
  
  // 智能功能状态
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<any[]>([])
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [favoriteStudents, setFavoriteStudents] = useState<any[]>([])
  const [quickActions, setQuickActions] = useState<any[]>([])
  const [smartTips, setSmartTips] = useState<string[]>([])
  const [operationHistory, setOperationHistory] = useState<any[]>([])
  
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
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [lastCardNumber, setLastCardNumber] = useState<string>('')
  
  // 防重复扫描
  const lastProcessedCard = useRef<string>('')
  const lastProcessTime = useRef<number>(0)
  
  // 键盘监听状态
  const [inputBuffer, setInputBuffer] = useState('')
  const [lastInputTime, setLastInputTime] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)


  // 加载学生积分详情
  const loadStudentPoints = async (studentId: string) => {
    try {
      const data = await getStudentPoints(studentId)
      setStudentPoints(data.student_points)
      setTransactions(data.transactions.items || [])
      
      // 智能分析学生积分情况
      analyzeStudentPoints(data.student_points, data.transactions.items || [])
      } catch (error) {
      console.error('加载学生积分失败:', error)
    }
  }

  // 智能分析学生积分情况
  const analyzeStudentPoints = (points: StudentPoints, transactions: PointTransaction[]) => {
    const tips: string[] = []
    
    // 积分余额分析
    if (points.current_points < 10) {
      tips.push('该学生积分余额较低，建议给予鼓励')
    } else if (points.current_points > 100) {
      tips.push('该学生积分充足，可以推荐兑换礼品')
    }
    
    // 最近活动分析
    const recentTransactions = transactions.slice(0, 5)
    const recentEarned = recentTransactions.filter(t => t.transaction_type === 'add_points').length
    const recentSpent = recentTransactions.filter(t => t.transaction_type === 'deduct_points' || t.transaction_type === 'redeem_gift').length
    
    if (recentEarned > recentSpent) {
      tips.push('该学生最近表现积极，积分增长良好')
    } else if (recentSpent > recentEarned) {
      tips.push('该学生最近兑换较多，可以给予更多积分机会')
    }
    
    // 积分趋势分析
    const lastWeekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return transactionDate > weekAgo
    })
    
    if (lastWeekTransactions.length === 0) {
      tips.push('该学生本周暂无积分活动，建议关注')
    }
    
    setSmartTips(tips)
  }

  // 智能推荐快速操作
  const generateQuickActions = (student: any) => {
    const actions = []
    
    // 根据积分余额推荐操作
    if (studentPoints && studentPoints.current_points < 20) {
      actions.push({
        type: 'add_points',
        points: '10',
        reason: '鼓励参与',
        icon: 'Plus',
        color: 'green'
      })
    }
    
    if (studentPoints && studentPoints.current_points > 50) {
      actions.push({
        type: 'redeem_gift',
        gift: '小礼品',
        points: '20',
        icon: 'Gift',
        color: 'blue'
      })
    }
    
    // 根据最近活动推荐
    const recentEarned = transactions.filter(t => t.transaction_type === 'add_points').length
    if (recentEarned > 3) {
      actions.push({
        type: 'add_points',
        points: '5',
        reason: '持续表现优秀',
        icon: 'Award',
        color: 'gold'
      })
    }
    
    setQuickActions(actions)
  }

  // 智能搜索建议
  const handleCardNumberInput = (value: string) => {
    setStudentCardNumber(value)
    
    if (value.length >= 2) {
      // 根据输入提供智能建议
      const suggestions = students.filter(s => 
        s.student_name?.toLowerCase().includes(value.toLowerCase()) ||
        s.student_id?.includes(value) ||
        s.cardNumber?.includes(value)
      ).slice(0, 5)
      
      setAutoCompleteSuggestions(suggestions)
    } else {
      setAutoCompleteSuggestions([])
    }
  }

  // 添加学生到最近使用
  const addToRecentStudents = (student: any) => {
    const recent = recentStudents.filter(s => s.id !== student.id)
    recent.unshift(student)
    setRecentStudents(recent.slice(0, 5))
  }

  // 添加到收藏
  const toggleFavoriteStudent = (student: any) => {
    const isFavorite = favoriteStudents.some(s => s.id === student.id)
    if (isFavorite) {
      setFavoriteStudents(favoriteStudents.filter(s => s.id !== student.id))
    } else {
      setFavoriteStudents([...favoriteStudents, student])
    }
  }


  // 处理学生卡片扫描
  const handleStudentCardScan = async () => {
    if (!studentCardNumber.trim()) {
      alert('请输入学生卡片号码')
      return
    }

    await processStudentCard(studentCardNumber.trim())
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

  // 处理学生卡片数据 - 使用简单的卡号查找逻辑
  const processStudentCard = async (cardNumber: string) => {
    try {
      console.log('🔍 开始处理学生卡片数据:', cardNumber)
      setIsScanning(true)

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
          console.log('❌ 学生数据加载超时')
          setIsScanning(false)
          return
        }
      }

      console.log('✅ 学生数据已加载，总数:', students.length)

      // 直接通过卡号查找学生
      const foundStudent = findStudentByCard(cardNumber)

      if (!foundStudent) {
        console.log('❌ 未找到学生，卡号:', cardNumber)
        console.log('🔍 可用学生卡号:', students.slice(0, 10).map(s => s.cardNumber))
        setIsScanning(false)
        return
      }

      setSelectedStudent(foundStudent)
      addToRecentStudents(foundStudent)
      await loadStudentPoints(foundStudent.id)
      generateQuickActions(foundStudent)
      setCurrentStep('view-points')
      setIsScanning(false)
    } catch (error) {
      console.error('处理学生卡片失败:', error)
      alert('处理学生卡片失败: ' + (error as Error).message)
      setIsScanning(false)
    }
  }

  // 根据卡号查找教师 - 使用与考勤系统相同的逻辑
  const findTeacherByCard = (cardNumber: string) => {
    const trimmed = cardNumber.trim()
    console.log('🔍 查找教师，原始卡号:', cardNumber)
    console.log('🔍 查找教师，清理后卡号:', trimmed)
    console.log('🔍 教师总数:', teachers.length)
    
    // 显示前几个教师的卡号用于调试
    console.log('🔍 前5个教师的卡号:', teachers.slice(0, 5).map(t => ({
      name: t.teacher_name,
      cardNumber: (t as any).cardNumber,
      teacher_id: t.teacher_id
    })))
    
    // 查找教师 - 精确匹配
    let teacher = teachers.find(t => (t as any).cardNumber === trimmed)
    if (teacher) {
      console.log('✅ 精确匹配找到教师:', teacher.teacher_name, (teacher as any).cardNumber)
      return teacher
    }
    
    // 查找教师 - 去除前导零后匹配
    const trimmedNoLeadingZeros = trimmed.replace(/^0+/, '')
    if (trimmedNoLeadingZeros !== trimmed) {
      console.log('🔍 尝试去除前导零后匹配教师:', trimmedNoLeadingZeros)
      teacher = teachers.find(t => (t as any).cardNumber === trimmedNoLeadingZeros)
      if (teacher) {
        console.log('✅ 去除前导零后找到教师:', teacher.teacher_name, (teacher as any).cardNumber)
        return teacher
      }
    }
    
    // 查找教师 - 添加前导零后匹配
    if (trimmed.length < 10) {
      const paddedCardNumber = trimmed.padStart(10, '0')
      console.log('🔍 尝试添加前导零后匹配教师:', paddedCardNumber)
      teacher = teachers.find(t => (t as any).cardNumber === paddedCardNumber)
      if (teacher) {
        console.log('✅ 添加前导零后找到教师:', teacher.teacher_name, (teacher as any).cardNumber)
        return teacher
      }
    }
    
    // 查找教师 - 通过teacher_id匹配
    teacher = teachers.find(t => t.teacher_id === trimmed)
    if (teacher) {
      console.log('✅ 通过teacher_id找到教师:', teacher.teacher_name, teacher.teacher_id)
      return teacher
    }
    
    console.log('❌ 未找到教师')
    return null
  }

  // 处理教师卡片扫描 - 使用简单的卡号查找逻辑
  const handleTeacherCardScan = async () => {
    if (!teacherCardNumber.trim()) {
      alert('请输入教师卡片号码')
      return
    }

    try {
      console.log('🔍 开始处理教师卡片数据:', teacherCardNumber)
      setIsScanning(true)

      // 等待一下，确保数据完全加载
      await new Promise(resolve => setTimeout(resolve, 500))

      // 检查教师数据是否已加载
      if (teachers.length === 0) {
        console.log('⚠️ 教师数据尚未加载，等待数据加载...')
        // 等待教师数据加载，最多等待3秒
        let attempts = 0
        while (teachers.length === 0 && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        
        if (teachers.length === 0) {
          console.log('❌ 教师数据加载超时')
          setIsScanning(false)
          return
        }
      }

      console.log('✅ 教师数据已加载，总数:', teachers.length)

      // 直接通过卡号查找教师
      const foundTeacher = findTeacherByCard(teacherCardNumber)

      if (!foundTeacher) {
        console.log('❌ 未找到教师，卡号:', teacherCardNumber)
        console.log('🔍 可用教师卡号:', teachers.slice(0, 10).map(t => t.cardNumber))
        setIsScanning(false)
        return
      }

      // 接受任何有效的教师卡片
      setVerifiedTeacher(foundTeacher)
      setCurrentStep('operation')
      setIsScanning(false)
    } catch (error) {
      console.error('教师身份验证失败:', error)
      alert('教师身份验证失败: ' + (error as Error).message)
      setIsScanning(false)
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
        gift_points: giftPoints ? parseInt(giftPoints) : undefined,
        status: 'approved',
        season_number: 1
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
    setLastCardNumber('')
  }

  // 键盘监听处理HID读卡器输入
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // 只在扫描学生或教师步骤时监听
    if (currentStep !== 'scan-student' && currentStep !== 'scan-teacher') {
      return
    }

    const now = Date.now()
    
    // 处理Enter键 - 立即处理输入
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // 清除超时
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      const cardNumber = inputBuffer.trim()
      const cleanedCardNumber = cardNumber.replace(/\D/g, '')
      
      if (cleanedCardNumber && cleanedCardNumber.length >= 4) {
        console.log('Enter键触发处理，卡号:', cleanedCardNumber)
        
        // 防重复处理
        if (now - lastProcessTime.current < 3000 && lastProcessedCard.current === cleanedCardNumber) {
          console.log('防重复扫描：忽略重复卡片')
          setInputBuffer('')
          setIsScanning(false)
          return
        }
        
        // 更新防重复状态
        lastProcessedCard.current = cleanedCardNumber
        lastProcessTime.current = now
        
        if (currentStep === 'scan-student') {
          setLastCardNumber(cleanedCardNumber)
          setStudentCardNumber(cleanedCardNumber)
          processStudentCard(cleanedCardNumber)
        } else if (currentStep === 'scan-teacher') {
          setTeacherCardNumber(cleanedCardNumber)
          handleTeacherCardScan()
        }
      }
      
      setInputBuffer('')
      setIsScanning(false)
      return
    }

    // 忽略特殊键（如Shift、Ctrl等）
    if (e.key.length > 1) {
      return
    }
    
    // 如果输入间隔超过500ms，重置缓冲区
    if (now - lastInputTime > 500) {
      setInputBuffer('')
      setIsScanning(false)
    }
    
    setLastInputTime(now)
    setIsScanning(true)
    
    // 清除之前的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // 处理输入
    const newBuffer = inputBuffer + e.key
    setInputBuffer(newBuffer)
    
    // 设置新的超时，如果500ms内没有新输入，认为输入完成
    timeoutRef.current = setTimeout(() => {
      const cardNumber = newBuffer.trim()
      
      // 清理卡号：只保留数字
      const cleanedCardNumber = cardNumber.replace(/\D/g, '')
      
      if (cleanedCardNumber && cleanedCardNumber.length >= 4) {
        console.log('超时触发处理，卡号:', cleanedCardNumber)
        
        // 防重复处理
        const now = Date.now()
        if (now - lastProcessTime.current < 3000 && lastProcessedCard.current === cleanedCardNumber) {
          console.log('防重复扫描：忽略重复卡片')
          setInputBuffer('')
          setIsScanning(false)
          return
        }
        
        // 更新防重复状态
        lastProcessedCard.current = cleanedCardNumber
        lastProcessTime.current = now
        
        if (currentStep === 'scan-student') {
          setLastCardNumber(cleanedCardNumber)
          setStudentCardNumber(cleanedCardNumber)
          processStudentCard(cleanedCardNumber)
        } else if (currentStep === 'scan-teacher') {
          setTeacherCardNumber(cleanedCardNumber)
          handleTeacherCardScan()
        }
      }
      
      setInputBuffer('')
      setIsScanning(false)
    }, 500) // 减少到500ms
  }, [inputBuffer, lastInputTime, currentStep, processStudentCard, handleTeacherCardScan])

  // 添加键盘监听
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleKeyPress])

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HID积分操作系统</h1>
        <p className="text-gray-600">通过HID读卡器进行安全的积分操作</p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { step: 'scan-student', label: '扫描学生卡片', icon: CreditCard },
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

      {/* HID读卡器状态提示 */}
      {currentStep === 'scan-student' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              HID读卡器状态
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">HID读卡器已就绪</span>
              </div>
            <p className="text-sm text-gray-600 mt-2">
              请将卡片放在HID读卡器上，或使用手动输入功能
            </p>
          </CardContent>
        </Card>
      )}

        {/* 步骤1: 扫描学生卡片 */}
      {currentStep === 'scan-student' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
                扫描学生卡片
            </CardTitle>
              <CardDescription>请将学生卡片放在HID读卡器上，系统会自动识别并查找学生信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {/* 快速访问 */}
              {(recentStudents.length > 0 || favoriteStudents.length > 0) && (
                <div className="space-y-4">
                  {/* 收藏的学生 */}
                  {favoriteStudents.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <span className="text-red-500">❤️</span>
                        收藏学生
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {favoriteStudents.slice(0, 5).map((student) => (
                <Button 
                            key={student.id}
                            variant="outline"
                            size="sm"
                            className="h-auto p-2 flex flex-col items-center gap-1"
                            onClick={() => {
                              setStudentCardNumber(student.cardNumber || student.student_id || '')
                              processStudentCard(student.cardNumber || student.student_id || '')
                            }}
                          >
                            <span className="font-medium text-xs">{student.student_name}</span>
                            <span className="text-xs text-gray-500">{student.student_id}</span>
                </Button>
                        ))}
                      </div>
              </div>
            )}

                  {/* 最近使用的学生 */}
                  {recentStudents.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        最近使用
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {recentStudents.slice(0, 5).map((student) => (
              <Button 
                            key={student.id}
                            variant="outline"
                            size="sm"
                            className="h-auto p-2 flex flex-col items-center gap-1"
                            onClick={() => {
                              setStudentCardNumber(student.cardNumber || student.student_id || '')
                              processStudentCard(student.cardNumber || student.student_id || '')
                            }}
                          >
                            <span className="font-medium text-xs">{student.student_name}</span>
                            <span className="text-xs text-gray-500">{student.student_id}</span>
              </Button>
                        ))}
                      </div>
              </div>
            )}
              </div>
            )}
            {/* HID读卡器组件 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  自动模式
                </Badge>
                {isScanning && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="animate-pulse">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      读取中...
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsScanning(false)
                        setInputBuffer('')
                        if (timeoutRef.current) {
                          clearTimeout(timeoutRef.current)
                          timeoutRef.current = null
                        }
                      }}
                      className="h-6 text-xs"
                    >
                      停止
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="relative">
              <Input
                  placeholder="将学生卡片放在HID读卡器上，系统会自动识别..."
                  value={lastCardNumber}
                  readOnly
                  className="font-mono text-lg pr-10 bg-gray-50"
                />
                {lastCardNumber && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setLastCardNumber("")
                        setStudentCardNumber("")
                      }}
                      title="清除输入"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
            </div>
            
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="h-4 w-4" />
                <span>将卡片放在HID读卡器上，系统会自动读取10位数字（配置：10 no.in D + Enter）</span>
              </div>
            </div>

            {/* 当前扫描的卡号 */}
            {lastCardNumber && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
            <div>
                    <p className="text-sm font-medium text-blue-900">已扫描卡号</p>
                    <p className="text-2xl font-mono text-blue-600">{lastCardNumber}</p>
                    {isScanning && (
                      <p className="text-sm text-blue-600 mt-1 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        正在自动查找学生...
                      </p>
                    )}
            </div>
            <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLastCardNumber("")
                      setStudentCardNumber("")
                    }}
                  >
                    清除
            </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* 步骤2: 查看学生积分信息 */}
      {currentStep === 'view-points' && selectedStudent && studentPoints && (
        <div className="space-y-6">
          {/* 智能提示 */}
          {smartTips.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <AlertCircle className="h-5 w-5" />
                  智能分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {smartTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-blue-800">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 快速操作建议 */}
          {quickActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  推荐操作
                </CardTitle>
                <CardDescription>基于学生积分情况智能推荐的操作</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                      onClick={() => {
                        if (action.type === 'add_points') {
                          setOperationType('add_points')
                          setPointsChange(action.points)
                          setReason(action.reason)
                          setCurrentStep('scan-teacher')
                        } else if (action.type === 'redeem_gift') {
                          setOperationType('redeem_gift')
                          setGiftName(action.gift)
                          setGiftPoints(action.points)
                          setCurrentStep('scan-teacher')
                        }
                      }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        action.color === 'green' ? 'bg-green-100 text-green-600' :
                        action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {action.icon === 'Plus' && <Plus className="h-5 w-5" />}
                        {action.icon === 'Gift' && <Gift className="h-5 w-5" />}
                        {action.icon === 'Award' && <Award className="h-5 w-5" />}
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{action.reason || action.gift}</p>
                        <p className="text-xs text-gray-500">{action.points}积分</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 学生信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                学生信息
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavoriteStudent(selectedStudent)}
                  className="ml-auto"
                >
                  {favoriteStudents.some(s => s.id === selectedStudent.id) ? '❤️' : '🤍'}
                </Button>
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

      {/* 步骤3: 扫描教师卡片 */}
      {currentStep === 'scan-teacher' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              教师身份验证
            </CardTitle>
            <CardDescription>请将教师卡片放在HID读卡器上，系统会自动识别并验证身份</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* HID读卡器组件 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  自动模式
                </Badge>
                {isScanning && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="animate-pulse">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      读取中...
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsScanning(false)
                        setInputBuffer('')
                        if (timeoutRef.current) {
                          clearTimeout(timeoutRef.current)
                          timeoutRef.current = null
                        }
                      }}
                      className="h-6 text-xs"
                    >
                      停止
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="relative">
               <Input
                  placeholder="将教师卡片放在HID读卡器上，系统会自动识别..."
                 value={teacherCardNumber}
                  readOnly
                  className="font-mono text-lg pr-10 bg-gray-50"
                />
                {teacherCardNumber && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setTeacherCardNumber("")
                      }}
                      title="清除输入"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
             </div>
                )}
            </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>将卡片放在HID读卡器上，系统会自动读取10位数字（配置：10 no.in D + Enter）</span>
              </div>
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

