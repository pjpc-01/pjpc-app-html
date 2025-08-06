"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DollarSign, Edit, Trash2, Plus } from "lucide-react"

// Custom Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, className = "" }: { checked: boolean; onChange: () => void; className?: string }) => {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      style={{
        backgroundColor: checked ? '#374151' : '#e5e7eb',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      />
    </button>
  )
}

export default function FeeManagement() {
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false)
  const [isEditFeeDialogOpen, setIsEditFeeDialogOpen] = useState(false)
  const [editingFeeItem, setEditingFeeItem] = useState<any>(null)
  const [isFeeEditMode, setIsFeeEditMode] = useState(false)
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [newFeeItem, setNewFeeItem] = useState({
    name: "",
    amount: "",
    type: "",
    description: "",
    applicableGrades: [] as string[],
    status: "active",
    category: "",
    subItems: [] as { id: number; name: string; amount: number; description: string; active: boolean }[]
  })

  const [feeItems, setFeeItems] = useState([
    { 
      id: 1, 
      name: "学费", 
      amount: 1200, 
      type: "monthly", 
      description: "每月学费", 
      applicableGrades: ["三年级", "四年级", "五年级"], 
      status: "active",
      category: "教育费用",
      subItems: [
        { id: 1, name: "基础学费", amount: 800, description: "基础课程费用", active: true },
        { id: 2, name: "特色课程费", amount: 400, description: "特色课程额外费用", active: true }
      ]
    },
    { 
      id: 2, 
      name: "餐费", 
      amount: 300, 
      type: "monthly", 
      description: "每月餐费", 
      applicableGrades: ["三年级", "四年级", "五年级"], 
      status: "active",
      category: "生活费用",
      subItems: [
        { id: 1, name: "午餐费", amount: 200, description: "每日午餐费用", active: true },
        { id: 2, name: "点心费", amount: 100, description: "下午点心费用", active: true }
      ]
    },
    { 
      id: 3, 
      name: "教材费", 
      amount: 200, 
      type: "one-time", 
      description: "学期教材费用", 
      applicableGrades: ["三年级", "四年级", "五年级"], 
      status: "active",
      category: "教育费用",
      subItems: [
        { id: 1, name: "课本费", amount: 120, description: "各科课本费用", active: true },
        { id: 2, name: "练习册费", amount: 80, description: "练习册费用", active: true }
      ]
    },
    { 
      id: 4, 
      name: "活动费", 
      amount: 150, 
      type: "one-time", 
      description: "课外活动费用", 
      applicableGrades: ["三年级", "四年级"], 
      status: "active",
      category: "活动费用",
      subItems: [
        { id: 1, name: "户外活动费", amount: 100, description: "户外活动费用", active: true },
        { id: 2, name: "室内活动费", amount: 50, description: "室内活动费用", active: true }
      ]
    },
  ])

  const grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "初一", "初二", "初三"]

  const handleAddFeeItem = () => {
    if (!newFeeItem.name || !newFeeItem.type) {
      alert("请填写完整信息")
      return
    }

    const totalAmount = calculateTotalAmount(newFeeItem.subItems)

    const feeItem = {
      id: Date.now(),
      name: newFeeItem.name,
      amount: totalAmount,
      type: newFeeItem.type,
      description: newFeeItem.description,
      applicableGrades: newFeeItem.applicableGrades,
      status: newFeeItem.status,
      category: newFeeItem.category,
      subItems: newFeeItem.subItems
    }

    setFeeItems([...feeItems, feeItem])
    setNewFeeItem({
      name: "",
      amount: "",
      type: "",
      description: "",
      applicableGrades: [],
      status: "active",
      category: "",
      subItems: []
    })
    setIsAddFeeDialogOpen(false)
  }

  const handleEditFeeItem = (feeItem: any) => {
    setEditingFeeItem(feeItem)
    setNewFeeItem({
      name: feeItem.name,
      amount: feeItem.amount.toString(),
      type: feeItem.type,
      description: feeItem.description,
      applicableGrades: feeItem.applicableGrades,
      status: feeItem.status,
      category: feeItem.category,
      subItems: feeItem.subItems
    })
    setIsEditFeeDialogOpen(true)
  }

  const handleUpdateFeeItem = () => {
    if (!newFeeItem.name || !newFeeItem.type) {
      alert("请填写完整信息")
      return
    }

    const totalAmount = calculateTotalAmount(newFeeItem.subItems)

    const updatedFeeItem = {
      ...editingFeeItem,
      name: newFeeItem.name,
      amount: totalAmount,
      type: newFeeItem.type,
      description: newFeeItem.description,
      applicableGrades: newFeeItem.applicableGrades,
      status: newFeeItem.status,
      category: newFeeItem.category,
      subItems: newFeeItem.subItems
    }

    setFeeItems(feeItems.map(item => item.id === editingFeeItem.id ? updatedFeeItem : item))
    setEditingFeeItem(null)
    setNewFeeItem({
      name: "",
      amount: "",
      type: "",
      description: "",
      applicableGrades: [],
      status: "active",
      category: "",
      subItems: []
    })
    setIsEditFeeDialogOpen(false)
  }

  const handleDeleteFeeItem = (feeItemId: number) => {
    if (confirm("确定要删除这个收费项目吗？")) {
      setFeeItems(feeItems.filter(item => item.id !== feeItemId))
    }
  }

  const handleFeeItemInputChange = (field: string, value: string) => {
    setNewFeeItem(prev => ({ ...prev, [field]: value }))
  }

  const handleFeeEditMode = () => {
    setIsFeeEditMode(!isFeeEditMode)
  }

  const toggleExpanded = (itemId: number) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const addSubItem = () => {
    const newSubItem = {
      id: Date.now(),
      name: "",
      amount: 0,
      description: "",
      active: true
    }
    setNewFeeItem(prev => ({
      ...prev,
      subItems: [...prev.subItems, newSubItem]
    }))
  }

  const updateSubItem = (index: number, field: string, value: string | number | boolean) => {
    setNewFeeItem(prev => ({
      ...prev,
      subItems: prev.subItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeSubItem = (index: number) => {
    setNewFeeItem(prev => ({
      ...prev,
      subItems: prev.subItems.filter((_, i) => i !== index)
    }))
  }

  const calculateTotalAmount = (subItems: any[]) => {
    return subItems
      .filter(subItem => subItem.active)
      .reduce((total, subItem) => total + subItem.amount, 0)
  }

  const toggleSubItemActive = (itemId: number, subItemId: number) => {
    setFeeItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          subItems: item.subItems.map(subItem => 
            subItem.id === subItemId 
              ? { ...subItem, active: !subItem.active }
              : subItem
          ),
          amount: calculateTotalAmount(
            item.subItems.map(subItem => 
              subItem.id === subItemId 
                ? { ...subItem, active: !subItem.active }
                : subItem
            )
          )
        }
      }
      return item
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                收费项目管理
              </CardTitle>
              <CardDescription>管理所有收费项目</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleFeeEditMode}>
                <Edit className="h-4 w-4 mr-2" />
                {isFeeEditMode ? "完成编辑" : "编辑"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分类</TableHead>
                <TableHead>总金额</TableHead>
                <TableHead>收费类型</TableHead>
                {isFeeEditMode && <TableHead>操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-2">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        onClick={() => toggleExpanded(item.id)}
                      >
                        <span>{item.category}</span>
                      </div>
                      {expandedItems.includes(item.id) && (
                        <div className="pl-8 space-y-2">
                          {item.subItems.map((subItem) => (
                            <div key={subItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-2 border-blue-200">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium min-w-[120px]">{subItem.name}</span>
                                <ToggleSwitch
                                  checked={subItem.active}
                                  onChange={() => toggleSubItemActive(item.id, subItem.id)}
                                />
                              </div>
                              <span className="text-sm font-medium text-blue-600">¥{subItem.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">¥{calculateTotalAmount(item.subItems)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.type === "monthly" ? "按月收费" : 
                       item.type === "one-time" ? "一次性收费" :
                       item.type === "semester" ? "学期收费" : "年度收费"}
                    </Badge>
                  </TableCell>
                  {isFeeEditMode && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFeeItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFeeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Fee Dialog */}
      <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            添加收费项目
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加收费项目</DialogTitle>
            <DialogDescription>创建新的收费项目</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  value={newFeeItem.category}
                  onChange={(e) => handleFeeItemInputChange("category", e.target.value)}
                  placeholder="例如：教育费用、生活费用"
                />
              </div>
              <div>
                <Label htmlFor="name">项目名称</Label>
                <Input
                  id="name"
                  value={newFeeItem.name}
                  onChange={(e) => handleFeeItemInputChange("name", e.target.value)}
                  placeholder="例如：学费、餐费"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="type">收费类型</Label>
              <Select value={newFeeItem.type} onValueChange={(value) => handleFeeItemInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择收费类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">按月收费</SelectItem>
                  <SelectItem value="one-time">一次性收费</SelectItem>
                  <SelectItem value="semester">学期收费</SelectItem>
                  <SelectItem value="annual">年度收费</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={newFeeItem.description}
                onChange={(e) => handleFeeItemInputChange("description", e.target.value)}
                placeholder="详细描述收费项目"
              />
            </div>

            <div>
              <Label>子项目</Label>
              <div className="space-y-3 mt-2">
                {newFeeItem.subItems.map((subItem, index) => (
                  <div key={subItem.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">子项目 {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubItem(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">名称</Label>
                        <Input
                          value={subItem.name}
                          onChange={(e) => updateSubItem(index, "name", e.target.value)}
                          placeholder="子项目名称"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">金额</Label>
                        <Input
                          type="number"
                          value={subItem.amount}
                          onChange={(e) => updateSubItem(index, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">描述</Label>
                        <Input
                          value={subItem.description}
                          onChange={(e) => updateSubItem(index, "description", e.target.value)}
                          placeholder="子项目描述"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={subItem.active}
                        onChange={() => updateSubItem(index, "active", !subItem.active)}
                      />
                      <span className="text-xs text-gray-600">
                        {subItem.active ? "启用" : "停用"}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加子项目
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAddFeeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddFeeItem}>
              添加项目
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Dialog */}
      <Dialog open={isEditFeeDialogOpen} onOpenChange={setIsEditFeeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑收费项目</DialogTitle>
            <DialogDescription>修改收费项目信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">分类</Label>
                <Input
                  id="edit-category"
                  value={newFeeItem.category}
                  onChange={(e) => handleFeeItemInputChange("category", e.target.value)}
                  placeholder="例如：教育费用、生活费用"
                />
              </div>
              <div>
                <Label htmlFor="edit-name">项目名称</Label>
                <Input
                  id="edit-name"
                  value={newFeeItem.name}
                  onChange={(e) => handleFeeItemInputChange("name", e.target.value)}
                  placeholder="例如：学费、餐费"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">收费类型</Label>
                <Select value={newFeeItem.type} onValueChange={(value) => handleFeeItemInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择收费类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">按月收费</SelectItem>
                    <SelectItem value="one-time">一次性收费</SelectItem>
                    <SelectItem value="semester">学期收费</SelectItem>
                    <SelectItem value="annual">年度收费</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">状态</Label>
                <Select value={newFeeItem.status} onValueChange={(value) => handleFeeItemInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">项目描述</Label>
              <Textarea
                id="edit-description"
                value={newFeeItem.description}
                onChange={(e) => handleFeeItemInputChange("description", e.target.value)}
                placeholder="详细描述收费项目"
              />
            </div>

            <div>
              <Label>子项目</Label>
              <div className="space-y-3 mt-2">
                {newFeeItem.subItems.map((subItem, index) => (
                  <div key={subItem.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">子项目 {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubItem(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">名称</Label>
                        <Input
                          value={subItem.name}
                          onChange={(e) => updateSubItem(index, "name", e.target.value)}
                          placeholder="子项目名称"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">金额</Label>
                        <Input
                          type="number"
                          value={subItem.amount}
                          onChange={(e) => updateSubItem(index, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">描述</Label>
                        <Input
                          value={subItem.description}
                          onChange={(e) => updateSubItem(index, "description", e.target.value)}
                          placeholder="子项目描述"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={subItem.active}
                        onChange={() => updateSubItem(index, "active", !subItem.active)}
                      />
                      <span className="text-xs text-gray-600">
                        {subItem.active ? "启用" : "停用"}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加子项目
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditFeeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateFeeItem}>
              更新项目
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 