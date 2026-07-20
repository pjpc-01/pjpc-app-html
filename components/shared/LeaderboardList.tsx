// ═══ Shared Leaderboard ════════════════════════════════════════════
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Building, RefreshCw, Maximize2, Loader2 } from "lucide-react"

export interface LeaderboardStudent {
  id: string
  name: string
  points: number
  center: string
  grade: string
  student_id?: string
}

export interface CenterInfo {
  id: string
  code: string
  name: string
}

export interface LeaderboardPageProps {
  rankings: LeaderboardStudent[]
  loading?: boolean
  onStudentClick?: (s: LeaderboardStudent) => void
  compact?: boolean
  centers: CenterInfo[]
  centerFilter: string
  onCenterChange: (center: string) => void
  onRefresh?: () => void
  onFullscreen?: () => void
  fullscreenDisabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────

export function LeaderboardList({
  students,
  variant = "dark",
  multiColumn = false,
  onStudentClick,
}: {
  students: LeaderboardStudent[]
  variant?: "dark" | "light"
  multiColumn?: boolean
  onStudentClick?: (s: LeaderboardStudent) => void
}) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={variant === "dark" ? "text-white/30 text-sm" : "text-gray-400 text-sm"}>暂无积分排行</p>
      </div>
    )
  }

  const count = students.length

  // Auto-rows for multiColumn mode
  const [rowCount, setRowCount] = useState(12)
  const gridRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!multiColumn) return
    const el = gridRef.current?.parentElement
    if (!el) return
    const calc = () => {
      const h = el.clientHeight
      setRowCount(Math.max(6, Math.floor(h / 40)))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [multiColumn, students.length])

  const badgeStyle = (r: number): React.CSSProperties => {
    if (r === 1) return { backgroundColor: variant === "dark" ? "#EAB308" : "#FACC15", color: "white" }
    if (r === 2) return { backgroundColor: variant === "dark" ? "#9CA3AF" : "#D1D5DB", color: "white" }
    if (r === 3) return { backgroundColor: variant === "dark" ? "#8B5E3C" : "#CD7F32", color: "white" }
    return {
      backgroundColor: variant === "dark" ? "rgba(255,255,255,0.1)" : "#F3F4F6",
      color: variant === "dark" ? "rgba(255,255,255,0.5)" : "#9CA3AF",
    }
  }

  const nameCol = (r: number) => 
    r === 1 ? "text-[#B8860B]" :
    r === 2 ? "text-[#71717A]" :
    r === 3 ? "text-[#8B5E3C]" :
    variant === "dark" ? "text-gray-200" : "text-black"
  const gradeCol = (r: number) =>
    r === 1 ? "text-[#D4A017]/80" :
    r === 2 ? "text-[#71717A]/80" :
    r === 3 ? "text-[#8B5E3C]/80" :
    variant === "dark" ? "text-gray-400" : "text-gray-600"
  const idCol = variant === "dark" ? "bg-blue-500/20 text-blue-300" : "bg-blue-50 text-blue-500"
  const ptsCol = variant === "dark" ? "text-amber-400" : "text-amber-600"
  const borderCls = variant === "dark" ? "border-b border-white/10" : "border-b border-gray-50"

  const row = (s: LeaderboardStudent, r: number) => (
    <div
      key={s.id}
      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${borderCls}`}
      onClick={() => onStudentClick?.(s)}
    >
      <span className="w-7 h-7 text-xs rounded-full flex items-center justify-center font-bold shrink-0" style={badgeStyle(r)}>{r}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium truncate ${nameCol(r)}`}>
          {s.name}
        </span>
        {s.student_id && (
          <span className={`text-[10px] ml-1.5 px-1.5 py-0.5 rounded shrink-0 ${idCol}`}>{s.student_id}</span>
        )}
        <p className={`text-[10px] leading-tight ${gradeCol(r)}`}>{s.grade}</p>
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${ptsCol}`}>
        {s.points}<span className="text-[10px] font-normal opacity-60 ml-0.5">分</span>
      </span>
    </div>
  )

  if (multiColumn) {
    // Column-major grid: auto-rows based on container height
    return (
      <div
        ref={gridRef}
        className="grid gap-x-4 gap-y-0"
        style={{
          gridAutoFlow: "column",
          gridTemplateRows: `repeat(${rowCount}, auto)`,
        }}
      >
        {students.map((s, i) => row(s, i + 1))}
      </div>
    )
  }

  return (
    <div>
      {students.map((s, i) => row(s, i + 1))}
    </div>
  )
}

// ─── Full leaderboard view ────────────────────────────────────────

export function LeaderboardView({
  rankings,
  centers = [],
  centerFilter,
  loading = false,
  compact = false,
  onCenterChange,
  onRefresh,
  onFullscreen,
  onStudentClick,
  fullscreenDisabled,
}: LeaderboardPageProps) {
  const filtered = rankings
    .filter(s => s.points > 0)
    .filter(s => {
      if (!centerFilter || centerFilter === "all" || centerFilter === "") return true
      return s.center === centerFilter
    })
    .sort((a, b) => b.points - a.points)

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400" />
          <select
            value={centerFilter}
            onChange={e => onCenterChange(e.target.value)}
            className="text-xs border rounded-lg px-3 py-2 h-9 bg-white"
          >
            <option value="all">全部分行</option>
            {centers.filter(c => c.code !== "all").map(c => (
              <option key={c.id} value={c.code}>{c.name}</option>
            ))}
          </select>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-9">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />刷新
            </Button>
          )}
          {onFullscreen && (
            <Button variant="ghost" size="sm" onClick={onFullscreen} className="h-9 ml-auto" disabled={fullscreenDisabled}>
              <Maximize2 className="h-3.5 w-3.5 mr-1" />全屏
            </Button>
          )}
        </div>
      )}
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardHeader className={compact ? "p-2" : ""}>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-amber-500" />
            积分排行榜
            <Badge variant="secondary" className="text-[10px] ml-1">积分排行</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className={compact ? "p-0" : "p-0"}>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-5 w-5 mx-auto animate-spin text-gray-400" />
              <p className="text-xs text-gray-400 mt-2">加载中...</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <LeaderboardList
                students={filtered}
                variant={compact ? "dark" : "light"}
                onStudentClick={onStudentClick}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
