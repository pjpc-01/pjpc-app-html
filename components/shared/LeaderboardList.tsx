// ═══ Shared Leaderboard ════════════════════════════════════════════
// SINGLE source of truth for ALL leaderboard displays:
//   - /points/leaderboard (page + fullscreen overlay)
//   - /dashboard/slideshow (widget + slideshow overlay)
//
// Change ONE file → everything updates.
// ═══════════════════════════════════════════════════════════════════

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Building, RefreshCw, Maximize2, Loader2 } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

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

// ─── Props ─────────────────────────────────────────────────────────

export interface LeaderboardPageProps {
  /** Raw student list (will be filtered & sorted internally) */
  rankings: LeaderboardStudent[]
  /** Loading state */
  loading?: boolean
  /** Called when a student row is clicked */
  onStudentClick?: (s: LeaderboardStudent) => void
  /** Compact mode: hide filter (for dashboard widgets) */
  compact?: boolean
  /** Centers list for the filter dropdown */
  centers: CenterInfo[]
  /** Current center filter value */
  centerFilter: string
  /** Called when center filter changes */
  onCenterChange: (center: string) => void
  /** Called when refresh button is clicked */
  onRefresh?: () => void
  /** Called when fullscreen button is clicked */
  onFullscreen?: () => void
  /** Fullscreen button disabled? */
  fullscreenDisabled?: boolean
}

// ─── Single-column student list ───────────────────────────────────

export function LeaderboardList({
  students,
  variant = "dark",
  onStudentClick,
}: {
  students: LeaderboardStudent[]
  variant?: "dark" | "light"
  onStudentClick?: (s: LeaderboardStudent) => void
}) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={variant === "dark" ? "text-white/30 text-sm" : "text-gray-400 text-sm"}>暂无积分排行</p>
      </div>
    )
  }

  const rowBg = (idx: number) => {
    if (variant === "dark") return ""
    return idx === 0 ? "bg-yellow-50/60" : idx === 1 ? "bg-gray-50/40" : idx === 2 ? "bg-amber-50/40" : ""
  }

  return (
    <div>
      {students.map((s, idx) => (
        <div
          key={s.id}
          className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 cursor-pointer transition-colors ${rowBg(idx)} hover:bg-amber-50/50`}
          onClick={() => onStudentClick?.(s)}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            idx === 0 ? "bg-yellow-400 text-white" :
            idx === 1 ? "bg-gray-300 text-white" :
            idx === 2 ? "bg-amber-500 text-white" :
            variant === "dark" ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-400"
          }`}>
            {idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-medium text-sm truncate ${variant === "dark" ? "text-white/90" : "text-gray-800"}`}>
                {s.name}
              </span>
              {s.student_id && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                  variant === "dark" ? "bg-blue-500/20 text-blue-300" : "bg-blue-50 text-blue-500"
                }`}>
                  {s.student_id}
                </span>
              )}
            </div>
            <p className={`text-[10px] ${variant === "dark" ? "text-white/30" : "text-gray-400"}`}>
              {s.grade}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-bold ${variant === "dark" ? "text-amber-400" : "text-amber-600"}`}>
              {s.points}
            </p>
            <p className={`text-[10px] ${variant === "dark" ? "text-white/30" : "text-gray-400"}`}>分</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Full leaderboard view (filter + list) ────────────────────────

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
      {/* Center filter — hidden in compact mode */}
      {!compact && (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400" />
          <select
            value={centerFilter}
            onChange={e => onCenterChange(e.target.value)}
            className="text-xs border rounded-lg px-3 py-2 h-9 bg-white"
          >
            <option value="">全部分行</option>
            {centers.map(c => (
              <option key={c.id} value={c.code}>{c.name || c.code}</option>
            ))}
          </select>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-9">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
          {onFullscreen && (
            <Button variant="ghost" size="sm" onClick={onFullscreen} className="h-9" disabled={fullscreenDisabled || filtered.length === 0}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Full Leaderboard */}
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
