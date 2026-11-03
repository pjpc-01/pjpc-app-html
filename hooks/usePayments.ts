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
        sort: '-date',
        filter: 'deleted!=true'
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

  /**
   * 重算发票状态：以数据库里的实际付款为准，不再用「内存里的 payments + 本次金额」那种
   * 会漏算的算法（删一笔、改金额之后状态就会残留）。所有改动付款的地方都调它。
   */
  const resyncInvoiceStatus = useCallback(async (invoiceId: string) => {
    if (!invoiceId) return
    try {
      const [payRes, invRes] = await Promise.all([
        fetchSecureData<Payment[]>('payments', { fullList: true, filter: `invoiceId='${invoiceId}' && deleted!=true` }),
        fetchSecureData<any[]>('invoices', { filter: `id='${invoiceId}'` }),
      ])
      const inv = (invRes || [])[0]
      if (!inv) return
      const paid = (payRes || [])
        .filter(p => p.status !== 'failed' && p.status !== 'refunded')
        .reduce((s, p) => s + (Number(p.amount) || 0), 0)
      const face = Number(inv.totalAmount || 0)
      let status = inv.status
      if (paid >= face - 0.01 && face > 0) status = 'paid'
      else if (paid > 0) status = 'partially_paid'
      else if (['paid', 'partially_paid'].includes(inv.status)) status = 'issued'
      if (status !== inv.status) await updateRecord('invoices', invoiceId, { status })
    } catch (err) {
      console.warn('[payments] 发票状态重算失败', err)
    }
  }, [])

  const createPayment = useCallback(async (paymentData: Omit<Payment, 'id'>, invoice?: Invoice) => {
    try {
      // 1. Create the payment record
      const result = await createRecord('payments', paymentData) as Payment
      setPayments(prev => [result, ...prev])

      // 2. 发票状态统一由 resyncInvoiceStatus 重算（别在这里再写一套算法）
      if (invoice) await resyncInvoiceStatus(invoice.id)

      return result
    } catch (err) {
      throw err
    }
  }, [resyncInvoiceStatus])

  const updatePayment = useCallback(async (paymentId: string, updates: Partial<Payment>) => {
    try {
      const result = await updateRecord('payments', paymentId, updates)
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? { ...payment, ...updates } : payment
      ))
      const target = payments.find(p => p.id === paymentId)
      if (target?.invoiceId) await resyncInvoiceStatus(target.invoiceId)
      return result
    } catch (err) {
      throw err
    }
  }, [payments, resyncInvoiceStatus])

  const deletePayment = useCallback(async (paymentId: string) => {
    try {
      const target = payments.find(p => p.id === paymentId)
      // 删付款必须连带删掉它开出的收据，否则收据变孤儿（库里已有一张 RCP-2026-239 就是这样）
      try {
        const recs = await fetchSecureData<any[]>('receipts', { fullList: true, filter: `paymentId='${paymentId}' && deleted!=true` })
        for (const r of recs || []) await deleteRecord('receipts', r.id)
      } catch (err) {
        console.warn('[payments] 连带删除收据失败', err)
      }
      await deleteRecord('payments', paymentId)
      setPayments(prev => prev.filter(payment => payment.id !== paymentId))
      // 删完钱少了，发票状态要跟着回落（paid → partially_paid / issued）
      if (target?.invoiceId) await resyncInvoiceStatus(target.invoiceId)
    } catch (err) {
      throw err
    }
  }, [payments, resyncInvoiceStatus])

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
    resyncInvoiceStatus,
    getFilteredPayments,
    getPaymentsByInvoice,
    getPaymentStatistics,
    refetch: fetchPayments
  }
}
