// ═══ Shared Leaderboard List ═══════════════════════════════════════
// Used by both /points/leaderboard (fullscreen overlay) and
// the slideshow widget. Any changes here reflect everywhere.
// ═══════════════════════════════════════════════════════════════════

export interface LeaderboardStudent {
  id: string
  name: string
  points: number
  center: string
  grade: string
  student_id?: string
}

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
      className={`flex items-center gap-3 py-1.5 px-1 rounded ${rowClass}`}
      onClick={() => onStudentClick?.(s)}
    >
      <span className={`w-8 text-right text-sm font-bold tabular-nums shrink-0 ${rankClass}`}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{s.name}</span>
          {s.student_id && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${idBadge}`}>
              {s.student_id}
            </span>
          )}
        </div>
        <p className={`text-[10px] ${gradeClass}`}>{s.grade}</p>
      </div>
      <span className={`text-sm font-bold w-16 text-right tabular-nums shrink-0 ${pointsClass}`}>
        {s.points}<span className={`text-[10px] font-normal ml-0.5 ${pointsLabelClass}`}>分</span>
      </span>
    </div>
  )

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
      <div className="space-y-0">
        {leftCol.map((s, i) => renderRow(s, i + 1))}
      </div>
      <div className="space-y-0">
        {rightCol.map((s, i) => renderRow(s, half + i + 1))}
      </div>
    </div>
  )
}
