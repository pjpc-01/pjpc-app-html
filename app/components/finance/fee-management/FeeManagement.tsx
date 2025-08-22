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
    type: "monthly",
    description: "",
    status: "active",
    category: "",
    applicableCenters: [],
    applicableLevels: [],
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
        type: "monthly",
        description: "",
        status: "active",
        category: "",
        applicableCenters: [],
        applicableLevels: [],
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
      type: fee.type,
      description: fee.description || "",
      status: fee.status,
      category: fee.category || "",
      applicableCenters: fee.applicableCenters || [],
      applicableLevels: fee.applicableLevels || [],
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
      setEditingFeeItem(null)
      setIsEditFeeDialogOpen(false)
    } catch (error) {
      console.error("Failed to update fee:", error)
      alert("更新收费项目失败，请重试")
    }
  }

  const handleDeleteFeeItem = async (feeId: string) => {
    if (confirm("确定要删除这个收费项目吗？")) {
      try {
        await deleteFee(feeId)
      } catch (error) {
        console.error("Failed to delete fee:", error)
        alert("删除收费项目失败，请重试")
      }
    }
  }

  const handleFeeItemInputChange = (field: keyof Omit<Fee, "id">, value: any) => {
    setNewFeeItem((prev) => ({ ...prev, [field]: value }))
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

  // Toggle category expansion
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

  // Expand/collapse all categories
  const toggleAllCategories = () => {
    const allCategories = Object.keys(groupedFees)
    const allExpanded = allCategories.every(cat => expandedCategories.has(cat))
    
    if (allExpanded) {
      setExpandedCategories(new Set())
    } else {
      setExpandedCategories(new Set(allCategories))
    }
  }

  return (
    <div className="space-y-6">

      {/* Fee Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                收费项目管理
                {!loading && !error && fees.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {fees.length} 个项目
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>管理所有收费项目</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleAllCategories}>
                {Object.keys(groupedFees).every(cat => expandedCategories.has(cat)) ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    收起全部
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    展开全部
                  </>
                )}
              </Button>
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
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              加载中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              错误: {error}
            </div>
          ) : fees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无收费项目
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedFees).map(([category, categoryFees]) => {
                const isExpanded = expandedCategories.has(category)
                const totalAmount = categoryFees.reduce((sum, fee) => sum + fee.amount, 0)
                const activeFees = categoryFees.filter(fee => fee.status === "active")
                const activeCount = activeFees.length
                const activeAmount = activeFees.reduce((sum, fee) => sum + fee.amount, 0)
                
                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <Card className="border-2">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-500" />
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
                                      {item.type === "monthly"
                                        ? "按月收费"
                                        : item.type === "one-time"
                                        ? "一次性收费"
                                        : "年度收费"}
                                    </Badge>
                                    <Button
                                      variant={item.status === "active" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => onToggleItemActive(item.id, item.status !== "active")}
                                      className="text-xs"
                                    >
                                      {item.status === "active" ? "已启用" : "已停用"}
                                    </Button>
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
