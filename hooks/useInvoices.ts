import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'

export interface Invoice {
  id: string
  studentId: string
  studentName: string
  studentGrade: string
  issueDate: string
  dueDate: string
  status: 'issued' | 'paid' | 'overdue' | 'cancelled'
  items: { name: string; amount: number }[]
  totalAmount: number
  notes: string
  invoiceNumber: string
  discount?: number
  discountType?: 'amount' | 'percent'
  latePaymentRule?: string
}

export interface InvoiceFilters {
  status: string
  studentName: string
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: '',
    studentName: ''
  })

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<Invoice[]>('invoices', {
        fullList: true,
        sort: '-created'
      })
      setInvoices(data || [])
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
      setInvoices([])
      setError('无法加载发票数据，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const generateInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear()
    const nextNumber = invoices.length + 1
    return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`
  }, [invoices])

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const invoiceNumber = generateInvoiceNumber()
    const data = { ...invoiceData, invoiceNumber }
    const result = await createRecord('invoices', data)
    setInvoices(prev => [...prev, result])
    return result
  }, [generateInvoiceNumber])

  const updateInvoice = useCallback(async (invoiceId: string, updates: Partial<Invoice>) => {
    const result = await updateRecord('invoices', invoiceId, updates)
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
    ))
    return result
  }, [])

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    await deleteRecord('invoices', invoiceId)
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
  }, [])

  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: Invoice['status']) => {
    await updateInvoice(invoiceId, { status })
  }, [updateInvoice])

  const getFilteredInvoices = useCallback(() => {
    return invoices.filter(invoice => {
      const matchesStatus = !filters.status || invoice.status === filters.status
      const matchesStudent = !filters.studentName || 
        invoice.studentName.toLowerCase().includes(filters.studentName.toLowerCase())
      return matchesStatus && matchesStudent
    })
  }, [invoices, filters])

  const generateInvoiceFromStudentFees = useCallback(async (
    studentId: string, 
    studentName: string, 
    studentGrade: string, 
    items: { name: string; amount: number }[],
    month?: string
  ) => {
    const currentDate = new Date()
    const issueDate = currentDate.toISOString().split('T')[0]
    const dueDate = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    
    return createInvoice({
      studentId,
      studentName,
      studentGrade,
      totalAmount,
      items: items.length > 0 ? items : [{ name: '学生费用', amount: totalAmount }],
      status: 'issued',
      issueDate,
      dueDate,
      notes: month ? `${month}学费` : '学费'
    })
  }, [createInvoice])

  const generateInvoicesForAllStudents = useCallback(async (month?: string) => {
    console.warn('Bulk generation should be handled via server-side function.')
  }, [])

  const generateMonthlyInvoices = useCallback(async (targetMonth?: string) => {
    const month = targetMonth || new Date().toISOString().slice(0, 7)
    await generateInvoicesForAllStudents(month)
  }, [generateInvoicesForAllStudents])

  const checkOverdueInvoices = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const overdueInvoices = invoices.filter(invoice => 
      invoice.status === 'issued' && invoice.dueDate < today
    )
    
    for (const invoice of overdueInvoices) {
      await updateInvoiceStatus(invoice.id, 'overdue')
    }
  }, [invoices, updateInvoiceStatus])

  const getInvoiceStatistics = useCallback(() => {
    const total = invoices.length
    const paid = invoices.filter(inv => inv.status === 'paid').length
    const issued = invoices.filter(inv => inv.status === 'issued').length
    const overdue = invoices.filter(inv => inv.status === 'overdue').length
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    
    return {
      total,
      paid,
      issued,
      overdue,
      totalAmount,
      paidAmount,
      collectionRate: total > 0 ? (paidAmount / totalAmount) * 100 : 0
    }
  }, [invoices])

  return {
    invoices,
    loading,
    error,
    filters,
    setFilters,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    getFilteredInvoices,
    generateInvoiceFromStudentFees,
    generateInvoicesForAllStudents,
    generateMonthlyInvoices,
    checkOverdueInvoices,
    getInvoiceStatistics,
    generateInvoiceNumber,
    refetch: fetchInvoices
  }
}
