import { useState, useCallback } from 'react'

// Invoice interface matching exact PocketBase field names
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

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
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

  const [filters, setFilters] = useState<InvoiceFilters>({
    status: "",
    studentName: ""
  })

  const generateInvoiceNumber = useCallback(() => {
    const year = new Date().getFullYear()
    const existingInvoices = invoices.filter(inv => inv.invoiceNumber.startsWith(`INV-${year}`))
    const nextNumber = existingInvoices.length + 1
    return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`
  }, [invoices])

  const createInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    const invoiceNumber = generateInvoiceNumber()
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Math.max(...invoices.map(inv => parseInt(inv.id)), 0) + 1 + "",
      invoiceNumber
    }
    setInvoices(prev => [...prev, newInvoice])
    return newInvoice
  }, [invoices, generateInvoiceNumber])

  const updateInvoice = useCallback((invoiceId: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
    ))
  }, [])

  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
  }, [])

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

  const generateInvoiceFromStudentFees = useCallback((studentId: string, studentName: string, studentGrade: string, month?: string): Invoice => {
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

  const generateInvoicesForAllStudents = useCallback((month?: string) => {
    const students = [
      { id: "1", name: "王小明", grade: "二年级" },
      { id: "2", name: "李小红", grade: "三年级" },
      { id: "3", name: "张小华", grade: "一年级" }
    ]
    
    students.forEach(student => {
      generateInvoiceFromStudentFees(student.id, student.name, student.grade, month)
    })
  }, [generateInvoiceFromStudentFees])

  const generateMonthlyInvoices = useCallback((targetMonth?: string) => {
    const month = targetMonth || new Date().toISOString().slice(0, 7)
    generateInvoicesForAllStudents(month)
  }, [generateInvoicesForAllStudents])

  const checkOverdueInvoices = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    invoices.forEach(invoice => {
      if (invoice.status === 'issued' && invoice.dueDate < today) {
        updateInvoiceStatus(invoice.id, 'overdue')
      }
    })
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