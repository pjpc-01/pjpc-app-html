"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PageLayout from "@/components/layouts/PageLayout"
import TabbedPage from "@/components/layouts/TabbedPage"
import StatsGrid from "@/components/ui/StatsGrid"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Scan,
  Link,
  Unlink,
  User,
  Smartphone,
  Activity,
  BarChart3,
  Settings,
  ExternalLink
} from "lucide-react"

// 整合的卡片数据接口
interface IntegratedCard {
  id: string
  cardNumber: string
  studentId: string
  studentName: string
  cardType: "NFC" | "RFID"
  status: "active" | "inactive" | "lost" | "replaced" | "pending"
  issuedDate: string
  expiryDate?: string
  notes?: string
  lastUsed?: string
  // 关联信息
  isAssociated: boolean
  associationDate?: string
  replacementRequestId?: string
  // 考勤统计
  totalCheckins: number
  lastCheckin?: string
  // 学生信息
  studentCenter: string
  studentGrade: string
  studentStatus: string
}

interface IntegratedCardManagerProps {
  center?: string
  onCardDetected?: (cardNumber: string) => void
  onError?: (error: string) => void
}

export default function IntegratedCardManager({ 
  center, 
  onCardDetected, 
  onError 
}: IntegratedCardManagerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [cardConflictDialog, setCardConflictDialog] = useState(false)
  const [conflictInfo, setConflictInfo] = useState<any>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }
  
  // 数据状态
  const [cards, setCards] = useState<IntegratedCard[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [filteredCards, setFilteredCards] = useState<IntegratedCard[]>([])
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [centerFilter, setCenterFilter] = useState(center || "all")
  
  // 对话框状态
  const [cardDialog, setCardDialog] = useState(false)
  const [associationDialog, setAssociationDialog] = useState(false)
  const [replacementDialog, setReplacementDialog] = useState(false)
  const [editingCard, setEditingCard] = useState<IntegratedCard | null>(null)
  
  // 新卡片表单
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    studentId: "",
    studentName: "",
    center: "",
    studentSearch: "",
    cardType: "NFC" as "NFC" | "RFID",
    status: "active" as "active" | "inactive" | "lost" | "replaced",
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: "",
    notes: "",
  })

  // 统计数据
  const [stats, setStats] = useState({
    totalCards: 0,
    activeCards: 0,
    associatedCards: 0,
    pendingReplacements: 0,
    todayCheckins: 0,
    systemHealth: 95
  })

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  // 筛选数据
  useEffect(() => {
    filterCards()
  }, [cards, searchTerm, statusFilter, typeFilter, centerFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // 加载学生数据
      const studentsResponse = await fetch('/api/students')
      const studentsData = await studentsResponse.json()
      
      if (studentsData.success) {
        // 检查数据结构
        const studentsList = studentsData.students || studentsData.data || []
        setStudents(studentsList)
        console.log('✅ 学生数据加载成功:', studentsList.length, '个学生')
        console.log('📊 学生数据示例:', studentsList.slice(0, 3))
        console.log('📊 学生数据字段:', studentsList[0] ? Object.keys(studentsList[0]) : '无数据')
        console.log('📊 学生数据ID示例:', studentsList.slice(0, 3).map(s => ({ id: s.id, name: s.student_name })))
      } else {
        console.warn('⚠️ 学生数据加载失败:', studentsData.error)
        setStudents([])
      }
      
      // 使用新的整合API
      const response = await fetch('/api/integrated-cards')
      const data = await response.json()
      
      if (data.success) {
        setCards(data.data || [])
        setStats(data.stats || stats)
        console.log('✅ 卡片数据加载成功:', data.data?.length || 0, '个卡片')
      } else {
        throw new Error(data.error || '加载数据失败')
      }
      
    } catch (error) {
      console.error('加载数据失败:', error)
      setError('加载数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const integrateCardData = async (nfcCards: any[], students: any[]) => {
    const integrated: IntegratedCard[] = []
    
    // 处理现有卡片
    for (const card of nfcCards) {
      const student = students.find(s => s.id === card.student)
      if (student) {
        integrated.push({
          id: card.id,
          cardNumber: card.card_number || '',
          studentId: student.student_id || '',
          studentName: student.student_name || '',
          cardType: card.card_type || 'NFC',
          status: card.replacement_status || 'active',
          issuedDate: card.issued_date || '',
          expiryDate: card.expiry_date || '',
          notes: card.notes || '',
          lastUsed: card.last_used || '',
          isAssociated: true,
          associationDate: card.association_date || '',
          replacementRequestId: card.replacement_request_id || '',
          totalCheckins: card.total_checkins || 0,
          lastCheckin: card.last_checkin || '',
          studentCenter: student.center || '',
          studentGrade: student.standard || '',
          studentStatus: student.status || 'active'
        })
      }
    }
    
    // 处理未关联卡片的学生
    for (const student of students) {
      if (student.cardNumber && !integrated.find(c => c.studentId === student.student_id)) {
        integrated.push({
          id: `temp-${student.id}`,
          cardNumber: student.cardNumber,
          studentId: student.student_id || '',
          studentName: student.student_name || '',
          cardType: 'NFC',
          status: 'active',
          issuedDate: new Date().toISOString().split('T')[0],
          isAssociated: true,
          totalCheckins: 0,
          studentCenter: student.center || '',
          studentGrade: student.standard || '',
          studentStatus: student.status || 'active'
        })
      }
    }
    
    return integrated
  }

  const updateStats = (cards: IntegratedCard[]) => {
    setStats({
      totalCards: cards.length,
      activeCards: cards.filter(c => c.status === 'active').length,
      associatedCards: cards.filter(c => c.isAssociated).length,
      pendingReplacements: cards.filter(c => c.status === 'pending').length,
      todayCheckins: cards.filter(c => c.lastCheckin && new Date(c.lastCheckin).toDateString() === new Date().toDateString()).length,
      systemHealth: 95
    })
  }

  const filterCards = () => {
    let filtered = cards

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 状态筛选
    if (statusFilter !== "all") {
      filtered = filtered.filter(card => card.status === statusFilter)
    }

    // 类型筛选
    if (typeFilter !== "all") {
      filtered = filtered.filter(card => card.cardType === typeFilter)
    }

    // 中心筛选
    if (centerFilter !== "all") {
      filtered = filtered.filter(card => card.studentCenter === centerFilter)
    }

    setFilteredCards(filtered)
  }

  // 编辑卡片
  const handleEditCard = (card: IntegratedCard) => {
    setEditingCard(card)
    setNewCard({
      cardNumber: card.cardNumber,
      studentId: card.studentId,
      studentName: card.studentName,
      center: card.studentCenter,
      studentSearch: card.studentName,
      cardType: card.cardType,
      status: card.status,
      issuedDate: card.issuedDate,
      expiryDate: card.expiryDate || '',
      notes: card.notes || ''
    })
    setCardDialog(true)
  }

  // 更新卡片
  const handleUpdateCard = async () => {
    if (!editingCard) return

    // 验证必填字段
    if (!newCard.cardNumber.trim()) {
      setError('请输入卡片号')
      return
    }
    if (!newCard.studentId.trim()) {
      setError('请选择学生')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('📝 更新卡片:', editingCard.id)
      
      // 调用更新API
      console.log('📤 发送更新请求:', {
        cardId: editingCard.id,
        cardNumber: newCard.cardNumber.trim(),
        studentId: newCard.studentId.trim(),
        cardType: newCard.cardType,
        status: newCard.status,
        notes: newCard.notes.trim()
      })
      
      const response = await fetch('/api/integrated-cards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: editingCard.id,
          cardNumber: newCard.cardNumber.trim(),
          studentId: newCard.studentId.trim(),
          cardType: newCard.cardType,
          status: newCard.status,
          notes: newCard.notes.trim()
        })
      })

      console.log('📊 响应状态:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ 更新失败详情:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(`更新失败: ${response.status} - ${errorData.error || errorData.message || response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ 更新成功:', result)
      
      // 更新本地状态
      const updatedCards = cards.map(card => 
        card.id === editingCard.id 
          ? { ...card, ...newCard, cardNumber: newCard.cardNumber.trim() }
          : card
      )
      setCards(updatedCards)
      updateStats(updatedCards)
      
      // 关闭对话框并重置状态
      setCardDialog(false)
      setEditingCard(null)
      setNewCard({
        cardNumber: "",
        studentId: "",
        studentName: "",
        center: "",
        studentSearch: "",
        cardType: "NFC",
        status: "active",
        issuedDate: new Date().toISOString().split('T')[0],
        expiryDate: "",
        notes: "",
      })
      
      showMessage('success', '卡片更新成功')
    } catch (err: any) {
      console.error('更新卡片失败:', err)
      setError(`更新卡片失败: ${err.message}`)
      showMessage('error', `更新卡片失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 删除卡片
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('确定要删除这张卡片吗？此操作不可撤销。')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🗑️ 删除卡片:', cardId)
      
      // 调用删除API
      const response = await fetch('/api/integrated-cards', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId })
      })

      if (!response.ok) {
        throw new Error(`删除失败: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ 删除成功:', result)
      
      // 从本地状态中移除
      const updatedCards = cards.filter(card => card.id !== cardId)
      setCards(updatedCards)
      updateStats(updatedCards)
      
      showMessage('success', '卡片删除成功')
    } catch (err: any) {
      console.error('删除卡片失败:', err)
      setError(`删除卡片失败: ${err.message}`)
      showMessage('error', `删除卡片失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCard = async () => {
    // 验证必填字段
    if (!newCard.cardNumber.trim()) {
      setError('请输入卡片号')
      return
    }
    if (!newCard.studentId.trim()) {
      setError('请选择学生')
      return
    }
    if (!newCard.center.trim()) {
      setError('请选择分行')
      return
    }

    // 检查学生数据是否已加载
    if (students.length === 0) {
      console.log('⚠️ 学生数据未加载，重新加载...')
      await loadData()
      // 等待一下让数据加载完成
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 再次检查学生数据
      if (students.length === 0) {
        setError('学生数据加载失败，请刷新页面重试')
        return
      }
    }

    console.log('🔍 开始关联卡片:', {
      cardNumber: newCard.cardNumber.trim(),
      studentId: newCard.studentId,
      studentName: newCard.studentName,
      center: newCard.center
    })

    // 检查学生是否存在
    console.log('🔍 验证学生数据:', {
      studentId: newCard.studentId,
      studentsCount: students.length,
      studentsSample: students.slice(0, 3).map(s => ({ id: s.id, name: s.student_name }))
    })

    // 尝试多种方式查找学生
    let selectedStudent = students.find(s => s.id === newCard.studentId)
    
    // 如果通过ID找不到，尝试通过student_id查找
    if (!selectedStudent) {
      selectedStudent = students.find(s => s.student_id === newCard.studentId)
    }
    
    // 如果还是找不到，尝试通过姓名查找
    if (!selectedStudent) {
      selectedStudent = students.find(s => s.student_name === newCard.studentName)
    }
    
    if (!selectedStudent) {
      console.error('❌ 找不到指定的学生:', {
        studentId: newCard.studentId,
        studentName: newCard.studentName,
        availableStudents: students.slice(0, 5).map(s => ({ 
          id: s.id, 
          student_id: s.student_id, 
          name: s.student_name 
        }))
      })
      setError(`找不到指定的学生 "${newCard.studentName}"，请重新选择`)
      return
    }
    console.log('✅ 找到学生:', selectedStudent.student_name)

    // 检查卡号是否已被使用
    const existingCard = cards.find(card => 
      card.cardNumber === newCard.cardNumber.trim() && 
      card.student?.id !== newCard.studentId
    )

    if (existingCard) {
      // 尝试从学生列表中获取更完整的学生信息
      const existingStudentInfo = students.find(s => s.id === existingCard.student?.id)
      const existingStudentName = existingStudentInfo?.student_name || 
                                 existingCard.student?.student_name || 
                                 '未知学生'
      const existingStudentId = existingStudentInfo?.student_id || 
                               existingCard.student?.student_id || 
                               existingCard.studentId

      console.log('🔍 卡号冲突检测:', {
        cardNumber: newCard.cardNumber.trim(),
        existingCard: existingCard,
        existingStudentInfo: existingStudentInfo,
        existingStudentName: existingStudentName
      })

      setConflictInfo({
        cardNumber: newCard.cardNumber.trim(),
        currentStudent: newCard.studentName,
        existingStudent: existingStudentName,
        existingStudentId: existingCard.student?.id || existingCard.studentId
      })
      setCardConflictDialog(true)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/integrated-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: newCard.cardNumber.trim(),
          studentId: newCard.studentId.trim(),
          cardType: newCard.cardType,
          notes: newCard.notes.trim()
        })
      })

      const data = await response.json()
      if (data.success) {
        setCardDialog(false)
        setNewCard({
          cardNumber: "",
          studentId: "",
          studentName: "",
          center: "",
          studentSearch: "",
          cardType: "NFC",
          status: "active",
          issuedDate: new Date().toISOString().split('T')[0],
          expiryDate: "",
          notes: "",
        })
        loadData()
        showMessage('success', '卡片关联成功！')
      } else {
        throw new Error(data.error || '添加卡片失败')
      }
    } catch (error) {
      console.error('添加卡片失败:', error)
      setError(`添加卡片失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCardConflict = async (action: 'replace' | 'cancel') => {
    if (action === 'replace') {
      try {
        setLoading(true)
        // 先取消原学生的卡片关联
        console.log('🔍 开始取消原学生关联:', {
          existingStudentId: conflictInfo.existingStudentId,
          cardNumber: conflictInfo.cardNumber
        })

        const unlinkResponse = await fetch('/api/students', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: conflictInfo.existingStudentId,
            cardNumber: '',
            nfc_tag_id: ''
          })
        })

        console.log('📡 取消关联响应:', {
          status: unlinkResponse.status,
          ok: unlinkResponse.ok
        })

        if (!unlinkResponse.ok) {
          const errorData = await unlinkResponse.json()
          console.error('❌ 取消原学生关联失败:', errorData)
          throw new Error(`取消原学生关联失败: ${errorData.error || unlinkResponse.statusText}`)
        }

        const unlinkData = await unlinkResponse.json()
        console.log('✅ 取消原学生关联成功:', unlinkData)

        // 然后关联新学生
        console.log('🔍 开始关联新学生:', {
          cardNumber: conflictInfo.cardNumber,
          studentId: newCard.studentId,
          studentName: newCard.studentName
        })

        const linkResponse = await fetch('/api/integrated-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardNumber: conflictInfo.cardNumber,
            studentId: newCard.studentId,
            cardType: newCard.cardType,
            notes: newCard.notes
          })
        })

        console.log('📡 关联新学生响应:', {
          status: linkResponse.status,
          ok: linkResponse.ok
        })

        if (!linkResponse.ok) {
          const errorData = await linkResponse.json()
          console.error('❌ 关联新学生失败:', errorData)
          throw new Error(`关联新学生失败: ${errorData.error || linkResponse.statusText}`)
        }

        const data = await linkResponse.json()
        console.log('📊 关联新学生结果:', data)

        if (data.success) {
          setCardDialog(false)
          setCardConflictDialog(false)
          setNewCard({
            cardNumber: "",
            studentId: "",
            studentName: "",
            center: "",
            studentSearch: "",
            cardType: "NFC",
            status: "active",
            issuedDate: new Date().toISOString().split('T')[0],
            expiryDate: "",
            notes: "",
          })
          loadData()
          showMessage('success', '卡片关联成功！已取消原学生关联')
        } else {
          throw new Error(data.error || '关联卡片失败')
        }
      } catch (error) {
        console.error('处理卡号冲突失败:', error)
        setError(`处理卡号冲突失败: ${error instanceof Error ? error.message : '未知错误'}`)
      } finally {
        setLoading(false)
      }
    } else {
      // 取消操作
      setCardConflictDialog(false)
      setConflictInfo(null)
    }
  }

  const handleAssociateCard = async (cardId: string, studentId: string) => {
    try {
      const response = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: studentId,
          cardNumber: cards.find(c => c.id === cardId)?.cardNumber
        })
      })

      if (response.ok) {
        loadData()
        setAssociationDialog(false)
      }
    } catch (error) {
      console.error('关联卡片失败:', error)
    }
  }

  const handleReplaceCard = async (cardId: string) => {
    try {
      const response = await fetch('/api/nfc-card-replacements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cardId,
          status: 'replaced',
          replacement_date: new Date().toISOString()
        })
      })

      if (response.ok) {
        loadData()
        setReplacementDialog(false)
      }
    } catch (error) {
      console.error('补办卡片失败:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'lost': return 'bg-red-100 text-red-800'
      case 'replaced': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'  // 数据库状态：已批准
      case 'rejected': return 'bg-red-100 text-red-800'      // 数据库状态：已拒绝
      case 'completed': return 'bg-blue-100 text-blue-800'  // 数据库状态：已完成
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'inactive': return <XCircle className="h-4 w-4" />
      case 'lost': return <AlertTriangle className="h-4 w-4" />
      case 'replaced': return <RefreshCw className="h-4 w-4" />
      case 'pending': return <AlertTriangle className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />  // 数据库状态：已批准
      case 'rejected': return <XCircle className="h-4 w-4" />        // 数据库状态：已拒绝
      case 'completed': return <CheckCircle className="h-4 w-4" />  // 数据库状态：已完成
      default: return <XCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总卡片数</p>
                <p className="text-2xl font-bold">{stats.totalCards}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃卡片</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeCards}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已关联</p>
                <p className="text-2xl font-bold text-blue-600">{stats.associatedCards}</p>
              </div>
              <Link className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日打卡</p>
                <p className="text-2xl font-bold text-purple-600">{stats.todayCheckins}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要功能区域 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              整合卡片管理
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setCardDialog(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                关联卡片
              </Button>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="cards">卡片管理</TabsTrigger>
              <TabsTrigger value="replacement">补办管理</TabsTrigger>
            </TabsList>

            {/* 概览标签页 */}
            <TabsContent value="overview" className="space-y-4">
              {/* 主要功能按钮 */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">卡片管理</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setCardDialog(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    关联卡片
                  </Button>
                  <Button variant="outline" onClick={loadData} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    刷新
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Input
                  placeholder="搜索卡片号、学生姓名或学号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="lost">丢失</SelectItem>
                    <SelectItem value="replaced">已补办</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCards.slice(0, 6).map((card) => (
                  <Card key={card.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(card.status)}>
                        {getStatusIcon(card.status)}
                        <span className="ml-1">{card.status}</span>
                      </Badge>
                      <Badge variant="outline">{card.cardType}</Badge>
                    </div>
                    <h3 className="font-medium">{card.studentName}</h3>
                    <p className="text-sm text-gray-600">学号: {card.studentId}</p>
                    <p className="text-sm text-gray-600">卡片: {card.cardNumber}</p>
                    <p className="text-sm text-gray-600">中心: {card.studentCenter}</p>
                    {card.lastCheckin && (
                      <p className="text-xs text-gray-500 mt-2">
                        最后打卡: {new Date(card.lastCheckin).toLocaleString()}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 卡片管理标签页 */}
            <TabsContent value="cards" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>卡片号</TableHead>
                    <TableHead>学生信息</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>关联状态</TableHead>
                    <TableHead>最后使用</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.cardNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{card.studentName}</p>
                          <p className="text-sm text-gray-600">{card.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{card.cardType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(card.status)}>
                          {getStatusIcon(card.status)}
                          <span className="ml-1">{card.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {card.isAssociated ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Link className="h-3 w-3 mr-1" />
                            已关联
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <Unlink className="h-3 w-3 mr-1" />
                            未关联
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {card.lastUsed ? new Date(card.lastUsed).toLocaleDateString() : '从未使用'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditCard(card)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>


            {/* 补办管理标签页 */}
            <TabsContent value="replacement" className="space-y-4">
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">补办管理功能</h3>
                <p className="text-gray-600 mb-4">处理卡片丢失和补办申请</p>
                <Button onClick={() => setReplacementDialog(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  处理补办
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 添加卡片对话框 */}
      <Dialog open={cardDialog} onOpenChange={setCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>关联卡片</DialogTitle>
            <DialogDescription>
              为学生关联NFC/RFID卡片（创建新卡片或关联现有卡片）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>分行</Label>
              <Select value={newCard.center || ""} onValueChange={(value) => setNewCard({...newCard, center: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分行" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WX 01">WX 01</SelectItem>
                  <SelectItem value="WX 02">WX 02</SelectItem>
                  <SelectItem value="WX 03">WX 03</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>选择学生</Label>
              <div className="text-xs text-gray-500 mb-2">
                学生总数: {students.length} | 当前分行: {newCard.center || '全部'}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="搜索学生学号或姓名..."
                  value={newCard.studentSearch || ""}
                  onChange={(e) => setNewCard({...newCard, studentSearch: e.target.value})}
                />
                <Select value={newCard.studentId} onValueChange={(value) => {
                  const student = students.find(s => s.id === value)
                  setNewCard({
                    ...newCard, 
                    studentId: value,
                    studentName: student?.student_name || '',
                    center: student?.center || newCard.center,
                    studentSearch: ""
                  })
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学生" />
                  </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <SelectItem value="no-students" disabled>
                      暂无学生数据
                    </SelectItem>
                  ) : (
                    students
                      .filter(s => {
                        const matchesCenter = !newCard.center || s.center === newCard.center
                        const matchesSearch = !newCard.studentSearch || 
                          s.student_id.toLowerCase().includes(newCard.studentSearch.toLowerCase()) ||
                          s.student_name.toLowerCase().includes(newCard.studentSearch.toLowerCase())
                        return matchesCenter && matchesSearch
                      })
                      .sort((a, b) => a.student_id.localeCompare(b.student_id))
                      .map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.student_id} - {student.student_name} ({student.center})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
                </Select>
              </div>
            </div>
            {newCard.studentId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800">已选择学生：</div>
                <div className="text-sm text-blue-700">
                  {newCard.studentName} ({students.find(s => s.id === newCard.studentId)?.student_id || newCard.studentId}) - {newCard.center}
                </div>
              </div>
            )}
            <div>
              <Label>卡片号</Label>
              <Input
                value={newCard.cardNumber}
                onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                placeholder="输入卡片号"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>卡片类型</Label>
                <Select value={newCard.cardType} onValueChange={(value: "NFC" | "RFID") => setNewCard({...newCard, cardType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>状态</Label>
                <Select value={newCard.status} onValueChange={(value: any) => setNewCard({...newCard, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="lost">丢失</SelectItem>
                    <SelectItem value="replaced">已补办</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCardDialog(false)} disabled={loading}>
                取消
              </Button>
              <Button onClick={editingCard ? handleUpdateCard : handleAddCard} disabled={loading}>
                {loading ? (editingCard ? '更新中...' : '关联中...') : (editingCard ? '更新卡片' : '关联卡片')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 卡号冲突对话框 */}
      <Dialog open={cardConflictDialog} onOpenChange={setCardConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              卡号冲突警告
            </DialogTitle>
            <DialogDescription>
              该卡号已被其他学生使用，请选择处理方式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-2">冲突信息：</div>
              <div className="text-sm text-orange-700 space-y-1">
                <p><strong>卡号：</strong>{conflictInfo?.cardNumber}</p>
                <p><strong>当前使用者：</strong>{conflictInfo?.existingStudent} ({conflictInfo?.existingStudentId})</p>
                <p><strong>新关联学生：</strong>{conflictInfo?.currentStudent}</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">处理选项：</div>
              <div className="text-sm text-blue-700">
                <p>• <strong>替换关联：</strong>取消原学生关联，关联新学生</p>
                <p>• <strong>取消操作：</strong>不进行任何更改</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleCardConflict('cancel')}
                disabled={loading}
              >
                取消操作
              </Button>
              <Button 
                onClick={() => handleCardConflict('replace')}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? '处理中...' : '替换关联'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
