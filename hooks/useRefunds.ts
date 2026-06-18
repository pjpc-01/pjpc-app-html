import { useState, useEffect, useCallback } from 'react'

export interface Refund {
  id: string
  paymentId?: string
  invoiceId: string
  studentId?: string
  amount: number
  reason: string
  method?: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  processedBy?: string
  notes?: string
  created?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

interface UseRefundsReturn {
  refunds: Refund[]
  loading: boolean
  error: string | null
  createRefund: (data: Omit<Refund, 'id'>) => Promise<Refund | undefined>
  refetch: () => void
  getTotalRefundedAmount: () => number
}

async function callRefundsApi<T>(
  options?: RequestInit
): Promise<T> {
  const response = await fetch('/api/finance/refunds', {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `API request failed: ${response.status}`)
  }
  const json: ApiResponse<T> = await response.json()
  if (!json.success) {
    throw new Error(json.error || 'Unknown API error')
  }
  return json.data
}

export function useRefunds(): UseRefundsReturn {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRefunds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await callRefundsApi<Refund[]>()
      setRefunds(data)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch refunds'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRefunds()
  }, [fetchRefunds])

  const createRefund = useCallback(
    async (data: Omit<Refund, 'id'>): Promise<Refund | undefined> => {
      setError(null)
      try {
        const result = await callRefundsApi<Refund>({
          method: 'POST',
          body: JSON.stringify(data),
        })
        setRefunds((prev) => [...prev, result])
        return result
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to create refund'
        setError(message)
        return undefined
      }
    },
    []
  )

  const getTotalRefundedAmount = useCallback((): number => {
    return refunds
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0)
  }, [refunds])

  return {
    refunds,
    loading,
    error,
    createRefund,
    refetch: fetchRefunds,
    getTotalRefundedAmount,
  }
}
