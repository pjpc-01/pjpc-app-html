// Fee type shared across finance components and hooks
export interface Fee {
  id: string
  name: string
  amount: number
  type: 'monthly' | 'one-time' | 'annual' | 'six-month'
  description?: string
  status: 'active' | 'inactive'
  category?: string
  icon?: string          // Lucide icon name for the category (e.g. "GraduationCap")
  applicableCenters?: string[]
  applicableLevels?: string[]
  // NOTE: discount / sixMonthPay / latePaymentFee moved to student_fees
  //       (per-student) and invoice_settings (global rules).
}

// Optional helper subtype used in forms when creating/updating
export type NewFeeItem = Omit<Fee, 'id'>


