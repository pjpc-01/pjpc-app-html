"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react"

const PROXY = "/api/pocketbase-proxy/api/collections/activities/records"

interface Activity {
  id: string
  title: string
  date: string
  center: string
  category: string
  description?: string
}

const CATEGORIES = ["教学", "活动", "假期", "比赛", "其他"]
const WEEKDAYS_SHORT = ["日", "一", "二", "三", "四", "五", "六"]
const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]

const fmtDate = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
const todayStr = () => fmtDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())

export default function ActivitiesPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = todayStr()
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState("")
  const [centerFilter, setCenterFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: "", center: "all", category: "活动", description: "" })

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }
  const goToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    setSelectedDate(null)
  }

  const loadActivities = useCallback(async () => {
    const monthStart = fmtDate(year, month, 1)
    const monthEnd = fmtDate(year, month, new Date(year, month, 0).getDate())
    const filter = `date >= "${monthStart}" && date <= "${monthEnd}"`
    try {
      const res = await fetch(`${PROXY}?filter=${encodeURIComponent(filter)}&sort=date&perPage=200`)
      const data = await res.json()
      setActivities((data?.items || []).map((a: any) => ({
        id: a.id, title: a.title, date: String(a.date).slice(0, 10),
        center: a.center || 'all', category: a.category || '活动', description: a.description,
      })))
      setError("")
    } catch (e) {
      setError("加载活动失败")
    }
  }, [year, month])

  useEffect(() => { loadActivities() }, [loadActivities])

  const grid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDow = firstDay.getDay()
    const totalDays = lastDay.getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const visibleActivities = centerFilter === "all"
    ? activities
    : activities.filter(a => a.center === "all" || a.center === centerFilter)

  const activityMap = useMemo(() => {
    const map: Record<string, Activity[]> = {}
    for (const s of visibleActivities) {
      if (!s.date) continue
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    }
    return map
  }, [visibleActivities])

  const selectedActivities = selectedDate ? (activityMap[selectedDate] || []) : []

  const addActivity = async () => {
    if (!form.title.trim() || !selectedDate) return
    try {
      const res = await fetch(PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), date: selectedDate, center: form.center, category: form.category, description: form.description }),
      })
      const d = await res.json()
      if (d?.id) {
        setDialogOpen(false)
        setForm({ title: "", center: "all", category: "活动", description: "" })
        await loadActivities()
      } else {
        setError(d?.message || "添加失败")
      }
    } catch (e) {
      setError("添加失败")
    }
  }

  const deleteActivity = async (id: string) => {
    try {
      await fetch(`${PROXY}/${id}`, { method: "DELETE" })
      setActivities(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      setError("删除失败")
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">活动管理</h1>
          <p className="text-gray-500 mt-1">按日历管理中心活动</p>
        </div>
        <select
          value={centerFilter}
          onChange={e => setCenterFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border bg-white"
        >
          <option value="all">全部中心</option>
          <option value="PU1">中学（PU1）</option>
          <option value="BATU14">小学（BATU14）</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{year}年{MONTH_NAMES[month - 1]}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-8">今天</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className="flex-1 p-2 sm:p-3">
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS_SHORT.map((d, i) => (
                  <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
                {grid.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="bg-white min-h-[60px] sm:min-h-[80px]" />
                  const dateStr = fmtDate(year, month, day)
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const dayActs = activityMap[dateStr] || []
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`bg-white text-left p-1 sm:p-1.5 min-h-[60px] sm:min-h-[80px] transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${isSelected ? "ring-2 ring-inset ring-primary bg-primary/5" : ""}`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isToday ? "bg-primary text-primary-foreground" : "text-gray-700"}`}>
                        {day}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayActs.slice(0, 3).map(a => (
                          <div key={a.id} className="flex items-center gap-1" title={a.title}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.center === 'all' ? 'bg-amber-400' : 'bg-violet-400'}`} />
                            <span className="text-[10px] text-gray-600 truncate leading-tight">
                              {(a.title || "活动").length > 8 ? (a.title || "活动").slice(0, 8) + "…" : (a.title || "活动")}
                            </span>
                          </div>
                        ))}
                        {dayActs.length > 3 && <span className="text-[10px] text-gray-400">+{dayActs.length - 3} 活动</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 p-3 sm:p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">
                    {selectedDate}
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {new Date(selectedDate).toLocaleDateString("zh-CN", { weekday: "long" })}
                    </span>
                  </h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(null)}><X className="h-3.5 w-3.5" /></Button>
                </div>
                <Button size="sm" onClick={() => setDialogOpen(true)} className="w-full mb-3 h-8 text-xs gap-1">
                  <Plus className="h-3 w-3" />添加活动
                </Button>
                {selectedActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="h-6 w-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">当日无活动</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {selectedActivities.map(a => (
                      <div key={a.id} className="p-2 rounded-lg border bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{a.title}</div>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <Badge variant="secondary" className="text-[9px]">{a.category}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${a.center === 'all' ? "text-amber-600" : "text-blue-600"}`}>
                                {a.center === 'all' ? "全中心" : (a.center === 'PU1' ? "中学PU1" : "小学BATU14")}
                              </Badge>
                              {a.description && <span className="text-[10px] text-gray-400 w-full">{a.description}</span>}
                            </div>
                          </div>
                          <button onClick={() => deleteActivity(a.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> 添加活动
              {selectedDate && <span className="text-sm font-normal text-gray-500">· {selectedDate}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">活动名称</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例如：运动会" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">适用中心</Label>
              <Select value={form.center} onValueChange={v => setForm({ ...form, center: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全中心</SelectItem>
                  <SelectItem value="PU1">中学（PU1）</SelectItem>
                  <SelectItem value="BATU14">小学（BATU14）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">分类</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">备注（可选）</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="补充说明" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={addActivity}><Plus className="h-3 w-3 mr-1" />添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}