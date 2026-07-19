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

  // ─── Stepped multi-column layout ──────────────────────────────────
  // Higher rank → bigger font, fewer columns (more prominent)
  // Lower rank → smaller font, more columns (fits all on one page)
  const tiers = [
    { start: 0, end: 3, cols: 3, name: "text-2xl", badge: "w-16 h-16 text-2xl", pts: "text-xl", pad: "py-4" },
    { start: 3, end: 10, cols: 3, name: "text-lg", badge: "w-11 h-11 text-base", pts: "text-base", pad: "py-3" },
    { start: 10, end: 20, cols: 4, name: "text-sm", badge: "w-8 h-8 text-sm", pts: "text-sm", pad: "py-2" },
    { start: 20, end: 35, cols: 5, name: "text-xs", badge: "w-7 h-7 text-xs", pts: "text-xs", pad: "py-1.5" },
    { start: 35, end: Infinity, cols: 6, name: "text-[10px]", badge: "w-6 h-6 text-[9px]", pts: "text-[10px]", pad: "py-1" },
  ]

  // Build tier groups
  interface TierGroup { tier: typeof tiers[0]; items: { student: LeaderboardStudent; rank: number }[] }
  const tierGroups: TierGroup[] = []
  if (multiColumn) {
    for (const t of tiers) {
      if (t.start >= count) break
      const slice = students.slice(t.start, Math.min(t.end, count))
      if (slice.length === 0) break
      tierGroups.push({
        tier: t,
        items: slice.map((s, i) => ({ student: s, rank: t.start + i + 1 })),
      })
    }
  }

  const rankBadge = (rank: number) => {
    for (const t of tiers) {
      if (rank > t.start && rank <= t.end) {
        const common = `${t.badge} rounded-full flex items-center justify-center font-bold shrink-0`
        if (variant === "dark") {
          if (rank === 1) return `${common} bg-yellow-500 text-white`
          if (rank === 2) return `${common} bg-gray-400 text-white`
          if (rank === 3) return `${common} bg-amber-600 text-white`
          return `${common} bg-white/10 text-white/50`
        }
        if (rank === 1) return `${common} bg-yellow-400 text-white`
        if (rank === 2) return `${common} bg-gray-300 text-white`
        if (rank === 3) return `${common} bg-amber-500 text-white`
        return `${common} bg-gray-100 text-gray-400`
      }
    }
    return ""
  }

  const rowPad = (rank: number) => {
    for (const t of tiers) { if (rank > t.start && rank <= t.end) return t.pad }
    return "py-1"
  }

  const nameSize = (rank: number) => {
    for (const t of tiers) { if (rank > t.start && rank <= t.end) return t.name }
    return "text-xs"
  }

  const ptsSize = (rank: number) => {
    for (const t of tiers) { if (rank > t.start && rank <= t.end) return t.pts }
    return "text-sm"
  }

  const metaSize = (rank: number) =>
    rank <= 3 ? "text-xs" : "text-[10px]"

  const rowBg = variant === "dark" ? "hover:bg-white/5" : "hover:bg-amber-50/50 border-b border-gray-50"

  const nameColor = variant === "dark" ? "text-white/90" : "text-gray-800"

  const gradeColor = variant === "dark" ? "text-white/30" : "text-gray-400"

  const idColor = variant === "dark" ? "bg-blue-500/20 text-blue-300" : "bg-blue-50 text-blue-500"

  const pointsColor = variant === "dark" ? "text-amber-400" : "text-amber-600"

  const renderRow = (s: LeaderboardStudent, rank: number, overridePad?: string) => (
    <div
      key={s.id}
      className={`flex items-center gap-2.5 px-3 cursor-pointer transition-colors ${multiColumn ? "border-b border-white/5" : variant === "dark" ? "border-b border-white/5" : "border-b border-gray-50"} ${overridePad || rowPad(rank)} ${multiColumn ? "hover:bg-white/5" : rowBg}`}
      onClick={() => onStudentClick?.(s)}
    >
      <span className={rankBadge(rank)}>{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`${nameSize(rank)} font-medium truncate ${nameColor}`}>{s.name}</span>
          {s.student_id && (
            <span className={`${metaSize(rank)} px-1.5 py-0.5 rounded shrink-0 ${idColor}`}>{s.student_id}</span>
          )}
        </div>
        <p className={`${metaSize(rank)} leading-tight ${gradeColor}`}>{s.grade}</p>
      </div>
      <span className={`${ptsSize(rank)} font-bold tabular-nums shrink-0 ${pointsColor}`}>
        {s.points}<span className="text-[10px] font-normal opacity-60 ml-0.5">分</span>
      </span>
    </div>
  )

  return multiColumn ? (
    <div className="flex flex-col gap-3">
      {tierGroups.map((g, ti) => (
        <div key={ti}>
          <div
            className="grid gap-x-3 gap-y-0"
            style={{
              gridAutoFlow: "column",
              gridTemplateRows: `repeat(${Math.ceil(g.items.length / g.tier.cols)}, auto)`,
            }}
          >
            {g.items.map(item => renderRow(item.student, item.rank, g.tier.pad))}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div>
      {students.map((s, idx) => {
        const rank = idx + 1
        return (
          <div
            key={s.id}
            className={`flex items-center gap-2.5 px-3 cursor-pointer transition-colors ${rowPad(rank)} ${variant === "dark" ? "border-b border-white/5" : "border-b border-gray-50"} ${rowBg}`}
            onClick={() => onStudentClick?.(s)}
          >
            <span className={rankBadge(rank)}>{rank}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`${nameSize(rank)} font-medium truncate ${nameColor}`}>
                  {s.name}
                </span>
                {s.student_id && (
                  <span className={`${metaSize(rank)} px-1.5 py-0.5 rounded shrink-0 ${idColor}`}>
                    {s.student_id}
                  </span>
                )}
              </div>
              <p className={`${metaSize(rank)} leading-tight ${gradeColor}`}>
                {s.grade}
              </p>
            </div>
            <span className={`${ptsSize(rank)} font-bold tabular-nums shrink-0 ${pointsColor}`}>
              {s.points}<span className="text-[10px] font-normal opacity-60 ml-0.5">分</span>
            </span>
          </div>
        )
      })}
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
