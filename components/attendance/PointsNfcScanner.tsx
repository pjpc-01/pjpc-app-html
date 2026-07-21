"use client"

import { useState, useCallback } from "react"
import { SmartphoneNfc, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

declare global {
  interface Window { NDEFReader: any }
}

export default function PointsNfcScanner() {
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleNfcTap = useCallback(async () => {
    console.log('[NFC] 点击扫描')
    setStatus(null)

    if (typeof window === "undefined" || !("NDEFReader" in window)) {
      console.log('[NFC] 设备不支持')
      setStatus({ ok: false, msg: "此设备不支持 NFC（仅 Android Chrome）" })
      return
    }

    setScanning(true)
    setStatus({ ok: true, msg: "请将卡片贴近手机背面..." })

    try {
      const ndef = new window.NDEFReader()
      console.log('[NFC] NDEFReader 创建成功')
      await ndef.scan()
      console.log('[NFC] scan() 成功，等待 NFC 卡片...')

      ndef.onreading = async (event: any) => {
        console.log('[NFC] ✅ 卡片检测到!', {
          serialNumber: event.serialNumber,
          recordCount: event.message?.records?.length
        })

        try {
          let cardId: string | null = null

          // Try serialNumber first
          if (event.serialNumber) {
            cardId = String(event.serialNumber).replace(/[^0-9A-Fa-f]/g, "")
            console.log('[NFC] serialNumber:', cardId)
          }

          // Try NDEF text records
          if (!cardId && event.message?.records) {
            for (const record of event.message.records) {
              try {
                if (record.recordType === "text") {
                  const decoder = new TextDecoder(record.encoding || "utf-8")
                  const text = decoder.decode(record.data).trim()
                  if (text && /^[0-9A-Fa-f :\-]+$/.test(text)) {
                    cardId = text.replace(/[^0-9A-Fa-f]/g, "")
                    console.log('[NFC] NDEF text:', cardId)
                    break
                  }
                }
              } catch {}
            }
          }

          if (!cardId) {
            console.log('[NFC] 无法提取卡号')
            setStatus({ ok: false, msg: "无法读取卡号" })
            setScanning(false)
            return
          }

          console.log('[NFC] 卡号:', cardId)

          // Build lookup IDs
          const lookupIds: string[] = [cardId]
          if (/^[0-9A-Fa-f]+$/.test(cardId) && cardId.length <= 8) {
            lookupIds.push(parseInt(cardId, 16).toString().padStart(10, "0"))
          }
          if (/^\d+$/.test(cardId) && cardId.length >= 8) {
            try { lookupIds.push(BigInt(cardId).toString(16).toUpperCase()) } catch {}
          }

          console.log('[NFC] 查询:', lookupIds)

          // Try to find the card
          let tapData: any = { found: false }
          for (const id of lookupIds) {
            try {
              const tapRes = await fetch("/api/nfc/tap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ card_uid: id }),
              })
              tapData = await tapRes.json()
              console.log('[NFC] 结果:', tapData.found ? '✅' : '❌', id)
              if (tapData.found) break
            } catch {}
          }

          if (!tapData.found) {
            setStatus({ ok: false, msg: tapData.error || "未注册的卡片" })
            setScanning(false)
            return
          }

          const person = tapData.person
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
          console.log('[NFC] 处理错误:', err.message)
          setStatus({ ok: false, msg: err.message })
          setScanning(false)
        }
      }

      ndef.onreadingerror = () => {
        console.log('[NFC] 读取错误')
        setStatus({ ok: false, msg: "读取失败，请重试" })
        setScanning(false)
      }
    } catch (err: any) {
      console.log('[NFC] 启动失败:', err.name, err.message)
      if (err.name === "NotAllowedError") {
        setStatus({ ok: false, msg: "NFC 权限未授予" })
      } else if (err.name === "NotSupportedError") {
        setStatus({ ok: false, msg: "设备不支持 NFC" })
      } else {
        setStatus({ ok: false, msg: err.message })
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
