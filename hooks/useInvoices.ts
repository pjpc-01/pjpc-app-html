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
}

export interface InvoiceFilters {
  status: string
  studentName: string
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'mock-1',
    studentId: 's1',
    studentName: '张小明',
    studentGrade: 'Primary 4',
    issueDate: '2026-06-01',
    dueDate: '2026-06-15',
    status: 'issued',
    items: [{ name: 'Monthly Tuition', amount: 800 }, { name: 'Material Fee', amount: 200 }],
    totalAmount: 1000,
    notes: 'June Tuition',
    invoiceNumber: 'INV-2026-001'
  },
  {
    id: 'mock-2',
    studentId: 's2',
    studentName: '李华',
    studentGrade: 'Secondary 1',
    issueDate: '2026-06-01',
    dueDate: '2026-06-15',
    status: 'paid',
    items: [{ name: 'Monthly Tuition', amount: 1200 }],
    totalAmount: 1200,
    notes: 'June Tuition',
    invoiceNumber: 'INV-2026-002'
  }
]

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMockMode, setIsMockMode] = useState(false)
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
      setIsMockMode(false)
    } catch (err) {
      console.warn('PocketBase unreachable, falling back to mock invoices:', err)
      setInvoices(MOCK_INVOICES)
      setIsMockMode(true)
      setError('Demo Mode: Server unreachable')
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
    try {
      const invoiceNumber = generateInvoiceNumber()
      const data = { ...invoiceData, invoiceNumber }
      const result = await createRecord('invoices', data)
      setInvoices(prev => [...prev, result])
      return result
    } catch (err) {
      if (isMockMode) {
        const mockResult = { ...invoiceData, id: `mock-${Date.now()}`, invoiceNumber: generateInvoiceNumber() } as Invoice
        setInvoices(prev => [...prev, mockResult])
        return mockResult
      }
      throw err
    }
  }, [generateInvoiceNumber, isMockMode])

  const updateInvoice = useCallback(async (invoiceId: string, updates: Partial<Invoice>) => {
    try {
      const result = await updateRecord('invoices', invoiceId, updates)
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
      ))
      return result
    } catch (err) {
      if (isMockMode) {
        setInvoices(prev => prev.map(invoice => 
          invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
        ))
        return { id: invoiceId, ...updates }
      }
      throw err
    }
  }, [isMockMode])

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      await deleteRecord('invoices', invoiceId)
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
    } catch (err) {
      if (isMockMode) {
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
        return
      }
      throw err
    }
  }, [isMockMode])

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

  const generateInvoiceFromStudentFees = useCallback(async (studentId: string, studentName: string, studentGrade: string, month?: string) => {
    const currentDate = new Date()
    const issueDate = currentDate.toISOString().split('T')[0]
    const dueDate = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const items = [
      { name: '基础学费', amount: 800 },
      { name: '特色课程费', amount: 400 }
    ]
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    
    return createInvoice({
      studentId,
      studentName,
      studentGrade,
      totalAmount,
      items,
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
    isMockMode,
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
