"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, GripVertical, Play, Pause, Settings2, ChevronLeft, ChevronRight, LayoutGrid, MonitorPlay, Trophy, Cake, Calendar, Megaphone, X, MoveUp, MoveDown, Palette, Eye, EyeOff } from "lucide-react"
import { LeaderboardList, type LeaderboardStudent } from "@/components/shared/LeaderboardList"

// ─── Types ──────────────────────────────────────────────────────────
interface Student {
  id: string; name: string; points: number; grade: string; center: string; status: string
  dob?: string; student_name?: string; standard?: string
}

interface WidgetConfig {
  id: string
  type: "leaderboard" | "birthdays" | "events" | "announcement"
  title: string
  settings: Record<string, any>
  enabled: boolean
}

interface CenterInfo { code: string; name: string }

type WidgetTypeInfo = {
  type: WidgetConfig["type"]
  label: string
  icon: React.ReactNode
  defaultTitle: string
  defaultSettings: Record<string, any>
}

const WIDGET_TYPES: WidgetTypeInfo[] = [
  { type: "leaderboard", label: "积分排行", icon: <Trophy className="h-4 w-4" />, defaultTitle: "积分排行榜", defaultSettings: { limit: 10 } },
  { type: "birthdays", label: "本月生日", icon: <Cake className="h-4 w-4" />, defaultTitle: "本月寿星", defaultSettings: { showAge: false } },
  { type: "events", label: "活动预告", icon: <Calendar className="h-4 w-4" />, defaultTitle: "活动预告", defaultSettings: { events: [] } },
  { type: "announcement", label: "公告栏", icon: <Megaphone className="h-4 w-4" />, defaultTitle: "公告栏", defaultSettings: { text: "" } },
]

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "w1", type: "leaderboard", title: "积分排行榜", settings: { limit: 10 }, enabled: true },
  { id: "w2", type: "birthdays", title: "本月寿星", settings: { showAge: false }, enabled: true },
  { id: "w3", type: "events", title: "活动预告", settings: { events: [] }, enabled: true },
]

// ─── Main Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <PageLayout title="分行仪表板" description="加载中..." userRole="admin" background="from-slate-50 to-gray-50">
        <div className="text-center py-16"><Loader2 className="h-6 w-6 mx-auto animate-spin text-gray-400" /></div>
      </PageLayout>
    }>
      <DashboardContent />
    </Suspense>
  )
}

