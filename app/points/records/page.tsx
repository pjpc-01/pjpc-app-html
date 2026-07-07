"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Star, Building, GraduationCap, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"

interface StudentPoints {
  id: string
  name: string
  points: number
  grade: string
  center: string
  status: string
}

export default function PointsRecordsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const centerParam = searchParams.get("center") || ""

  const [students, setStudents] = useState<StudentPoints[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [centerFilter, setCenterFilter] = useState(centerParam)
  const [centers, setCenters] = useState<{ id: string; code: string; name: string }[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<"name" | "points" | "center" | "grade">("points")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "200", page: String(page) })
      const c = centerFilter || centerParam
      if (c && c !== "all") params.set("center", c)
      const res = await fetch(`/api/points/records?${params}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.students || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error("加载积分记录失败:", err)
    } finally {
      setLoading(false)
    }
  }, [centerFilter, centerParam, page])

  // Fetch centers
  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/centers/records")
      .then(r => r.json())
      .then(d => setCenters(d?.items?.map((c: any) => ({ id: c.id, code: c.code, name: c.name })) || []))
      .catch(() => {})
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // ─── Filtering & Sorting ─────────────────────────

  const filtered = students
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.center.toLowerCase().includes(q) || s.grade.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === "points") cmp = a.points - b.points
      else if (sortField === "name") cmp = a.name.localeCompare(b.name, "zh-CN")
      else if (sortField === "center") cmp = a.center.localeCompare(b.center)
      else if (sortField === "grade") cmp = a.grade.localeCompare(b.grade)
      return sortDir === "desc" ? -cmp : cmp
    })

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(sortDir === "desc" ? "asc" : "desc")
    else { setSortField(field); setSortDir("desc") }
  }

  const totalPoints = filtered.reduce((sum, s) => sum + s.points, 0)
  const avgPoints = filtered.length ? Math.round(totalPoints / filtered.length) : 0

  return (
    <PageLayout
      title="积分记录"
      description={`全部学生积分明细 · ${total} 人`}
      backUrl="/points"
      userRole="admin"
      background="from-amber-50 to-yellow-50"
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: GraduationCap, color: "text-blue-500", label: "学生数", val: filtered.length },
            { icon: Star, color: "text-amber-500", label: "总积分", val: totalPoints },
            { icon: ArrowUpDown, color: "text-green-500", label: "平均分", val: avgPoints },
          ].map((s, i) => (
            <Card key={i} className="border">
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                  <p className="text-lg font-bold">{s.val}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索学生姓名/年级/中心..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <select
            value={centerFilter}
            onChange={e => { setCenterFilter(e.target.value); setPage(1) }}
            className="text-xs border rounded-lg px-3 py-2 h-9 bg-white"
          >
            <option value="">全部分行</option>
            {centers.map(c => (
              <option key={c.id} value={c.code}>{c.name || c.code}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchStudents} className="h-9">
            <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-amber-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">暂无积分记录</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b sticky top-0 z-10">
                      {[
                        { key: "name" as const, label: "学生姓名", w: "" },
                        { key: "points" as const, label: "积分", w: "w-20 text-center" },
                        { key: "grade" as const, label: "年级", w: "w-20 text-center" },
                        { key: "center" as const, label: "分行", w: "w-24 text-center" },
                      ].map(h => (
                        <th key={h.key} className={`text-left px-4 py-2.5 text-xs font-semibold text-gray-500 ${h.w}`}>
                          <button
                            onClick={() => toggleSort(h.key)}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            {h.label}
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => (
                      <tr
                        key={s.id}
                        className={`border-b border-gray-50 hover:bg-amber-50/50 cursor-pointer transition-colors ${
                          s.status !== "active" ? "opacity-50" : ""
                        }`}
                        onClick={() => router.push(`/points?studentId=${s.id}&name=${encodeURIComponent(s.name)}`)}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              s.points >= 100 ? "bg-amber-100 text-amber-700" :
                              s.points > 0 ? "bg-blue-50 text-blue-600" :
                              s.points < 0 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"
                            }`}>
                              {idx + 1}
                            </div>
                            <span className="font-medium text-gray-900">{s.name}</span>
                            {s.status !== "active" && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-orange-500 border-orange-300">停学</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-bold ${
                            s.points > 0 ? "text-amber-600" : s.points < 0 ? "text-red-500" : "text-gray-400"
                          }`}>
                            {s.points > 0 ? "+" : ""}{s.points}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-500 text-xs">{s.grade || "—"}</td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant="secondary" className="text-[10px]">{s.center || "—"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
