import { useState, useCallback } from 'react'

export interface Invoice {
  id: number
  invoiceNumber: string
  student: string
  studentId: number
  amount: number
  items: { name: string; amount: number }[]
  status: 'draft' | 'issued' | 'sent' | 'pending' | 'overdue' | 'paid' | 'cancelled'
  issueDate: string
  dueDate: string
  paidDate: string | null
  paymentMethod: string | null
  notes: string
  tax: number
  discount: number
  totalAmount: number
  parentEmail: string
  reminderSent: boolean
  lastReminderDate: string | null
}

export interface InvoiceFilters {
  status: string
  studentName: string
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { 
      id: 1, 
      invoiceNumber: "INV-2024-001", 
      student: "王小明", 
      studentId: 1,
      amount: 1200, 
      items: [
        { name: "基础学费", amount: 800 },
        { name: "特色课程费", amount: 400 }
      ],
      status: "issued", 
      issueDate: "2024-01-15", 
      dueDate: "2024-01-30",
      paidDate: "2024-01-20",
      paymentMethod: "支付宝",
      notes: "1月学费",
      tax: 0,
      discount: 0,
      totalAmount: 1200,
      parentEmail: "parent1@example.com",
      reminderSent: false,
      lastReminderDate: null
    },
    { 
      id: 2, 
      invoiceNumber: "INV-2024-002", 
      student: "李小红", 
      studentId: 2,
      amount: 1500, 
      items: [
        { name: "基础学费", amount: 1000 },
        { name: "特色课程费", amount: 500 }
      ],
      status: "pending", 
      issueDate: "2024-01-16", 
      dueDate: "2024-01-31",
      paidDate: null,
      paymentMethod: null,
      notes: "1月学费",
      tax: 0,
      discount: 100,
      totalAmount: 1400,
      parentEmail: "parent2@example.com",
      reminderSent: true,
      lastReminderDate: "2024-01-25"
    },
    { 
      id: 3, 
      invoiceNumber: "INV-2024-003", 
      student: "张小华", 
      studentId: 3,
      amount: 800, 
      items: [
        { name: "基础学费", amount: 800 }
      ],
      status: "overdue", 
      issueDate: "2024-01-10", 
      dueDate: "2024-01-25",
      paidDate: null,
      paymentMethod: null,
      notes: "1月学费",
      tax: 0,
      discount: 0,
      totalAmount: 800,
      parentEmail: "parent3@example.com",
      reminderSent: true,
      lastReminderDate: "2024-01-26"
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
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Math.max(...invoices.map(inv => inv.id), 0) + 1,
      invoiceNumber: generateInvoiceNumber()
    }
    setInvoices(prev => [...prev, newInvoice])
    return newInvoice
  }, [invoices, generateInvoiceNumber])

  const updateInvoice = useCallback((invoiceId: number, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
    ))
  }, [])

  const deleteInvoice = useCallback((invoiceId: number) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
  }, [])

  const updateInvoiceStatus = useCallback((invoiceId: number, status: Invoice['status']) => {
    const updates: Partial<Invoice> = { status }
    if (status === 'paid') {
      updates.paidDate = new Date().toISOString().split('T')[0]
    }
    updateInvoice(invoiceId, updates)
  }, [updateInvoice])

  const sendInvoiceReminder = useCallback((invoiceId: number) => {
    const today = new Date().toISOString().split('T')[0]
    updateInvoice(invoiceId, {
      reminderSent: true,
      lastReminderDate: today
    })
  }, [updateInvoice])

  const getFilteredInvoices = useCallback(() => {
    return invoices.filter(invoice => {
      const matchesStatus = !filters.status || invoice.status === filters.status
      const matchesStudent = !filters.studentName || 
        invoice.student.toLowerCase().includes(filters.studentName.toLowerCase())
      return matchesStatus && matchesStudent
    })
  }, [invoices, filters])

  const generateInvoiceFromStudentFees = useCallback((studentId: number, studentName: string, month?: string): Invoice => {
    const currentDate = new Date()
    const issueDate = currentDate.toISOString().split('T')[0]
    const dueDate = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // This would typically fetch from student fee assignments
    const items = [
      { name: "基础学费", amount: 800 },
      { name: "特色课程费", amount: 400 }
    ]
    
    const amount = items.reduce((sum, item) => sum + item.amount, 0)
    
    return createInvoice({
      studentId,
      student: studentName,
      amount,
      items,
      status: 'draft',
      issueDate,
      dueDate,
      paidDate: null,
      paymentMethod: null,
      notes: month ? `${month}学费` : "学费",
      tax: 0,
      discount: 0,
      totalAmount: amount,
      parentEmail: `${studentName}@example.com`,
      reminderSent: false,
      lastReminderDate: null
    })
  }, [createInvoice])

  const generateInvoicesForAllStudents = useCallback((month?: string) => {
    const students = [
      { id: 1, name: "王小明" },
      { id: 2, name: "李小红" },
      { id: 3, name: "张小华" }
    ]
    
    students.forEach(student => {
      generateInvoiceFromStudentFees(student.id, student.name, month)
    })
  }, [generateInvoiceFromStudentFees])

  const generateMonthlyInvoices = useCallback((targetMonth?: string) => {
    const month = targetMonth || new Date().toISOString().slice(0, 7)
    generateInvoicesForAllStudents(month)
  }, [generateInvoicesForAllStudents])

  const checkOverdueInvoices = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    invoices.forEach(invoice => {
      if (invoice.status === 'pending' && invoice.dueDate < today) {
        updateInvoiceStatus(invoice.id, 'overdue')
      }
    })
  }, [invoices, updateInvoiceStatus])

  const getInvoiceStatistics = useCallback(() => {
    const total = invoices.length
    const paid = invoices.filter(inv => inv.status === 'paid').length
    const pending = invoices.filter(inv => inv.status === 'pending').length
    const overdue = invoices.filter(inv => inv.status === 'overdue').length
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    
    return {
      total,
      paid,
      pending,
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
    sendInvoiceReminder,
    getFilteredInvoices,
    generateInvoiceFromStudentFees,
    generateInvoicesForAllStudents,
    generateMonthlyInvoices,
    checkOverdueInvoices,
    getInvoiceStatistics,
    generateInvoiceNumber
  }
} 