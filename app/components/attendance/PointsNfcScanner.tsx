"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Loader2, Wifi } from "lucide-react"

interface Props {
  /** Set mode to filter which card type to accept */
  mode?: "student" | "teacher"
  /** Callback when a card is scanned */
  onScan?: (cardUid: string) => void
  /** Optional label text */
  label?: string
  /** Auto-dispatch pjpc:student-scanned event (student mode) */
  autoDispatch?: boolean
}

/**
 * PointsNfcScanner — Listens for USB GlobalCardScanner keyboard input
 * and dispatches card_uid events.
 * 
 * Student mode: dispatched as pjpc:student-scanned custom event
 * Teacher mode: invokes onScan callback with card_uid
 */
export default function PointsNfcScanner({
  mode = "student",
  onScan,
  label = mode === "teacher" ? "请刷老师卡确认" : "请刷学生卡",
  autoDispatch = true,
}: Props) {
  const [scanning, setScanning] = useState(false)
  const [lastUid, setLastUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bufferRef = useRef("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // GlobalCardScanner sends card UID as simulated keyboard input
      // Card UIDs are 10-digit decimal numbers
      if (e.key === "Enter") {
        const uid = bufferRef.current.trim()
        bufferRef.current = ""
        if (uid.length >= 6) {
          setLastUid(uid)
          setScanning(false)

          if (mode === "teacher") {
            onScan?.(uid)
          } else if (autoDispatch) {
            window.dispatchEvent(
              new CustomEvent("pjpc:student-scanned", {
                detail: { card_uid: uid },
              })
            )
          }
        }
        return
      }

      // Start scanning indicator on first digit
      if (/^[0-9]$/.test(e.key)) {
        if (!scanning) setScanning(true)
        bufferRef.current += e.key

        // Reset buffer after 500ms of no input (card scan takes ~100-200ms)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          bufferRef.current = ""
          setScanning(false)
        }, 500)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [mode, scanning, autoDispatch, onScan])

  return (
    <div className="flex flex-col items-center gap-2">
      <Card className={`w-48 h-32 flex flex-col items-center justify-center border-2 cursor-default transition-colors ${
        scanning
          ? "border-amber-400 bg-amber-50 animate-pulse"
          : "border-dashed border-gray-200 bg-white"
      }`}>
        {scanning ? (
          <>
            <Loader2 className="h-6 w-6 text-amber-500 animate-spin mb-1" />
            <span className="text-[10px] text-amber-600 font-medium">正在读取...</span>
            {bufferRef.current && (
              <span className="text-xs text-gray-400 mt-0.5">{bufferRef.current.slice(0, 10)}</span>
            )}
          </>
        ) : lastUid ? (
          <>
            <Wifi className="h-6 w-6 text-green-500 mb-1" />
            <span className="text-[10px] text-green-600 font-medium">已读取</span>
            <span className="text-xs text-gray-400 mt-0.5">{lastUid}</span>
          </>
        ) : (
          <>
            <Wifi className="h-6 w-6 text-gray-300 mb-1" />
            <span className="text-[10px] text-gray-400">{label}</span>
          </>
        )}
      </Card>
      {error && (
        <span className="text-[10px] text-red-500">{error}</span>
      )}
    </div>
  )
}
