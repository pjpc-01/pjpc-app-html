"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Zap,
  ExternalLink,
} from "lucide-react"
import { NFCCard } from "@/lib/nfc-rfid"

interface NFCCardsTabProps {
  cards: NFCCard[]
  loading: boolean
  newCardDialog: boolean
  setNewCardDialog: (open: boolean) => void
  editingCard: NFCCard | null
  setEditingCard: (card: NFCCard | null) => void
  newCard: any
  setNewCard: (card: any) => void
  addCard: () => void
  updateCard: () => void
  deleteCard: (id: string) => void
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}

export default function NFCCardsTab({
  cards,
  loading,
  newCardDialog,
  setNewCardDialog,
  editingCard,
  setEditingCard,
  newCard,
  setNewCard,
  addCard,
  updateCard,
  deleteCard,
  getStatusColor,
  getStatusIcon
}: NFCCardsTabProps) {
  return (
    <div className="space-y-6">
      {/* 卡片统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总卡数</p>
                <p className="text-2xl font-bold text-blue-600">{cards.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃卡</p>
                <p className="text-2xl font-bold text-green-600">
                  {cards.filter(card => card.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">问题卡</p>
                <p className="text-2xl font-bold text-red-600">
                  {cards.filter(card => card.status === 'lost' || card.status === 'inactive').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 卡片管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              卡片管理
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setNewCardDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加卡片
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setNewCardDialog(true)} 
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                快速添加（带网址）
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>卡号</TableHead>
                <TableHead>学生ID</TableHead>
                <TableHead>学生姓名</TableHead>
                <TableHead>卡片类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>专属网址</TableHead>
                <TableHead>发行日期</TableHead>
                <TableHead>到期日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono">{card.cardNumber}</TableCell>
                  <TableCell>{card.studentId}</TableCell>
                  <TableCell>{card.studentName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{card.cardType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(card.status)}>
                      {getStatusIcon(card.status)}
                      {card.status === 'active' ? '活跃' : 
                       card.status === 'inactive' ? '停用' : 
                       card.status === 'lost' ? '丢失' : '已替换'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {card.studentUrl ? (
                      <a 
                        href={card.studentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        访问网址
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">未设置</span>
                    )}
                  </TableCell>
                  <TableCell>{card.issuedDate}</TableCell>
                  <TableCell>{card.expiryDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCard(card)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCard(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 添加/编辑卡片对话框 */}
      <Dialog open={newCardDialog || !!editingCard} onOpenChange={() => {
        setNewCardDialog(false)
        setEditingCard(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? '编辑卡片' : '添加新卡片'}
            </DialogTitle>
            <DialogDescription>
              {editingCard ? '修改卡片信息' : '创建新的NFC/RFID卡片'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardNumber">卡号</Label>
                <Input
                  id="cardNumber"
                  value={editingCard ? editingCard.cardNumber : newCard.cardNumber}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, cardNumber: e.target.value})
                    : setNewCard({...newCard, cardNumber: e.target.value})
                  }
                  placeholder="输入卡号"
                />
              </div>
              <div>
                <Label htmlFor="studentId">学生ID</Label>
                <Input
                  id="studentId"
                  value={editingCard ? editingCard.studentId : newCard.studentId}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, studentId: e.target.value})
                    : setNewCard({...newCard, studentId: e.target.value})
                  }
                  placeholder="输入学生ID"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentName">学生姓名</Label>
                <Input
                  id="studentName"
                  value={editingCard ? editingCard.studentName : newCard.studentName}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, studentName: e.target.value})
                    : setNewCard({...newCard, studentName: e.target.value})
                  }
                  placeholder="输入学生姓名"
                />
              </div>
              <div>
                <Label htmlFor="cardType">卡片类型</Label>
                <Select 
                  value={editingCard ? editingCard.cardType : newCard.cardType}
                  onValueChange={(value: "NFC" | "RFID") => editingCard 
                    ? setEditingCard({...editingCard, cardType: value})
                    : setNewCard({...newCard, cardType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFC">NFC</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issuedDate">发行日期</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={editingCard ? editingCard.issuedDate : newCard.issuedDate}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, issuedDate: e.target.value})
                    : setNewCard({...newCard, issuedDate: e.target.value})
                  }
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">到期日期</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={editingCard ? editingCard.expiryDate : newCard.expiryDate}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, expiryDate: e.target.value})
                    : setNewCard({...newCard, expiryDate: e.target.value})
                  }
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">卡片状态</Label>
                <Select 
                  value={editingCard ? editingCard.status : newCard.status}
                  onValueChange={(value: "active" | "inactive" | "lost" | "replaced") => editingCard 
                    ? setEditingCard({...editingCard, status: value})
                    : setNewCard({...newCard, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                    <SelectItem value="lost">丢失</SelectItem>
                    <SelectItem value="replaced">已替换</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="balance">余额</Label>
                <Input
                  id="balance"
                  type="number"
                  value={editingCard ? editingCard.balance : newCard.balance}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, balance: parseFloat(e.target.value) || 0})
                    : setNewCard({...newCard, balance: parseFloat(e.target.value) || 0})
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            
            {/* 学生专属网址 - 突出显示 */}
            <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <Label htmlFor="studentUrl" className="text-blue-800 font-semibold">
                  学生专属网址
                </Label>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  重要
                </Badge>
              </div>
              <div className="space-y-2">
                <Input
                  id="studentUrl"
                  type="url"
                  value={editingCard ? editingCard.studentUrl || '' : newCard.studentUrl || ''}
                  onChange={(e) => editingCard 
                    ? setEditingCard({...editingCard, studentUrl: e.target.value})
                    : setNewCard({...newCard, studentUrl: e.target.value})
                  }
                  placeholder="https://school.com/student/STU001"
                  className="border-blue-300 focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const studentId = editingCard ? editingCard.studentId : newCard.studentId
                      if (studentId) {
                        const autoUrl = `https://school.com/student/${studentId}`
                        if (editingCard) {
                          setEditingCard({...editingCard, studentUrl: autoUrl})
                        } else {
                          setNewCard({...newCard, studentUrl: autoUrl})
                        }
                      }
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    自动生成
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = editingCard ? editingCard.studentUrl : newCard.studentUrl
                      if (url) {
                        window.open(url, '_blank')
                      }
                    }}
                    disabled={!editingCard?.studentUrl && !newCard.studentUrl}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    测试链接
                  </Button>
                </div>
                <p className="text-xs text-blue-600">
                  每个学生都有专属的网址，用于访问个人信息和相关资源
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">备注</Label>
              <Input
                id="notes"
                value={editingCard ? editingCard.notes : newCard.notes}
                onChange={(e) => editingCard 
                  ? setEditingCard({...editingCard, notes: e.target.value})
                  : setNewCard({...newCard, notes: e.target.value})
                }
                placeholder="输入备注信息"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewCardDialog(false)
                  setEditingCard(null)
                }}
              >
                取消
              </Button>
              <Button 
                onClick={editingCard ? updateCard : addCard}
                disabled={loading}
              >
                {loading ? "处理中..." : (editingCard ? "更新" : "添加")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
