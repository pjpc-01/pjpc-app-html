'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface HIDCardReaderProps {
  onCardRead: (cardNumber: string) => void
  onError?: (error: string) => void
  placeholder?: string
  className?: string
}

export default function HIDCardReader({ 
  onCardRead, 
  onError,
  placeholder = "将卡片放在HID读卡器上...",
  className = ""
}: HIDCardReaderProps) {
  const [inputBuffer, setInputBuffer] = useState("")
  const [lastInputTime, setLastInputTime] = useState(0)
  const [isReading, setIsReading] = useState(false)
  const [lastCardNumber, setLastCardNumber] = useState("")
  const [inputMode, setInputMode] = useState<'auto' | 'manual'>('auto')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 自动聚焦到输入框
  useEffect(() => {
    if (inputRef.current && inputMode === 'auto') {
      inputRef.current.focus()
    }
  }, [inputMode])

  // 检测并清理重复模式（专门针对10位数字）
  const detectAndCleanRepeatingPattern = useCallback((input: string) => {
    // 检测10位数字的重复模式
    const patterns = [
      /(\d{10})\1+/,  // 10位数字重复
      /(\d{8,10})\1+/,  // 8-10位数字重复
      /(\d{6,10})\1+/,  // 6-10位数字重复
      /(\d{4,10})\1+/,  // 4-10位数字重复
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) {
        return match[1] // 返回第一个完整序列
      }
    }
    
    // 如果没有重复模式，检查是否是10位数字
    const digitsOnly = input.replace(/\D/g, '')
    if (digitsOnly.length === 10) {
      return digitsOnly
    }
    
    return input // 没有重复模式，返回原输入
  }, [])

  // 处理HID读卡器输入
  const handleInput = useCallback((value: string) => {
    const now = Date.now()
    
    // 如果输入间隔超过1秒，重置缓冲区
    if (now - lastInputTime > 1000) {
      setInputBuffer("")
      setIsReading(false)
    }
    
    setLastInputTime(now)
    setIsReading(true)
    
    // 清除之前的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // 检查是否包含重复模式（HID读卡器常见问题）
    const newBuffer = inputBuffer + value
    const cleanedInput = detectAndCleanRepeatingPattern(newBuffer)
    
    if (cleanedInput !== newBuffer) {
      // 检测到重复模式，使用清理后的输入
      const cardNumber = cleanedInput.trim()
      if (cardNumber.length >= 4) {
        setLastCardNumber(cardNumber)
        onCardRead(cardNumber)
        setInputBuffer("")
        setIsReading(false)
        return
      }
    }
    
    // 设置新的超时，如果1秒内没有新输入，认为输入完成
    timeoutRef.current = setTimeout(() => {
      const cardNumber = inputBuffer.trim()
      // 专门针对10位数字进行检测
      if (cardNumber && cardNumber.length === 10) {
        setLastCardNumber(cardNumber)
        onCardRead(cardNumber)
        setInputBuffer("")
        setIsReading(false)
      } else if (cardNumber && cardNumber.length >= 4) {
        // 如果不是10位，但长度足够，也尝试处理
        setLastCardNumber(cardNumber)
        onCardRead(cardNumber)
        setInputBuffer("")
        setIsReading(false)
      }
    }, 1000)
    
    setInputBuffer(prev => prev + value)
  }, [inputBuffer, lastInputTime, onCardRead, detectAndCleanRepeatingPattern])

  // 处理键盘输入（专门处理HID读卡器的回车键）
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cardNumber = inputBuffer.trim()
      
      // 专门针对10位数字进行检测（你的读卡器配置）
      if (cardNumber && cardNumber.length === 10) {
        setLastCardNumber(cardNumber)
        onCardRead(cardNumber)
        setInputBuffer("")
        setIsReading(false)
      } else if (cardNumber && cardNumber.length >= 4) {
        // 如果不是10位，但长度足够，也尝试处理
        setLastCardNumber(cardNumber)
        onCardRead(cardNumber)
        setInputBuffer("")
        setIsReading(false)
      }
    } else if (e.key === 'Escape') {
      setInputBuffer("")
      setIsReading(false)
    }
  }, [inputBuffer, onCardRead])

  // 手动输入模式
  const handleManualInput = useCallback((value: string) => {
    // 自动清理重复模式
    const cleanedValue = detectAndCleanRepeatingPattern(value)
    setInputBuffer(cleanedValue)
    
    // 专门针对10位数字进行检测
    if (cleanedValue.length === 10) {
      setLastCardNumber(cleanedValue)
      onCardRead(cleanedValue)
    } else if (cleanedValue.length >= 4) {
      // 如果不是10位，但长度足够，也尝试处理
      setLastCardNumber(cleanedValue)
      onCardRead(cleanedValue)
    }
  }, [onCardRead, detectAndCleanRepeatingPattern])

  // 清除输入
  const clearInput = useCallback(() => {
    setInputBuffer("")
    setIsReading(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // 切换输入模式
  const toggleInputMode = useCallback(() => {
    setInputMode(prev => prev === 'auto' ? 'manual' : 'auto')
    clearInput()
  }, [clearInput])

  // 清理超时
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 输入模式切换 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={inputMode === 'auto' ? 'default' : 'outline'}>
            {inputMode === 'auto' ? '自动模式' : '手动模式'}
          </Badge>
          {isReading && (
            <Badge variant="secondary" className="animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              读取中...
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleInputMode}
        >
          {inputMode === 'auto' ? '切换到手动' : '切换到自动'}
        </Button>
      </div>

      {/* 输入框 */}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputBuffer}
          onChange={(e) => {
            if (inputMode === 'auto') {
              handleInput(e.target.value)
            } else {
              handleManualInput(e.target.value)
            }
          }}
          onKeyDown={handleKeyDown}
          className={`font-mono text-lg pr-10 ${
            isReading ? 'border-blue-400 bg-blue-50' : ''
          }`}
          autoFocus={inputMode === 'auto'}
        />
        
        {/* 清除按钮 */}
        {inputBuffer && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                const cleaned = detectAndCleanRepeatingPattern(inputBuffer)
                setInputBuffer(cleaned)
              }}
              title="清理重复模式"
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={clearInput}
              title="清除输入"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 状态指示 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {inputMode === 'auto' ? (
          <>
            <CreditCard className="h-4 w-4" />
            <span>将卡片放在HID读卡器上，系统会自动读取10位数字（配置：10 no.in D + Enter）</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            <span>手动输入10位卡号，按回车确认</span>
          </>
        )}
      </div>

      {/* 最后读取的卡号 */}
      {lastCardNumber && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">最后读取的卡号</p>
              <p className="text-lg font-mono text-green-600">{lastCardNumber}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLastCardNumber("")}
            >
              清除
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
