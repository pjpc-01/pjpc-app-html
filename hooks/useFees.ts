import { useState, useCallback } from 'react'

// Fee interface matching exact PocketBase field names
export interface Fee {
  id: string
  name: string
  category: string
  amount: number
  type: 'recurring' | 'one-time' | 'optional'
  applicableGrades: string[]
  status: 'active' | 'inactive'
  subItems: { id: number; name: string; amount: number }[]
  description: string
}

export interface FeeFilters {
  category: string
  status: string
  type: string
}

export const useFees = () => {
  const [fees, setFees] = useState<Fee[]>([
    {
      id: "1",
      name: "基础学费",
      category: "Academic",
      amount: 800,
      type: "recurring",
      applicableGrades: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
      status: "active",
      subItems: [
        { id: 1, name: "基础课程", amount: 600 },
        { id: 2, name: "教材费", amount: 200 }
      ],
      description: "每月基础学费"
    },
    {
      id: "2",
      name: "特色课程费",
      category: "Extracurricular",
      amount: 400,
      type: "recurring",
      applicableGrades: ["一年级", "二年级", "三年级"],
      status: "active",
      subItems: [
        { id: 1, name: "艺术课程", amount: 200 },
        { id: 2, name: "体育课程", amount: 200 }
      ],
      description: "特色课程费用"
    },
    {
      id: "3",
      name: "注册费",
      category: "Administrative",
      amount: 500,
      type: "one-time",
      applicableGrades: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
      status: "active",
      subItems: [
        { id: 1, name: "注册手续费", amount: 300 },
        { id: 2, name: "学生证费用", amount: 200 }
      ],
      description: "新生注册费用"
    }
  ])

  const [filters, setFilters] = useState<FeeFilters>({
    category: "",
    status: "",
    type: ""
  })

  const createFee = useCallback((feeData: Omit<Fee, 'id'>) => {
    const newFee: Fee = {
      ...feeData,
      id: Math.max(...fees.map(fee => parseInt(fee.id)), 0) + 1 + ""
    }
    setFees(prev => [...prev, newFee])
    return newFee
  }, [fees])

  const updateFee = useCallback((feeId: string, updates: Partial<Fee>) => {
    setFees(prev => prev.map(fee => 
      fee.id === feeId ? { ...fee, ...updates } : fee
    ))
  }, [])

  const deleteFee = useCallback((feeId: string) => {
    setFees(prev => prev.filter(fee => fee.id !== feeId))
  }, [])

  const getFilteredFees = useCallback(() => {
    return fees.filter(fee => {
      const matchesCategory = !filters.category || fee.category === filters.category
      const matchesStatus = !filters.status || fee.status === filters.status
      const matchesType = !filters.type || fee.type === filters.type
      return matchesCategory && matchesStatus && matchesType
    })
  }, [fees, filters])

  const getFeesByGrade = useCallback((grade: string) => {
    return fees.filter(fee => 
      fee.status === 'active' && 
      fee.applicableGrades.includes(grade)
    )
  }, [fees])

  const getFeeStatistics = useCallback(() => {
    const total = fees.length
    const active = fees.filter(fee => fee.status === 'active').length
    const inactive = fees.filter(fee => fee.status === 'inactive').length
    const recurring = fees.filter(fee => fee.type === 'recurring').length
    const oneTime = fees.filter(fee => fee.type === 'one-time').length
    const optional = fees.filter(fee => fee.type === 'optional').length
    
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0)
    
    return {
      total,
      active,
      inactive,
      recurring,
      oneTime,
      optional,
      totalAmount
    }
  }, [fees])

  return {
    fees,
    filters,
    setFilters,
    createFee,
    updateFee,
    deleteFee,
    getFilteredFees,
    getFeesByGrade,
    getFeeStatistics
  }
} 