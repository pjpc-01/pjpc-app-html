import { Receipt } from '@/hooks/useReceipts'

export const generateReceiptNumber = (invoiceNumber: string) => {
  return invoiceNumber.replace('INV-', 'RCP-')
}

export const createReceiptFromInvoice = (
  invoice: any, 
  paymentMethod: string, 
  paymentDate: string,
  receiptId: number
): Receipt => {
  const receiptNumber = generateReceiptNumber(invoice.invoiceNumber)
  
  return {
    id: receiptId,
    receiptNumber,
    invoiceNumber: invoice.invoiceNumber,
    student: invoice.student,
    studentId: invoice.studentId,
    amount: invoice.amount,
    items: invoice.items,
    status: 'issued',
    issueDate: new Date().toISOString().split('T')[0],
    paymentDate,
    paymentMethod,
    notes: `收据 - ${invoice.notes}`,
    tax: invoice.tax,
    discount: invoice.discount,
    totalAmount: invoice.totalAmount,
    parentEmail: invoice.parentEmail,
    receiptTemplate: 'default',
    generatedBy: 'system'
  }
}

