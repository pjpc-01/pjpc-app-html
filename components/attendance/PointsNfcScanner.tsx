"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useNfcAuth } from "@/contexts/nfc-auth-context"
import { SmartphoneNfc, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Web NFC API type (only available in Chrome Android)
declare global {
  interface Window { NDEFReader: any }
}

export default function PointsNfcScanner() {
  const router = useRouter()
  const { isAuthenticated, teacher, loginWithCard, pendingStudent, setPendingStudent } = useNfcAuth()
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleNfcTap = useCallback(async () => {
    if (typeof window === "undefined" || !("NDEFReader" in window)) {
      setStatus({ ok: false, msg: "此设备不支持 NFC（仅 Android Chrome）" })
      return
    }

    setScanning(true)
    setStatus({ ok: true, msg: "请将卡片贴近手机背面..." })

    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()

      // Extract UID: try NDEF text record first, fall back to serialNumber
      const extractUid = (message: any, serialNumber: string): string | null => {
        if (message?.records) {
          for (const record of message.records) {
            try {
              if (record.recordType === "text") {
                const decoder = new TextDecoder(record.encoding || "utf-8")
                const text = decoder.decode(record.data).trim()
                if (text.length >= 8 && text.length <= 20 && /^[0-9A-Fa-f]+$/.test(text)) {
                  console.log(`📱 [手机NFC] NDEF文本: ${text}`)
                  return text
                }
              }
              if (record.recordType === "url") {
                const decoder = new TextDecoder()
                const url = decoder.decode(record.data)
                const uid = new URL(url).searchParams.get("uid")
                if (uid) return uid
              }
            } catch {}
          }
        }
        return serialNumber || null
      }

      ndef.onreading = async (event: any) => {
        try {
          const { message, serialNumber } = event
          const cardId = extractUid(message, serialNumber)

          // Build lookup IDs: raw hex + decimal conversion
          let lookupIds: string[] = []
          if (cardId) {
            const clean = cardId.replace(/:/g, "")
            lookupIds.push(clean)
            if (/^[0-9A-Fa-f]+$/.test(clean) && clean.length <= 8) {
              const decimal = parseInt(clean, 16).toString().padStart(10, "0")
              lookupIds.push(decimal)
            }
          }

          if (lookupIds.length === 0) {
            setStatus({ ok: false, msg: "无法读取卡号" })
            setScanning(false)
            return
          }

          // Try each format
          let tapData: any = { found: false }
          for (const id of lookupIds) {
            const tapRes = await fetch("/api/nfc/tap", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ card_uid: id }),
            })
            tapData = await tapRes.json()
            if (tapData.found) break
          }

          console.log(`📱 [手机NFC] UID: ${lookupIds[0]}, found: ${tapData.found}`)
          setStatus({ ok: true, msg: `读取卡号: ${lookupIds[0]}` })

          if (!tapData.found) {
            setStatus({ ok: false, msg: tapData.error || "未注册的卡片" })
            setScanning(false)
            return
          }

          const person = tapData.person
          const personType = tapData.person_type

          // Logged in → student card → go to points
          if (isAuthenticated && teacher && personType === "student") {
            setStatus({ ok: true, msg: `🎯 ${person.name}` })
            setScanning(false)
            router.push(`/points?studentId=${person.id}&name=${encodeURIComponent(person.name)}`)
            return
          }

          // Logged in → teacher card → already logged in
          if (isAuthenticated && personType === "teacher") {
            setStatus({ ok: true, msg: `已登入: ${teacher.name}` })
            setScanning(false)
            return
          }

          // Not logged in → student card → store pending
          if (personType === "student") {
            setPendingStudent({
              id: person.id,
              name: person.name,
              student_id: person.student_id || person.id,
              grade: person.grade || "",
              center: person.center || "",
            })
            setStatus({ ok: true, msg: `${person.name} — 请刷教师卡` })
            // Keep scanning for teacher card
            return
          }

          // Not logged in → teacher card → login
          if (personType === "teacher") {
            setStatus({ ok: true, msg: `验证教师 ${person.name}...` })
            const result = await loginWithCard(cardId)

            if (!result.success) {
              setStatus({ ok: false, msg: result.error || "登入失败" })
              setScanning(false)
              return
            }

            setStatus({ ok: true, msg: `✅ ${person.name} 已登入` })
            setScanning(false)

            // If there was a pending student, go to points
            if (pendingStudent) {
              setTimeout(() => {
                router.push(`/points?studentId=${pendingStudent.id}&name=${encodeURIComponent(pendingStudent.name)}`)
              }, 500)
            }
            return
          }
        } catch (err: any) {
          setStatus({ ok: false, msg: err.message })
          setScanning(false)
        }
      }

      ndef.onreadingerror = () => {
        setStatus({ ok: false, msg: "读取失败，请重试" })
        setScanning(false)
      }
    } catch (err: any) {
      setStatus({ ok: false, msg: `NFC 错误: ${err.message}` })
      setScanning(false)
    }
  }, [isAuthenticated, teacher, pendingStudent, loginWithCard, setPendingStudent, router])

  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
        <SmartphoneNfc className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-base font-bold text-gray-700 mb-1">手机 NFC 积分</h3>
      <p className="text-sm text-gray-400 mb-4">刷教师卡登入 → 刷学生卡调分</p>

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
        {isAuthenticated && teacher ? (
          <div className="space-y-2">
            <div className="text-xs text-green-600 font-medium">✅ {teacher.name} 老师已登入</div>
            <Button onClick={handleNfcTap} disabled={scanning} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <SmartphoneNfc className="h-4 w-4 mr-1" />
              {scanning ? "扫描中..." : "刷学生卡调分"}
            </Button>
          </div>
        ) : (
          <Button onClick={handleNfcTap} disabled={scanning} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <SmartphoneNfc className="h-4 w-4 mr-1" />
            {scanning ? "扫描中..." : "刷教师卡登入"}
          </Button>
        )}
      </div>
    </div>
  )
}
