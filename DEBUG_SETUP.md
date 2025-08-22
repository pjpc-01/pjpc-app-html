# Debug Logging Setup Guide

## 🎯 **Problem Solved**
Your console was flooded with logs because React Fast Refresh remounts components on every save, and you had console.log calls in useEffect and cleanup functions.

## ✅ **Solution: Conditional Debug Logging**

### **1. Environment Variable Setup**

Add this to your `.env.local` file:
```bash
# Enable debug logging (set to 'true' to see logs, 'false' or remove to hide logs)
NEXT_PUBLIC_DEBUG=true
```

### **2. Debug Configuration Pattern**

```typescript
// ========================================
// Debug Configuration
// ========================================
const DEBUG = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === 'true'

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`🔍 [ComponentName] ${message}`, data || '')
  }
}
```

### **3. Clean Data Fetching Pattern**

```typescript
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
      debugLog('Starting API call with abort signal')
      const response = await fetch('/api/data', { signal })
      
      // Check if aborted during fetch
      if (signal.aborted) {
        debugLog('Fetch aborted during API call')
        return
      }
      
      const result = await response.json()
      setData(result)
      debugLog('Data fetch completed successfully')
      
    } catch (error) {
      // Only log if it's not an abort error (abort is expected on unmount)
      if (error instanceof Error && error.name !== 'AbortError') {
        debugLog('Data fetch failed', { error: error.message })
      }
    }
  }

  fetchData()

  // Cleanup function
  return () => {
    debugLog('Component unmounting - aborting fetch')
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }
}, []) // Empty dependency array - only run on mount
```

## 🚀 **Benefits**

1. **No Console Spam**: Logs only appear when `NEXT_PUBLIC_DEBUG=true`
2. **Clean Unmounts**: AbortController properly cancels pending requests
3. **No Memory Leaks**: Proper cleanup prevents memory leaks
4. **Development Friendly**: Easy to toggle debugging on/off
5. **Production Ready**: No logs in production builds

## 🔧 **Usage**

- **Development with logs**: Set `NEXT_PUBLIC_DEBUG=true` in `.env.local`
- **Development without logs**: Set `NEXT_PUBLIC_DEBUG=false` or remove the variable
- **Production**: Logs are automatically disabled

## 📝 **Key Points**

1. **AbortController**: Properly cancels fetch requests on unmount
2. **Conditional Logging**: Only logs when debug flag is enabled
3. **Initial Mount Check**: Prevents logging on every re-render
4. **Error Handling**: Ignores expected AbortError on unmount
5. **Clean Dependencies**: Empty dependency array prevents infinite loops
