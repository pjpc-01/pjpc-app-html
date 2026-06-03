import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData } from '@/lib/secure-api-client'

export interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  method: string
  created?: string
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<Expense[]>('expenses', {
        sort: '-date',
      })
      setExpenses(data)
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError(err instanceof Error ? err.message : '获取支出记录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const createExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      // In a real scenario, this would call the API. 
      // For now, we'll use the secure client's post if implemented, 
      // or simulate the DB update for the mock period.
      const newExpense = await fetchSecureData<Expense>('expenses/create', { 
        method: 'POST', 
        data: expense 
      })
      setExpenses(prev => [newExpense, ...prev])
      return newExpense
    } catch (err) {
      console.error('Error creating expense:', err)
      throw err
    }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const updated = await fetchSecureData<Expense>(`expenses/${id}`, { 
        method: 'PATCH', 
        data: updates 
      })
      setExpenses(prev => prev.map(e => e.id === id ? updated : e))
      return updated
    } catch (err) {
      console.error('Error updating expense:', err)
      throw err
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      await fetchSecureData(`expenses/${id}`, { method: 'DELETE' })
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error('Error deleting expense:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  }
}
