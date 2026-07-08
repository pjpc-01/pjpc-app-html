"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, RefreshCw, Trophy, Maximize2, X, ChevronDown } from "lucide-react"

interface RankingStudent {
  id: string; name: string; points: number; grade: string; center: string; status: string
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <PageLayout title="积分排行榜" description="加载中..." backUrl="/points" userRole="admin" background="from-yellow-50 to-amber-50">
        <div className="text-center py-16"><Loader2 className="h-6 w-6 mx-auto animate-spin text-amber-500" /></div>
      </PageLayout>
    }>
      <LeaderboardContent />
    </Suspense>
  )
}

function PodiumTop3({ top3, router }: { top3: RankingStudent[]; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="grid grid-cols-3 divide-x border-b bg-gradient-to-b from-yellow-50/50 to-white">
      {[
        { rank: 2, student: top3[1], color: "text-gray-400", bg: "bg-gray-100" },
        { rank: 1, student: top3[0], color: "text-amber-500", bg: "bg-amber-100" },
        { rank: 3, student: top3[2], color: "text-orange-400", bg: "bg-orange-50" },
      ].map(p => (
        <div key={p.rank} className="p-4 text-center cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => router.push(`/points?studentId=${p.student?.id}&name=${encodeURIComponent(p.student?.name || "")}`)}>
          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${p.bg} mb-2`}>
            <span className={`text-sm font-bold ${p.color}`}>{p.rank}</span>
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{p.student?.name || "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{p.student?.grade}</p>
          <p className="text-lg font-bold text-amber-600 mt-1">{p.student?.points || 0}</p>
          <p className="text-[10px] text-gray-400">分</p>
        </div>
      ))}
    </div>
  )
}

function RankingList({ list, router, maxH, large }: { list: RankingStudent[]; router: ReturnType<typeof useRouter>; maxH?: string; large?: boolean }) {
  return (
    <div className={`overflow-y-auto ${maxH || "max-h-[320px]"}`}>
      {list.map((s, idx) => (
        <div key={s.id}
          className={`flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${s.status !== "active" ? "opacity-50" : ""}`}
          onClick={() => router.push(`/points?studentId=${s.id}&name=${encodeURIComponent(s.name)}`)}>
          <span className={`text-xs font-semibold w-5 text-right tabular-nums ${
            idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-orange-400" : "text-gray-300"
          }`}>{idx + 1}</span>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className={`font-medium text-gray-800 truncate ${large ? "text-base" : "text-sm"}`}>{s.name}</span>
            {s.status !== "active" && <Badge variant="outline" className="text-[10px] px-1 py-0 text-orange-400">停</Badge>}
          </div>
          <span className={`text-gray-400 ${large ? "text-sm" : "text-xs"}`}>{s.grade}</span>
          <span className={`text-gray-400 ${large ? "text-sm" : "text-xs"} w-16 text-right`}>{s.center}</span>
          <span className={`font-semibold w-16 text-right tabular-nums ${large ? "text-base" : "text-sm"} ${s.points > 0 ? "text-amber-600" : s.points < 0 ? "text-red-500" : "text-gray-300"}`}>
            {s.points > 0 ? "+" : ""}{s.points}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Center Detail Modal ────────────────────────────────────────────
function CenterDetailOverlay({
  name, list, router, onClose
}: {
  name: string; list: RankingStudent[]; router: ReturnType<typeof useRouter>; onClose: () => void
}) {
  const sorted = [...list].sort((a, b) => b.points - a.points)
  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)
  const isPrimary = name.includes("PU1") || name.includes("中学")

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isPrimary ? "bg-gradient-to-r from-blue-50 to-sky-50" : "bg-gradient-to-r from-green-50 to-emerald-50"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${isPrimary ? "bg-blue-500" : "bg-green-500"}`} />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{name}</h1>
            <p className="text-sm text-gray-500">{sorted.length} 名学生 · 总分 {sorted.reduce((sum, s) => sum + Math.max(0, s.points), 0)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-black/5">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="px-6 py-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="flex items-end justify-center gap-4" style={{ minHeight: "180px" }}>
            {/* 2nd */}
            {top3[1] && (
              <div className="text-center flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => { onClose(); router.push(`/points?studentId=${top3[1].id}&name=${encodeURIComponent(top3[1].name)}`) }}>
                <p className="text-sm font-medium text-gray-600 mb-2 truncate w-20">{top3[1].name}</p>
                <div className="w-20 h-24 bg-gray-100 rounded-t-xl flex items-end justify-center pb-2 relative">
                  <span className="text-2xl">🥈</span>
                </div>
                <div className="w-20 bg-gray-200 rounded-b-xl py-3 text-center">
                  <p className="text-lg font-bold text-gray-600">{top3[1].points}</p>
                  <p className="text-[10px] text-gray-400">分</p>
                </div>
              </div>
            )}
            {/* 1st */}
            {top3[0] && (
              <div className="text-center flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity -mt-2"
                onClick={() => { onClose(); router.push(`/points?studentId=${top3[0].id}&name=${encodeURIComponent(top3[0].name)}`) }}>
                <p className="text-sm font-bold text-amber-600 mb-2 truncate w-24">👑 {top3[0].name}</p>
                <div className={`w-24 h-36 ${isPrimary ? "bg-blue-100" : "bg-amber-100"} rounded-t-xl flex items-end justify-center pb-3 relative`}>
                  <span className="text-3xl">🏆</span>
                </div>
                <div className={`w-24 ${isPrimary ? "bg-blue-200" : "bg-amber-200"} rounded-b-xl py-3 text-center`}>
                  <p className={`text-xl font-bold ${isPrimary ? "text-blue-700" : "text-amber-700"}`}>{top3[0].points}</p>
                  <p className="text-[10px] text-gray-500">分</p>
                </div>
              </div>
            )}
            {/* 3rd */}
            {top3[2] && (
              <div className="text-center flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => { onClose(); router.push(`/points?studentId=${top3[2].id}&name=${encodeURIComponent(top3[2].name)}`) }}>
                <p className="text-sm font-medium text-gray-600 mb-2 truncate w-20">{top3[2].name}</p>
                <div className="w-20 h-16 bg-orange-50 rounded-t-xl flex items-end justify-center pb-1 relative">
                  <span className="text-xl">🥉</span>
                </div>
                <div className="w-20 bg-orange-100 rounded-b-xl py-3 text-center">
                  <p className="text-lg font-bold text-orange-600">{top3[2].points}</p>
                  <p className="text-[10px] text-gray-400">分</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full ranking table */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Header row */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100">
          <span className="w-5 text-[11px] font-semibold text-gray-400 text-right">#</span>
          <span className="flex-1 text-[11px] font-semibold text-gray-400">姓名</span>
          <span className="w-12 text-[11px] font-semibold text-gray-400 text-center">年级</span>
          <span className="w-20 text-[11px] font-semibold text-gray-400 text-right">积分</span>
        </div>
        {sorted.length === 0 ? (
          <div className="text-center py-20 text-gray-400">暂无数据</div>
        ) : (
          sorted.map((s, idx) => (
            <div key={s.id}
              className={`flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                idx < 3 ? "bg-yellow-50/30" : ""
              }`}
              onClick={() => { onClose(); router.push(`/points?studentId=${s.id}&name=${encodeURIComponent(s.name)}`) }}>
              {/* Rank */}
              <div className="w-5 text-right">
                {idx === 0 ? <span className="text-lg">🥇</span>
                  : idx === 1 ? <span className="text-lg">🥈</span>
                  : idx === 2 ? <span className="text-lg">🥉</span>
                  : <span className="text-sm font-medium text-gray-400 tabular-nums">{idx + 1}</span>}
              </div>
              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-800 truncate">{s.name}</p>
              </div>
              {/* Grade */}
              <span className="w-12 text-center text-sm text-gray-500">{s.grade}</span>
              {/* Points */}
              <span className={`w-20 text-right text-lg font-bold tabular-nums ${s.points > 0 ? "text-amber-600" : s.points < 0 ? "text-red-500" : "text-gray-300"}`}>
                {s.points > 0 ? "+" : ""}{s.points}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function LeaderboardContent() {
  const router = useRouter()
  const [rankings, setRankings] = useState<RankingStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [centerNames, setCenterNames] = useState<Record<string, string>>({})
  const [detailCenter, setDetailCenter] = useState<string | null>(null)

  const fetchRankings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/points/records?limit=200")
      const data = await res.json()
      if (data.success) setRankings(data.students || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/centers/records")
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {}
        for (const c of d?.items || []) map[c.code] = c.name || c.code
        setCenterNames(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchRankings() }, [fetchRankings])

  const getCenterName = (code: string) => centerNames[code] || code || "未分配"

  const filtered = rankings.filter(s => {
    if (s.status !== "active") return false
    if (!search) return true
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.grade.toLowerCase().includes(q) || s.center.toLowerCase().includes(q)
  })

  // Overall ranking
  const overall = [...rankings]
    .filter(s => s.status === "active" && s.points > 0)
    .sort((a, b) => b.points - a.points)
  const top10 = overall.slice(0, 10)

  // Group by center
  const centerOrder = [...new Set(filtered.map(s => s.center || ""))].sort()
  const grouped: Record<string, RankingStudent[]> = {}
  for (const c of centerOrder) {
    grouped[getCenterName(c)] = filtered
      .filter(s => (s.center || "") === c)
      .sort((a, b) => b.points - a.points)
  }

  // Detail view data
  const detailList = detailCenter ? grouped[detailCenter] || [] : []

  if (loading) {
    return (
      <PageLayout title="积分排行榜" description="加载中..." backUrl="/points" userRole="admin" background="from-yellow-50 to-amber-50">
        <div className="text-center py-16"><Loader2 className="h-6 w-6 mx-auto animate-spin text-amber-500" /></div>
      </PageLayout>
    )
  }

  return (
    <>
      {/* ─── Detail overlay ─── */}
      {detailCenter && (
        <CenterDetailOverlay
          name={detailCenter}
          list={detailList}
          router={router}
          onClose={() => setDetailCenter(null)}
        />
      )}

      <PageLayout
        title="积分排行榜"
        description={`${overall.length} 人上榜 · ${Object.keys(grouped).length} 个分行`}
        backUrl="/points"
        userRole="admin"
        background="from-yellow-50 to-amber-50"
      >
        <div className="space-y-5">
          {/* Search + refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索姓名或年级..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-white" />
            </div>
            <Button variant="outline" size="sm" onClick={fetchRankings} className="h-9"><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>

          {/* Per-center leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Object.entries(grouped).map(([name, list]) => {
              const sorted = [...list].sort((a, b) => b.points - a.points)
              const active = sorted.filter(s => s.points > 0)
              const top3 = active.slice(0, 3)
              const isPrimary = name.includes("PU1") || name.includes("中学")
              return (
                <Card key={name} className="overflow-hidden shadow-sm">
                  <div className={`px-5 py-3 flex items-center justify-between bg-white border-b`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-5 rounded-full ${isPrimary ? "bg-blue-500" : "bg-green-500"}`} />
                      <h3 className="text-sm font-semibold text-gray-800">{name}</h3>
                      <Badge variant="secondary" className="text-[11px] font-normal">{sorted.length}人</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">最高 <span className="font-semibold text-amber-600">{sorted[0]?.points || 0}</span> 分</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => setDetailCenter(name)}
                      >
                        <Maximize2 className="h-3 w-3" />
                        全屏
                      </Button>
                    </div>
                  </div>
                  {top3.length > 0 && <PodiumTop3 top3={top3} router={router} />}
                  <RankingList list={sorted} router={router} maxH="max-h-[280px]" />
                </Card>
              )
            })}
          </div>

          {/* ===== 总排行榜 ===== */}
          {overall.length > 0 && (
            <Card className="overflow-hidden shadow-sm border-amber-200">
              <div className="px-5 py-3 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-800">总排行</h3>
                <Badge className="text-[11px] bg-amber-100 text-amber-700 border-amber-200">{overall.length}人</Badge>
              </div>

              {/* Top 10 horizontal */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-end justify-center gap-3" style={{ minHeight: "140px" }}>
                  {top10.length >= 3 && (
                    <>
                      {/* 2nd */}
                      <div className="text-center flex flex-col items-center cursor-pointer hover:opacity-80"
                        onClick={() => router.push(`/points?studentId=${top10[1]?.id}&name=${encodeURIComponent(top10[1]?.name || "")}`)}>
                        <p className="text-xs font-medium text-gray-500 mb-1 truncate w-16">{top10[1]?.name}</p>
                        <div className="w-14 h-16 bg-gray-100 rounded-t-lg flex items-end justify-center pb-1">
                          <span className="text-xl">🥈</span>
                        </div>
                        <div className="w-14 bg-gray-200 rounded-b-lg py-1 text-center">
                          <p className="text-xs font-bold text-gray-600">{top10[1]?.points || 0}</p>
                        </div>
                      </div>
                      {/* 1st */}
                      <div className="text-center flex flex-col items-center cursor-pointer hover:opacity-80"
                        onClick={() => router.push(`/points?studentId=${top10[0]?.id}&name=${encodeURIComponent(top10[0]?.name || "")}`)}>
                        <p className="text-xs font-bold text-amber-600 mb-1 truncate w-16">🥇 {top10[0]?.name}</p>
                        <div className="w-16 h-24 bg-amber-100 rounded-t-lg flex items-end justify-center pb-1">
                          <span className="text-2xl">👑</span>
                        </div>
                        <div className="w-16 bg-amber-200 rounded-b-lg py-1.5 text-center">
                          <p className="text-sm font-bold text-amber-700">{top10[0]?.points || 0}</p>
                        </div>
                      </div>
                      {/* 3rd */}
                      <div className="text-center flex flex-col items-center cursor-pointer hover:opacity-80"
                        onClick={() => router.push(`/points?studentId=${top10[2]?.id}&name=${encodeURIComponent(top10[2]?.name || "")}`)}>
                        <p className="text-xs font-medium text-gray-500 mb-1 truncate w-16">{top10[2]?.name}</p>
                        <div className="w-14 h-12 bg-orange-50 rounded-t-lg flex items-end justify-center pb-1">
                          <span className="text-lg">🥉</span>
                        </div>
                        <div className="w-14 bg-orange-100 rounded-b-lg py-1 text-center">
                          <p className="text-xs font-bold text-orange-600">{top10[2]?.points || 0}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {top10.length > 3 && (
                  <div className="flex gap-2 mt-4 justify-center flex-wrap">
                    {top10.slice(3).map((s, i) => (
                      <div key={s.id}
                        className="text-center px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors min-w-[80px]"
                        onClick={() => router.push(`/points?studentId=${s.id}&name=${encodeURIComponent(s.name)}`)}>
                        <p className="text-[10px] text-gray-400">#{i + 4}</p>
                        <p className="text-xs font-medium text-gray-700 truncate">{s.name}</p>
                        <p className="text-xs font-bold text-amber-600">{s.points}分</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {overall.length > 10 && (
                <div>
                  <div className="px-5 py-2 bg-gray-50/50 border-b">
                    <span className="text-[11px] text-gray-400">第 11 - {overall.length} 名</span>
                  </div>
                  <RankingList list={overall.slice(10)} router={router} maxH="max-h-[300px]" />
                </div>
              )}
            </Card>
          )}
        </div>
      </PageLayout>
    </>
  )
}
