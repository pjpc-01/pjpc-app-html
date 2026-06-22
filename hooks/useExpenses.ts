import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord, createRecordWithFile } from '@/lib/secure-api-client'

export interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  method: string
  centerId?: string
  receipt?: string  // file field — PB returns filename string
  expand?: {
    centerId?: {
      id: string
      name: string
      code: string
    }
  }
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
        fullList: true,
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
      const newExpense = await createRecord('expenses', expense) as Expense
      setExpenses(prev => [newExpense, ...prev])
      return newExpense
    } catch (err) {
      console.error('Error creating expense:', err)
      throw err
    }
  }

  const createExpenseWithReceipt = async (expense: Omit<Expense, 'id' | 'receipt'>, file: File) => {
    try {
      const newExpense = await createRecordWithFile('expenses', expense, 'receipt', file) as Expense
      setExpenses(prev => [newExpense, ...prev])
      return newExpense
    } catch (err) {
      console.error('Error creating expense with receipt:', err)
      throw err
    }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const updated = await updateRecord('expenses', id, updates) as Expense
      setExpenses(prev => prev.map(e => e.id === id ? updated : e))
      return updated
    } catch (err) {
      console.error('Error updating expense:', err)
      throw err
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      await deleteRecord('expenses', id)
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
    createExpenseWithReceipt,
    updateExpense,
    deleteExpense
  }
}
