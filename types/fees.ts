// Fee type shared across finance components and hooks
export interface Fee {
  id: string
  name: string
  amount: number
  frequency: 'one-time' | 'recurring'  // Changed from 'type' to match PocketBase schema
  description?: string
  status: 'active' | 'inactive'
  category: string  // Made required to match PocketBase schema
}

// Optional helper subtype used in forms when creating/updating
export type NewFeeItem = Omit<Fee, 'id'>

// Payment interfaces - FIXED to match your actual PocketBase schema
export interface Payment {
  id: string
  payment_id: string
  invoice_id: string
  amount_paid: number
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'e_wallet' // Fixed: e_v → e_wallet
  transaction_id?: string
  payment_date: string
  status: 'confirmed' | 'pending' | 'failed' | 'cancelled' // Fixed: ca → cancelled
  notes?: string
  // Remove created/updated if they don't exist in your schema
}

export interface PaymentWithInvoice extends Payment {
  expand?: {
    invoice_id?: {
      id: string
      invoice_id: string
      student_name?: string
      total_amount: number
      status: string
      issue_date: string
      due_date: string
    }
  }
}

export interface PaymentFormData {
  amount: string
  method: string
  notes: string
}

export interface PaymentFilters {
  status: string
  method: string
  search: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface ReconciliationResult {
  totalInvoices: number
  totalPayments: number
  paidInvoices: number
  unpaidInvoices: number
  totalAmountInvoiced: number
  totalAmountPaid: number
  discrepancies: Array<{
    type: string
    invoiceId: string
    invoiceNumber: string
    expected: number
    actual: number
    difference: number
  }>
}


