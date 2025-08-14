import { useState, useCallback, useEffect } from 'react'
import { pb } from '@/lib/pocketbase'

// Receipt interface matching exact PocketBase field names
export interface Receipt {
  id: string
  receiptNumber: string
  paymentId: string
  invoiceId: string
  studentId?: string
  recipientName: string
  dateIssued: string
  status: 'draft' | 'sent' | 'delivered'
  items: { name: string; amount: number }[]
  totalPaid: number
  notes?: string
}

export interface ReceiptFilters {
  status: string
  dateRange: { start: string; end: string }
}

export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<ReceiptFilters>({
    status: "",
    dateRange: { start: "", end: "" }
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
      console.log('✅ Authentication successful for receipts')
      return true
    } catch (authError) {
      console.error('❌ Authentication failed for receipts:', authError)
      setError('Authentication failed. Please check your credentials.')
      return false
    }
  }, [])

  // Load receipts from PocketBase
  useEffect(() => {
    const loadReceipts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Authenticate first
        const isAuthenticated = await authenticate()
        if (!isAuthenticated) {
          setLoading(false)
          return
        }

        const records = await pb.collection('receipts').getFullList({
          sort: '-dateIssued',
          expand: 'paymentId,invoiceId'
        })
        
        const mapped: Receipt[] = records.map((r: any) => ({
          id: r.id,
          receiptNumber: r.receiptNumber,
          paymentId: r.paymentId,
          invoiceId: r.invoiceId,
          studentId: r.expand?.invoiceId?.studentId,
          recipientName: r.recipientName,
          dateIssued: r.dateIssued,
          status: r.status,
          items: r.items || [],
          totalPaid: r.totalPaid,
          notes: r.notes
        }))
        
        setReceipts(mapped)
        setError(null)
      } catch (err: any) {
        console.error('Failed to load receipts from PocketBase:', err)
        
        // Handle authentication errors
        if (err.status === 403) {
          setError('Access denied. Please check your permissions.')
        } else if (err.status === 401) {
          setError('Authentication required. Please log in.')
        } else {
          setError('Failed to load receipts: ' + (err.message || 'Unknown error'))
        }
        
        // Fallback to sample data if PocketBase is not available
        setReceipts([
          {
            id: "1",
            receiptNumber: "RCP-2024-001",
            paymentId: "1",
            invoiceId: "1",
            studentId: "1",
            recipientName: "王小明家长",
            dateIssued: "2024-01-20",
            status: "sent",
            items: [
              { name: "基础学费", amount: 800 },
              { name: "特色课程费", amount: 400 }
            ],
            totalPaid: 1200,
            notes: "1月学费收据"
          },
          {
            id: "2",
            receiptNumber: "RCP-2024-002",
            paymentId: "2",
            invoiceId: "2",
            studentId: "2",
            recipientName: "李小红家长",
            dateIssued: "2024-01-25",
            status: "sent",
            items: [
              { name: "基础学费", amount: 1000 },
              { name: "特色课程费", amount: 400 }
            ],
            totalPaid: 1400,
            notes: "1月学费收据"
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    loadReceipts()
  }, [authenticate])

  const generateReceiptNumber = useCallback(async () => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const year = new Date().getFullYear()
      const existingReceipts = await pb.collection('receipts').getList(1, 1, {
        filter: `receiptNumber ~ "${year}"`,
        sort: '-receiptNumber'
      })
      
      if (existingReceipts.items.length > 0) {
        const lastNumber = existingReceipts.items[0].receiptNumber
        const match = lastNumber.match(new RegExp(`RCP-${year}-(\\d+)`))
        if (match) {
          const nextNumber = parseInt(match[1]) + 1
          return `RCP-${year}-${nextNumber.toString().padStart(3, '0')}`
        }
      }
      
      return `RCP-${year}-001`
    } catch (err: any) {
      console.error('Failed to generate receipt number:', err)
      const year = new Date().getFullYear()
      const nextNumber = receipts.filter(r => r.receiptNumber.startsWith(`RCP-${year}`)).length + 1
      return `RCP-${year}-${nextNumber.toString().padStart(3, '0')}`
    }
  }, [receipts, authenticate])

  const createReceipt = useCallback(async (receiptData: Omit<Receipt, 'id' | 'receiptNumber'>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      const receiptNumber = await generateReceiptNumber()
      
      const created = await pb.collection('receipts').create({
        ...receiptData,
        receiptNumber
      })
      
      const newReceipt: Receipt = {
        ...receiptData,
        id: created.id,
        receiptNumber
      }
      
      setReceipts(prev => [...prev, newReceipt])
      return newReceipt
    } catch (err: any) {
      console.error('Failed to create receipt:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [generateReceiptNumber, authenticate])

  const updateReceipt = useCallback(async (receiptId: string, updates: Partial<Receipt>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('receipts').update(receiptId, updates)
      setReceipts(prev => prev.map(receipt => 
        receipt.id === receiptId ? { ...receipt, ...updates } : receipt
      ))
    } catch (err: any) {
      console.error('Failed to update receipt:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const deleteReceipt = useCallback(async (receiptId: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('receipts').delete(receiptId)
      setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId))
    } catch (err: any) {
      console.error('Failed to delete receipt:', err)
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

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

  const getReceiptsByStudent = useCallback((studentId: string): Receipt[] => {
    return receipts.filter(receipt => receipt.studentId === studentId)
  }, [receipts])

  const generateReceiptFromPayment = useCallback(async (paymentId: string, paymentData: any, invoiceData: any): Promise<Receipt> => {
    const currentDate = new Date().toISOString().split('T')[0]
    
    return createReceipt({
      paymentId,
      invoiceId: invoiceData.id,
      studentId: invoiceData.studentId,
      dateIssued: currentDate,
      recipientName: invoiceData.studentName + "家长",
      items: invoiceData.items || [],
      totalPaid: paymentData.amountPaid,
      status: 'sent',
      notes: `收据 - ${invoiceData.invoiceNumber}`
    })
  }, [createReceipt])

  const getReceiptStatistics = useCallback(() => {
    const total = receipts.length
    const draft = receipts.filter(r => r.status === 'draft').length
    const sent = receipts.filter(r => r.status === 'sent').length
    const delivered = receipts.filter(r => r.status === 'delivered').length
    
    const totalAmount = receipts.reduce((sum, r) => sum + r.totalPaid, 0)
    
    return {
      total,
      draft,
      sent,
      delivered,
      totalAmount
    }
  }, [receipts])

  return {
    receipts,
    loading,
    error,
    filters,
    setFilters,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    updateReceiptStatus,
    getFilteredReceipts,
    getReceiptByPayment,
    getReceiptsByStudent,
    generateReceiptFromPayment,
    getReceiptStatistics,
    generateReceiptNumber
  }
}
