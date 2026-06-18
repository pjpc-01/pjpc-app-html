import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData } from '@/lib/secure-api-client'

export interface Budget {
  id: string
  category: string
  month: number
  year: number
  budgetAmount: number
  spent?: number
  variance?: number
  percentage?: number
  notes?: string
  status?: string
}

export interface BudgetSummary {
  budgets: Budget[]
  summary: {
    totalBudget: number
    totalSpent: number
    variance: number
    categories: Array<{
      category: string
      budget: number
      spent: number
      variance: number
      percentage: number
    }>
  }
  totalBudget: number
  totalSpent: number
}

export const BUDGET_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salary',
  'Supplies',
  'Food',
  'Transport',
  'Marketing',
  'Maintenance',
  'Other',
] as const

function buildBudgetsUrl(month?: number, year?: number): string {
  const params = new URLSearchParams()
  if (month !== undefined) params.set('month', String(month))
  if (year !== undefined) params.set('year', String(year))
  const qs = params.toString()
  return `/api/finance/budgets${qs ? `?${qs}` : ''}`
}

export function useBudgets(month?: number, year?: number) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [summary, setSummary] = useState<BudgetSummary['summary'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setMonth] = useState<number | undefined>(month)
  const [currentYear, setYear] = useState<number | undefined>(year)

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const url = buildBudgetsUrl(currentMonth, currentYear)
      const response = await fetch(url)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to fetch budgets: ${response.status}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch budgets')
      }

      const data = json.data as BudgetSummary
      setBudgets(data.budgets || [])
      setSummary(data.summary || null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch budgets'
      setError(message)
      console.error('useBudgets fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const createBudget = useCallback(
    async (data: {
      category: string
      month: number
      year: number
      budgetAmount: number
      notes?: string
      status?: string
    }) => {
      try {
        const response = await fetch('/api/finance/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `Failed to create budget: ${response.status}`)
        }

        const json = await response.json()

        if (!json.success) {
          throw new Error(json.error || 'Failed to create budget')
        }

        await fetchBudgets()
        return json.data
      } catch (err) {
        console.error('createBudget error:', err)
        throw err
      }
    },
    [fetchBudgets],
  )

  const updateBudget = useCallback(
    async (
      budgetId: string,
      updates: Partial<{
        category: string
        month: number
        year: number
        budgetAmount: number
        notes: string
        status: string
      }>,
    ) => {
      try {
        const response = await fetch(`/api/finance/budgets?id=${budgetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `Failed to update budget: ${response.status}`)
        }

        const json = await response.json()

        if (!json.success) {
          throw new Error(json.error || 'Failed to update budget')
        }

        await fetchBudgets()
        return json.data
      } catch (err) {
        console.error('updateBudget error:', err)
        throw err
      }
    },
    [fetchBudgets],
  )

  const deleteBudget = useCallback(async (budgetId: string) => {
    try {
      const response = await fetch(`/api/finance/budgets?id=${budgetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to delete budget: ${response.status}`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to delete budget')
      }

      setBudgets(prev => prev.filter(b => b.id !== budgetId))
      return json.data
    } catch (err) {
      console.error('deleteBudget error:', err)
      throw err
    }
  }, [])

  return {
    budgets,
    summary,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    setMonth,
    setYear,
    refetch: fetchBudgets,
  }
}
