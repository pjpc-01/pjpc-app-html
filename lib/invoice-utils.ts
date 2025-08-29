import { SimpleInvoice } from '@/hooks/useInvoiceData'

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
