import { useState, useCallback } from 'react'
import { Invoice } from './useInvoices'

export interface Payment {
  id: number
  invoiceId: number
  amount: number
  date: string
  method: '支付宝' | '微信' | '银行卡' | '现金' | '其他'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  reference: string
  notes: string
}

export interface PaymentFilters {
  method: string
  status: string
  studentName: string
  dateRange: { start: string; end: string }
}

export const usePayments = (invoices: Invoice[]) => {
  const [payments, setPayments] = useState<Payment[]>([
    { 
      id: 1, 
      invoiceId: 1, 
      amount: 1200, 
      date: "2024-01-15", 
      method: "支付宝", 
      status: "completed", 
      reference: "ALI20240115001", 
      notes: "1月学费" 
    },
    { 
      id: 2, 
      invoiceId: 2, 
      amount: 800, 
      date: "2024-01-10", 
      method: "微信", 
      status: "pending", 
      reference: "WX20240110001", 
      notes: "部分付款" 
    },
    { 
      id: 3, 
      invoiceId: 3, 
      amount: 300, 
      date: "2024-01-12", 
      method: "银行卡", 
      status: "completed", 
      reference: "BANK20240112001", 
      notes: "餐费" 
    }
  ])

  const [filters, setFilters] = useState<PaymentFilters>({
    method: "",
    status: "",
    studentName: "",
    dateRange: { start: "", end: "" }
  })

  const addPayment = useCallback((paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: Math.max(...payments.map(p => p.id), 0) + 1
    }
    setPayments(prev => [...prev, newPayment])
    return newPayment
  }, [payments])

  const updatePayment = useCallback((paymentId: number, updates: Partial<Payment>) => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId ? { ...payment, ...updates } : payment
    ))
  }, [])

  const deletePayment = useCallback((paymentId: number) => {
    setPayments(prev => prev.filter(payment => payment.id !== paymentId))
  }, [])

  const getPaymentByInvoice = useCallback((invoiceId: number) => {
    return payments.filter(payment => payment.invoiceId === invoiceId)
  }, [payments])

  const getInvoiceOutstandingBalance = useCallback((invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return 0
    
    const totalPaid = payments
      .filter(payment => payment.invoiceId === invoiceId && payment.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0)
    
    return Math.max(0, invoice.totalAmount - totalPaid)
  }, [invoices, payments])

  const getInvoicePaymentHistory = useCallback((invoiceId: number) => {
    return payments
      .filter(payment => payment.invoiceId === invoiceId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [payments])

  const addPaymentToInvoice = useCallback((invoiceId: number, paymentData: Omit<Payment, 'id' | 'invoiceId'>) => {
    return addPayment({
      ...paymentData,
      invoiceId
    })
  }, [addPayment])

  const getFilteredPayments = useCallback(() => {
    return payments.filter(payment => {
      const matchesMethod = !filters.method || payment.method === filters.method
      const matchesStatus = !filters.status || payment.status === filters.status
      
      let matchesDateRange = true
      if (filters.dateRange.start || filters.dateRange.end) {
        const paymentDate = new Date(payment.date)
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null
        
        if (startDate && paymentDate < startDate) matchesDateRange = false
        if (endDate && paymentDate > endDate) matchesDateRange = false
      }
      
      return matchesMethod && matchesStatus && matchesDateRange
    })
  }, [payments, filters])

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
    
    const methodBreakdown = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount
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
      successRate: total > 0 ? (completed / total) * 100 : 0,
      methodBreakdown
    }
  }, [payments])

  const reconcilePayments = useCallback((invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return false
    
    const outstandingBalance = getInvoiceOutstandingBalance(invoiceId)
    
    if (outstandingBalance === 0) {
      // Mark invoice as paid
      return true
    }
    
    return false
  }, [invoices, getInvoiceOutstandingBalance])

  const processPartialPayment = useCallback((invoiceId: number, amount: number, method: Payment['method'], notes?: string) => {
    const payment = addPaymentToInvoice(invoiceId, {
      amount,
      date: new Date().toISOString().split('T')[0],
      method,
      status: 'completed',
      reference: `${method.toUpperCase()}${Date.now()}`,
      notes: notes || '部分付款'
    })
    
    // Check if invoice is now fully paid
    const isFullyPaid = getInvoiceOutstandingBalance(invoiceId) === 0
    return { payment, isFullyPaid }
  }, [addPaymentToInvoice, getInvoiceOutstandingBalance])

  return {
    payments,
    filters,
    setFilters,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentByInvoice,
    getInvoiceOutstandingBalance,
    getInvoicePaymentHistory,
    addPaymentToInvoice,
    getFilteredPayments,
    getPaymentStatistics,
    reconcilePayments,
    processPartialPayment
  }
} 