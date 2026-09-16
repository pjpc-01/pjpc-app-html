import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'
import { toLocalMonthKey } from "@/lib/utils"

export interface Invoice {
  id: string
  studentId: string
  studentName: string
  studentGrade: string
  issueDate: string
  dueDate: string
  status: 'issued' | 'paid' | 'overdue' | 'cancelled' | 'draft' | 'sent' | 'pending' | 'partially_paid'
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
  level?: string
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
        sort: '-created',
        filter: 'deleted=false'
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

  // 本次会话内已分配的序号 —— 防止批量/并发开票时多个请求查到同一个"最小空号"
  const allocatedSeqRef = useRef<Set<number>>(new Set())

  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    const now = new Date()
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    try {
      const prefix = `INV-${yearMonth}-`
      // perPage 拉大，避免当月发票超过 200 张时漏号
      const res = await fetch(`/api/pocketbase-proxy/api/collections/invoices/records?perPage=1000&filter=${encodeURIComponent(`invoiceNumber~'${prefix}'`)}`)
      const data = await res.json()
      // 拉取本月全部发票号码，解析序号，找最小未使用的空号（复用被删除/空缺的号码）
      const used = new Set<number>()
      ;(data?.items || []).forEach((inv: any) => {
        const m = (inv.invoiceNumber || '').match(/^INV-\d{6}-(\d+)$/)
        if (m) used.add(parseInt(m[1], 10))
      })
      // 关键：把本次会话已分配但可能尚未落库的号也算"已用"，避免并发拿到同一个号
      allocatedSeqRef.current.forEach((n: number) => used.add(n))
      let seq = 1
      while (used.has(seq)) seq++
      allocatedSeqRef.current.add(seq)
      return `${prefix}${String(seq).padStart(3, '0')}`
    } catch {
      return `INV-${yearMonth}-${String(Date.now() % 1000).padStart(3, '0')}`
    }
  }, [])

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => {
    // 票号有数据库唯一约束；万一撞号（并发），自动换号重试，绝不静默写重复号
    let lastError: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const invoiceNumber = await generateInvoiceNumber()
      try {
        const result = await createRecord('invoices', { ...invoiceData, invoiceNumber })
        setInvoices(prev => [...prev, result])
        return result
      } catch (e: any) {
        lastError = e
        const msg = String(e?.message || e?.data?.message || e || '')
        if (/invoiceNumber|unique|2067|已被占用|validation/i.test(msg)) continue
        throw e
      }
    }
    throw lastError
  }, [generateInvoiceNumber])

  const updateInvoice = useCallback(async (invoiceId: string, updates: Partial<Invoice>) => {
    const result = await updateRecord('invoices', invoiceId, updates)
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
    ))
    return result
  }, [])

  // 级联：一张发票下的 payment + receipt 跟着一起进/出回收站
  // 用户要求：删的时候一起进回收站，恢复时一并恢复 —— 否则会出现"孤儿收款"（报表把没收到的钱算成收入）
  const cascadeInvoiceChildren = useCallback(async (invoiceId: string, deleted: boolean) => {
    try {
      const pays = await fetchSecureData<any>('payments', { fullList: true, filter: `invoiceId="${invoiceId}"` })
      for (const pay of pays || []) {
        await updateRecord('payments', pay.id, { deleted })
        const recs = await fetchSecureData<any>('receipts', { fullList: true, filter: `paymentId="${pay.id}"` })
        for (const rc of recs || []) await updateRecord('receipts', rc.id, { deleted })
      }
    } catch (e) {
      console.error('级联处理关联收款/收据失败:', e)
    }
  }, [])

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    await updateRecord('invoices', invoiceId, { deleted: true })
    await cascadeInvoiceChildren(invoiceId, true)
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
  }, [cascadeInvoiceChildren])

  const restoreInvoice = useCallback(async (invoiceId: string) => {
    await updateRecord('invoices', invoiceId, { deleted: false })
    await cascadeInvoiceChildren(invoiceId, false)
  }, [cascadeInvoiceChildren])

  const permanentDeleteInvoice = useCallback(async (invoiceId: string) => {
    // 永久删除：连带收款/收据一起物理删掉
    try {
      const pays = await fetchSecureData<any>('payments', { fullList: true, filter: `invoiceId="${invoiceId}"` })
      for (const pay of pays || []) {
        const recs = await fetchSecureData<any>('receipts', { fullList: true, filter: `paymentId="${pay.id}"` })
        for (const rc of recs || []) await deleteRecord('receipts', rc.id)
        await deleteRecord('payments', pay.id)
      }
    } catch (e) {
      console.error('永久删除关联收款/收据失败:', e)
    }
    await deleteRecord('invoices', invoiceId)
  }, [])

  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: Invoice['status']) => {
    await updateInvoice(invoiceId, { status })
  }, [updateInvoice])

  const getFilteredInvoices = useCallback(() => {
    return invoices.filter(invoice => {
      // 排除已删除发票（软删除）
      if (invoice.deleted) return false
      // Status filter: "all" = no filter, "paid" = status === 'paid', "unpaid" = issued/overdue
      const matchesStatus = !filters.status || filters.status === 'all' || (
        filters.status === 'paid' ? invoice.status === 'paid'
        : filters.status === 'unpaid' ? (invoice.status === 'issued' || invoice.status === 'overdue' || invoice.status === 'draft' || invoice.status === 'pending' || invoice.status === 'partially_paid')
        : invoice.status === filters.status
      )

      // Search filter: match invoiceNumber or studentName
      const query = (filters.search || '').toLowerCase()
      const matchesSearch = !query || 
        (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(query)) ||
        (invoice.studentName && invoice.studentName.toLowerCase().includes(query)) ||
        (invoice.student && invoice.student.toLowerCase().includes(query))

      // Legacy studentName filter (fallback)
      const matchesStudent = !filters.studentName || 
        invoice.studentName.toLowerCase().includes(filters.studentName.toLowerCase())

      return matchesStatus && matchesSearch && matchesStudent
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
    const month = targetMonth || toLocalMonthKey()
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
    restoreInvoice,
    permanentDeleteInvoice,
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
