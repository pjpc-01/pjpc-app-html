"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"

// ─── Toast ────────────────────────────────────────────

function Toast({ status, message, personName, onClose }: {
  status: "success" | "error" | "loading" | null
  message: string
  personName?: string
  onClose: () => void
}) {
  useEffect(() => {
    if (!status) return
    const t = setTimeout(onClose, status === "success" ? 3000 : status === "error" ? 4000 : 15000)
    return () => clearTimeout(t)
  }, [status, onClose])

  if (!status) return null

  return (
    <div className={`fixed top-4 right-4 z-[9999] max-w-sm rounded-xl shadow-2xl border-2 px-4 py-3 backdrop-blur-sm transition-all duration-300 ${
      status === "success" ? "bg-green-50/95 border-green-400" :
      status === "error" ? "bg-red-50/95 border-red-400" :
      "bg-blue-50/95 border-blue-400"
    }`}>
      <div className="flex items-start gap-3">
        {status === "loading" ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />
        : status === "success" ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        : <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
        <div className="flex-1 min-w-0">
          {personName && <p className="font-bold text-sm text-gray-900">{personName}</p>}
          <p className={`text-xs ${status === "success" ? "text-green-700" : status === "error" ? "text-red-700" : "text-blue-700"}`}>
            {message}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}

// ─── 全局考勤读卡器 (USB Card Reader) ─────────────────

export default function GlobalCardScanner() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [status, setStatus] = useState<"success" | "error" | "loading" | null>(null)
  const [msg, setMsg] = useState("")
  const [personName, setPersonName] = useState("")
  const dismissRef = useRef<ReturnType<typeof setTimeout>>()

  const show = useCallback((s: "success" | "error" | "loading", m: string, name?: string) => {
    if (dismissRef.current) clearTimeout(dismissRef.current)
    setStatus(s); setMsg(m); if (name) setPersonName(name)
  }, [])

  const dismiss = useCallback(() => { setStatus(null); setMsg(""); setPersonName("") }, [])

  const handleCard = useCallback(async (cardId: string) => {
    // 未登录不处理
    if (!user) return

    console.log(`💳 [考勤] 检测到卡号: ${cardId}`)
    show("loading", `读取卡号: ${cardId}`)

    try {
      const tapRes = await fetch("/api/nfc/tap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_uid: cardId }),
      })
      const tapData = await tapRes.json()

      if (!tapRes.ok || !tapData.found) {
        show("error", tapData.error || "未注册的卡片")
        return
      }

      const person = tapData.person
      show("loading", "打卡中...", person.name)

      const chkRes = await fetch("/api/attendance/checkin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: person.id, person_name: person.name,
          person_type: tapData.person_type,
          center: person.center || "BATU14",
          method: "usb_reader",
          notes: `USB读卡器 - 卡号: ${cardId}`,
        }),
      })
      const chkData = await chkRes.json()

      if (!chkRes.ok || !chkData.success) {
        show("error", `${chkData.error || "打卡失败"}`, person.name)
        return
      }

      show("success", `🎉 ${chkData.action}成功`, person.name)
      console.log(`💳 [考勤] ${chkData.action}成功: ${person.name}`)
    } catch (err: any) {
      show("error", `网络错误: ${err.message}`)
    }
  }, [show, user])

  useEffect(() => {
    // 未登录不启动读卡器 / 积分页面禁用(避免与手机NFC冲突)
    if (!user) return
    if (pathname === "/points") {
      console.log("💳 [全局考勤读卡器] ⏸️  积分页已禁用")
      return
    }

    let buffer = ""; let lastTime = 0

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const now = Date.now()
      if (now - lastTime > 800) { buffer = "" }
      lastTime = now

      if (/^[0-9]$/.test(e.key)) {
        buffer += e.key
        if (buffer.length >= 10) { const cardId = buffer.slice(-10); buffer = ""; handleCard(cardId) }
      }
      if (e.key === "Enter" && buffer.length >= 7) {
        const cardId = buffer; buffer = ""
        if (cardId.length >= 7) handleCard(cardId)
      }
    }

    document.addEventListener("keydown", onKey)
    console.log("💳 [全局考勤读卡器] ✅ 已启动 (USB 刷卡=打卡)")
    return () => document.removeEventListener("keydown", onKey)
  }, [handleCard, user, pathname])

  return <Toast status={status} message={msg} personName={personName || undefined} onClose={dismiss} />
}