// ─── Birthday Widget ────────────────────────────────────────────────
function BirthdayWidget({ students }: { students: Student[] }) {
  const now = new Date()
  const currentMonth = now.getMonth() // 0-indexed

  const birthdays = students
    .filter(s => {
      if (!s.dob) return false
      try {
        const d = new Date(s.dob)
        return d.getMonth() === currentMonth
      } catch { return false }
    })
    .sort((a, b) => {
      try { return new Date(a.dob!).getDate() - new Date(b.dob!).getDate() }
      catch { return 0 }
    })

  if (birthdays.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">本月没有寿星 🎂</p>
  }

  const monthLabel = now.toLocaleDateString("zh-CN", { month: "long" })

  return (
    <div>
      <p className="text-xs text-gray-400 mb-3">{monthLabel} · {birthdays.length} 位寿星</p>
      <div className="space-y-2">
        {birthdays.map(s => {
          const day = s.dob ? new Date(s.dob).getDate() : "?"
          return (
            <div key={s.id} className="flex items-center gap-3 px-3 py-3 hover:bg-pink-50 rounded transition-colors">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎂</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                <p className="text-[11px] text-gray-400">{s.grade}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-pink-500">{day}</p>
                <p className="text-[10px] text-gray-400">日</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Events Widget ──────────────────────────────────────────────────
function EventsWidget({ events, onUpdate }: { events: any[]; onUpdate?: (events: any[]) => void }) {
  const [editing, setEditing] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDate, setNewDate] = useState("")

  const addEvent = () => {
    if (!newTitle.trim()) return
    const updated = [...events, { title: newTitle.trim(), date: newDate || "", id: Date.now().toString() }]
    onUpdate?.(updated)
    setNewTitle("")
    setNewDate("")
    setEditing(false)
  }

  const removeEvent = (id: string) => {
    onUpdate?.(events.filter((e: any) => e.id !== id))
  }

  // Sort by date, upcoming first
  const sorted = [...events].sort((a: any, b: any) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  if (events.length === 0 && !editing) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm mb-2">暂无活动</p>
        {onUpdate && <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(true)}>+ 添加活动</Button>}
      </div>
    )
  }

  return (
    <div>
      {sorted.map((e: any) => {
        const dateStr = e.date ? new Date(e.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }) : ""
        const isUpcoming = e.date && new Date(e.date) >= new Date()
        return (
          <div key={e.id} className="flex items-center gap-3 px-3 py-3 hover:bg-blue-50 rounded transition-colors group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isUpcoming ? "bg-blue-100" : "bg-gray-100"}`}>
              <Calendar className={`h-4 w-4 ${isUpcoming ? "text-blue-500" : "text-gray-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{e.title}</p>
              {dateStr && <p className="text-[11px] text-gray-400">{dateStr}</p>}
            </div>
            {dateStr && (
              <Badge variant={isUpcoming ? "default" : "secondary"} className={`text-[10px] ${isUpcoming ? "bg-blue-100 text-blue-600" : ""}`}>
                {isUpcoming ? "即将" : "已过"}
              </Badge>
            )}
            {onUpdate && (
              <button onClick={() => removeEvent(e.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
      {onUpdate && (
        editing ? (
          <div className="flex items-center gap-2 mt-2 px-2">
            <Input placeholder="活动名称" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-7 text-xs flex-1" />
            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-7 text-xs w-28" />
            <Button size="sm" className="h-7 text-xs" onClick={addEvent}>添加</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>取消</Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="text-xs mt-1 w-full" onClick={() => setEditing(true)}>+ 添加活动</Button>
        )
      )}
    </div>
  )
}

// ─── Announcement Widget ────────────────────────────────────────────
function AnnouncementWidget({ text, onUpdate }: { text: string; onUpdate?: (text: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)

  const save = () => {
    onUpdate?.(draft)
    setEditing(false)
  }

  if (!text && !editing) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm mb-2">暂无公告</p>
        {onUpdate && <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(true)}>+ 写公告</Button>}
      </div>
    )
  }

  return (
    <div>
      {editing ? (
        <div className="space-y-2">
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            className="w-full min-h-[80px] p-2 text-sm border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="输入公告内容..." />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={save}>保存</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setDraft(text); setEditing(false) }}>取消</Button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-lg whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
            {text}
          </div>
          {onUpdate && (
            <button onClick={() => { setDraft(text); setEditing(true) }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/80 rounded p-1 text-gray-400 hover:text-gray-600 transition-all">
              <Settings2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Slideshow Overlay ──────────────────────────────────────────────
function SlideshowOverlay({
  centerName, widgets, students, router, eventsByWidget, announcementsByWidget, onClose
}: {
  centerName: string
  widgets: WidgetConfig[]
  students: Student[]
  router: ReturnType<typeof useRouter>
  eventsByWidget: Record<string, any[]>
  announcementsByWidget: Record<string, string>
  onClose: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const interval = 8000
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const list = widgets.filter(w => w.enabled)
  const current = list[idx] || null
  const centerStudents = students.filter(s => s.center === centerName || s.center === (centerName.includes("中学") ? "PU1" : "BATU14"))

  const go = (dir: 1 | -1) => {
    if (list.length < 2) return
    setIdx(i => (i + dir + list.length) % list.length)
  }

  // Auto-advance
  useEffect(() => {
    if (paused || list.length <= 1) return
    intervalRef.current = setInterval(() => setIdx(i => (i + 1) % list.length), interval)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused, list.length, interval])

  // Keyboard — stable references via refs to avoid dependency churn
  const refOnClose = useRef(onClose)
  refOnClose.current = onClose
  const refGo = useRef(go)
  refGo.current = go
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") refOnClose.current()
      if (e.key === "ArrowRight") refGo.current(1)
      if (e.key === "ArrowLeft") refGo.current(-1)
      if (e.key === " ") { e.preventDefault(); setPaused(p => !p) }
    }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [])

  if (!current) return null

  const renderWidget = (w: WidgetConfig) => {
    switch (w.type) {
      case "leaderboard": {
        const sorted = [...centerStudents].filter(s => s.points > 0).sort((a, b) => b.points - a.points)
        const mapped: LeaderboardStudent[] = sorted.map(s => ({
          id: s.id,
          name: s.name,
          points: s.points,
          center: s.center,
          grade: s.grade,
          student_id: (s as any).student_id || undefined,
        }))
        return <LeaderboardList students={mapped} variant="dark" multiColumn={true} />
      }
      case "birthdays": return <BirthdayWidget students={centerStudents} />
      case "events": return <EventsWidget events={eventsByWidget[w.id] || w.settings.events || []} />
      case "announcement": return <AnnouncementWidget text={announcementsByWidget[w.id] || w.settings.text || ""} />
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 text-white shrink-0">
        <div className="flex items-center gap-3">
          <MonitorPlay className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-semibold">{centerName} · 幻灯片模式</span>
          <Badge className="text-[10px] bg-gray-700 text-gray-300">{idx + 1}/{list.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white h-8 text-xs gap-1"
            onClick={() => setPaused(p => !p)}>
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "继续" : "暂停"}
          </Button>
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white h-8 w-8"
            onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex p-6 min-h-0">
        <div className="w-full flex flex-col min-h-0">
          <div className="text-center mb-4 shrink-0">
            <h1 className="text-lg font-bold text-white">{current.title}</h1>
            <div className="flex justify-center">
              <div className="flex gap-1.5 mt-1">
                {list.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/30"}`} />
                ))}
              </div>
            </div>
          </div>
          <Card className="shadow-2xl border-0 overflow-hidden flex-1 flex flex-col min-h-0">
            <CardContent className="p-6 flex-1 overflow-hidden min-h-0">
              {renderWidget(current)}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Left/right nav — pointer-events-none so they don't block header buttons */}
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white h-10 w-10 rounded-full hover:bg-white/10 pointer-events-auto"
          onClick={() => go(-1)}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white h-10 w-10 rounded-full hover:bg-white/10 pointer-events-auto"
          onClick={() => go(1)}>
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Content ───────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [centers, setCenters] = useState<CenterInfo[]>([])
  const [selectedCenter, setSelectedCenter] = useState<string>("all")

  // Widget state: per-center templates stored as JSON
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [editMode, setEditMode] = useState(false)
  const [slideshow, setSlideshow] = useState(false)

  // Dynamic data for editable widgets (stored per widget id)
  const [eventsByWidget, setEventsByWidget] = useState<Record<string, any[]>>({})
  const [announcementsByWidget, setAnnouncementsByWidget] = useState<Record<string, string>>({})

  // Load from localStorage
  useEffect(() => {
    const key = `dashboard_widgets_${selectedCenter}`
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        setWidgets(parsed.widgets || DEFAULT_WIDGETS)
        setEventsByWidget(parsed.events || {})
        setAnnouncementsByWidget(parsed.announcements || {})
      } else {
        setWidgets(DEFAULT_WIDGETS)
        setEventsByWidget({})
        setAnnouncementsByWidget({})
      }
    } catch {
      setWidgets(DEFAULT_WIDGETS)
    }
  }, [selectedCenter])

  // Save to localStorage
  const saveWidgets = useCallback((w: WidgetConfig[], e: Record<string, any[]>, a: Record<string, string>) => {
    const key = `dashboard_widgets_${selectedCenter}`
    localStorage.setItem(key, JSON.stringify({ widgets: w, events: e, announcements: a }))
    setWidgets(w)
    setEventsByWidget(e)
    setAnnouncementsByWidget(a)
  }, [selectedCenter])

  // Fetch centers
  useEffect(() => {
    fetch("/api/pocketbase-proxy/api/collections/centers/records")
      .then(r => r.json())
      .then(d => {
        const items = d?.items || []
        setCenters(items.map((c: any) => ({ code: c.code, name: c.name || c.code })))
        if (items.length > 0 && selectedCenter === "all") {
          setSelectedCenter(items[0].code)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch students
  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/points/records?limit=500")
      const data = await res.json()
      if (data.success) {
        const all = (data.students || []).filter((s: Student) => s.status === "active")
        // Also fetch detailed student list for birthdays
        const detailRes = await fetch("/api/students/list?limit=500")
        const detailData = await detailRes.json()
        if (detailData.success && detailData.students) {
          // Merge dob into points data
          const dobMap: Record<string, string> = {}
          for (const ds of detailData.students) {
            if (ds.student_name && ds.dob) {
              // Find matching student by name
              const match = all.find((s: Student) =>
                s.name === ds.student_name || s.name.toLowerCase() === ds.student_name?.toLowerCase()
              )
              if (match) dobMap[match.id] = ds.dob
            }
          }
          setStudents(all.map((s: Student) => ({ ...s, dob: dobMap[s.id] || (s as any).dob })))
        } else {
          setStudents(all)
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // Center filter
  const centerStudents = selectedCenter === "all"
    ? students
    : students.filter(s => s.center === selectedCenter ||
        (selectedCenter === "PU1" && (s.center === "中学（PU1）" || s.center === "PU1")) ||
        (selectedCenter === "BATU14" && (s.center === "小学（BATU14）" || s.center === "BATU14")))

  // Widget management
  const addWidget = (type: WidgetConfig["type"]) => {
    const info = WIDGET_TYPES.find(t => t.type === type)!
    const newWidget: WidgetConfig = {
      id: `w_${Date.now()}`,
      type,
      title: info.defaultTitle,
      settings: { ...info.defaultSettings },
      enabled: true,
    }
    saveWidgets([...widgets, newWidget], eventsByWidget, announcementsByWidget)
  }

  const removeWidget = (id: string) => {
    const newEvents = { ...eventsByWidget }; delete newEvents[id]
    const newAnnouncements = { ...announcementsByWidget }; delete newAnnouncements[id]
    saveWidgets(widgets.filter(w => w.id !== id), newEvents, newAnnouncements)
  }

  const toggleWidget = (id: string) => {
    saveWidgets(
      widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w),
      eventsByWidget, announcementsByWidget
    )
  }

  const moveWidget = (id: string, direction: "up" | "down") => {
    const idx = widgets.findIndex(w => w.id === id)
    if (idx < 0) return
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= widgets.length) return
    const copy = [...widgets];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
    saveWidgets(copy, eventsByWidget, announcementsByWidget)
  }

  const updateWidgetTitle = (id: string, title: string) => {
    saveWidgets(widgets.map(w => w.id === id ? { ...w, title } : w), eventsByWidget, announcementsByWidget)
  }

  const updateWidgetSetting = (id: string, key: string, value: any) => {
    saveWidgets(
      widgets.map(w => w.id === id ? { ...w, settings: { ...w.settings, [key]: value } } : w),
      eventsByWidget, announcementsByWidget
    )
  }

  const renderWidgetContent = (w: WidgetConfig) => {
    switch (w.type) {
      case "leaderboard": {
        const sorted = [...centerStudents].filter(s => s.points > 0).sort((a, b) => b.points - a.points)
        const mapped: LeaderboardStudent[] = sorted.map(s => ({
          id: s.id,
          name: s.name,
          points: s.points,
          center: s.center,
          grade: s.grade,
          student_id: (s as any).student_id || undefined,
        }))
        return <LeaderboardList students={mapped} variant="light" />
      }
      case "birthdays":
        return <BirthdayWidget students={centerStudents} />
      case "events":
        return <EventsWidget
          events={eventsByWidget[w.id] || w.settings.events || []}
          onUpdate={editMode ? (events) => { setEventsByWidget(prev => ({ ...prev, [w.id]: events })); saveWidgets(widgets, { ...eventsByWidget, [w.id]: events }, announcementsByWidget) } : undefined}
        />
      case "announcement":
        return <AnnouncementWidget
          text={announcementsByWidget[w.id] || w.settings.text || ""}
          onUpdate={editMode ? (text) => { setAnnouncementsByWidget(prev => ({ ...prev, [w.id]: text })); saveWidgets(widgets, eventsByWidget, { ...announcementsByWidget, [w.id]: text }) } : undefined}
        />
      default:
        return null
    }
  }

  const getWidgetIcon = (type: WidgetConfig["type"]) => {
    const info = WIDGET_TYPES.find(t => t.type === type)
    return info?.icon || <LayoutGrid className="h-3.5 w-3.5" />
  }

  const centerName = centers.find(c => c.code === selectedCenter)?.name || selectedCenter

  const enabledWidgets = widgets.filter(w => w.enabled)

  if (loading) {
    return (
      <PageLayout title="分行仪表板" description="加载中..." userRole="admin" background="from-slate-50 to-gray-50">
        <div className="text-center py-16"><Loader2 className="h-6 w-6 mx-auto animate-spin text-gray-400" /></div>
      </PageLayout>
    )
  }

  return (
    <>
      {/* Slideshow overlay */}
      {slideshow && (
        <SlideshowOverlay
          centerName={centerName}
          widgets={widgets}
          students={students}
          router={router}
          eventsByWidget={eventsByWidget}
          announcementsByWidget={announcementsByWidget}
          onClose={() => setSlideshow(false)}
        />
      )}

      <PageLayout
        title="分行仪表板"
        description={`${centerStudents.length} 名学生 · ${enabledWidgets.length} 个组件`}
        userRole="admin"
        background="from-slate-50 to-gray-50"
      >
        <div className="space-y-4">
          {/* Top bar: center selector + actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Center tabs */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 flex-1 min-w-0 overflow-x-auto">
              {centers.map(c => (
                <button key={c.code}
                  onClick={() => setSelectedCenter(c.code)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${selectedCenter === c.code ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                  {c.name}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant={editMode ? "default" : "outline"} size="sm" className="h-8 text-xs gap-1"
                onClick={() => setEditMode(!editMode)}>
                <Settings2 className="h-3 w-3" />
                {editMode ? "完成" : "编辑"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1"
                onClick={() => setSlideshow(true)} disabled={enabledWidgets.length === 0}>
                <MonitorPlay className="h-3 w-3" />
                幻灯片
              </Button>
            </div>
          </div>

          {/* Edit mode: add widget buttons */}
          {editMode && (
            <div className="flex items-center gap-2 flex-wrap p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <span className="text-xs text-gray-400 mr-1">添加组件：</span>
              {WIDGET_TYPES.map(t => (
                <Button key={t.type} variant="ghost" size="sm" className="h-7 text-xs gap-1 bg-white border"
                  onClick={() => addWidget(t.type)}>
                  {t.icon}{t.label}
                </Button>
              ))}
            </div>
          )}

          {/* Widget grid */}
          {enabledWidgets.length === 0 ? (
            <div className="text-center py-20">
              <LayoutGrid className="h-10 w-10 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 mb-2">还没有组件</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditMode(true)}>编辑并添加组件</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {widgets.filter(w => w.enabled).map((w, idx) => (
                <Card key={w.id} className={`overflow-hidden shadow-sm ${editMode ? "ring-1 ring-blue-200" : ""} ${idx === 0 && widgets.filter(w => w.enabled).length % 2 === 1 ? "lg:col-span-2" : ""}`}>
                  {/* Widget header */}
                  <div className="px-4 py-3 flex items-center justify-between bg-white border-b">
                    <div className="flex items-center gap-2">
                      {editMode && <GripVertical className="h-3.5 w-3.5 text-gray-300" />}
                      <span className="text-gray-500">{getWidgetIcon(w.type)}</span>
                      {editMode ? (
                        <input
                          value={w.title}
                          onChange={e => updateWidgetTitle(w.id, e.target.value)}
                          className="text-sm font-semibold bg-transparent border-b border-dashed border-gray-200 outline-none text-gray-700"
                        />
                      ) : (
                        <h3 className="text-sm font-semibold text-gray-700">{w.title}</h3>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{WIDGET_TYPES.find(t => t.type === w.type)?.label}</Badge>
                    </div>
                    {editMode && (
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveWidget(w.id, "up")} className="p-1 text-gray-300 hover:text-gray-600"><MoveUp className="h-3 w-3" /></button>
                        <button onClick={() => moveWidget(w.id, "down")} className="p-1 text-gray-300 hover:text-gray-600"><MoveDown className="h-3 w-3" /></button>
                        <button onClick={() => toggleWidget(w.id)} className="p-1 text-gray-300 hover:text-gray-600"><EyeOff className="h-3 w-3" /></button>
                        <button onClick={() => removeWidget(w.id)} className="p-1 text-gray-300 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                  {/* Widget content */}
                  <CardContent className="p-4">
                    {editMode && w.type === "leaderboard" && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] text-gray-400">显示数量：</span>
                        {[5, 10, 15, 20].map(n => (
                          <button key={n}
                            onClick={() => updateWidgetSetting(w.id, "limit", n)}
                            className={`text-[10px] px-2 py-0.5 rounded ${w.settings.limit === n ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                    {renderWidgetContent(w)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Disabled widgets (edit mode only) */}
          {editMode && widgets.filter(w => !w.enabled).length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">已隐藏的组件：</p>
              <div className="flex gap-2 flex-wrap">
                {widgets.filter(w => !w.enabled).map(w => (
                  <Badge key={w.id} variant="outline" className="cursor-pointer gap-1 text-[11px] py-1"
                    onClick={() => toggleWidget(w.id)}>
                    <Eye className="h-3 w-3" />{w.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  )
}
