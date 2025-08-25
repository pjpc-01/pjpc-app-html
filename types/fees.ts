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


