// ═══ Shared Leaderboard ════════════════════════════════════════════
"use client"

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
  avatar?: string
}

export interface CenterInfo {
  id: string
  code: string
  name: string
}

// 年级中文显示映射 — 兼容各种 raw grade 格式
const GRADE_DISPLAY: Record<string, string> = {
  "Standard 1": "一年级", "Standard 2": "二年级", "Standard 3": "三年级",
  "Standard 4": "四年级", "Standard 5": "五年级", "Standard 6": "六年级",
  "Form 1": "中一", "Form 2": "中二", "Form 3": "中三",
  "Form 4": "中四", "Form 5": "中五", "Form 6": "中六",
  "Peralihan": "预备班",
  "1": "一年级", "2": "二年级", "3": "三年级",
  "4": "四年级", "5": "五年级", "6": "六年级",
  "7": "中一", "8": "中二", "9": "中三",
  "10": "中四", "11": "中五", "12": "中六",
  "y1": "一年级", "y2": "二年级", "y3": "三年级",
  "y4": "四年级", "y5": "五年级", "y6": "六年级",
  "y7": "中一", "y8": "中二", "y9": "中三",
  "y10": "中四", "y11": "中五", "y12": "中六",
}
const toGradeDisplay = (grade: string): string => GRADE_DISPLAY[grade] || grade

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
  startRank = 1,
}: {
  students: LeaderboardStudent[]
  variant?: "dark" | "light"
  multiColumn?: boolean
  onStudentClick?: (s: LeaderboardStudent) => void
  startRank?: number
}) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={variant === "dark" ? "text-white/30 text-sm" : "text-gray-400 text-sm"}>暂无积分排行</p>
      </div>
    )
  }

  const count = students.length

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
  const borderCls = variant === "dark" ? "border-b border-white/5" : "border-b border-gray-50"

  const getAvatarUrl = (s: LeaderboardStudent) => {
    if (!s.avatar) return null
    if (s.avatar.startsWith("http")) return s.avatar
    return `/api/pocketbase-proxy/api/files/students/${s.id}/${s.avatar}`
  }

  const avatarEl = (s: LeaderboardStudent, r: number) => {
    const url = getAvatarUrl(s)
    if (url) {
      return (
        <img
          src={url}
          alt={s.name}
          className="w-7 h-7 rounded-full shrink-0 object-cover border border-white/20"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )
    }
    return (
      <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${nameCol(r)}`}
        style={{backgroundColor: variant === "dark" ? "rgba(255,255,255,0.15)" : "#E5E7EB"}}>
        {s.name.charAt(0)}
      </span>
    )
  }

  const row = (s: LeaderboardStudent, r: number) => (
    <div
      key={s.id}
      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${borderCls}`}
      onClick={() => onStudentClick?.(s)}
    >
      <span className="w-7 h-7 text-xs rounded-full flex items-center justify-center font-bold shrink-0" style={badgeStyle(r)}>{r}</span>
      {avatarEl(s, r)}
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium truncate ${nameCol(r)}`}>
          {s.name}
        </span>
        {s.student_id && (
          <span className={`text-[10px] ml-1.5 px-1.5 py-0.5 rounded shrink-0 ${idCol}`}>{s.student_id}</span>
        )}
        <p className={`text-[10px] leading-tight ${gradeCol(r)}`}>{toGradeDisplay(s.grade)}</p>
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${ptsCol}`}>
        {s.points}<span className="text-[10px] font-normal opacity-60 ml-0.5">分</span>
      </span>
    </div>
  )

  if (multiColumn) {
    // Column-major grid: fill top→bottom, auto-create next column
    return (
      <div
        className="grid gap-x-4 gap-y-0"
        style={{
          gridAutoFlow: "column",
          gridTemplateRows: `repeat(10, auto)`,
        }}
      >
        {students.map((s, i) => row(s, startRank + i))}
      </div>
    )
  }

  return (
    <div>
      {students.map((s, i) => row(s, startRank + i))}
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
    .filter(s => {
      if (!centerFilter || centerFilter === "all" || centerFilter === "") return true
      return s.center === centerFilter
    })
    .sort((a, b) => b.points - a.points)

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={!centerFilter || centerFilter === "all" || centerFilter === "" ? "default" : "outline"}
            onClick={() => onCenterChange("all")}
            className="h-8 text-xs"
          >
            全部
          </Button>
          {centers.map(c => (
            <Button
              key={c.id}
              size="sm"
              variant={centerFilter === c.code ? "default" : "outline"}
              onClick={() => onCenterChange(c.code)}
              className="h-8 text-xs"
            >
              <Building className="h-3 w-3 mr-1" />{c.name || c.code}
            </Button>
          ))}
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
          {onFullscreen && (
            <Button variant="ghost" size="sm" onClick={onFullscreen} className="h-9" disabled={fullscreenDisabled || filtered.length === 0}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <Card className={compact ? "border-0 shadow-none" : ""}>
        {!compact && (
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> 全部排行
              <Badge variant="secondary" className="text-[10px]">{filtered.length}</Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className={compact ? "p-0" : "p-0"}>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-amber-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">暂无积分排行</p>
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
