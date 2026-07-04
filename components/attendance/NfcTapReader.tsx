"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  WifiOff,
  CheckCircle2,
  XCircle,
  SmartphoneNfc,
  LogIn,
  LogOut,
  RefreshCw,
  User,
  GraduationCap,
} from "lucide-react"

declare global {
  interface Window {
    NDEFReader: any
  }
}

interface PersonInfo {
  id: string
  name: string
  center: string
  grade?: string
  position?: string
}

interface CardInfo {
  uid: string
  type: string
  issued_date: string
}

interface TapResult {
  found: boolean
  person_type?: "student" | "teacher"
  person?: PersonInfo
  card?: CardInfo
  error?: string
}

interface CheckinResult {
  success: boolean
  action: string // "签到" | "签退"
  message: string
}

type ReaderState = "idle" | "scanning" | "reading" | "checking_in" | "success" | "error"

export default function NfcTapReader() {
  const [readerState, setReaderState] = useState<ReaderState>("idle")
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null)
  const [tapResult, setTapResult] = useState<TapResult | null>(null)
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [log, setLog] = useState<string[]>([])

  // Check Web NFC support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = "NDEFReader" in window
      setNfcSupported(supported)
      if (!supported) {
        setLog((prev) => ["⚠️ 此浏览器不支持 Web NFC（需要 Android Chrome + HTTPS/localhost）", ...prev])
      }
    }
  }, [])

  const addLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)])
  }

  // Extract UID from NDEF records
  const extractUidFromNdef = (records: any[]): string | null => {
    if (!records || records.length === 0) return null

    for (const record of records) {
      if (record.recordType === "text") {
        const decoder = new TextDecoder(record.encoding || "utf-8")
        const text = decoder.decode(record.data)
        addLog(`📝 NDEF 文本记录: "${text}"`)
        if (text.length >= 8 && text.length <= 32) {
          return text.trim()
        }
      }

      if (record.recordType === "url") {
        const decoder = new TextDecoder()
        const url = decoder.decode(record.data)
        addLog(`🔗 NDEF URL 记录: "${url}"`)
        try {
          const urlObj = new URL(url)
          const uid = urlObj.searchParams.get("uid")
          if (uid) return uid
        } catch {}
      }

      if (record.recordType === "mime" && record.mediaType === "application/json") {
        try {
          const decoder = new TextDecoder()
          const json = JSON.parse(decoder.decode(record.data))
          if (json.uid) return json.uid
          if (json.card_uid) return json.card_uid
        } catch {}
      }
    }

    return null
  }

  // Start NFC scan
  const startScan = useCallback(async () => {
    if (!nfcSupported) {
      setErrorMsg("浏览器不支持 Web NFC，请使用 Android Chrome 或 USB 读卡器方案")
      setReaderState("error")
      return
    }

    try {
      setReaderState("scanning")
      setTapResult(null)
      setCheckinResult(null)
      setErrorMsg("")
      addLog("🔍 开始扫描...请将 NFC 卡片靠近手机背面")

      const ndef = new window.NDEFReader()

      ndef.addEventListener("reading", async ({ message, serialNumber }: any) => {
        addLog(`📡 检测到 NFC 标签 (序列号: ${serialNumber || "未知"})`)
        setReaderState("reading")

        let cardUid = extractUidFromNdef(message.records)

        if (!cardUid && serialNumber) {
          cardUid = serialNumber
          addLog(`ℹ️ 卡片无 NDEF 数据，使用硬件序列号: ${cardUid}`)
        }

        if (!cardUid) {
          setErrorMsg("无法读取卡片 UID。请确保卡片已写入 NDEF 数据，或使用 USB 读卡器。")
          setReaderState("error")
          return
        }

        // Call unified tap API
        addLog(`📤 查询卡片: ${cardUid}`)
        try {
          const tapRes = await fetch("/api/nfc/tap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ card_uid: cardUid }),
          })

          if (!tapRes.ok) {
            const tapData = await tapRes.json()
            const errMsg = tapData.error || "未注册的卡片"
            setErrorMsg(errMsg)
            setTapResult({ found: false, error: errMsg })
            setReaderState("error")
            addLog(`❌ ${errMsg}`)
            return
          }

          const tapData: TapResult = await tapRes.json()
          setTapResult(tapData)

          const personTypeLabel = tapData.person_type === "teacher" ? "教师" : "学生"
          addLog(`✅ ${personTypeLabel}: ${tapData.person?.name} (${tapData.person?.id}) — 中心: ${tapData.person?.center}`)

          // Auto check-in/out via unified API
          if (tapData.person) {
            setReaderState("checking_in")
            addLog(`📥 执行签到/签退...`)

            const chkRes = await fetch("/api/attendance/checkin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                person_id: tapData.person.id,
                person_name: tapData.person.name,
                person_type: tapData.person_type || "student",
                center: tapData.person.center,
                method: "nfc_web",
                notes: `Web NFC — 卡号: ${cardUid}`,
              }),
            })

            const chkData = await chkRes.json()
            setCheckinResult({
              success: chkData.success,
              action: chkData.action || "签到",
              message: chkData.message || "",
            })
            setReaderState("success")

            const emoji = chkData.action === "签退" ? "👋" : "✅"
            addLog(`${emoji} ${chkData.action}成功 — ${tapData.person.name}`)
          }
        } catch (err: any) {
          setErrorMsg(`网络错误: ${err.message}`)
          setReaderState("error")
          addLog(`❌ 网络错误: ${err.message}`)
        }
      })

      ndef.addEventListener("readingerror", () => {
        addLog("⚠️ 读取失败，请重试")
        setErrorMsg("读取失败，请将卡片完全贴合手机背面再试")
        setReaderState("error")
      })

      await ndef.scan()
      addLog("📡 扫描已启动，等待 NFC 标签...")
    } catch (err: any) {
      if (err.name === "AbortError") {
        addLog("🛑 扫描已取消")
        setReaderState("idle")
      } else {
        setErrorMsg(`NFC 初始化失败: ${err.message}`)
        setReaderState("error")
        addLog(`❌ NFC 错误: ${err.message}`)
      }
    }
  }, [nfcSupported])

  const reset = () => {
    setReaderState("idle")
    setTapResult(null)
    setCheckinResult(null)
    setErrorMsg("")
  }

  // ============ RENDER ============

  if (nfcSupported === null) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-gray-400" />
          <p className="text-sm text-gray-400 mt-2">检测浏览器 NFC 支持...</p>
        </CardContent>
      </Card>
    )
  }

  if (!nfcSupported) {
    return (
      <Card className="border-dashed border-amber-300 bg-amber-50">
        <CardContent className="p-6 text-center space-y-3">
          <WifiOff className="h-10 w-10 mx-auto text-amber-500" />
          <h3 className="font-bold text-amber-800">NFC 不可用</h3>
          <p className="text-sm text-amber-600">此浏览器不支持 Web NFC。请使用：</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside text-left max-w-xs mx-auto">
            <li><strong>Android 手机</strong> + Chrome 浏览器</li>
            <li>或将此页面通过 <strong>HTTPS</strong> 访问</li>
            <li>或使用 <strong>USB 读卡器</strong>（运行 Python 桥接脚本）</li>
          </ul>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SmartphoneNfc className="h-6 w-6 text-blue-600" />
          NFC 感应打卡
        </CardTitle>
        <CardDescription>学生和教师统一 — 将 NFC 卡片靠近手机背面自动签到/签退</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* State: Idle */}
        {readerState === "idle" && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-3 animate-pulse">
              <SmartphoneNfc className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 mb-4">学生和教师统一使用 NFC 卡片打卡</p>
            <Button
              onClick={startScan}
              size="lg"
              className="w-full h-16 text-lg rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              <SmartphoneNfc className="h-6 w-6 mr-2" />
              开始扫描 NFC
            </Button>
          </div>
        )}

        {/* State: Scanning */}
        {readerState === "scanning" && (
          <div className="text-center py-6 space-y-3">
            <div className="relative inline-flex">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                <SmartphoneNfc className="h-12 w-12 text-blue-600 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
            </div>
            <p className="text-lg font-bold text-blue-700">请贴近 NFC 卡片...</p>
            <p className="text-sm text-blue-500">将卡片放在手机背面 NFC 感应区</p>
            <Button variant="outline" size="sm" onClick={reset}>
              取消
            </Button>
          </div>
        )}

        {/* State: Reading / Checking In */}
        {(readerState === "reading" || readerState === "checking_in") && (
          <div className="text-center py-4 space-y-2">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
            <p className="font-medium text-blue-700">
              {readerState === "reading" ? "正在读取卡片..." : "正在签到..."}
            </p>
          </div>
        )}

        {/* State: Error */}
        {readerState === "error" && (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800">{errorMsg}</AlertDescription>
            </Alert>

            {tapResult && !tapResult.found && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm mb-2">
                  卡号: <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">{tapResult.card?.uid || "未知"}</code>
                </p>
                <p className="text-gray-400 text-sm">该卡片未在系统中注册</p>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        )}

        {/* State: Success */}
        {readerState === "success" && tapResult?.person && (
          <div className="space-y-4">
            {/* Person Card */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-5 border border-green-200 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
              <div className="flex items-center justify-center gap-2">
                {tapResult.person_type === "teacher" ? (
                  <User className="h-5 w-5 text-purple-500" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-blue-500" />
                )}
                <h3 className="text-xl font-bold text-gray-900">{tapResult.person.name}</h3>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant={tapResult.person_type === "teacher" ? "default" : "secondary"} className="font-mono">
                  {tapResult.person_type === "teacher" ? "教师" : "学生"}
                </Badge>
                <Badge variant="secondary" className="font-mono">{tapResult.person.id}</Badge>
                <Badge variant="outline">{tapResult.person.center}</Badge>
              </div>
            </div>

            {/* Check-in Result */}
            {checkinResult && (
              <div
                className={`rounded-xl p-4 text-center border-2 ${
                  checkinResult.action === "签退"
                    ? "border-orange-300 bg-orange-50"
                    : "border-green-300 bg-green-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {checkinResult.action === "签退" ? (
                    <LogOut className="h-6 w-6 text-orange-600" />
                  ) : (
                    <LogIn className="h-6 w-6 text-green-600" />
                  )}
                  <span
                    className={`text-lg font-bold ${
                      checkinResult.action === "签退" ? "text-orange-700" : "text-green-700"
                    }`}
                  >
                    {checkinResult.action}成功！
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>
            )}

            <Button variant="outline" className="w-full" size="lg" onClick={reset}>
              继续打卡
            </Button>
          </div>
        )}

        {/* Log (debug) */}
        {log.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              调试日志 ({log.length})
            </summary>
            <div className="mt-2 max-h-32 overflow-y-auto bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 space-y-0.5">
              {log.map((entry, i) => (
                <div key={i}>{entry}</div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
