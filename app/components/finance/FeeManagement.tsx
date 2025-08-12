"use client"

import { useState } from "react"
import { FeeTable } from "./FeeTable"
import { AddFeeDialog } from "./AddFeeDialog"
import { EditFeeDialog } from "./EditFeeDialog"

interface SubItem {
  id: number
  name: string
  amount: number
  description: string
  active: boolean
}

interface FeeItem {
  id: number
  name: string
  amount: number
  type: string
  description: string
  applicableGrades: string[]
  status: string
  category: string
  subItems: SubItem[]
}

export default function FeeManagement() {
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false)
  const [isEditFeeDialogOpen, setIsEditFeeDialogOpen] = useState(false)
  const [editingFeeItem, setEditingFeeItem] = useState<FeeItem | null>(null)
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
    subItems: [] as SubItem[]
  })

  const [feeItems, setFeeItems] = useState<FeeItem[]>([
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

  const handleAddFeeItem = () => {
    if (!newFeeItem.name || !newFeeItem.type) {
      alert("请填写完整信息")
      return
    }

    const totalAmount = calculateTotalAmount(newFeeItem.subItems)

    const feeItem: FeeItem = {
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

  const handleEditFeeItem = (feeItem: FeeItem) => {
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

    const updatedFeeItem: FeeItem = {
      ...editingFeeItem!,
      name: newFeeItem.name,
      amount: totalAmount,
      type: newFeeItem.type,
      description: newFeeItem.description,
      applicableGrades: newFeeItem.applicableGrades,
      status: newFeeItem.status,
      category: newFeeItem.category,
      subItems: newFeeItem.subItems
    }

    setFeeItems(feeItems.map(item => item.id === editingFeeItem!.id ? updatedFeeItem : item))
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
    const newSubItem: SubItem = {
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

  const calculateTotalAmount = (subItems: SubItem[]) => {
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
      <FeeTable
        feeItems={feeItems}
        isFeeEditMode={isFeeEditMode}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
        onToggleSubItemActive={toggleSubItemActive}
        onEditFeeItem={handleEditFeeItem}
        onDeleteFeeItem={handleDeleteFeeItem}
        onFeeEditMode={handleFeeEditMode}
        calculateTotalAmount={calculateTotalAmount}
      />

      <AddFeeDialog
        isOpen={isAddFeeDialogOpen}
        onOpenChange={setIsAddFeeDialogOpen}
        newFeeItem={newFeeItem}
        onFeeItemInputChange={handleFeeItemInputChange}
        onAddSubItem={addSubItem}
        onUpdateSubItem={updateSubItem}
        onRemoveSubItem={removeSubItem}
        onAddFeeItem={handleAddFeeItem}
      />

      <EditFeeDialog
        isOpen={isEditFeeDialogOpen}
        onOpenChange={setIsEditFeeDialogOpen}
        newFeeItem={newFeeItem}
        onFeeItemInputChange={handleFeeItemInputChange}
        onAddSubItem={addSubItem}
        onUpdateSubItem={updateSubItem}
        onRemoveSubItem={removeSubItem}
        onUpdateFeeItem={handleUpdateFeeItem}
      />
    </div>
  )
} 