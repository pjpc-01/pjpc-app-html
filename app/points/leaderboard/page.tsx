"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Badge } from "@/components/ui/badge"
import { Trophy, X } from "lucide-react"
import { LeaderboardView, LeaderboardList, type LeaderboardStudent, type CenterInfo } from "@/components/shared/LeaderboardList"

interface RankingStudent {
  id: string
  name: string
  points: number
  center: string
  grade: string
  student_id?: string
  avatar?: string
}

// ─── Full-screen overlay ────────────────────────────────
function FullscreenOverlay({ students, centerName, onClose }: { students: RankingStudent[]; centerName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 text-white shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold">{centerName || "全部"} · 积分排行榜</span>
          <Badge className="text-[10px] bg-gray-700 text-gray-300">{students.length} 人</Badge>
        </div>
        <button onClick={onClose}
          className="inline-flex items-center justify-center rounded-md text-white/60 hover:text-white h-7 w-7 hover:bg-white/10 transition-colors">
          <X className="h-4 w-4 pointer-events-none" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <LeaderboardList students={students} variant="dark" />
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const centerParam = searchParams.get("center") || ""

  const [rankings, setRankings] = useState<RankingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [centerFilter, setCenterFilter] = useState(centerParam)
  const [centers, setCenters] = useState<CenterInfo[]>([])
  const [fullscreen, setFullscreen] = useState(false)

  const fetchRankings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/points?limit=200")
      const data = await res.json()
      if (data.success) setRankings(data.students || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRankings() }, [fetchRankings])

  // Fetch centers
  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/centers/records")
      .then(r => r.json())
      .then(d => setCenters(d?.items?.map((c: any) => ({ id: c.id, code: c.code, name: c.name })) || []))
      .catch(() => {})
  }, [])

  const filtered = rankings
    .filter(s => {
      if (!centerFilter || centerFilter === "all") return true
      return s.center === centerFilter
    })
    .sort((a, b) => b.points - a.points)

  const centerName = centers.find(c => c.code === centerFilter)?.name || centerFilter || "全部"

  return (
    <PageLayout
      title="积分排行榜"
      description={`共 ${filtered.length} 名学生有积分`}
      backUrl="/points"
      userRole="admin"
      background="from-yellow-50 to-amber-50"
    >
      {/* Fullscreen overlay */}
      {fullscreen && (
        <FullscreenOverlay
          students={filtered}
          centerName={centerName}
          onClose={() => setFullscreen(false)}
        />
      )}

      {/* Shared leaderboard view */}
      <LeaderboardView
        rankings={rankings}
        centers={centers}
        centerFilter={centerFilter}
        loading={loading}
        onCenterChange={setCenterFilter}
        onRefresh={fetchRankings}
        onFullscreen={() => setFullscreen(true)}
        onStudentClick={(s) => router.push(`/points?studentId=${s.id}&name=${encodeURIComponent(s.name)}`)}
      />
    </PageLayout>
  )
}
