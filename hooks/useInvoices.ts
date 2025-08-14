import { useState, useCallback, useEffect } from 'react'
import { pb } from '@/lib/pocketbase'

// Invoice interface matching exact PocketBase field names
export interface Invoice {
  id: string
  invoiceNumber: string
  studentId: string
  studentName: string
  studentGrade: string
  issueDate: string
  dueDate: string
  status: 'issued' | 'paid' | 'overdue' | 'cancelled'
  items: { name: string; amount: number }[]
  totalAmount: number
  notes?: string
  parentEmail?: string
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
    status: "",
    studentName: ""
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
      console.log('✅ Authentication successful for invoices')
      return true
    } catch (authError) {
      console.error('❌ Authentication failed for invoices:', authError)
      setError('Authentication failed. Please check your credentials.')
      return false
    }
  }, [])

  // Load invoices from PocketBase
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true)
        setError(null)

        // Authenticate first
        const isAuthenticated = await authenticate()
        if (!isAuthenticated) {
          setLoading(false)
          return
        }

        const records = await pb.collection('invoices').getFullList({
          sort: '-issueDate',
          expand: 'studentId'
        })
        
        const mapped: Invoice[] = records.map((r: any) => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          studentId: r.studentId,
          studentName: r.studentName,
          studentGrade: r.studentGrade,
          issueDate: r.issueDate,
          dueDate: r.dueDate,
          status: r.status,
          items: r.items || [],
          totalAmount: r.totalAmount,
          notes: r.notes,
          parentEmail: r.expand?.studentId?.father_email || r.expand?.studentId?.mother_email
        }))
        
        setInvoices(mapped)
        setError(null)
      } catch (err: any) {
        console.error('Failed to load invoices from PocketBase:', err)
        
        // Handle authentication errors
        if (err.status === 403) {
          setError('Access denied. Please check your permissions.')
        } else if (err.status === 401) {
          setError('Authentication required. Please log in.')
        } else {
          setError('Failed to load invoices: ' + (err.message || 'Unknown error'))
        }
        
        // Fallback to sample data if PocketBase is not available
        setInvoices([
          { 
            id: "1", 
            invoiceNumber: "INV-2024-001", 
            studentId: "1",
            studentName: "王小明",
            studentGrade: "二年级",
            totalAmount: 1200, 
            items: [
              { name: "基础学费", amount: 800 },
              { name: "特色课程费", amount: 400 }
            ],
            status: "issued", 
            issueDate: "2024-01-15", 
            dueDate: "2024-01-30",
            notes: "1月学费"
          },
          { 
            id: "2", 
            invoiceNumber: "INV-2024-002", 
            studentId: "2",
            studentName: "李小红",
            studentGrade: "三年级",
            totalAmount: 1500, 
            items: [
              { name: "基础学费", amount: 1000 },
              { name: "特色课程费", amount: 500 }
            ],
            status: "issued", 
            issueDate: "2024-01-16", 
            dueDate: "2024-01-31",
            notes: "1月学费"
          },
          { 
            id: "3", 
            invoiceNumber: "INV-2024-003", 
            studentId: "3",
            studentName: "张小华",
            studentGrade: "一年级",
            totalAmount: 800, 
            items: [
              { name: "基础学费", amount: 800 }
            ],
            status: "overdue", 
            issueDate: "2024-01-10", 
            dueDate: "2024-01-25",
            notes: "1月学费"
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    loadInvoices()
  }, [authenticate])

  const generateInvoiceNumber = useCallback(async () => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const year = new Date().getFullYear()
      const existingInvoices = await pb.collection('invoices').getList(1, 1, {
        filter: `invoiceNumber ~ "${year}"`,
        sort: '-invoiceNumber'
      })
      
      if (existingInvoices.items.length > 0) {
        const lastNumber = existingInvoices.items[0].invoiceNumber
        const match = lastNumber.match(new RegExp(`INV-${year}-(\\d+)`))
        if (match) {
          const nextNumber = parseInt(match[1]) + 1
          return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`
        }
      }
      
      return `INV-${year}-001`
    } catch (err: any) {
      console.error('Failed to generate invoice number:', err)
      const year = new Date().getFullYear()
      const nextNumber = invoices.filter(inv => inv.invoiceNumber.startsWith(`INV-${year}`)).length + 1
      return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`
    }
  }, [invoices, authenticate])

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const invoiceNumber = await generateInvoiceNumber()
      
      const created = await pb.collection('invoices').create({
        ...invoiceData,
        invoiceNumber
      })
      
      const newInvoice: Invoice = {
        ...invoiceData,
        id: created.id,
        invoiceNumber
      }
      
      setInvoices(prev => [...prev, newInvoice])
      return newInvoice
    } catch (err: any) {
      console.error('Failed to create invoice:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [generateInvoiceNumber, authenticate])

  const updateInvoice = useCallback(async (invoiceId: string, updates: Partial<Invoice>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('invoices').update(invoiceId, updates)
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
      ))
    } catch (err: any) {
      console.error('Failed to update invoice:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('invoices').delete(invoiceId)
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
    } catch (err: any) {
      console.error('Failed to delete invoice:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const updateInvoiceStatus = useCallback((
    invoiceId: string, 
    status: Invoice['status']
  ) => {
    updateInvoice(invoiceId, { status })
  }, [updateInvoice])

  const getFilteredInvoices = useCallback(() => {
    return invoices.filter(invoice => {
      const matchesStatus = !filters.status || invoice.status === filters.status
      const matchesStudent = !filters.studentName || 
        invoice.studentName.toLowerCase().includes(filters.studentName.toLowerCase())
      return matchesStatus && matchesStudent
    })
  }, [invoices, filters])

  const generateInvoiceFromStudentFees = useCallback(async (studentId: string, studentName: string, studentGrade: string, month?: string): Promise<Invoice> => {
    const currentDate = new Date()
    const issueDate = currentDate.toISOString().split('T')[0]
    const dueDate = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // This would typically fetch from student fee assignments
    const items = [
      { name: "基础学费", amount: 800 },
      { name: "特色课程费", amount: 400 }
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
      notes: month ? `${month}学费` : "学费"
    })
  }, [createInvoice])

  const generateInvoicesForAllStudents = useCallback(async (month?: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const students = await pb.collection('students').getFullList({
        filter: 'status = "active"'
      })
      
      for (const student of students) {
        await generateInvoiceFromStudentFees(
          student.id, 
          student.student_name, 
          student.standard, 
          month
        )
      }
    } catch (err: any) {
      console.error('Failed to generate invoices for all students:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [generateInvoiceFromStudentFees, authenticate])

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
    generateInvoiceNumber
  }
} 