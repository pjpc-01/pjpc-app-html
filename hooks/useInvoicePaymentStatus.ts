import { useQuery } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase-instance'

export interface InvoicePaymentSummary {
  invoiceId: string
  totalAmount: number
  totalPaid: number
  remainingAmount: number
  paymentCount: number
  status: string
  isFullyPaid: boolean
  isOverpaid: boolean
  paymentProgress: number
  lastPaymentDate?: string
}

export interface InvoiceWithPayments {
  id: string
  invoice_id: string
  student_name: string
  total_amount: number
  status: string
  issue_date: string
  due_date: string
  payments: Array<{
    id: string
    amount_paid: number
    payment_date: string
    status: string
  }>
  paymentSummary: InvoicePaymentSummary
}

// Fetch invoices with their payment information
const fetchInvoicesWithPayments = async (): Promise<InvoiceWithPayments[]> => {
  try {
    // Fetch all invoices
    const invoices = await pb.collection('invoices').getList(1, 200, {
      sort: '-created'
    })
    
    // Fetch all payments
    const payments = await pb.collection('payments').getList(1, 200, {})
    
    // Group payments by invoice
    const paymentsByInvoice = payments.items.reduce((acc, payment) => {
      const invoiceId = payment.invoice_id
      if (!acc[invoiceId]) {
        acc[invoiceId] = []
      }
      acc[invoiceId].push({
        id: payment.id,
        amount_paid: payment.amount_paid,
        payment_date: payment.payment_date,
        status: payment.status
      })
      return acc
    }, {} as Record<string, any[]>)
    
    // Combine invoices with their payments and calculate summaries
    const invoicesWithPayments: InvoiceWithPayments[] = invoices.items.map(invoice => {
      const invoicePayments = paymentsByInvoice[invoice.id] || []
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount_paid, 0)
      const remainingAmount = invoice.total_amount - totalPaid
      const paymentProgress = (totalPaid / invoice.total_amount) * 100
      
      const paymentSummary: InvoicePaymentSummary = {
        invoiceId: invoice.id,
        totalAmount: invoice.total_amount,
        totalPaid,
        remainingAmount,
        paymentCount: invoicePayments.length,
        status: invoice.status,
        isFullyPaid: totalPaid >= invoice.total_amount,
        isOverpaid: totalPaid > invoice.total_amount,
        paymentProgress: Math.min(paymentProgress, 100),
        lastPaymentDate: invoicePayments.length > 0 
          ? invoicePayments[0]?.payment_date 
          : undefined
      }
      
      return {
        id: invoice.id,
        invoice_id: invoice.invoice_id,
        student_name: invoice.student_name || 'Unknown Student',
        total_amount: invoice.total_amount,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        payments: invoicePayments.sort((a, b) => 
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
        ),
        paymentSummary
      }
    })
    
    return invoicesWithPayments
    
  } catch (error: any) {
    console.error('❌ Error fetching invoices with payments:', error)
    throw new Error(`Failed to fetch invoices with payments: ${error.message}`)
  }
}

export const useInvoicePaymentStatus = () => {
  const {
    data: invoicesWithPayments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices-with-payments'],
    queryFn: fetchInvoicesWithPayments,
    staleTime: 1 * 60 * 1000, // 1 minute - more frequent updates for payment status
    retry: 2
  })
  
  // Helper functions
  const getInvoicePaymentSummary = (invoiceId: string): InvoicePaymentSummary | undefined => {
    return invoicesWithPayments.find(inv => inv.id === invoiceId)?.paymentSummary
  }
  
  const getInvoicesByStatus = (status: string): InvoiceWithPayments[] => {
    return invoicesWithPayments.filter(inv => inv.status === status)
  }
  
  const getOverdueInvoices = (): InvoiceWithPayments[] => {
    const today = new Date()
    return invoicesWithPayments.filter(inv => {
      const dueDate = new Date(inv.due_date)
      return dueDate < today && !inv.paymentSummary.isFullyPaid
    })
  }
  
  const getInvoicesNeedingAttention = (): InvoiceWithPayments[] => {
    return invoicesWithPayments.filter(inv => 
      inv.status === 'pending' || inv.status === 'underpaid'
    )
  }
  
  return {
    invoicesWithPayments,
    loading: isLoading,
    error: error?.message,
    refetch,
    
    // Helper functions
    getInvoicePaymentSummary,
    getInvoicesByStatus,
    getOverdueInvoices,
    getInvoicesNeedingAttention,
    
    // Computed values
    totalInvoices: invoicesWithPayments.length,
    paidInvoices: invoicesWithPayments.filter(inv => inv.paymentSummary.isFullyPaid).length,
    pendingInvoices: invoicesWithPayments.filter(inv => inv.status === 'pending').length,
    underpaidInvoices: invoicesWithPayments.filter(inv => inv.status === 'underpaid').length,
    overpaidInvoices: invoicesWithPayments.filter(inv => inv.status === 'overpaid').length,
    
    // Financial totals
    totalAmountInvoiced: invoicesWithPayments.reduce((sum, inv) => sum + inv.total_amount, 0),
    totalAmountPaid: invoicesWithPayments.reduce((sum, inv) => sum + inv.paymentSummary.totalPaid, 0),
    totalAmountOutstanding: invoicesWithPayments.reduce((sum, inv) => sum + inv.paymentSummary.remainingAmount, 0)
  }
}
