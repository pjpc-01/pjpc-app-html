"use client"

import { useEffect, useRef, useState } from 'react'
import { tvLog } from '../../utils/logger'

interface NFCBackgroundRunnerProps {
  center: string
  onCardRead?: (cardData: string) => void
  enabled?: boolean
}

export default function NFCBackgroundRunner({ 
  center, 
  onCardRead,
  enabled = true 
}: NFCBackgroundRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [lastCardData, setLastCardData] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      setIsRunning(false)
      return
    }

    tvLog('NFC后台运行器启动', { center, enabled })
    setIsRunning(true)

    // 监听键盘输入（模拟NFC读卡器）
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的输入
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // 处理Enter键（模拟读卡完成）
      if (event.key === 'Enter') {
        event.preventDefault()
        
        if (!isProcessingRef.current) {
          isProcessingRef.current = true
          
          // 模拟NFC读卡数据
          const mockCardData = `NFC_${center}_${Date.now()}`
          setLastCardData(mockCardData)
          
          tvLog('模拟NFC读卡', { cardData: mockCardData, center })
          
          if (onCardRead) {
            onCardRead(mockCardData)
          }
          
          // 防止重复处理
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          
          timeoutRef.current = setTimeout(() => {
            isProcessingRef.current = false
          }, 1000)
        }
      }
    }

    // 添加键盘监听器
    document.addEventListener('keydown', handleKeyDown)

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsRunning(false)
      tvLog('NFC后台运行器停止', { center })
    }
  }, [center, onCardRead, enabled])

  // 在开发环境下显示状态
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
        <div>NFC: {isRunning ? '运行中' : '已停止'}</div>
        <div>中心: {center}</div>
        {lastCardData && <div>最后读卡: {lastCardData.slice(-8)}</div>}
      </div>
    )
  }

  // 生产环境下不渲染任何内容
  return null
}
