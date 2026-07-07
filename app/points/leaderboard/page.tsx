"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Star, RefreshCw, Medal, Building, GraduationCap } from "lucide-react"

interface RankingStudent {
  id: string
  name: string
  points: number
  center: string
  grade: string
}

export default function LeaderboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const centerParam = searchParams.get("center") || ""

  const [rankings, setRankings] = useState<RankingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [centerFilter, setCenterFilter] = useState(centerParam)
  const [centers, setCenters] = useState<{ id: string; code: string; name: string }[]>([])

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
    .filter(s => s.points > 0)
    .filter(s => {
      if (!centerFilter || centerFilter === "all") return true
      return s.center === centerFilter
    })
    .sort((a, b) => b.points - a.points)

  const top3 = filtered.slice(0, 3)

  return (
    <PageLayout
      title="积分排行榜"
      description={`共 ${filtered.filter(s => s.points > 0).length} 名学生有积分`}
      backUrl="/points"
      userRole="admin"
      background="from-yellow-50 to-amber-50"
    >
      <div className="space-y-4">
        {/* Center filter */}
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400" />
          <select
            value={centerFilter}
            onChange={e => setCenterFilter(e.target.value)}
            className="text-xs border rounded-lg px-3 py-2 h-9 bg-white"
          >
            <option value="">全部分行</option>
            {centers.map(c => (
              <option key={c.id} value={c.code}>{c.name || c.code}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={fetchRankings} className="h-9">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Top 3 Podium */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-3 items-end">
            {[
              { rank: 2, student: top3[1], color: "bg-gray-100 border-gray-300", medal: "🥈", h: "h-28", label: "第2名" },
              { rank: 1, student: top3[0], color: "bg-yellow-50 border-yellow-300", medal: "🥇", h: "h-36", label: "第1名" },
              { rank: 3, student: top3[2], color: "bg-amber-50 border-amber-300", medal: "🥉", h: "h-24", label: "第3名" },
            ].map((p, i) => (
              <Card
                key={p.rank}
                className={`border-2 ${p.color} cursor-pointer hover:shadow-md transition-shadow ${p.h}`}
                onClick={() => router.push(`/points?studentId=${p.student?.id}&name=${encodeURIComponent(p.student?.name || "")}`)}
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
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> 全部排行
              <Badge variant="secondary" className="text-[10px]">{filtered.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                {filtered.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-amber-50/50 cursor-pointer transition-colors ${
                      idx < 3 ? (idx === 0 ? "bg-yellow-50/60" : idx === 1 ? "bg-gray-50/40" : "bg-amber-50/40") : ""
                    }`}
                    onClick={() => router.push(`/points?studentId=${s.id}&name=${encodeURIComponent(s.name)}`)}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? "bg-yellow-400 text-white" :
                      idx === 1 ? "bg-gray-300 text-white" :
                      idx === 2 ? "bg-amber-500 text-white" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.center} · {s.grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{s.points}</p>
                      <p className="text-[10px] text-gray-400">分</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
