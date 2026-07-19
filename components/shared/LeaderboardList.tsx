// ═══ Shared Leaderboard ════════════════════════════════════════════
// SINGLE source of truth for ALL leaderboard displays:
//   - /points/leaderboard (page + fullscreen overlay)
//   - /dashboard/slideshow (widget + slideshow overlay)
//
// Change ONE file → everything updates.
// ═══════════════════════════════════════════════════════════════════

"use client"

import { Fragment } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Building, RefreshCw, Maximize2, X, Loader2 } from "lucide-react"

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

// ─── Props shared by both views ────────────────────────────────────

export interface LeaderboardViewProps {
  /** Raw student list (will be filtered & sorted internally) */
  rankings: LeaderboardStudent[]
  /** Loading state */
  loading?: boolean
  /** Called when a student row is clicked */
  onStudentClick?: (s: LeaderboardStudent) => void
  /** Optional compact mode: hide podium & filter (for dashboard widgets) */
  compact?: boolean
}

export interface LeaderboardPageProps extends LeaderboardViewProps {
  /** Centers list for the filter dropdown */
  centers: CenterInfo[]
  /** Current center filter value */
  centerFilter: string
  /** Called when center filter changes */
  onCenterChange: (center: string) => void
  /** Called when refresh button is clicked */
  onRefresh?: () => void
  /** Called when fullscreen button is clicked (only for page mode) */
  onFullscreen?: () => void
  /** Fullscreen button disabled? */
  fullscreenDisabled?: boolean
}

// ─── Two-column student list (clean, no podium/filter) ────────────

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

  const half = Math.ceil(students.length / 2)
  const leftCol = students.slice(0, half)
  const rightCol = students.slice(half)

  const rowClass = variant === "dark"
    ? "text-white/90 hover:bg-white/5 cursor-pointer transition-colors"
    : "hover:bg-amber-50/50 cursor-pointer transition-colors border-b border-gray-50"

  const rankClass = variant === "dark"
    ? "text-white/40"
    : "text-gray-400"

  const idBadge = variant === "dark"
    ? "bg-blue-500/20 text-blue-300"
    : "bg-blue-50 text-blue-500"

  const gradeClass = variant === "dark"
    ? "text-white/30"
    : "text-gray-400"

  const pointsClass = variant === "dark"
    ? "text-amber-400"
    : "text-amber-600"

  const pointsLabelClass = variant === "dark"
    ? "text-white/30"
    : "text-gray-400"

  const renderRow = (s: LeaderboardStudent, rank: number) => (
    <div
      key={s.id}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded ${rowClass}`}
      onClick={() => onStudentClick?.(s)}
    >
      <span className={`w-6 text-right text-xs font-bold tabular-nums shrink-0 ${rankClass}`}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">{s.name}</span>
          {s.student_id && (
            <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${idBadge}`}>
              {s.student_id}
            </span>
          )}
        </div>
        <p className={`text-[9px] leading-tight ${gradeClass}`}>{s.grade}</p>
      </div>
      <span className={`text-xs font-bold tabular-nums shrink-0 ${pointsClass}`}>
        {s.points}<span className={`text-[9px] font-normal ml-0.5 ${pointsLabelClass}`}>分</span>
      </span>
    </div>
  )

  // Reorder the array so each group of 10 fills left->right in the 2-column grid
  // Track original index for correct rank display
  const groupSize = 10
  interface OrderedItem { student: LeaderboardStudent; originalIndex: number }
  const reordered: OrderedItem[] = []
  for (let i = 0; i < students.length; i += groupSize) {
    const group = students.slice(i, i + groupSize)
    const mid = Math.ceil(group.length / 2)
    const left = group.slice(0, mid)
    const right = group.slice(mid)
    for (let j = 0; j < Math.max(left.length, right.length); j++) {
      if (j < left.length) {
        const origIdx = i + j
        reordered.push({ student: left[j], originalIndex: origIdx })
      }
      if (j < right.length) {
        const origIdx = i + mid + j
        reordered.push({ student: right[j], originalIndex: origIdx })
      }
    }
  }

  // Track where groups change so we can insert spacing
  const groupBoundaries = new Set<number>()
  let idx = 0
  for (let i = 0; i < students.length; i += groupSize) {
    idx += i + groupSize <= students.length ? groupSize : students.length - i
    if (idx < students.length) groupBoundaries.add(idx)
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-0">
      {reordered.map((item, gridIdx) => {
        const rank = item.originalIndex + 1
        return (
          <Fragment key={item.student.id}>
            {groupBoundaries.has(gridIdx) && (
              <div className="col-span-2 h-2" />
            )}
            {renderRow(item.student, rank)}
          </Fragment>
        )
      })}
    </div>
  )
}

// ─── Top 3 podium ──────────────────────────────────────────────────

function LeaderboardPodium({
  top3,
  onStudentClick,
}: {
  top3: LeaderboardStudent[]
  onStudentClick?: (s: LeaderboardStudent) => void
}) {
  if (top3.length === 0) return null

  const items = [
    { rank: 2, student: top3[1], color: "bg-gray-100 border-gray-300", medal: "🥈", h: "h-28" },
    { rank: 1, student: top3[0], color: "bg-yellow-50 border-yellow-300", medal: "🥇", h: "h-36" },
    { rank: 3, student: top3[2], color: "bg-amber-50 border-amber-300", medal: "🥉", h: "h-24" },
  ].filter(p => p.student)

  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      {items.map(p => (
        <Card
          key={p.rank}
          className={`border-2 ${p.color} cursor-pointer hover:shadow-md transition-shadow ${p.h}`}
          onClick={() => onStudentClick?.(p.student!)}
        >
          <CardContent className="p-4 text-center h-full flex flex-col items-center justify-center">
            <span className="text-3xl mb-1">{p.medal}</span>
            <p className="font-bold text-gray-900 text-sm truncate w-full">{p.student?.name || "—"}</p>
            <p className="text-[10px] text-gray-400">{p.student?.center}</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{p.student?.points || 0}</p>
            <p className="text-[10px] text-gray-400">分</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Full leaderboard view (filter + podium + list) ───────────────

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

  const top3 = filtered.slice(0, 3)

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

      {/* Top 3 Podium — hidden in compact mode */}
      {!compact && filtered.length > 0 && (
        <LeaderboardPodium top3={top3} onStudentClick={onStudentClick} />
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
