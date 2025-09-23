"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
  Scan
} from "lucide-react"

interface NFCCard {
  id: string
  cardNumber: string
  studentId: string
  studentName: string
  cardType: "NFC" | "RFID"
  status: "active" | "inactive" | "lost" | "replaced"
  issuedDate: string
  expiryDate?: string
  notes?: string
  lastUsed?: string
}

interface CardManagementProps {
  cards: NFCCard[]
  onUpdateCards: (cards: NFCCard[]) => void
  onExportCards: () => void
  onAddCard: () => void
  onEditCard: (card: NFCCard) => void
  onScanCard: () => void
}

export default function CardManagement({
  cards,
  onUpdateCards,
  onExportCards,
  onAddCard,
  onEditCard,
  onScanCard
}: CardManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedCards, setSelectedCards] = useState<string[]>([])

  // 过滤卡片
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || card.status === statusFilter
    const matchesType = typeFilter === "all" || card.cardType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'lost': return 'bg-red-100 text-red-800'
      case 'replaced': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3 mr-1" />
      case 'inactive': return <XCircle className="h-3 w-3 mr-1" />
      case 'lost': return <AlertTriangle className="h-3 w-3 mr-1" />
      case 'replaced': return <RefreshCw className="h-3 w-3 mr-1" />
      default: return <XCircle className="h-3 w-3 mr-1" />
    }
  }

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCards(filteredCards.map(c => c.id))
    } else {
      setSelectedCards([])
    }
  }

  // 处理单个选择
  const handleSelectCard = (cardId: string, checked: boolean) => {
    if (checked) {
      setSelectedCards(prev => [...prev, cardId])
    } else {
      setSelectedCards(prev => prev.filter(id => id !== cardId))
    }
  }

  // 批量更新状态
  const bulkUpdateStatus = (status: "active" | "inactive" | "lost" | "replaced") => {
    const updatedCards = cards.map(card => 
      selectedCards.includes(card.id) ? { ...card, status } : card
    )
    onUpdateCards(updatedCards)
    setSelectedCards([])
  }

  // 批量删除
  const bulkDeleteCards = () => {
    const updatedCards = cards.filter(card => !selectedCards.includes(card.id))
    onUpdateCards(updatedCards)
    setSelectedCards([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            卡片管理
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={onExportCards} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
            <Button onClick={onAddCard} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加卡片
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索和过滤 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索卡片号、学生ID或姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">激活</SelectItem>
              <SelectItem value="inactive">停用</SelectItem>
              <SelectItem value="lost">丢失</SelectItem>
              <SelectItem value="replaced">已替换</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="类型筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="NFC">NFC</SelectItem>
              <SelectItem value="RFID">RFID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 批量操作 */}
        {selectedCards.length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg mb-4">
            <span className="text-sm font-medium">已选择 {selectedCards.length} 张卡片</span>
            <Button onClick={() => bulkUpdateStatus("active")} size="sm" variant="outline">
              <CheckCircle className="h-3 w-3 mr-1" />
              批量激活
            </Button>
            <Button onClick={() => bulkUpdateStatus("inactive")} size="sm" variant="outline">
              <XCircle className="h-3 w-3 mr-1" />
              批量停用
            </Button>
            <Button onClick={() => bulkUpdateStatus("lost")} size="sm" variant="outline">
              <AlertTriangle className="h-3 w-3 mr-1" />
              标记丢失
            </Button>
            <Button onClick={bulkDeleteCards} size="sm" variant="destructive">
              <Trash2 className="h-3 w-3 mr-1" />
              批量删除
            </Button>
          </div>
        )}

        {/* 卡片表格 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>卡片号</TableHead>
              <TableHead>学生ID</TableHead>
              <TableHead>学生姓名</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>发行日期</TableHead>
              <TableHead>最后使用</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCards.map((card) => (
              <TableRow key={card.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedCards.includes(card.id)}
                    onCheckedChange={(checked) => handleSelectCard(card.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-mono">{card.cardNumber}</TableCell>
                <TableCell>{card.studentId}</TableCell>
                <TableCell>{card.studentName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{card.cardType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(card.status)}>
                    {getStatusIcon(card.status)}
                    {card.status === "active" ? "激活" : 
                     card.status === "inactive" ? "停用" :
                     card.status === "lost" ? "丢失" : "已替换"}
                  </Badge>
                </TableCell>
                <TableCell>{card.issuedDate}</TableCell>
                <TableCell>{card.lastUsed || "未使用"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEditCard(card)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={onScanCard}>
                      <Scan className="h-3 w-3" />
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无卡片</h3>
            <p className="text-gray-600">没有找到符合条件的卡片</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

