import { useState, useCallback } from 'react'
import { createReceiptFromInvoice as createReceiptFromInvoiceUtil } from '@/lib/receipt-utils'

export interface Receipt {
  id: number
  receiptNumber: string
  invoiceNumber: string // Links to the corresponding invoice
  student: string
  studentId: number
  amount: number
  items: { name: string; amount: number }[]
  status: 'pending' | 'issued' | 'sent' | 'cancelled'
  issueDate: string
  paymentDate: string
  paymentMethod: string
  notes: string
  tax: number
  discount: number
  totalAmount: number
  parentEmail: string
  receiptTemplate: string
  generatedBy: string
}

export interface ReceiptFilters {
  status: string
  studentName: string
  invoiceNumber: string
}

export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([])

  const [filters, setFilters] = useState<ReceiptFilters>({
    status: "all",
    studentName: "",
    invoiceNumber: ""
  })

  const generateReceiptNumber = useCallback((invoiceNumber: string) => {
    // Receipt number should match the invoice number for linking
    return invoiceNumber.replace('INV-', 'RCP-')
  }, [])

  const createReceiptFromInvoice = useCallback((invoice: any, paymentMethod: string, paymentDate: string) => {
    const newReceipt = createReceiptFromInvoiceUtil(
      invoice,
      paymentMethod,
      paymentDate,
      Math.max(...receipts.map(rec => rec.id), 0) + 1
    )
    
    setReceipts(prev => [...prev, newReceipt])
    return newReceipt
  }, [receipts])

  const updateReceipt = useCallback((receiptId: number, updates: Partial<Receipt>) => {
    setReceipts(prev => prev.map(receipt => 
      receipt.id === receiptId ? { ...receipt, ...updates } : receipt
    ))
  }, [])

  const deleteReceipt = useCallback((receiptId: number) => {
    setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId))
  }, [])

  const getReceiptByInvoiceNumber = useCallback((invoiceNumber: string) => {
    return receipts.find(receipt => receipt.invoiceNumber === invoiceNumber)
  }, [receipts])

  const getReceiptsByStudent = useCallback((studentId: number) => {
    return receipts.filter(receipt => receipt.studentId === studentId)
  }, [receipts])

  const getFilteredReceipts = useCallback(() => {
    return receipts.filter(receipt => {
      const matchesStatus = !filters.status || filters.status === "all" || receipt.status === filters.status
      const matchesStudent = !filters.studentName || 
        receipt.student.toLowerCase().includes(filters.studentName.toLowerCase())
      const matchesInvoice = !filters.invoiceNumber || 
        receipt.invoiceNumber.includes(filters.invoiceNumber)
      return matchesStatus && matchesStudent && matchesInvoice
    })
  }, [receipts, filters])

  const getReceiptStatistics = useCallback(() => {
    const total = receipts.length
    const issued = receipts.filter(rec => rec.status === 'issued').length
    const pending = receipts.filter(rec => rec.status === 'pending').length
    const totalAmount = receipts.reduce((sum, rec) => sum + rec.totalAmount, 0)
    const issuedAmount = receipts
      .filter(rec => rec.status === 'issued')
      .reduce((sum, rec) => sum + rec.totalAmount, 0)
    
    return {
      total,
      issued,
      pending,
      totalAmount,
      issuedAmount,
      issueRate: total > 0 ? (issued / total) * 100 : 0
    }
  }, [receipts])

  return {
    receipts,
    filters,
    setFilters,
    createReceiptFromInvoice,
    updateReceipt,
    deleteReceipt,
    getReceiptByInvoiceNumber,
    getReceiptsByStudent,
    getFilteredReceipts,
    getReceiptStatistics,
    generateReceiptNumber
  }
}
