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

// Fetch fee items from fee_items collection
const fetchFeeItems = async (): Promise<FeeItem[]> => {
  console.log('[useFeeItems] Fetching fee items...')
  
  const records = await pb.collection('fee_items').getFullList(200, {
    sort: 'category,name',
    fields: 'id,name,category,amount,description,status,frequency'
  })
  
  const feeItems: FeeItem[] = records.map(record => ({
    id: record.id,
    name: record.name || 'Unnamed',
    category: record.category || '未分类',
    amount: Number(record.amount || 0),
    description: record.description,
    status: record.status || 'active',
    active: record.status === 'active',
    frequency: record.frequency,
  }))
  
  console.log(`[useFeeItems] Fetched ${feeItems.length} fee items`)
  return feeItems
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
    error: query.error ? (query.error as Error).message : null,
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
