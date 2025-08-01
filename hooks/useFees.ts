import { useState, useCallback } from 'react'

export interface SubItem {
  id: number
  name: string
  amount: number
  description: string
  active: boolean
}

export interface FeeItem {
  id: number
  name: string
  amount: number
  type: 'monthly' | 'one-time' | 'semester' | 'annual'
  description: string
  applicableGrades: string[]
  status: 'active' | 'inactive'
  category: string
  subItems: SubItem[]
}

export const useFees = () => {
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

  const addFeeItem = useCallback((item: Omit<FeeItem, 'id'>) => {
    const newItem = { ...item, id: Date.now() }
    setFeeItems(prev => [...prev, newItem])
  }, [])

  const updateFeeItem = useCallback((id: number, updates: Partial<FeeItem>) => {
    setFeeItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }, [])

  const deleteFeeItem = useCallback((id: number) => {
    setFeeItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const calculateTotalAmount = useCallback((subItems: SubItem[]) => {
    return subItems
      .filter(subItem => subItem.active)
      .reduce((total, subItem) => total + subItem.amount, 0)
  }, [])

  const updateSubItem = useCallback((feeId: number, subItemId: number, updates: Partial<SubItem>) => {
    setFeeItems(prev => prev.map(fee => 
      fee.id === feeId 
        ? {
            ...fee,
            subItems: fee.subItems.map(subItem => 
              subItem.id === subItemId 
                ? { ...subItem, ...updates }
                : subItem
            )
          }
        : fee
    ))
  }, [])

  return {
    feeItems,
    addFeeItem,
    updateFeeItem,
    deleteFeeItem,
    calculateTotalAmount,
    updateSubItem
  }
} 