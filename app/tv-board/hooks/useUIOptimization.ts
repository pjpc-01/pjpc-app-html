import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from './useMemoryOptimization'

/**
 * UI优化Hook集合
 * 提供各种UI优化功能
 */

// 1. 智能加载状态管理
export function useSmartLoading(initialLoading = true) {
  const [loading, setLoading] = useState(initialLoading)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const loadingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const startLoading = useCallback((message = '加载中...', progress = 0) => {
    setLoading(true)
    setLoadingMessage(message)
    setLoadingProgress(progress)
    
    // 设置超时，防止无限加载
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setLoadingMessage('加载超时')
    }, 30000) // 30秒超时
  }, [])

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingProgress(Math.min(100, Math.max(0, progress)))
    if (message) {
      setLoadingMessage(message)
    }
  }, [])

  const finishLoading = useCallback(() => {
    setLoading(false)
    setLoadingProgress(100)
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
  }, [])

  const resetLoading = useCallback(() => {
    setLoading(false)
    setLoadingProgress(0)
    setLoadingMessage('')
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  return {
    loading,
    loadingProgress,
    loadingMessage,
    startLoading,
    updateProgress,
    finishLoading,
    resetLoading
  }
}

// 2. 智能错误处理
export function useSmartError() {
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const [retryCounts, setRetryCounts] = useState<Map<string, number>>(new Map())

  const addError = useCallback((message: string) => {
    setErrors(prev => new Map(prev.set(Date.now().toString(), message)))
  }, [])

  const removeError = useCallback((key: string) => {
    setErrors(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }, [])

  const clearErrors = useCallback(() => {
    setErrors(new Map())
    setRetryCounts(new Map())
  }, [])

  const getRetryCount = useCallback((key: string) => {
    return retryCounts.get(key) || 0
  }, [retryCounts])

  const incrementRetryCount = useCallback((key: string) => {
    setRetryCounts(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(key) || 0
      newMap.set(key, current + 1)
      return newMap
    })
  }, [])

  const resetRetryCount = useCallback((key: string) => {
    setRetryCounts(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }, [])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    getRetryCount,
    incrementRetryCount,
    resetRetryCount,
    hasErrors: errors.size > 0
  }
}

// 3. 智能动画管理
export function useSmartAnimation() {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const animationRefs = useRef<Set<() => void>>(new Set())

  useEffect(() => {
    // 检查用户是否偏好减少动画
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const registerAnimation = useCallback((cleanup: () => void) => {
    animationRefs.current.add(cleanup)
    return () => {
      animationRefs.current.delete(cleanup)
    }
  }, [])

  const stopAllAnimations = useCallback(() => {
    animationRefs.current.forEach(cleanup => cleanup())
    animationRefs.current.clear()
  }, [])

  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled(prev => !prev)
  }, [])

  return {
    animationsEnabled: animationsEnabled && !reducedMotion,
    reducedMotion,
    registerAnimation,
    stopAllAnimations,
    toggleAnimations
  }
}

// 4. 智能滚动管理
export function useSmartScroll(containerRef: React.RefObject<HTMLElement>) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  
  const lastScrollTop = useRef(0)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const currentScrollTop = containerRef.current.scrollTop
    const direction = currentScrollTop > lastScrollTop.current ? 'down' : 'up'
    
    setScrollPosition(currentScrollTop)
    setScrollDirection(direction)
    setIsScrolling(true)
    lastScrollTop.current = currentScrollTop

    // 清除之前的超时
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // 设置新的超时来检测滚动结束
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
      setScrollDirection(null)
    }, 150)
  }, [containerRef])

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [containerRef])

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ 
        top: containerRef.current.scrollHeight, 
        behavior: 'smooth' 
      })
    }
  }, [containerRef])

  const scrollToPosition = useCallback((position: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: position, behavior: 'smooth' })
    }
  }, [containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [containerRef, handleScroll])

  return {
    scrollPosition,
    isScrolling,
    scrollDirection,
    scrollToTop,
    scrollToBottom,
    scrollToPosition
  }
}

// 5. 智能可见性检测
export function useSmartVisibility(elementRef: React.RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = useState(false)
  const [intersectionRatio, setIntersectionRatio] = useState(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        setIntersectionRatio(entry.intersectionRatio)
      },
      {
        threshold: [0, 0.1, 0.5, 0.9, 1.0],
        rootMargin: '50px'
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef])

  return {
    isVisible,
    intersectionRatio,
    visibilityPercentage: Math.round(intersectionRatio * 100)
  }
}
