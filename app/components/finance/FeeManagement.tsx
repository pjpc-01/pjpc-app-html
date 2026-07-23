"use client"

import { useState } from "react"
import { useFees } from "@/hooks/useFees"
import { Fee } from "@/types/fees"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, DollarSign, Plus, ChevronDown, ChevronRight, GraduationCap, BookOpen, Package, CalendarDays, Utensils, Bus, FolderOpen, School, ClipboardList, Receipt, Banknote, ScrollText, Library } from "lucide-react"
import { createElement, type ComponentType } from "react"

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  GraduationCap, BookOpen, Package, CalendarDays, Utensils, Bus,
  ClipboardList, Receipt, Banknote, ScrollText, School, Library, FolderOpen,
}

const renderIcon = (iconName: string | undefined, className = "h-4 w-4") => {
  const Icon = iconName ? ICON_MAP[iconName] : undefined
  return Icon ? createElement(Icon, { className }) : <FolderOpen className={className} />
}
import { AddFeeDialog } from "./AddFeeDialog"
import { EditFeeDialog } from "./EditFeeDialog"


const CATEGORY_MAP: Record<string, string> = {
  'Tuition': '学费',
  'Administrative': '行政费',
  'Materials': '教材费',
  'Miscellaneous': '杂项',
  'Activity': '活动费',
  'Daycare': '安亲班',
  'Transport': '交通费',
  'Meals': '膳食费',
}

const ITEM_NAME_MAP: Record<string, string> = {
  'Monthly Tuition Fee': '月度学费',
  'Registration Fee': '注册费',
  'Late Payment Penalty': '逾期缴费罚款',
  'Textbook Fee': '教材费',
}

const ITEM_DESC_MAP: Record<string, string> = {
  'Standard monthly tuition': '标准月度学费',
  'New student registration': '新学生注册费',
  'Penalty for payments after 7th of month': '每月7日后缴费的罚款',
  'Yearly textbooks': '年度教材费',
}

export default function FeeManagement() {
  const { t } = useLanguage()
  const {
    fees,
    loading,
    error,
    createFee,
    updateFee,
    deleteFee,
  } = useFees()

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
    category: undefined,
    applicableCenters: [],
    applicableLevels: [],
  })

  const onToggleItemActive = async (feeId: string, active: boolean) => {
    await updateFee(feeId, { status: active ? "active" : "inactive" })
  }

  const handleAddFeeItem = async () => {
    if (!newFeeItem.name.trim() || newFeeItem.amount <= 0) {
      alert("请填写所有必需的费用项信息")
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
        category: undefined,
        applicableCenters: [],
        applicableLevels: [],
      })
      setIsAddFeeDialogOpen(false)
    } catch (error) {
      console.error("费用项创建失败:", error)
      alert("创建费用项失败，请重试")
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
      category: fee.category,
      applicableCenters: fee.applicableCenters || [],
      applicableLevels: fee.applicableLevels || [],
    })
    setIsEditFeeDialogOpen(true)
  }

  const handleUpdateFeeItem = async () => {
    if (!editingFeeItem) return

    if (!newFeeItem.name.trim() || newFeeItem.amount <= 0) {
      alert("请填写所有必需的费用项信息")
      return
    }

    try {
      await updateFee(editingFeeItem.id, newFeeItem)
      setEditingFeeItem(null)
      setIsEditFeeDialogOpen(false)
    } catch (error) {
      console.error("更新费用项失败:", error)
      alert("更新费用项失败，请重试")
    }
  }

  const handleDeleteFeeItem = async (feeId: string) => {
    if (confirm("确定要删除此费用项吗？")) {
      try {
        await deleteFee(feeId)
      } catch (error) {
        console.error("删除费用项失败:", error)
        alert("删除费用项失败，请重试")
      }
    }
  }

  const handleFeeItemInputChange = (field: keyof Omit<Fee, "id">, value: any) => {
    setNewFeeItem((prev) => ({ ...prev, [field]: value }))
  }

  const groupedFees = fees.reduce((groups, fee) => {
    const category = fee.category || "未分类"
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(fee)
    return groups
  }, {} as Record<string, Fee[]>)

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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                费用项管理
                {!loading && !error && fees.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {fees.length} 项
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>管理所有费用项</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleAllCategories}>
                {Object.keys(groupedFees).every(cat => expandedCategories.has(cat)) ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    全部折叠
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    全部展开
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsFeeEditMode(!isFeeEditMode)}>
                <Edit className="h-4 w-4 mr-2" />
                {isFeeEditMode ? "完成编辑" : "编辑"}
              </Button>
              <Button onClick={() => setIsAddFeeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新增费用项
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('teacher.loading')}</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">错误: {error}</div>
          ) : fees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无费用项</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedFees).map(([category, categoryFees]) => {
                const isExpanded = expandedCategories.has(category)
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
                              <div className="flex items-center gap-2">
                                {renderIcon(categoryFees.find(f => f.icon)?.icon, "h-5 w-5 text-muted-foreground")}
                                <div>
                                  <CardTitle className="text-lg">{CATEGORY_MAP[category] || category}</CardTitle>
                                  <CardDescription>
                                    {categoryFees.length} 项 • {activeCount} 已启用
                                  </CardDescription>
                                </div>
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
                        <CardContent className="pt-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>项目名称</TableHead>
                                <TableHead>{t('finance.amount')}</TableHead>
                                <TableHead>费用类型</TableHead>
                                <TableHead>{t('teacher.status')}</TableHead>
                                {isFeeEditMode && <TableHead>{t('finance.enable')}</TableHead>}
                                {isFeeEditMode && <TableHead>{t('teacher.actions')}</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryFees.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    {renderIcon(item.icon, "h-4 w-4 text-muted-foreground")}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{ITEM_NAME_MAP[item.name] || item.name}</div>
                                    {item.description && (
                                      <div className="text-sm text-gray-500">{ITEM_DESC_MAP[item.description] || item.description}</div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">RM {item.amount}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {item.type === "monthly"
                                        ? "月费"
                                        : item.type === "one-time"
                                        ? "一次性费用"
                                        : "年费"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={item.status === "active" ? "default" : "secondary"}>
                                      {item.status === "active" ? "启用" : "禁用"}
                                    </Badge>
                                  </TableCell>
                                  {isFeeEditMode && (
                                    <TableCell>
                                      <Button
                                        variant={item.status === "active" ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => onToggleItemActive(item.id, item.status !== "active")}
                                      >
                                        {item.status === "active" ? "停用" : "启用"}
                                      </Button>
                                    </TableCell>
                                  )}
                                  {isFeeEditMode && (
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditFeeItem(item)}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteFeeItem(item.id)}>
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
