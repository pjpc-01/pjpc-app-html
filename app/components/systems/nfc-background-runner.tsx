"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function NFCBackgroundRunner({ center, enabled }: { center: string; enabled: boolean }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'error'>('idle')
  const [lastRead, setLastRead] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    let interval: NodeJS.Timeout
    let mounted = true

    const checkNFC = async () => {
      try {
        const response = await fetch('/api/nfc/read')
        if (!mounted) return

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setLastRead(data.data)
            setStatus('running')
            
            // 自动考勤
            try {
              const checkinResponse = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  studentId: data.data,
                  center: center,
                  timestamp: new Date().toISOString()
                })
              })
              
              if (checkinResponse.ok) {
                console.log(`[NFC] 自动考勤成功: ${data.data} @ ${center}`)
              }
            } catch (checkinError) {
              console.warn('[NFC] 考勤失败:', checkinError)
            }
          } else {
            setStatus('idle')
          }
        } else {
          setStatus('error')
        }
      } catch (error) {
        if (mounted) {
          setStatus('error')
          console.warn('[NFC] 读取失败:', error)
        }
      }
    }

    // 立即检查一次
    checkNFC()
    
    // 每2秒检查一次NFC
    interval = setInterval(checkNFC, 2000)

    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [center, enabled])

  // 不显示UI，只在后台运行
  return null
}