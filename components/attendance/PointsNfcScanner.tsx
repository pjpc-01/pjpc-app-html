"use client"

import { useState, useCallback, useRef } from "react"
import { SmartphoneNfc, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

declare global {
  interface Window { NDEFReader: any }
}

export default function PointsNfcScanner() {
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const handleNfcTap = useCallback(async () => {
    console.log('[NFC] 按钮触发')
    setStatus(null)

    if (typeof window === "undefined" || !("NDEFReader" in window)) {
      console.log('[NFC] NDEFReader 不支持')
      setStatus({ ok: false, msg: "此设备不支持 NFC（仅 Android Chrome）" })
      return
    }

    // Abort any previous scan
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    controllerRef.current = new AbortController()
    const { signal } = controllerRef.current

    setScanning(true)
    setStatus({ ok: true, msg: "请将卡片贴近手机背面..." })

    try {
      const ndef = new window.NDEFReader()
      console.log('[NFC] NDEFReader 创建成功')

      // Start scanning
      await ndef.scan({ signal })
      console.log('[NFC] scan() 已启动，等待 NFC 卡片...')

      // Timeout: stop after 30 seconds
      const timer = setTimeout(() => {
        if (signal.aborted) return
        console.log('[NFC] 30秒超时，停止扫描')
        controllerRef.current?.abort()
        setStatus({ ok: false, msg: "超时，请重试" })
        setScanning(false)
      }, 30000)

      ndef.onreading = async (event: any) => {
        clearTimeout(timer)
        console.log('[NFC] ✅ onreading 触发!')
        console.log('[NFC] event keys:', Object.keys(event))
        console.log('[NFC] event:', JSON.stringify({
          serialNumber: event.serialNumber,
          messageRecords: event.message?.records?.length,
        }))

        try {
          let cardId: string | null = null

          // Method 1: serialNumber from event
          if (event.serialNumber) {
            const sn = String(event.serialNumber)
            console.log('[NFC] serialNumber:', sn)
            cardId = sn.replace(/[^0-9A-Fa-f]/g, "")
            console.log('[NFC] cleaned serialNumber:', cardId)
          }

          // Method 2: NDEF text records
          if (!cardId && event.message?.records) {
            for (const record of event.message.records) {
              try {
                console.log('[NFC] record type:', record.recordType, 'mediaType:', record.mediaType)
                if (record.recordType === "text") {
                  const decoder = new TextDecoder(record.encoding || "utf-8")
                  const text = decoder.decode(record.data).trim()
                  console.log('[NFC] NDEF text:', text)
                  if (text.length >= 4 && /^[0-9A-Fa-f :\-]+$/.test(text)) {
                    cardId = text.replace(/[^0-9A-Fa-f]/g, "")
                    console.log('[NFC] NDEF extracted:', cardId)
                    break
                  }
                }
                // Method 3: Try any record with data
                if (!cardId && record.data) {
                  const raw = new TextDecoder().decode(record.data).trim()
                  if (raw.length >= 4 && /^[0-9A-Fa-f :\-]+$/.test(raw)) {
                    cardId = raw.replace(/[^0-9A-Fa-f]/g, "")
                    console.log('[NFC] raw record:', cardId)
                  }
                }
              } catch (e) {
                console.log('[NFC] record parse error:', e)
              }
            }
          }

          // Method 4: URL record
          if (!cardId && event.message?.records) {
            for (const record of event.message.records) {
              if (record.recordType === "url" && record.data) {
                try {
                  const url = new TextDecoder().decode(record.data).trim()
                  console.log('[NFC] URL record:', url)
                  // Extract UID from URL if present
                  const match = url.match(/[0-9A-Fa-f]{8,}/)
                  if (match) {
                    cardId = match[0]
                    console.log('[NFC] URL extracted:', cardId)
                    break
                  }
                } catch {}
              }
            }
          }

          if (!cardId) {
            console.log('[NFC] 无法提取卡号')
            setStatus({ ok: false, msg: "无法读取卡号，请确认卡片类型" })
            setScanning(false)
            return
          }

          console.log('[NFC] 最终卡号:', cardId)

          // Generate lookup IDs
          const lookupIds: string[] = [cardId]
          
          // If hex <= 8 chars, also try decimal conversion
          if (/^[0-9A-Fa-f]+$/.test(cardId) && cardId.length <= 8) {
            try {
              const decimal = parseInt(cardId, 16).toString().padStart(10, "0")
              lookupIds.push(decimal)
              console.log('[NFC] decimal variant:', decimal)
            } catch {}
          }
          
          // If decimal, also try hex
          if (/^\d+$/.test(cardId) && cardId.length >= 8) {
            try {
              const hex = BigInt(cardId).toString(16).toUpperCase()
              lookupIds.push(hex)
              console.log('[NFC] hex variant:', hex)
            } catch {}
          }

          console.log('[NFC] lookup IDs:', lookupIds)

          // Try each lookup ID against /api/nfc/tap
          let tapData: any = { found: false }
          for (const id of lookupIds) {
            console.log('[NFC] 尝试查找:', id)
            try {
              const tapRes = await fetch("/api/nfc/tap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ card_uid: id }),
              })
              tapData = await tapRes.json()
              console.log('[NFC] tap result:', tapData)
              if (tapData.found) break
            } catch (e) {
              console.log('[NFC] fetch error:', e)
            }
          }

          if (!tapData.found) {
            setStatus({ ok: false, msg: tapData.error || "未注册的卡片" })
            setScanning(false)
            return
          }

          const person = tapData.person
          console.log('[NFC] 找到:', person.name, person.id)

          if (tapData.person_type === "student") {
            setStatus({ ok: true, msg: `🎯 ${person.name}` })
            window.dispatchEvent(new CustomEvent("pjpc:student-scanned", {
              detail: { studentId: person.id, studentName: person.name }
            }))
          } else {
            setStatus({ ok: false, msg: "请刷学生卡" })
          }
          setScanning(false)

        } catch (err: any) {
          console.log('[NFC] onreading 处理错误:', err)
          setStatus({ ok: false, msg: err.message || "处理失败" })
          setScanning(false)
        }
      }

      ndef.onreadingerror = (e: any) => {
        clearTimeout(timer)
        console.log('[NFC] ❌ onreadingerror:', e)
        setStatus({ ok: false, msg: "读取失败，请贴近再试" })
        setScanning(false)
      }

    } catch (err: any) {
      console.log('[NFC] ❌ scan() 错误:', err.name, err.message)
      
      if (err.name === "AbortError") {
        setStatus({ ok: false, msg: "扫描已取消" })
      } else if (err.name === "NotAllowedError") {
        setStatus({ ok: false, msg: "NFC 权限未授予" })
      } else if (err.name === "NotSupportedError") {
        setStatus({ ok: false, msg: "设备不支持 NFC" })
      } else if (err.name === "SecurityError") {
        setStatus({ ok: false, msg: "需要 HTTPS 连接" })
      } else {
        setStatus({ ok: false, msg: `NFC 错误: ${err.message}` })
      }
      setScanning(false)
    }
  }, [])

  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
        <SmartphoneNfc className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-base font-bold text-gray-700 mb-1">手机 NFC 积分</h3>
      <p className="text-sm text-gray-400 mb-4">将学生 NFC 卡贴近手机背面</p>

      {status && (
        <div className={`mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          status.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
           : status.ok ? <CheckCircle className="h-3.5 w-3.5" />
           : <XCircle className="h-3.5 w-3.5" />}
          {status.msg}
        </div>
      )}

      <div>
        <Button onClick={handleNfcTap} disabled={scanning} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <SmartphoneNfc className="h-4 w-4 mr-1" />
          {scanning ? "扫描中..." : "刷学生卡"}
        </Button>
      </div>
    </div>
  )
}
