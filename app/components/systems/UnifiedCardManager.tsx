"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Link,
  Unlink,
  User,
  Users,
  BarChart3,
  Settings,
  Database,
  Shield,
  Activity,
  Clock,
  MapPin,
  FileText,
  Calendar,
  Smartphone,
  Wifi,
  WifiOff
} from "lucide-react"
import CardReplacementManager from "./CardReplacementManager"
import IntegratedCardManager from "./IntegratedCardManager"

// 统一的卡片数据接口
interface UnifiedCard {
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
  // 设备信息
  deviceId?: string
  deviceName?: string
  deviceStatus?: "online" | "offline" | "maintenance"
}

interface UnifiedCardManagerProps {
  center?: string
}

export default function UnifiedCardManager({ center }: UnifiedCardManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [cards, setCards] = useState<UnifiedCard[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [filteredCards, setFilteredCards] = useState<UnifiedCard[]>([])
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [centerFilter, setCenterFilter] = useState(center || "all")
  
  // 对话框状态
  const [cardDialog, setCardDialog] = useState(false)
  const [editingCard, setEditingCard] = useState<UnifiedCard | null>(null)
  
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

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
        const studentsList = studentsData.students || studentsData.data || []
        setStudents(studentsList)
        console.log('✅ 学生数据加载成功:', studentsList.length, '个学生')
      } else {
        console.warn('⚠️ 学生数据加载失败:', studentsData.error)
        setStudents([])
      }
      
      // 使用新的整合API
      const response = await fetch('/api/integrated-cards')
      const data = await response.json()
      
      if (data.success) {
        // 转换API数据格式以匹配UnifiedCard接口
        const transformedCards: UnifiedCard[] = (data.data || []).map((item: any) => ({
          id: item.id,
          cardNumber: item.cardNumber || '',
          studentId: item.studentId || '',
          studentName: item.studentName || '',
          cardType: item.cardType || 'NFC',
          status: item.status || 'active',
          issuedDate: item.issuedDate || '',
          expiryDate: item.expiryDate || '',
          notes: item.notes || '',
          lastUsed: item.lastUsed || '',
          isAssociated: item.isAssociated || false,
          associationDate: item.associationDate || '',
          replacementRequestId: item.replacementRequestId || '',
          totalCheckins: item.totalCheckins || 0,
          lastCheckin: item.lastCheckin || '',
          studentCenter: item.studentCenter || '',
          studentGrade: item.studentGrade || '',
          studentStatus: item.studentStatus || 'active',
          deviceId: item.deviceId || '',
          deviceName: item.deviceName || '',
          deviceStatus: item.deviceStatus || 'offline'
        }))
        
        setCards(transformedCards)
        setStats(data.stats || {
          totalCards: transformedCards.length,
          activeCards: transformedCards.filter(c => c.status === 'active').length,
          associatedCards: transformedCards.filter(c => c.isAssociated).length,
          pendingReplacements: transformedCards.filter(c => c.status === 'pending').length,
          todayCheckins: transformedCards.filter(c => 
            c.lastCheckin && new Date(c.lastCheckin).toDateString() === new Date().toDateString()
          ).length,
          systemHealth: 95
        })
        console.log('✅ 卡片数据加载成功:', transformedCards.length, '个卡片')
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

  const filterCards = () => {
    let filtered = cards.filter(card => {
      const matchesSearch = card.cardNumber.includes(searchTerm) || 
                           card.studentName.includes(searchTerm) || 
                           card.studentId.includes(searchTerm)
      const matchesStatus = statusFilter === "all" || card.status === statusFilter
      const matchesType = typeFilter === "all" || card.cardType === typeFilter
      const matchesCenter = centerFilter === "all" || card.studentCenter === centerFilter
      
      return matchesSearch && matchesStatus && matchesType && matchesCenter
    })
    
    setFilteredCards(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'lost': return 'bg-red-100 text-red-800'
      case 'replaced': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />
      case 'inactive': return <XCircle className="h-3 w-3" />
      case 'lost': return <AlertTriangle className="h-3 w-3" />
      case 'replaced': return <RefreshCw className="h-3 w-3" />
      case 'pending': return <AlertTriangle className="h-3 w-3" />
      default: return <XCircle className="h-3 w-3" />
    }
  }

  // 编辑卡片
  const handleEditCard = (card: UnifiedCard) => {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
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

  const updateStats = (cards: UnifiedCard[]) => {
    setStats({
      totalCards: cards.length,
      activeCards: cards.filter(c => c.status === 'active').length,
      associatedCards: cards.filter(c => c.isAssociated).length,
      pendingReplacements: cards.filter(c => c.status === 'pending').length,
      todayCheckins: cards.filter(c => c.lastCheckin && new Date(c.lastCheckin).toDateString() === new Date().toDateString()).length,
      systemHealth: 95
    })
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              系统概览
            </TabsTrigger>
            <TabsTrigger value="replacement" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              卡片补办
            </TabsTrigger>
            <TabsTrigger value="association" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              关联管理
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              设备管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              系统设置
            </TabsTrigger>
          </TabsList>

      {/* 系统概览 */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                系统状态概览
              </CardTitle>
              <CardDescription>实时监控卡片系统运行状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">读卡器状态</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">卡片识别</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">用户关联</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">正常</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                使用统计
              </CardTitle>
              <CardDescription>最近7天的卡片使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">今日使用次数</span>
                  <span className="font-semibold">456</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">本周使用次数</span>
                  <span className="font-semibold">3,128</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">平均每日使用</span>
                  <span className="font-semibold">447</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">最活跃时段</span>
                  <span className="font-semibold">08:00-09:00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              快速操作
            </CardTitle>
            <CardDescription>卡片管理系统的快速操作入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">新增卡片</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Search className="h-6 w-6" />
                <span className="text-sm">搜索卡片</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Download className="h-6 w-6" />
                <span className="text-sm">导出数据</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-6 w-6" />
                <span className="text-sm">刷新数据</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>


      {/* 卡片管理 */}
      <TabsContent value="cards" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                卡片管理
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => setCardDialog(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  添加卡片
                </Button>
                <Button onClick={loadData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 搜索和筛选 */}
            <div className="flex gap-4 mb-4">
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

            {/* 卡片列表 */}
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
          </CardContent>
        </Card>
      </TabsContent>

      {/* 卡片补办 */}
      <TabsContent value="replacement" className="space-y-6">
        <CardReplacementManager center={center} />
      </TabsContent>

      {/* 关联管理 */}
      <TabsContent value="association" className="space-y-6">
        <IntegratedCardManager center={center} />
      </TabsContent>

      {/* 设备管理 */}
      <TabsContent value="devices" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  设备管理
                </CardTitle>
                <CardDescription>管理NFC/RFID读卡器设备</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新状态
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加设备
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 设备状态统计 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">在线设备</p>
                        <p className="text-2xl font-bold text-green-600">8</p>
                      </div>
                      <Wifi className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">离线设备</p>
                        <p className="text-2xl font-bold text-red-600">2</p>
                      </div>
                      <WifiOff className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">维护中</p>
                        <p className="text-2xl font-bold text-orange-600">1</p>
                      </div>
                      <Settings className="h-8 w-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总设备数</p>
                        <p className="text-2xl font-bold text-blue-600">11</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 设备列表 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备名称</TableHead>
                    <TableHead>位置</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最后活动</TableHead>
                    <TableHead>今日使用</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">入口读卡器</span>
                      </div>
                    </TableCell>
                    <TableCell>主入口</TableCell>
                    <TableCell>
                      <Badge variant="outline">NFC</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <Wifi className="h-3 w-3 mr-1" />
                        在线
                      </Badge>
                    </TableCell>
                    <TableCell>2分钟前</TableCell>
                    <TableCell>45次</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Activity className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">出口读卡器</span>
                      </div>
                    </TableCell>
                    <TableCell>主出口</TableCell>
                    <TableCell>
                      <Badge variant="outline">RFID</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <Wifi className="h-3 w-3 mr-1" />
                        在线
                      </Badge>
                    </TableCell>
                    <TableCell>5分钟前</TableCell>
                    <TableCell>32次</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Activity className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">备用读卡器</span>
                      </div>
                    </TableCell>
                    <TableCell>备用区域</TableCell>
                    <TableCell>
                      <Badge variant="outline">混合</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-800">
                        <WifiOff className="h-3 w-3 mr-1" />
                        离线
                      </Badge>
                    </TableCell>
                    <TableCell>2小时前</TableCell>
                    <TableCell>0次</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 系统设置 */}
      <TabsContent value="settings" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系统设置
              </CardTitle>
              <CardDescription>配置卡片管理系统参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">自动过期提醒</span>
                  <Button variant="outline" size="sm">配置</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">批量操作权限</span>
                  <Button variant="outline" size="sm">设置</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">数据备份</span>
                  <Button variant="outline" size="sm">备份</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                系统监控
              </CardTitle>
              <CardDescription>监控系统性能和运行状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">系统负载</span>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">数据库连接</span>
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API响应时间</span>
                  <span className="text-sm text-gray-600">45ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    {/* 添加/编辑卡片对话框 */}
    <Dialog open={cardDialog} onOpenChange={setCardDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingCard ? '编辑卡片' : '添加卡片'}</DialogTitle>
          <DialogDescription>
            {editingCard ? '修改卡片信息' : '为学生添加新的NFC/RFID卡片'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>卡片号</Label>
            <Input
              value={newCard.cardNumber}
              onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
              placeholder="输入卡片号"
            />
          </div>
          <div>
            <Label>学生</Label>
            <Select value={newCard.studentId} onValueChange={(value) => {
              const student = students.find(s => s.id === value)
              setNewCard({
                ...newCard, 
                studentId: value,
                studentName: student?.student_name || '',
                center: student?.center || newCard.center
              })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.student_id} - {student.student_name} ({student.center})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Select value={newCard.status} onValueChange={(value: "active" | "inactive" | "lost" | "replaced") => setNewCard({...newCard, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                  <SelectItem value="lost">丢失</SelectItem>
                  <SelectItem value="replaced">已补办</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>备注</Label>
            <Input
              value={newCard.notes}
              onChange={(e) => setNewCard({...newCard, notes: e.target.value})}
              placeholder="输入备注信息"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCardDialog(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={editingCard ? handleUpdateCard : () => {}} disabled={loading}>
              {loading ? (editingCard ? '更新中...' : '添加中...') : (editingCard ? '更新卡片' : '添加卡片')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  )
}
