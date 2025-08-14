import { useState, useCallback, useEffect } from 'react'
import { pb } from '@/lib/pocketbase'

// Payment interface matching exact PocketBase field names
export interface Payment {
  id: string
  referenceNo: string
  invoiceId: string
  studentId?: string
  amountPaid: number
  datePaid: string
  method: 'cash' | 'bank_transfer' | 'check' | 'online'
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'overpaid' | 'underpaid'
  notes?: string
}

export interface PaymentFilters {
  status: string
  method: string
  dateRange: { start: string; end: string }
}

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<PaymentFilters>({
    status: "",
    method: "",
    dateRange: { start: "", end: "" }
  })

  // Authentication function
  const authenticate = useCallback(async () => {
    try {
      // Check if already authenticated
      if (pb.authStore.isValid) {
        return true
      }

      // Try to authenticate with admin credentials
      await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('✅ Authentication successful for payments')
      return true
    } catch (authError) {
      console.error('❌ Authentication failed for payments:', authError)
      setError('Authentication failed. Please check your credentials.')
      return false
    }
  }, [])

  // Load payments from PocketBase
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true)
        setError(null)

        // Authenticate first
        const isAuthenticated = await authenticate()
        if (!isAuthenticated) {
          setLoading(false)
          return
        }

        const records = await pb.collection('payments').getFullList({
          sort: '-datePaid',
          expand: 'invoiceId'
        })
        
        const mapped: Payment[] = records.map((r: any) => ({
          id: r.id,
          referenceNo: r.referenceNo,
          invoiceId: r.invoiceId,
          studentId: r.expand?.invoiceId?.studentId,
          amountPaid: r.amountPaid,
          datePaid: r.datePaid,
          method: r.method,
          status: r.status,
          notes: r.notes
        }))
        
        setPayments(mapped)
        setError(null)
      } catch (err: any) {
        console.error('Failed to load payments from PocketBase:', err)
        
        // Handle authentication errors
        if (err.status === 403) {
          setError('Access denied. Please check your permissions.')
        } else if (err.status === 401) {
          setError('Authentication required. Please log in.')
        } else {
          setError('Failed to load payments: ' + (err.message || 'Unknown error'))
        }
        
        // Fallback to sample data if PocketBase is not available
        setPayments([
          {
            id: "1",
            referenceNo: "TXN001",
            invoiceId: "1",
            studentId: "1",
            amountPaid: 1200,
            datePaid: "2024-01-20",
            method: "bank_transfer",
            status: "completed",
            notes: "1月学费支付"
          },
          {
            id: "2",
            referenceNo: "CASH001",
            invoiceId: "2",
            studentId: "2",
            amountPaid: 1400,
            datePaid: "2024-01-25",
            method: "cash",
            status: "completed",
            notes: "1月学费支付"
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    loadPayments()
  }, [authenticate])

  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id'>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const created = await pb.collection('payments').create(paymentData)
      const newPayment: Payment = {
        ...paymentData,
        id: created.id
      }
      setPayments(prev => [...prev, newPayment])
      return newPayment
    } catch (err: any) {
      console.error('Failed to create payment:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const updatePayment = useCallback(async (paymentId: string, updates: Partial<Payment>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('payments').update(paymentId, updates)
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? { ...payment, ...updates } : payment
      ))
    } catch (err: any) {
      console.error('Failed to update payment:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('payments').delete(paymentId)
      setPayments(prev => prev.filter(payment => payment.id !== paymentId))
    } catch (err: any) {
      console.error('Failed to delete payment:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const updatePaymentStatus = useCallback((paymentId: string, status: Payment['status']) => {
    updatePayment(paymentId, { status })
  }, [updatePayment])

  const getFilteredPayments = useCallback(() => {
    return payments.filter(payment => {
      const matchesStatus = !filters.status || payment.status === filters.status
      const matchesMethod = !filters.method || payment.method === filters.method
      
      let matchesDateRange = true
      if (filters.dateRange.start && filters.dateRange.end) {
        const paymentDate = new Date(payment.datePaid)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        matchesDateRange = paymentDate >= startDate && paymentDate <= endDate
      }
      
      return matchesStatus && matchesMethod && matchesDateRange
    })
  }, [payments, filters])

  const getPaymentsByInvoice = useCallback((invoiceId: string): Payment[] => {
    return payments.filter(payment => payment.invoiceId === invoiceId)
  }, [payments])

  const getPaymentsByStudent = useCallback((studentId: string): Payment[] => {
    return payments.filter(payment => payment.studentId === studentId)
  }, [payments])

  const getPaymentStatistics = useCallback(() => {
    const total = payments.length
    const completed = payments.filter(p => p.status === 'completed').length
    const pending = payments.filter(p => p.status === 'pending').length
    const failed = payments.filter(p => p.status === 'failed').length
    const refunded = payments.filter(p => p.status === 'refunded').length
    const overpaid = payments.filter(p => p.status === 'overpaid').length
    const underpaid = payments.filter(p => p.status === 'underpaid').length
    
    const totalAmount = payments.reduce((sum, p) => sum + p.amountPaid, 0)
    const completedAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amountPaid, 0)
    
    const byMethod = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total,
      completed,
      pending,
      failed,
      refunded,
      overpaid,
      underpaid,
      totalAmount,
      completedAmount,
      byMethod
    }
  }, [payments])

  return {
    payments,
    loading,
    error,
    filters,
    setFilters,
    createPayment,
    updatePayment,
    deletePayment,
    updatePaymentStatus,
    getFilteredPayments,
    getPaymentsByInvoice,
    getPaymentsByStudent,
    getPaymentStatistics
  }
} 