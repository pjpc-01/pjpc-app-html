import { useEffect, useRef, useCallback } from 'react'

/**
 * 内存优化Hook
 * 管理组件内存使用，防止内存泄漏
 */
export function useMemoryOptimization() {
  const cleanupRefs = useRef<Set<() => void>>(new Set())
  const intervalRefs = useRef<Set<ReturnType<typeof setInterval>>>(new Set())
  const timeoutRefs = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  // 注册清理函数
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupRefs.current.add(cleanupFn)
    return () => {
      cleanupRefs.current.delete(cleanupFn)
    }
  }, [])

  // 注册定时器
  const registerInterval = useCallback((interval: ReturnType<typeof setInterval>) => {
    intervalRefs.current.add(interval)
    return interval
  }, [])

  const registerTimeout = useCallback((timeout: ReturnType<typeof setTimeout>) => {
    timeoutRefs.current.add(timeout)
    return timeout
  }, [])

  // 创建安全的定时器
  const createInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay)
    return registerInterval(interval)
  }, [registerInterval])

  const createTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay)
    return registerTimeout(timeout)
  }, [registerTimeout])

  // 清理所有资源
  const cleanup = useCallback(() => {
    // 清理函数
    cleanupRefs.current.forEach(cleanupFn => {
      try {
        cleanupFn()
      } catch (error) {
        console.warn('清理函数执行失败:', error)
      }
    })
    cleanupRefs.current.clear()

    // 清理定时器
    intervalRefs.current.forEach(interval => {
      clearInterval(interval)
    })
    intervalRefs.current.clear()

    // 清理超时
    timeoutRefs.current.forEach(timeout => {
      clearTimeout(timeout)
    })
    timeoutRefs.current.clear()
  }, [])

  // 组件卸载时自动清理
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    registerCleanup,
    createInterval,
    createTimeout,
    cleanup
  }
}

/**
 * 防抖Hook - 减少频繁的函数调用
 * 使用 callbackRef 避免闭包问题
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 更新 callback 引用
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay]) as T

  // 清理超时
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * 节流Hook - 限制函数调用频率
 * 使用 callbackRef 避免闭包问题
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback)
  const lastCallRef = useRef<number>(0)

  // 更新 callback 引用
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now
      callbackRef.current(...args)
    }
  }, [delay]) as T

  return throttledCallback
}