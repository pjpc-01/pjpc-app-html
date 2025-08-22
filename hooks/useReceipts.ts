import { useState, useCallback } from 'react'

// Receipt interface matching exact PocketBase field names
export interface Receipt {
  id: string
  paymentId: string
  receiptNumber: string
  dateIssued: string
  recipientName: string
  items: { name: string; amount: number }[]
  totalPaid: number
  status: 'draft' | 'issued' | 'sent' | 'acknowledged'
  notes: string
}

export interface ReceiptFilters {
  status: string
  dateRange: { start: string; end: string }
}

export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([
    {
      id: "1",
      paymentId: "1",
      receiptNumber: "RCP-2024-001",
      dateIssued: "2024-01-20",
      recipientName: "王小明家长",
      items: [
        { name: "基础学费", amount: 800 },
        { name: "特色课程费", amount: 400 }
      ],
      totalPaid: 1200,
      status: "issued",
      notes: "1月学费收据"
    },
    {
      id: "2",
      paymentId: "2",
      receiptNumber: "RCP-2024-002",
      dateIssued: "2024-01-25",
      recipientName: "李小红家长",
      items: [
        { name: "基础学费", amount: 1000 },
        { name: "特色课程费", amount: 400 }
      ],
      totalPaid: 1400,
      status: "issued",
      notes: "1月学费收据"
    }
  ])

  const [filters, setFilters] = useState<ReceiptFilters>({
    status: "",
    dateRange: { start: "", end: "" }
  })

  const generateReceiptNumber = useCallback(() => {
    const year = new Date().getFullYear()
    const existingReceipts = receipts.filter(r => r.receiptNumber.startsWith(`RCP-${year}`))
    const nextNumber = existingReceipts.length + 1
    return `RCP-${year}-${nextNumber.toString().padStart(3, '0')}`
  }, [receipts])

  const createReceipt = useCallback((receiptData: Omit<Receipt, 'id' | 'receiptNumber'>) => {
    const receiptNumber = generateReceiptNumber()
    
    const newReceipt: Receipt = {
      ...receiptData,
      id: Math.max(...receipts.map(r => parseInt(r.id)), 0) + 1 + "",
      receiptNumber
    }
    setReceipts(prev => [...prev, newReceipt])
    return newReceipt
  }, [receipts, generateReceiptNumber])

  const updateReceipt = useCallback((receiptId: string, updates: Partial<Receipt>) => {
    setReceipts(prev => prev.map(receipt => 
      receipt.id === receiptId ? { ...receipt, ...updates } : receipt
    ))
  }, [])

  const deleteReceipt = useCallback((receiptId: string) => {
    setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId))
  }, [])

  const updateReceiptStatus = useCallback((receiptId: string, status: Receipt['status']) => {
    updateReceipt(receiptId, { status })
  }, [updateReceipt])

  const getFilteredReceipts = useCallback(() => {
    return receipts.filter(receipt => {
      const matchesStatus = !filters.status || receipt.status === filters.status
      
      let matchesDateRange = true
      if (filters.dateRange.start && filters.dateRange.end) {
        const receiptDate = new Date(receipt.dateIssued)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        matchesDateRange = receiptDate >= startDate && receiptDate <= endDate
      }
      
      return matchesStatus && matchesDateRange
    })
  }, [receipts, filters])

  const getReceiptByPayment = useCallback((paymentId: string): Receipt | undefined => {
    return receipts.find(receipt => receipt.paymentId === paymentId)
  }, [receipts])

  const generateReceiptFromPayment = useCallback((paymentId: string, paymentData: any, invoiceData: any): Receipt => {
    const currentDate = new Date().toISOString().split('T')[0]
    
    return createReceipt({
      paymentId,
      dateIssued: currentDate,
      recipientName: invoiceData.studentName + "家长",
      items: invoiceData.items || [],
      totalPaid: paymentData.amountPaid,
      status: 'issued',
      notes: `收据 - ${invoiceData.invoiceNumber}`
    })
  }, [createReceipt])

  const getReceiptStatistics = useCallback(() => {
    const total = receipts.length
    const draft = receipts.filter(r => r.status === 'draft').length
    const issued = receipts.filter(r => r.status === 'issued').length
    const sent = receipts.filter(r => r.status === 'sent').length
    const acknowledged = receipts.filter(r => r.status === 'acknowledged').length
    
    const totalAmount = receipts.reduce((sum, r) => sum + r.totalPaid, 0)
    
    return {
      total,
      draft,
      issued,
      sent,
      acknowledged,
      totalAmount
    }
  }, [receipts])

  return {
    receipts,
    filters,
    setFilters,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    updateReceiptStatus,
    getFilteredReceipts,
    getReceiptByPayment,
    generateReceiptFromPayment,
    getReceiptStatistics,
    generateReceiptNumber
  }
}
