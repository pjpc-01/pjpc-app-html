import { useState, useCallback } from 'react'

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
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: "1",
      invoiceId: "1",
      amountPaid: 1200,
      datePaid: "2024-01-20",
      method: "bank_transfer",
      referenceNo: "TXN001",
      status: "completed",
      notes: "1月学费支付"
    },
    {
      id: "2",
      invoiceId: "2",
      amountPaid: 1400,
      datePaid: "2024-01-25",
      method: "cash",
      referenceNo: "CASH001",
      status: "completed",
      notes: "1月学费支付"
    }
  ])

  const [filters, setFilters] = useState<PaymentFilters>({
    status: "",
    method: "",
    dateRange: { start: "", end: "" }
  })

  const createPayment = useCallback((paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: Math.max(...payments.map(p => parseInt(p.id)), 0) + 1 + ""
    }
    setPayments(prev => [...prev, newPayment])
    return newPayment
  }, [payments])

  const updatePayment = useCallback((paymentId: string, updates: Partial<Payment>) => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId ? { ...payment, ...updates } : payment
    ))
  }, [])

  const deletePayment = useCallback((paymentId: string) => {
    setPayments(prev => prev.filter(payment => payment.id !== paymentId))
  }, [])

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
    filters,
    setFilters,
    createPayment,
    updatePayment,
    deletePayment,
    updatePaymentStatus,
    getFilteredPayments,
    getPaymentsByInvoice,
    getPaymentStatistics
  }
} 