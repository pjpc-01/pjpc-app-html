import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase-instance'

// Simple receipt interface matching PocketBase schema
export interface Receipt {
  id: string
  receipt_id: string
  invoice_id: string
  amount: number
  receipt_date: string
  created: string
  updated: string
}

// Create receipt data interface
export interface CreateReceiptData {
  receipt_id: string
  invoice_id: string
  amount: number
  receipt_date: string
}

// API functions
const fetchReceipts = async (): Promise<Receipt[]> => {
  try {
    const result = await pb.collection('receipts').getList(1, 200, {})
    return result.items
  } catch (error: any) {
    console.error('Error fetching receipts:', error)
    throw new Error(`Failed to fetch receipts: ${error.message}`)
  }
}

const createReceipt = async (data: CreateReceiptData): Promise<Receipt> => {
  try {
    const newReceipt = await pb.collection('receipts').create(data)
    return newReceipt
  } catch (error: any) {
    console.error('Error creating receipt:', error)
    throw new Error(`Failed to create receipt: ${error.message}`)
  }
}

const deleteReceipt = async (id: string): Promise<void> => {
  try {
    await pb.collection('receipts').delete(id)
  } catch (error: any) {
    console.error('Error deleting receipt:', error)
    throw new Error(`Failed to delete receipt: ${error.message}`)
  }
}



// React Query hook
export const useReceipts = () => {
  const queryClient = useQueryClient()

  // Query: Fetch receipts
  const {
    data: receipts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['receipts'],
    queryFn: fetchReceipts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })

  // Mutation: Create receipt
  const createReceiptMutation = useMutation({
    mutationFn: createReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
    onError: (error) => {
      console.error('Error creating receipt:', error)
    }
  })

  // Mutation: Delete receipt
  const deleteReceiptMutation = useMutation({
    mutationFn: deleteReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
    onError: (error) => {
      console.error('Error deleting receipt:', error)
    }
  })

  // Helper functions
  const addReceipt = async (data: CreateReceiptData) => {
    return createReceiptMutation.mutateAsync(data)
  }

  const removeReceipt = async (id: string) => {
    return deleteReceiptMutation.mutateAsync(id)
  }

  // Calculate stats
  const totalReceipts = receipts.length
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0)

  return {
    // Data
    receipts,
    totalReceipts,
    totalAmount,
    
    // State
    isLoading,
    error: error?.message || null,
    
    // Actions
    addReceipt,
    removeReceipt,
    refetch,
    
    // Mutation states
    isCreating: createReceiptMutation.isPending,
    isDeleting: deleteReceiptMutation.isPending,
  }
}
