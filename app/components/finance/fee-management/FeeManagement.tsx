"use client"

import { useState } from "react"
import { useFees } from "@/hooks/useFees"
import { Fee } from "@/types/fees"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleSwitch } from "@/components/ui/ToggleSwitch"
import { Edit, Trash2, DollarSign, Plus, ChevronDown, ChevronRight } from "lucide-react"
import { AddFeeDialog } from "./AddFeeDialog"
import { EditFeeDialog } from "./EditFeeDialog"

export default function FeeManagement() {
  const {
    fees,
    loading,
    error,
    createFee,
    updateFee,
    deleteFee,
  } = useFees()

  // Debug logging
  console.log("🔍 FeeManagement render:", { fees: fees.length, loading, error })
  console.log("🔍 FeeManagement hook values:", { 
    feesLength: fees.length, 
    loading, 
    error: error?.substring(0, 50),
    firstFee: fees[0] ? `${fees[0].name} (${fees[0].id})` : 'None'
  })

  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false)
  const [isEditFeeDialogOpen, setIsEditFeeDialogOpen] = useState(false)
  const [editingFeeItem, setEditingFeeItem] = useState<Fee | null>(null)
  const [isFeeEditMode, setIsFeeEditMode] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [newFeeItem, setNewFeeItem] = useState<Omit<Fee, "id">>({
    name: "",
    amount: 0,
    frequency: "recurring",  // Changed from "type": "monthly"
    description: "",
    status: "active",
    category: "学费",  // Set default category
  })

  const onToggleItemActive = async (feeId: string, active: boolean) => {
    await updateFee(feeId, { status: active ? "active" : "inactive" })
  }

  const handleAddFeeItem = async () => {
    if (!newFeeItem.name.trim() || newFeeItem.amount <= 0) {
      alert("请完整填写收费项目信息")
      return
    }

    try {
      await createFee(newFeeItem)
      setNewFeeItem({
        name: "",
        amount: 0,
        frequency: "recurring",
        description: "",
        status: "active",
        category: "学费",
      })
      setIsAddFeeDialogOpen(false)
    } catch (error) {
      console.error("Fee creation failed:", error)
      alert("创建收费项目失败，请重试")
    }
  }

  const handleEditFeeItem = (fee: Fee) => {
    setEditingFeeItem(fee)
    setNewFeeItem({
      name: fee.name,
      amount: fee.amount,
      frequency: fee.frequency || "recurring",
      description: fee.description || "",
      status: fee.status,
      category: fee.category || "学费",
    })
    setIsEditFeeDialogOpen(true)
  }

  const handleUpdateFeeItem = async () => {
    if (!editingFeeItem) return

    if (!newFeeItem.name.trim() || newFeeItem.amount <= 0) {
      alert("请完整填写收费项目信息")
      return
    }

    try {
      await updateFee(editingFeeItem.id, newFeeItem)
      setIsEditFeeDialogOpen(false)
      setEditingFeeItem(null)
    } catch (error) {
      console.error("Fee update failed:", error)
      alert("更新收费项目失败，请重试")
    }
  }

  const handleDeleteFeeItem = async (feeId: string) => {
    if (!confirm("确定要删除这个收费项目吗？")) return

    try {
      await deleteFee(feeId)
    } catch (error) {
      console.error("Fee deletion failed:", error)
      alert("删除收费项目失败，请重试")
    }
  }

  const handleFeeItemInputChange = (field: keyof Omit<Fee, "id">, value: any) => {
    setNewFeeItem(prev => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Group fees by category
  const groupedFees = fees.reduce((groups, fee) => {
    const category = fee.category || "未分类"
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(fee)
    return groups
  }, {} as Record<string, Fee[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">加载失败: {error}</p>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    )
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
              <CardDescription>管理所有收费项目，按分类组织</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFeeEditMode(!isFeeEditMode)}>
                <Edit className="h-4 w-4 mr-2" />
                {isFeeEditMode ? "完成编辑" : "编辑"}
              </Button>
              <Button onClick={() => setIsAddFeeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加收费项目
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收费项目</h3>
              <p className="text-gray-500 mb-4">点击"添加收费项目"开始创建</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedFees).map(([category, categoryFees]) => {
                const isExpanded = expandedCategories.has(category)
                const activeCount = categoryFees.filter(fee => fee.status === "active").length
                const activeAmount = categoryFees
                  .filter(fee => fee.status === "active")
                  .reduce((sum, fee) => sum + fee.amount, 0)

                return (
                  <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <div>
                                <CardTitle className="text-lg">{category}</CardTitle>
                                <CardDescription>
                                  {categoryFees.length} 个项目 • {activeCount} 个启用
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  RM {activeAmount}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-sm">
                                {categoryFees.length} 项
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0 px-4 pb-4">
                          <div className="space-y-3">
                            {categoryFees.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-6 flex-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {item.name}
                                    </div>
                                    {item.description && (
                                      <div className="text-xs text-gray-500 mt-1 truncate">
                                        {item.description}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-blue-600 whitespace-nowrap">
                                      RM {item.amount}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {item.frequency === "recurring"
                                        ? "按月收费"
                                        : item.frequency === "one-time"
                                        ? "一次性收费"
                                        : "年度收费"}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                      <ToggleSwitch
                                        checked={item.status === "active"}
                                        onChange={() => onToggleItemActive(item.id, item.status !== "active")}
                                        size="sm"
                                      />
                                      <span className="text-xs text-gray-600">
                                        {item.status === "active" ? "已启用" : "已停用"}
                                      </span>
                                    </div>
                                    {isFeeEditMode && (
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditFeeItem(item)}>
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteFeeItem(item.id)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddFeeDialog
        isOpen={isAddFeeDialogOpen}
        onOpenChange={setIsAddFeeDialogOpen}
        newFeeItem={newFeeItem}
        onFeeItemInputChange={handleFeeItemInputChange}
        onAddFeeItem={handleAddFeeItem}
      />

      <EditFeeDialog
        isOpen={isEditFeeDialogOpen}
        onOpenChange={setIsEditFeeDialogOpen}
        newFeeItem={newFeeItem}
        onFeeItemInputChange={handleFeeItemInputChange}
        onUpdateFeeItem={handleUpdateFeeItem}
      />
    </div>
  )
}
