import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'

// Payment interface matching exact PocketBase field names
export interface Payment {
  id: string
  invoiceId: string
  amountPaid: number
  datePaid: string
  method: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'check' | 'online_payment' | 'other'
  referenceNo: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  notes: string
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
    status: '',
    method: '',
    dateRange: { start: '', end: '' }
  })

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<Payment[]>('payments', {
        fullList: true,
        sort: '-datePaid'
      })
      setPayments(data || [])
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError(err instanceof Error ? err.message : '获取缴费记录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id'>) => {
    try {
      const result = await createRecord('payments', paymentData)
      setPayments(prev => [result, ...prev])
      return result
    } catch (err) {
      console.error('Error creating payment:', err)
      throw err
    }
  }, [])

  const updatePayment = useCallback(async (paymentId: string, updates: Partial<Payment>) => {
    try {
      const result = await updateRecord('payments', paymentId, updates)
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? { ...payment, ...updates } : payment
      ))
      return result
    } catch (err) {
      console.error('Error updating payment:', err)
      throw err
    }
  }, [])

  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      await deleteRecord('payments', paymentId)
      setPayments(prev => prev.filter(payment => payment.id !== paymentId))
    } catch (err) {
      console.error('Error deleting payment:', err)
      throw err
    }
  }, [])

  const updatePaymentStatus = useCallback(async (paymentId: string, status: Payment['status']) => {
    await updatePayment(paymentId, { status })
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

  const getPaymentStatistics = useCallback(() => {
    const total = payments.length
    const completed = payments.filter(p => p.status === 'completed').length
    const pending = payments.filter(p => p.status === 'pending').length
    const failed = payments.filter(p => p.status === 'failed').length
    const refunded = payments.filter(p => p.status === 'refunded').length
    
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
    getPaymentStatistics,
    refetch: fetchPayments
  }
}
