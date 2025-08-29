import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase-instance'
import { Payment } from '@/types/fees'

// Helper function to calculate invoice payment status
const calculateInvoicePaymentStatus = (
  invoice: any, 
  payments: any[]
) => {
  const invoicePayments = payments.filter(payment => payment.invoice_id === invoice.id)
  
  if (invoicePayments.length === 0) {
    return "pending"
  }
  
  const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount_paid, 0)
  if (totalPaid > invoice.total_amount) return "overpaid"
  if (totalPaid === invoice.total_amount) return "paid"
  if (totalPaid > 0 && totalPaid < invoice.total_amount) return "underpaid"
  return "pending"
}

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

// Enhanced create function with automatic invoice status update
const createPaymentAPI = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
  console.log('🔄 Creating payment with automatic invoice status update...')
  
  try {
    // Step 1: Create the payment
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
    
    // Step 2: Fetch the invoice to get current details
    console.log('🔄 Fetching invoice for status update:', paymentData.invoice_id)
    const invoice = await pb.collection('invoices').getOne(paymentData.invoice_id)
    
    // Step 3: Fetch all payments for this invoice to calculate new status
    console.log('🔄 Fetching all payments for invoice to calculate status')
    const allPayments = await pb.collection('payments').getList(1, 200, {
      filter: `invoice_id = "${paymentData.invoice_id}"`
    })
    
    // Step 4: Calculate new invoice status
    const newStatus = calculateInvoicePaymentStatus(invoice, allPayments.items)
    console.log(`📊 Calculated new invoice status: ${newStatus} (was: ${invoice.status})`)
    
    // Step 5: Update invoice status if it has changed
    if (newStatus !== invoice.status) {
      console.log(`🔄 Updating invoice status from "${invoice.status}" to "${newStatus}"`)
      await pb.collection('invoices').update(paymentData.invoice_id, { status: newStatus })
      console.log('✅ Invoice status updated successfully')
    } else {
      console.log('ℹ️ Invoice status unchanged, no update needed')
    }
    
    return newPayment as unknown as Payment
    
  } catch (error: any) {
    console.error('❌ Error creating payment or updating invoice status:', error)
    
    // Enhanced error logging
    if (error.data) {
      console.error('Validation errors:', error.data)
    }
    
    throw new Error(`Failed to create payment: ${error.message || 'Unknown error'}`)
  }
}

// Main hook - ENHANCED with automatic invoice status updates
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
  
  // Enhanced mutation with automatic invoice status updates
  const createPayment = useMutation({
    mutationFn: createPaymentAPI,
    onSuccess: () => {
      // Invalidate both payments and invoices since we're updating both
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      console.log('✅ Payment created and invoice status updated - queries invalidated')
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
