import { SimpleInvoice } from '@/hooks/useInvoiceData'
import { pb } from './pocketbase-instance'

/**
 * Invoice utility functions for managing invoice-related operations
 */
export class InvoiceUtils {
  /**
   * Check if a student already has an invoice for the current month
   */
  static hasInvoiceThisMonth(studentId: string, invoices: SimpleInvoice[]): boolean {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    
    return invoices.some(invoice => {
      if (invoice.student_id !== studentId) return false
      
      // Check if invoice was created this month
      const invoiceDate = new Date(invoice.issue_date)
      return invoiceDate.getFullYear() === currentYear && 
             invoiceDate.getMonth() + 1 === currentMonth
    })
  }

  /**
   * Get the current month invoice for a specific student
   */
  static getCurrentMonthInvoice(studentId: string, invoices: SimpleInvoice[]): SimpleInvoice | null {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    
    return invoices.find(invoice => {
      if (invoice.student_id !== studentId) return false
      
      const invoiceDate = new Date(invoice.issue_date)
      return invoiceDate.getFullYear() === currentYear && 
             invoiceDate.getMonth() + 1 === currentMonth
    }) || null
  }

  /**
   * Get all students who already have invoices for the current month
   */
  static getStudentsWithCurrentMonthInvoices(invoices: SimpleInvoice[]): string[] {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    
    const studentIds = new Set<string>()
    
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.issue_date)
      if (invoiceDate.getFullYear() === currentYear && 
          invoiceDate.getMonth() + 1 === currentMonth) {
        studentIds.add(invoice.student_id)
      }
    })
    
    return Array.from(studentIds)
  }

  /**
   * Get current month name for display
   */
  static getCurrentMonthName(): string {
    const now = new Date()
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  /**
   * Check if an invoice is from the current month
   */
  static isCurrentMonthInvoice(invoice: SimpleInvoice): boolean {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const invoiceDate = new Date(invoice.issue_date)
    return invoiceDate.getFullYear() === currentYear && 
           invoiceDate.getMonth() + 1 === currentMonth
  }

  /**
   * Get month and year from invoice issue date
   */
  static getInvoiceMonthYear(invoice: SimpleInvoice): { month: number; year: number } {
    const invoiceDate = new Date(invoice.issue_date)
    return {
      month: invoiceDate.getMonth() + 1,
      year: invoiceDate.getFullYear()
    }
  }

  /**
   * Check if two dates are in the same month and year
   */
  static isSameMonthYear(date1: Date | string, date2: Date | string): boolean {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth()
  }
}

// Export convenience functions
export const hasInvoiceThisMonth = InvoiceUtils.hasInvoiceThisMonth
export const getCurrentMonthInvoice = InvoiceUtils.getCurrentMonthInvoice
export const getStudentsWithCurrentMonthInvoices = InvoiceUtils.getStudentsWithCurrentMonthInvoices
export const getCurrentMonthName = InvoiceUtils.getCurrentMonthName
export const isCurrentMonthInvoice = InvoiceUtils.isCurrentMonthInvoice
export const getInvoiceMonthYear = InvoiceUtils.getInvoiceMonthYear
export const isSameMonthYear = InvoiceUtils.isSameMonthYear

/**
 * Utility functions for invoice management
 */

export interface InvoiceStatusCalculation {
  invoiceId: string
  currentStatus: string
  newStatus: string
  totalAmount: number
  totalPaid: number
  difference: number
  needsUpdate: boolean
}

/**
 * Calculate invoice payment status based on total payments
 */
export const calculateInvoicePaymentStatus = (
  invoice: any, 
  payments: any[]
): string => {
  const invoicePayments = payments.filter(payment => payment.invoice_id === invoice.id)
  
  if (invoicePayments.length === 0) {
    return "pending"
  }
  
  const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount_paid, 0)
  if (totalPaid > invoice.total_amount) return "overpaid"
  if (totalPaid === invoice.total_amount) return "paid"
  if (totalPaid > 0 && totalPaid < invoice.total_amount) return "underpaid"
  return "pending"
}

/**
 * Recalculate and update invoice status based on current payments
 */
export const recalculateInvoiceStatus = async (invoiceId: string): Promise<InvoiceStatusCalculation> => {
  try {
    // Fetch invoice
    const invoice = await pb.collection('invoices').getOne(invoiceId)
    
    // Fetch all payments for this invoice
    const payments = await pb.collection('payments').getList(1, 200, {
      filter: `invoice_id = "${invoiceId}"`
    })
    
    // Calculate new status
    const newStatus = calculateInvoicePaymentStatus(invoice, payments.items)
    
    // Calculate totals
    const totalPaid = payments.items.reduce((sum, p) => sum + p.amount_paid, 0)
    const difference = totalPaid - invoice.total_amount
    
    const calculation: InvoiceStatusCalculation = {
      invoiceId,
      currentStatus: invoice.status,
      newStatus,
      totalAmount: invoice.total_amount,
      totalPaid,
      difference,
      needsUpdate: newStatus !== invoice.status
    }
    
    // Update invoice status if needed
    if (calculation.needsUpdate) {
      await pb.collection('invoices').update(invoiceId, { status: newStatus })
      console.log(`✅ Invoice ${invoiceId} status updated from "${invoice.status}" to "${newStatus}"`)
    }
    
    return calculation
    
  } catch (error: any) {
    console.error(`❌ Error recalculating invoice status for ${invoiceId}:`, error)
    throw new Error(`Failed to recalculate invoice status: ${error.message}`)
  }
}

/**
 * Bulk recalculate invoice statuses for multiple invoices
 */
export const bulkRecalculateInvoiceStatuses = async (invoiceIds: string[]): Promise<InvoiceStatusCalculation[]> => {
  const results: InvoiceStatusCalculation[] = []
  
  for (const invoiceId of invoiceIds) {
    try {
      const result = await recalculateInvoiceStatus(invoiceId)
      results.push(result)
    } catch (error) {
      console.error(`❌ Failed to recalculate invoice ${invoiceId}:`, error)
      // Continue with other invoices even if one fails
    }
  }
  
  return results
}

/**
 * Get payment summary for an invoice
 */
export const getInvoicePaymentSummary = async (invoiceId: string) => {
  try {
    const invoice = await pb.collection('invoices').getOne(invoiceId)
    const payments = await pb.collection('payments').getList(1, 200, {
      filter: `invoice_id = "${invoiceId}"`
    })
    
    const totalPaid = payments.items.reduce((sum, p) => sum + p.amount_paid, 0)
    const remainingAmount = invoice.total_amount - totalPaid
    
    return {
      invoiceId,
      totalAmount: invoice.total_amount,
      totalPaid,
      remainingAmount,
      paymentCount: payments.items.length,
      status: invoice.status,
      isFullyPaid: totalPaid >= invoice.total_amount,
      isOverpaid: totalPaid > invoice.total_amount
    }
  } catch (error: any) {
    console.error(`❌ Error getting payment summary for invoice ${invoiceId}:`, error)
    throw new Error(`Failed to get payment summary: ${error.message}`)
  }
}
