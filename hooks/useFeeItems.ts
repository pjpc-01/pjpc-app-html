'use client'

import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase-instance'

export interface FeeItem {
  id: string
  name: string
  category: string
  amount: number
  description?: string
  status: 'active' | 'inactive'
  active: boolean
  frequency?: 'one-time' | 'recurring'
}

// Query keys for React Query
export const feeItemsQueryKeys = {
  feeItems: ['fee-items'] as const,
}

// Fetch fee items from the fees collection
const fetchFeeItems = async (): Promise<FeeItem[]> => {
  try {
    console.log('开始获取费用项目数据...')
    console.log('PocketBase URL:', pb.baseURL)
    console.log('Auth status:', pb.authStore.isValid)
    
    // 检查集合是否存在
    const collections = await pb.collections.getFullList()
    console.log('Available collections:', collections.map(c => c.name))
    
    // 尝试获取费用项目
    const records = await pb.collection('fees').getFullList(200, {
      sort: 'category,name',
      fields: 'id,name,category,amount,description,status,type'
    })
    
    const feeItems = records.map(record => ({
      id: record.id,
      name: record.name || 'Unnamed',
      category: record.category || '未分类',
      amount: Number(record.amount || 0),
      description: record.description,
      status: record.status || 'active',
      active: record.status === 'active',
      frequency: record.type === 'recurring' ? 'recurring' : 'one-time',
    }))
    
    console.log(`成功获取 ${feeItems.length} 个费用项目`)
    return feeItems
  } catch (error) {
    console.error('获取费用项目失败:', error)
    throw error
  }
}

// Hook for fetching fee items
export const useFeeItems = () => {
  const query = useQuery({
    queryKey: feeItemsQueryKeys.feeItems,
    queryFn: fetchFeeItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    feeItems: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    isError: query.isError,
    refetch: query.refetch,
  }
}

// Hook for fetching only active fee items
export const useActiveFeeItems = () => {
  const { feeItems, loading, error, isError, refetch } = useFeeItems()
  
  const activeFeeItems = feeItems.filter(item => item.status === 'active')
  
  return {
    feeItems: activeFeeItems,
    loading,
    error,
    isError,
    refetch,
  }
}
