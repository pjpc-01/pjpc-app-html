"use client"

import { useEffect, useState } from "react"

// 键盘模拟NFC读卡器组件
export default function KeyboardNFCBackgroundRunner({ 
  center, 
  enabled 
}: { 
  center: string; 
  enabled: boolean 
}) {
  const [isListening, setIsListening] = useState(false)
  const [inputBuffer, setInputBuffer] = useState<string>('')
  const [lastInputTime, setLastInputTime] = useState<number>(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isListening) return

      const currentTime = Date.now()
      
      // 如果输入间隔超过1秒，清空缓冲区
      if (currentTime - lastInputTime > 1000) {
        setInputBuffer('')
      }
      
      setLastInputTime(currentTime)
      
      // 处理回车键
      if (event.key === 'Enter') {
        event.preventDefault()
        
        if (inputBuffer.trim().length > 0) {
          console.log("[键盘NFC] 检测到卡片数据:", inputBuffer.trim())
          
          // 调用后端API处理NFC数据
          processNFCCard(inputBuffer.trim())
          
          // 清空缓冲区
          setInputBuffer('')
        }
      } else if (event.key.length === 1) {
        // 只处理单个字符
        setInputBuffer(prev => prev + event.key)
      }
    }

    if (enabled) {
      document.addEventListener('keydown', handleKeyPress)
      setIsListening(true)
      console.log("[键盘NFC] 开始监听键盘输入")
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      setIsListening(false)
      console.log("[键盘NFC] 停止监听键盘输入")
    }
  }, [enabled, inputBuffer, lastInputTime])

  // 处理NFC卡片数据
  const processNFCCard = async (cardData: string) => {
    try {
      console.log("[键盘NFC] 处理卡片数据:", cardData)

      // 使用增强的分析API
      const res = await fetch("/api/nfc/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nfcData: cardData,
          deviceInfo: {
            deviceId: 'keyboard-nfc-reader',
            deviceName: '键盘模拟NFC读卡器'
          },
          centerId: center,
          timestamp: new Date().toISOString(),
        }),
      })

      if (res.ok) {
        const result = await res.json()
        console.log("[键盘NFC] 考勤处理成功:", result)
        
        // 可以在这里添加成功提示
        if (result.success) {
          console.log(`✅ ${result.user.type === 'student' ? '学生' : '教师'} ${result.user.name} 考勤成功`)
        }
      } else {
        const errorResult = await res.json()
        console.warn("[键盘NFC] 考勤处理失败:", errorResult.message)
      }
    } catch (err) {
      console.error("[键盘NFC] 处理卡片失败:", err)
    }
  }

  return null // 不渲染UI
}
