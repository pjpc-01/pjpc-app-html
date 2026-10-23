"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * 学生首页数据（/api/student/home）。
 *
 * 服务端只回「登录学生自己」的数据；学生带别人的 id 也只回自己。
 * 多个页面共用一份，避免每页各写一次 fetch + 错误处理。
 */
export type StudentHome = {
  student: any
  today: { date: string; weekday: string; weekday_zh: string; classes: any[]; next: any }
  week_schedule: any[]
  homework: any[]
  pending_homework: number
  points: { total: number; monthly: number; recent: any[] }
  attendance: { present: number; absent: number; records: number }
  notices: any[]
  leaves: any[]
  achievements?: { earned_count: number; total: number; fresh: any[] }
}

export function useStudentHome() {
  const [data, setData] = useState<StudentHome | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/student/home")
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setData(d as StudentHome)
      setError("")
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  return { data, loading, error, reload }
}

export const DAYS: { key: string; zh: string }[] = [
  { key: "Monday", zh: "星期一" },
  { key: "Tuesday", zh: "星期二" },
  { key: "Wednesday", zh: "星期三" },
  { key: "Thursday", zh: "星期四" },
  { key: "Friday", zh: "星期五" },
  { key: "Saturday", zh: "星期六" },
  { key: "Sunday", zh: "星期日" },
]

const ALIAS: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
  周一: "Monday", 周二: "Tuesday", 周三: "Wednesday", 周四: "Thursday", 周五: "Friday", 周六: "Saturday", 周日: "Sunday",
  星期一: "Monday", 星期二: "Tuesday", 星期三: "Wednesday", 星期四: "Thursday", 星期五: "Friday", 星期六: "Saturday", 星期日: "Sunday",
}

export function dayKey(v: any): string {
  const s = String(v || "")
  if (!s) return ""
  if (ALIAS[s]) return ALIAS[s]
  return s
}

export function weekdayOf(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return ""
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()]
}
