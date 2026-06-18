import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'
import { Invoice } from '@/lib/pocketbase-schema'

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  date: string
  method: string
  status: 'pending' | 'completed' | 'failed' | 'refunded' | string
  notes?: string
  created?: string
  updated?: string
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
  const [isMockMode, setIsMockMode] = useState(false)
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
        sort: '-date'
      })
      setPayments(data || [])
      setIsMockMode(false)
    } catch (err) {
      console.warn('PocketBase unreachable, falling back to mock payments:', err)
      setIsMockMode(true)
      setError('Demo Mode: Server unreachable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id'>, invoice?: Invoice) => {
    try {
      // 1. Create the payment record
      const result = await createRecord('payments', paymentData) as Payment
      setPayments(prev => [result, ...prev])

      // 2. Auto-Sync Invoice Status
      if (invoice) {
        const totalPaid = (payments.filter(p => p.invoiceId === invoice.id).reduce((sum, p) => sum + p.amount, 0)) + paymentData.amount
        
        let newStatus = invoice.status
        if (totalPaid >= (invoice as any).totalAmount) {
          newStatus = 'paid'
        } else if (totalPaid > 0) {
          newStatus = 'partially_paid'
        }

        if (newStatus !== invoice.status) {
          await updateRecord('invoices', invoice.id, { status: newStatus })
        }
      }

      return result
    } catch (err) {
      throw err
    }
  }, [payments])

  const updatePayment = useCallback(async (paymentId: string, updates: Partial<Payment>) => {
    try {
      const result = await updateRecord('payments', paymentId, updates)
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? { ...payment, ...updates } : payment
      ))
      return result
    } catch (err) {
      throw err
    }
  }, [])

  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      await deleteRecord('payments', paymentId)
      setPayments(prev => prev.filter(payment => payment.id !== paymentId))
    } catch (err) {
      throw err
    }
  }, [])

  const getFilteredPayments = useCallback(() => {
    return payments.filter(payment => {
      const matchesStatus = !filters.status || payment.status === filters.status
      const matchesMethod = !filters.method || payment.method === filters.method
      
      let matchesDateRange = true
      if (filters.dateRange.start && filters.dateRange.end) {
        const paymentDate = new Date(payment.date)
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
    
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const completedAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    
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
    isMockMode,
    filters,
    setFilters,
    createPayment,
    updatePayment,
    deletePayment,
    getFilteredPayments,
    getPaymentsByInvoice,
    getPaymentStatistics,
    refetch: fetchPayments
  }
}
