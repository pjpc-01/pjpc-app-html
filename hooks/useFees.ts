import { useState, useCallback, useEffect } from 'react'
import { pb, updatePocketBaseUrl } from '@/lib/pocketbase'

// Fee interface matching exact PocketBase field names
export interface Fee {
  id: string
  name: string
  category: string
  amount: number
  type: 'monthly' | 'one-time' | 'annual'
  status: 'active' | 'inactive'
  // Optional for backward-compat with UI components that expect subItems
  subItems?: { id: string; name: string; amount: number }[]
  applicableCenters?: string[]
  applicableLevels?: string[]
  description?: string
  effectiveFrom?: string
  effectiveTo?: string
  notes?: string
}

export interface FeeFilters {
  category: string
  status: string
  type: string
}

export const useFees = () => {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FeeFilters>({
    category: "",
    status: "",
    type: ""
  })

  // Authentication function
  const authenticate = useCallback(async () => {
    try {
      // Check if already authenticated
      if (pb.authStore.isValid) {
        return true
      }

      // Try to authenticate with admin credentials
      await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('✅ Authentication successful for fees')
      return true
    } catch (authError) {
      console.error('❌ Authentication failed for fees:', authError)
      setError('Authentication failed. Please check your credentials.')
      return false
    }
  }, [])

  // Load fees from PocketBase
  useEffect(() => {
    let isMounted = true
    let abortController: AbortController | null = null

    const loadFees = async () => {
      try {
        // Cancel previous request if it exists
        if (abortController) {
          abortController.abort()
        }

        // Create new abort controller for this request
        abortController = new AbortController()

        setLoading(true)
        setError(null)

        // Use consistent URL - don't change it dynamically
        console.log('🔗 Using PocketBase URL:', pb.baseUrl)

        // Authenticate first
        const isAuthenticated = await authenticate()
        if (!isAuthenticated) {
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        const records = await pb.collection('fees').getFullList(200, {
          sort: 'category'
        })
        
        if (!isMounted) return

        console.log('📊 Loaded fees from PocketBase:', records.length, 'records')
        
        const mapped: Fee[] = records.map((r: any) => ({
          id: r.id,
          name: r.name || r.category || '未命名', // Now use name field if it exists
          category: r.category,
          amount: r.amount,
          type: r.type,
          status: r.status,
          subItems: [{ id: r.id, name: r.name || r.category || '未命名', amount: r.amount }],
          applicableCenters: r.applicableCenters || [],
          applicableLevels: r.applicableLevels || [],
          description: r.description,
          effectiveFrom: r.effectiveFrom,
          effectiveTo: r.effectiveTo,
          notes: r.notes
        }))
        
        console.log('✅ Mapped fees:', mapped.map(f => ({ id: f.id, name: f.name, status: f.status, category: f.category })))
        
        setFees(mapped)
        setError(null)
      } catch (err: any) {
        if (!isMounted) return

        // Don't log or set error for cancelled requests
        if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
          console.log('🔄 Request was cancelled, skipping error handling')
          return
        }

        console.error('Failed to load fees from PocketBase:', err)
        
        // Handle authentication errors
        if (err.status === 403) {
          setError('Access denied. Please check your permissions.')
        } else if (err.status === 401) {
          setError('Authentication required. Please log in.')
        } else {
          setError('Failed to load fees: ' + (err.message || 'Unknown error'))
        }
        
        // Only use fallback data if we have no existing data
        if (fees.length === 0) {
          setFees([
            {
              id: "1",
              name: "基础学费",
              category: "Academic",
              amount: 800,
              type: "monthly",
              status: "active",
              subItems: [{ id: "1", name: "基础学费", amount: 800 }],
              description: "每月基础学费"
            },
            {
              id: "2",
              name: "特色课程费",
              category: "Extracurricular",
              amount: 400,
              type: "monthly",
              status: "active",
              subItems: [{ id: "2", name: "特色课程费", amount: 400 }],
              description: "特色课程费用"
            },
            {
              id: "3",
              name: "注册费",
              category: "Administrative",
              amount: 500,
              type: "one-time",
              status: "active",
              subItems: [{ id: "3", name: "注册费", amount: 500 }],
              description: "新生注册费用"
            }
          ])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadFees()

    // Set up periodic refresh every 30 seconds to keep data in sync
    const intervalId = setInterval(() => {
      if (isMounted) {
        loadFees()
      }
    }, 30000)

    return () => {
      isMounted = false
      if (abortController) {
        abortController.abort()
      }
      clearInterval(intervalId)
    }
  }, [authenticate])

  const createFee = useCallback(async (feeData: Omit<Fee, 'id'>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      console.log('🔄 Creating fee with data:', feeData)
      
      // Include name field since it now exists in PocketBase schema
      const pocketbaseData = feeData
      
      const created = await pb.collection('fees').create(pocketbaseData)
      const newFee: Fee = {
        ...feeData,
        id: created.id
      }
      
      console.log('✅ Fee created successfully:', newFee)
      
      setFees(prev => [...prev, newFee])
      return newFee
    } catch (err: any) {
      console.error('Failed to create fee:', err)
      
      // Don't log or set error for cancelled requests
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log('🔄 Create request was cancelled, skipping error handling')
        throw new Error('Request was cancelled')
      }
      
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const updateFee = useCallback(async (feeId: string, updates: Partial<Fee>) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      // Include name field since it now exists in PocketBase schema
      const pocketbaseUpdates = updates
      
      await pb.collection('fees').update(feeId, pocketbaseUpdates)
      setFees(prev => prev.map(fee => 
        fee.id === feeId ? { ...fee, ...updates } : fee
      ))
    } catch (err: any) {
      console.error('Failed to update fee:', err)
      
      // Don't log or set error for cancelled requests
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log('🔄 Update request was cancelled, skipping error handling')
        throw new Error('Request was cancelled')
      }
      
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const deleteFee = useCallback(async (feeId: string) => {
    try {
      // Ensure authentication
      const isAuthenticated = await authenticate()
      if (!isAuthenticated) {
        throw new Error('Authentication required')
      }

      await pb.collection('fees').delete(feeId)
      setFees(prev => prev.filter(fee => fee.id !== feeId))   
    } catch (err: any) {
      console.error('Failed to delete fee:', err)
      
      // Don't log or set error for cancelled requests
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        console.log('🔄 Delete request was cancelled, skipping error handling')
        throw new Error('Request was cancelled')
      }
      
      if (err.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }
      throw err
    }
  }, [authenticate])

  const getFilteredFees = useCallback(() => {
    return fees.filter(fee => {
      const matchesCategory = !filters.category || fee.category === filters.category
      const matchesStatus = !filters.status || fee.status === filters.status
      const matchesType = !filters.type || fee.type === filters.type
      return matchesCategory && matchesStatus && matchesType
    })
  }, [fees, filters])

  const getFeesByGrade = useCallback((grade: string) => {
    return fees.filter(fee => 
      fee.status === 'active' && 
      (fee.applicableLevels?.includes(grade) || !fee.applicableLevels?.length)
    )
  }, [fees])

  const getFeeStatistics = useCallback(() => {
    const total = fees.length
    const active = fees.filter(fee => fee.status === 'active').length
    const inactive = fees.filter(fee => fee.status === 'inactive').length
    const monthly = fees.filter(fee => fee.type === 'monthly').length
    const oneTime = fees.filter(fee => fee.type === 'one-time').length
    const annual = fees.filter(fee => fee.type === 'annual').length
    
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0)
    
    return {
      total,
      active,
      inactive,
      monthly,
      oneTime,
      annual,
      totalAmount
    }
  }, [fees])

  return {
    fees,
    loading,
    error,
    filters,
    setFilters,
    createFee,
    updateFee,
    deleteFee,
    getFilteredFees,
    getFeesByGrade,
    getFeeStatistics
  }
} 