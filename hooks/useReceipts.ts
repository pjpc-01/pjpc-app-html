import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'
import { Receipt } from '@/lib/pocketbase-schema'

export interface ReceiptFilters {
  status: string
  dateRange: { start: string; end: string }
  studentName: string
  receiptNumber: string
}

export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMockMode, setIsMockMode] = useState(false)
  const [filters, setFilters] = useState<ReceiptFilters>({
    status: '',
    dateRange: { start: '', end: '' },
    studentName: '',
    receiptNumber: ''
  })

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<Receipt[]>('receipts', {
        fullList: true,
        sort: '-receipt_date'
      })
      setReceipts(data || [])
      setIsMockMode(false)
    } catch (err) {
      console.warn('PocketBase unreachable, falling back to mock receipts:', err)
      setIsMockMode(true)
      setError('Demo Mode: Server unreachable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  const generateReceiptNumber = useCallback(async () => {
    const year = new Date().getFullYear()
    const prefix = `RCP-${year}-`
    
    // Fetch all receipts (no filter — filter would fail on missing field)
    const allReceipts = await fetchSecureData<Receipt[]>('receipts', {
      fullList: true,
      sort: '-created'
    })
    
    // Filter and find max number in JS
    let maxNumber = 0
    for (const r of allReceipts) {
      if (r.receiptNumber && r.receiptNumber.startsWith(prefix)) {
        const numPart = r.receiptNumber.replace(prefix, '')
        const num = parseInt(numPart, 10)
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num
        }
      }
    }
    const nextNumber = maxNumber + 1
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`
  }, [])

  const createReceipt = useCallback(async (receiptData: Omit<Receipt, 'id' | 'receiptNumber'>) => {
    try {
      const receiptNumber = await generateReceiptNumber()
      const result = await createRecord('receipts', {
        ...receiptData,
        receiptNumber
      })
      setReceipts(prev => [result, ...prev])
      return result
    } catch (err) {
      throw err
    }
  }, [generateReceiptNumber])

  const updateReceipt = useCallback(async (receiptId: string, updates: Partial<Receipt>) => {
    try {
      const result = await updateRecord('receipts', receiptId, updates)
      setReceipts(prev => prev.map(receipt => 
        receipt.id === receiptId ? { ...receipt, ...updates } : receipt
      ))
      return result
    } catch (err) {
      throw err
    }
  }, [])

  const deleteReceipt = useCallback(async (receiptId: string) => {
    try {
      await deleteRecord('receipts', receiptId)
      setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId))
    } catch (err) {
      throw err
    }
  }, [])

  const getFilteredReceipts = useCallback(() => {
    return receipts.filter(receipt => {
      const matchesStatus = !filters.status || receipt.status === filters.status
      
      let matchesDateRange = true
      if (filters.dateRange.start && filters.dateRange.end) {
        const receiptDate = new Date(receipt.receipt_date)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        matchesDateRange = receiptDate >= startDate && receiptDate <= endDate
      }

      const matchesStudentName = !filters.studentName ||
        receipt.studentId.toLowerCase().includes(filters.studentName.toLowerCase())
      
      const matchesReceiptNumber = !filters.receiptNumber ||
        receipt.receiptNumber.toLowerCase().includes(filters.receiptNumber.toLowerCase())
      
      return matchesStatus && matchesDateRange && matchesStudentName && matchesReceiptNumber
    })
  }, [receipts, filters])

  const getReceiptByPayment = useCallback((paymentId: string): Receipt | undefined => {
    return receipts.find(receipt => receipt.paymentId === paymentId)
  }, [receipts])

  const generateReceiptFromPayment = useCallback(async (paymentId: string, paymentData: { amount: number }, invoiceData: { studentId: string; invoiceNumber: string }): Promise<Receipt> => {
    const currentDate = new Date().toISOString().split('T')[0]
    
    return createReceipt({
      paymentId,
      receipt_date: currentDate,
      studentId: invoiceData.studentId,
      totalAmount: paymentData.amount,
      status: 'issued',
      notes: `收据 - ${invoiceData.invoiceNumber}`
    })
  }, [createReceipt])

  const getReceiptStatistics = useCallback(() => {
    const total = receipts.length
    const issued = receipts.filter(r => r.status === 'issued').length
    const draft = receipts.filter(r => r.status === 'draft').length
    const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0)
    
    return {
      total,
      issued,
      draft,
      totalAmount
    }
  }, [receipts])

  return {
    receipts,
    loading,
    error,
    isMockMode,
    filters,
    setFilters,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    getFilteredReceipts,
    getReceiptByPayment,
    generateReceiptFromPayment,
    getReceiptStatistics,
    generateReceiptNumber
  }
}
