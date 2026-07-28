import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'

export interface Invoice {
  id: string
  studentId: string
  studentName: string
  studentGrade: string
  issueDate: string
  dueDate: string
  status: 'issued' | 'paid' | 'overdue' | 'cancelled' | 'draft' | 'sent' | 'pending'
  items: { name: string; amount: number }[]
  totalAmount: number
  notes: string
  invoiceNumber: string
  discount?: number
  discountType?: 'amount' | 'percent'
  latePaymentRule?: string
  studentNumber?: string // 学号 (human-readable student ID like "B1", "T2")
  [key: string]: any // Allow additional fields like student, grade, receiptNumber
}

export interface InvoiceFilters {
  status: string
  studentName: string
  search?: string
  grade?: string
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

  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    const now = new Date()
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    try {
      // Query PB for existing invoice numbers in this month
      const prefix = `INV-${yearMonth}-`
      const res = await fetch(`/api/pocketbase-proxy/api/collections/invoices/records?perPage=1&filter=invoiceNumber~'${prefix}'`)
      const data = await res.json()
      const count = (data.totalItems || 0) + 1
      return `INV-${yearMonth}-${String(count).padStart(3, '0')}`
    } catch {
      // Fallback: use timestamp-based
      return `INV-${yearMonth}-${String(Date.now() % 1000).padStart(3, '0')}`
    }
  }, [])

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const invoiceNumber = await generateInvoiceNumber()
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
      // Status filter: "all" = no filter, "paid" = status === 'paid', "unpaid" = issued/overdue
      const matchesStatus = !filters.status || filters.status === 'all' || (
        filters.status === 'paid' ? invoice.status === 'paid'
        : filters.status === 'unpaid' ? (invoice.status === 'issued' || invoice.status === 'overdue' || invoice.status === 'draft' || invoice.status === 'pending')
        : invoice.status === filters.status
      )

      // Search filter: match invoiceNumber or studentName
      const query = (filters.search || '').toLowerCase()
      const matchesSearch = !query || 
        (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(query)) ||
        (invoice.studentName && invoice.studentName.toLowerCase().includes(query)) ||
        (invoice.student && invoice.student.toLowerCase().includes(query))

      // Grade filter
      const matchesGrade = !filters.grade || filters.grade === 'all' ||
        invoice.studentGrade === filters.grade ||
        invoice.grade === filters.grade

      // Legacy studentName filter (fallback)
      const matchesStudent = !filters.studentName || 
        invoice.studentName.toLowerCase().includes(filters.studentName.toLowerCase())

      return matchesStatus && matchesSearch && matchesGrade && matchesStudent
    })
  }, [invoices, filters])

  const generateInvoiceFromStudentFees = useCallback(async (
    studentId: string, 
    studentName: string, 
    studentGrade: string, 
    items: { name: string; amount: number }[],
    month?: string,
    studentNumber?: string
  ) => {
    const currentDate = new Date()
    const issueDate = currentDate.toISOString().split('T')[0]
    const dueDate = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    
    return createInvoice({
      studentId,
      studentName,
      studentGrade,
      studentNumber,
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
