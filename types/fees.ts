// Fee type shared across finance components and hooks
export interface Fee {
  id: string
  name: string
  amount: number  // 单价
  type: 'monthly' | 'one-time' | 'annual' | 'six-month' | 'daily'
  description?: string
  status: 'active' | 'inactive'
  category?: string
  icon?: string          // Lucide icon name for the category (e.g. "GraduationCap")
  applicableCenters?: string[]
  applicableLevels?: string[]
  // 历史表单仍在读这些键；已迁到 student_fees / invoice_settings，这里留可选兼容
  discount?: number
  discountType?: 'amount' | 'percent'
  sixMonthPay?: boolean
  sixMonthPayRate?: number
  latePaymentFee?: number
  latePaymentRule?: string
  notes?: string
}

// Optional helper subtype used in forms when creating/updating
export type NewFeeItem = Omit<Fee, 'id'>


