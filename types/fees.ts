// Fee type shared across finance components and hooks
export interface Fee {
  id: string
  name: string
  amount: number
  type: 'monthly' | 'one-time' | 'annual'
  description?: string
  status: 'active' | 'inactive'
  category?: string
  applicableCenters?: string[]
  applicableLevels?: string[]
}

// Optional helper subtype used in forms when creating/updating
export type NewFeeItem = Omit<Fee, 'id'>


