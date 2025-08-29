import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase-instance'
import { Payment } from '@/types/fees'

// Simple fetch function - FIXED to match your actual schema
const fetchPayments = async (): Promise<Payment[]> => {
  console.log('🔄 Fetching payments...')
  
  try {
    // FIXED: Remove sort by 'created' since it might not exist
    const result = await pb.collection('payments').getList(1, 200, {})
    
    console.log(`✅ Fetched ${result.items.length} payments`)
    return result.items as unknown as Payment[]
    
  } catch (error: any) {
    console.error('❌ Error fetching payments:', error)
    
    // Enhanced error logging to see exactly what's wrong
    if (error.data) {
      console.error('Error data:', error.data)
    }
    if (error.status) {
      console.error('Error status:', error.status)
    }
    
    throw new Error(`Failed to fetch payments: ${error.message}`)
  }
}

// Simple create function - FIXED to match your schema
const createPaymentAPI = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
  console.log('🔄 Creating payment...')
  
  try {
    // FIXED: Ensure data matches your actual schema
    const paymentToCreate = {
      payment_id: paymentData.payment_id,
      invoice_id: paymentData.invoice_id,
      amount_paid: paymentData.amount_paid,
      payment_method: paymentData.payment_method,
      transaction_id: paymentData.transaction_id || '',
      payment_date: paymentData.payment_date,
      status: paymentData.status,
      notes: paymentData.notes || ''
    }
    
    console.log('📝 Creating payment with data:', paymentToCreate)
    
    const newPayment = await pb.collection('payments').create(paymentToCreate)
    console.log('✅ Payment created successfully')
    return newPayment as unknown as Payment
  } catch (error: any) {
    console.error('❌ Error creating payment:', error)
    
    // Enhanced error logging
    if (error.data) {
      console.error('Validation errors:', error.data)
    }
    
    throw new Error(`Failed to create payment: ${error.message || 'Unknown error'}`)
  }
}

// Main hook - SIMPLIFIED
export const usePaymentData = () => {
  const queryClient = useQueryClient()
  
  // Simple query - NO EXPAND
  const {
    data: payments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
    staleTime: 2 * 60 * 1000,
    retry: 2
  })
  
  // Simple mutation
  const createPayment = useMutation({
    mutationFn: createPaymentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: (error: any) => {
      console.error('❌ Error creating payment:', error)
    }
  })
  
  return {
    payments,
    loading: isLoading,
    error: error?.message,
    createPayment: createPayment.mutateAsync,
    refetch,
    isCreating: createPayment.isPending
  }
}
