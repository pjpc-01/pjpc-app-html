"use client"

import { useState } from "react"
import { useFees } from "@/hooks/useFees"
import { FeeTable } from "./FeeTable"
import { AddFeeDialog } from "./AddFeeDialog"
import { EditFeeDialog } from "./EditFeeDialog"

interface SubItem {}

interface FeeItem {
  id: string
  name: string
  amount: number
  type: 'monthly' | 'one-time' | 'annual'
  description: string
  applicableGrades: string[]
  status: 'active' | 'inactive'
  category: string
}

export default function FeeManagement() {
  const { 
    fees, 
    loading, 
    error, 
    createFee, 
    updateFee, 
    deleteFee 
  } = useFees()

  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false)
  const [isEditFeeDialogOpen, setIsEditFeeDialogOpen] = useState(false)
  const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null)
  const [isFeeEditMode, setIsFeeEditMode] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [newFeeItem, setNewFeeItem] = useState({
    name: "",
    amount: "",
    type: "monthly" as 'monthly' | 'one-time' | 'annual',
    description: "",
    applicableGrades: [] as string[],
    status: "active" as 'active' | 'inactive',
    category: ""
  })

  // Group fees by category for collapsible sections
  const groupedByCategory = fees.reduce<Record<string, FeeItem[]>>((acc, fee) => {
    const item: FeeItem = {
      id: fee.id,
      name: fee.name,
      amount: fee.amount,
      type: fee.type,
      description: fee.description || "",
      applicableGrades: fee.applicableLevels || [],
      status: fee.status,
      category: fee.category
    }
    const key = fee.category || '未分类'
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const onToggleCategory = (category: string) => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  const onToggleItemActive = async (feeId: string, active: boolean) => {
    await updateFee(feeId, { status: active ? 'active' : 'inactive' } as any)
  }

  const handleAddFeeItem = async () => {
    // Enhanced validation
    if (!newFeeItem.name.trim()) {
      alert("请填写收费项目名称")
      return
    }
    if (!newFeeItem.type) {
      alert("请选择收费类型")
      return
    }
    if (!newFeeItem.category.trim()) {
      alert("请填写收费类别")
      return
    }
    if (!newFeeItem.amount || Number(newFeeItem.amount) <= 0) {
      alert("请填写有效的金额")
      return
    }

    try {
      const feeData = {
        name: newFeeItem.name.trim(),
        amount: Number(newFeeItem.amount),
        type: newFeeItem.type,
        description: newFeeItem.description.trim(),
        applicableLevels: newFeeItem.applicableGrades,
        status: newFeeItem.status,
        category: newFeeItem.category.trim(),
      }

      await createFee(feeData)
      
      // Reset form
      setNewFeeItem({
        name: "",
        amount: "",
        type: "monthly",
        description: "",
        applicableGrades: [],
        status: "active",
        category: ""
      })
      setIsAddFeeDialogOpen(false)
    } catch (error) {
      console.error('Failed to create fee:', error)
      alert('创建收费项目失败，请重试')
    }
  }

  const handleEditFeeItem = (feeItem: FeeItem) => {
    setEditingFeeItem(feeItem)
    setNewFeeItem({
      name: feeItem.name,
      amount: feeItem.amount.toString(),
      type: feeItem.type,
      description: feeItem.description,
      applicableGrades: feeItem.applicableGrades,
      status: feeItem.status,
      category: feeItem.category
    })
    setIsEditFeeDialogOpen(true)
  }

  const handleUpdateFeeItem = async () => {
    if (!editingFeeItem) return

    // Enhanced validation
    if (!newFeeItem.name.trim()) {
      alert("请填写收费项目名称")
      return
    }
    if (!newFeeItem.type) {
      alert("请选择收费类型")
      return
    }
    if (!newFeeItem.category.trim()) {
      alert("请填写收费类别")
      return
    }
    if (!newFeeItem.amount || Number(newFeeItem.amount) <= 0) {
      alert("请填写有效的金额")
      return
    }

    try {
      const feeData = {
        name: newFeeItem.name.trim(),
        amount: Number(newFeeItem.amount),
        type: newFeeItem.type,
        description: newFeeItem.description.trim(),
        applicableLevels: newFeeItem.applicableGrades,
        status: newFeeItem.status,
        category: newFeeItem.category.trim(),
      }

      await updateFee(editingFeeItem.id, feeData)
      
      setEditingFeeItem(null)
      setNewFeeItem({
        name: "",
        amount: "",
        type: "monthly",
        description: "",
        applicableGrades: [],
        status: "active",
        category: ""
      })
      setIsEditFeeDialogOpen(false)
    } catch (error) {
      console.error('Failed to update fee:', error)
      alert('更新收费项目失败，请重试')
    }
  }

  const handleDeleteFeeItem = async (feeItemId: string) => {
    if (confirm("确定要删除这个收费项目吗？")) {
      try {
        await deleteFee(feeItemId)
      } catch (error) {
        console.error('Failed to delete fee:', error)
        alert('删除收费项目失败，请重试')
      }
    }
  }

  const handleFeeItemInputChange = (field: string, value: string) => {
    setNewFeeItem(prev => ({ ...prev, [field]: value }))
  }

  const handleFeeEditMode = () => {
    setIsFeeEditMode(!isFeeEditMode)
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const addSubItem = () => {}
  const updateSubItem = (_index: number, _field: string, _value: string | number | boolean) => {}
  const removeSubItem = (_index: number) => {}
  const calculateTotalAmount = (_subItems: SubItem[]) => 0

  const toggleSubItemActive = async (_itemId: string, _subItemId: number) => {}

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">错误: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FeeTable
        groupedByCategory={groupedByCategory}
        expandedCategories={expandedCategories}
        onToggleCategory={onToggleCategory}
        onEditFeeItem={handleEditFeeItem}
        onDeleteFeeItem={handleDeleteFeeItem}
        onToggleItemActive={onToggleItemActive}
        isFeeEditMode={isFeeEditMode}
        onFeeEditMode={handleFeeEditMode}
      />

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