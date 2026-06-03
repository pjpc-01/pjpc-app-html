'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSecureData, createRecord } from '@/lib/secure-api-client'
import { COLLECTION_NAMES } from '@/lib/pocketbase-schema'

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

export const feeItemsQueryKeys = {
  feeItems: ['fee-items'] as const,
}

const fetchFeeItems = async (): Promise<FeeItem[]> => {
  try {
    const records = await fetchSecureData<any[]>(COLLECTION_NAMES.FEE_ITEMS, {
      fullList: true,
      sort: 'category,name',
    })
    
    return (records || []).map(record => ({
      id: record.id,
      name: record.name || 'Unnamed',
      category: record.category || '未分类',
      amount: Number(record.amount || 0),
      description: record.description,
      status: (record.status as 'active' | 'inactive') || 'active',
      active: record.status === 'active',
      frequency: (record.type === 'recurring' ? 'recurring' : 'one-time') as 'recurring' | 'one-time',
    }))
  } catch (error) {
    console.error('获取费用项目失败:', error)
    throw error
  }
}

export const useFeeItems = () => {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: feeItemsQueryKeys.feeItems,
    queryFn: fetchFeeItems,
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: async (newItem: any) => {
      return await createRecord(COLLECTION_NAMES.FEE_ITEMS, newItem)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeItemsQueryKeys.feeItems })
    }
  })

  return {
    feeItems: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    isError: query.isError,
    createFeeItem: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    refetch: query.refetch,
  }
}

export const useActiveFeeItems = () => {
  const { feeItems, loading, error, isError, refetch } = useFeeItems()
  return {
    feeItems: feeItems.filter(item => item.status === 'active'),
    loading,
    error,
    isError,
    refetch,
  }
}
