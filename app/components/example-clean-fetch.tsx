// ========================================
// Clean Data Fetching Example Component
// ========================================

import React, { useEffect, useRef, useState } from 'react'

// ========================================
// Debug Configuration
// ========================================
const DEBUG = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === 'true'

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`🔍 [CleanFetch] ${message}`, data || '')
  }
}

// ========================================
// Example Component
// ========================================
export const CleanFetchExample: React.FC = () => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitialMountRef = useRef(true)

  // ========================================
  // Clean Data Fetching with AbortController
  // ========================================
  useEffect(() => {
    // Only log on initial mount, not on every re-render
    if (isInitialMountRef.current) {
      debugLog('Component mounted - starting data fetch')
      isInitialMountRef.current = false
    }

    // Create new AbortController for this fetch
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    // Fetch data with abort signal
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        debugLog('Starting API call with abort signal')
        
        // Simulate API call
        const response = await fetch('/api/data', { signal })
        
        // Check if aborted during fetch
        if (signal.aborted) {
          debugLog('Fetch aborted during API call')
          return
        }
        
        const result = await response.json()
        
        // Check if aborted during processing
        if (signal.aborted) {
          debugLog('Fetch aborted during data processing')
          return
        }
        
        setData(result)
        debugLog('Data fetch completed successfully', { count: result.length })
        
      } catch (error) {
        // Only log if it's not an abort error (abort is expected on unmount)
        if (error instanceof Error && error.name !== 'AbortError') {
          debugLog('Data fetch failed', { error: error.message })
          setError(error.message)
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Cleanup function - will run on unmount or dependency change
    return () => {
      debugLog('Component unmounting - aborting fetch')
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, []) // Empty dependency array - only run on mount

  // ========================================
  // Render
  // ========================================
  return (
    <div>
      <h2>Clean Fetch Example</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data.length > 0 && (
        <div>
          <p>Loaded {data.length} items</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
