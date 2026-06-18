import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'

export interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName?: string
  openingBalance?: number
  currentBalance?: number
  status?: string
  created?: string
  updated?: string
}

export interface BankTransaction {
  id: string
  bankAccountId: string
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  reference?: string
  category?: string
  notes?: string
  created?: string
}

const ACCOUNTS_COLLECTION = 'bank_accounts'
const TRANSACTIONS_COLLECTION = 'bank_transactions'

export const useBankAccounts = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<BankAccount[]>(ACCOUNTS_COLLECTION, {
        sort: '-created',
        fullList: true,
      })
      setAccounts(data)
    } catch (err) {
      console.error('Error fetching bank accounts:', err)
      setError(err instanceof Error ? err.message : '获取银行账户失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const createAccount = async (account: Omit<BankAccount, 'id'>) => {
    try {
      const newAccount = await createRecord(ACCOUNTS_COLLECTION, account) as BankAccount
      setAccounts(prev => [newAccount, ...prev])
      return newAccount
    } catch (err) {
      console.error('Error creating bank account:', err)
      throw err
    }
  }

  const updateAccount = async (id: string, updates: Partial<BankAccount>) => {
    try {
      const updated = await updateRecord(ACCOUNTS_COLLECTION, id, updates) as BankAccount
      setAccounts(prev => prev.map(a => a.id === id ? updated : a))
      return updated
    } catch (err) {
      console.error('Error updating bank account:', err)
      throw err
    }
  }

  const deleteAccount = async (id: string) => {
    try {
      await deleteRecord(ACCOUNTS_COLLECTION, id)
      setAccounts(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error deleting bank account:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refetch: fetchAccounts,
  }
}

export const useBankTransactions = (bankAccountId?: string) => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const options: any = {
        sort: '-date',
        fullList: true,
      }
      if (bankAccountId) {
        options.filter = `bankAccountId = '${bankAccountId}'`
      }
      const data = await fetchSecureData<BankTransaction[]>(TRANSACTIONS_COLLECTION, options)
      setTransactions(data)
    } catch (err) {
      console.error('Error fetching bank transactions:', err)
      setError(err instanceof Error ? err.message : '获取银行交易记录失败')
    } finally {
      setLoading(false)
    }
  }, [bankAccountId])

  const importTransactions = async (newTransactions: Omit<BankTransaction, 'id'>[]) => {
    try {
      setLoading(true)
      const results = await Promise.all(
        newTransactions.map(tx => createRecord(TRANSACTIONS_COLLECTION, tx) as Promise<BankTransaction>)
      )
      setTransactions(prev => [...results, ...prev])
      return results
    } catch (err) {
      console.error('Error importing transactions:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      await deleteRecord(TRANSACTIONS_COLLECTION, id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Error deleting transaction:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    loading,
    error,
    importTransactions,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}
