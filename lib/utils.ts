import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
      console.log(`${label}: ${duration.toFixed(2)}ms`)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(value)
  }

  getAverageTime(label: string): number {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  getMetrics(): Record<string, { average: number; count: number; min: number; max: number }> {
    const result: Record<string, { average: number; count: number; min: number; max: number }> = {}
    
    for (const [label, values] of this.metrics.entries()) {
      if (values.length === 0) continue
      
      const min = Math.min(...values)
      const max = Math.max(...values)
      const average = values.reduce((a, b) => a + b, 0) / values.length
      
      result[label] = { average, count: values.length, min, max }
    }
    
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}

// 缓存工具
export class CacheManager {
  private static instance: CacheManager
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    const isExpired = Date.now() - item.timestamp > item.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  getSize(): number {
    return this.cache.size
  }
}

// 错误处理工具
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorCount: Map<string, number> = new Map()
  private readonly maxErrors = 10
  private readonly errorWindow = 60 * 1000 // 1分钟

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  handleError(error: Error, context?: string): void {
    const errorKey = `${error.message}_${context || 'unknown'}`
    const currentCount = this.errorCount.get(errorKey) || 0
    
    if (currentCount >= this.maxErrors) {
      console.warn(`Too many errors for ${errorKey}, suppressing further logs`)
      return
    }

    this.errorCount.set(errorKey, currentCount + 1)
    
    // 清理旧的错误计数
    setTimeout(() => {
      const count = this.errorCount.get(errorKey) || 0
      if (count > 0) {
        this.errorCount.set(errorKey, count - 1)
      }
    }, this.errorWindow)

    console.error(`[${context || 'Unknown'}] Error:`, error)
  }

  clearErrorCounts(): void {
    this.errorCount.clear()
  }
}

// 防抖工具
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流工具
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 数据验证工具
export class Validator {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  static isStrongPassword(password: string): boolean {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  }

  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '')
  }

  static validateRequired(value: any, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} 是必填项`
    }
    return null
  }
}

// 格式化工具
export class Formatter {
  static formatCurrency(amount: number, currency: string = 'CNY'): string {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  static formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (format === 'relative') {
      const now = new Date()
      const diff = now.getTime() - dateObj.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) return '今天'
      if (days === 1) return '昨天'
      if (days < 7) return `${days}天前`
      if (days < 30) return `${Math.floor(days / 7)}周前`
      if (days < 365) return `${Math.floor(days / 30)}个月前`
      return `${Math.floor(days / 365)}年前`
    }
    
    if (format === 'long') {
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return dateObj.toLocaleDateString('zh-CN')
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// 数组工具
export class ArrayUtils {
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  static unique<T>(array: T[]): T[] {
    return [...new Set(array)]
  }

  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  static sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance()
export const cacheManager = CacheManager.getInstance()
export const errorHandler = ErrorHandler.getInstance()
