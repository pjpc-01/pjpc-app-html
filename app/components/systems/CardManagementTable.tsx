"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Unlink
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

interface CardManagementTableProps {
  center?: string
}

export default function CardManagementTable({ center }: CardManagementTableProps) {
  const [loading, setLoading] = useState(false)
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
      // 模拟数据加载
      const mockCards: IntegratedCard[] = [
        {
          id: "1",
          cardNumber: "1234567890",
          studentId: "STU001",
          studentName: "张三",
          cardType: "NFC",
          status: "active",
          issuedDate: "2024-01-01",
          expiryDate: "2025-01-01",
          lastUsed: "2024-12-15",
          isAssociated: true,
          associationDate: "2024-01-01",
          studentCenter: "中心A",
          studentGrade: "三年级",
          studentStatus: "在读",
          totalCheckins: 45,
          lastCheckin: "2024-12-15"
        },
        {
          id: "2",
          cardNumber: "0987654321",
          studentId: "STU002",
          studentName: "李四",
          cardType: "RFID",
          status: "active",
          issuedDate: "2024-01-15",
          lastUsed: "2024-12-14",
          isAssociated: true,
          associationDate: "2024-01-15",
          studentCenter: "中心A",
          studentGrade: "四年级",
          studentStatus: "在读",
          totalCheckins: 32,
          lastCheckin: "2024-12-14"
        },
        {
          id: "3",
          cardNumber: "1122334455",
          studentId: "STU003",
          studentName: "王五",
          cardType: "NFC",
          status: "lost",
          issuedDate: "2024-02-01",
          isAssociated: false,
          studentCenter: "中心B",
          studentGrade: "五年级",
          studentStatus: "在读",
          totalCheckins: 0
        }
      ]
      
      setCards(mockCards)
      setStats({
        totalCards: mockCards.length,
        activeCards: mockCards.filter(c => c.status === 'active').length,
        associatedCards: mockCards.filter(c => c.isAssociated).length,
        pendingReplacements: mockCards.filter(c => c.status === 'lost').length,
        todayCheckins: 0,
        systemHealth: 95
      })
    } catch (error) {
      console.error('加载数据失败:', error)
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              卡片管理
            </CardTitle>
            <CardDescription>管理所有NFC/RFID卡片</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button size="sm" onClick={() => setCardDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新增卡片
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="搜索卡片号、学生姓名或ID..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
                <SelectItem value="lost">丢失</SelectItem>
                <SelectItem value="replaced">已替换</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="NFC">NFC</SelectItem>
                <SelectItem value="RFID">RFID</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
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
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCards.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无卡片数据</h3>
              <p className="text-gray-600 mb-4">请添加第一张卡片或调整筛选条件</p>
              <Button onClick={() => setCardDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加第一张卡片
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
