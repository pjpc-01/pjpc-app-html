"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { gradeCanon, gradeLabel } from "@/lib/grades"
import {
  Search,
  CreditCard,
  LogOut,
  Star,
  CalendarDays,
  BookOpen,
  CalendarClock,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context";

// 无操作自动回待机的时间（毫秒）
const IDLE_MS = 45000

const LEAVE_TYPES = [
  { value: "sick", label: "病假" },
  { value: "personal", label: "事假" },
  { value: "emergency", label: "急事假" },
  { value: "other", label: "其他" },
]

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_LABEL: Record<string, string> = {
  Mon: "周一",
  Tue: "周二",
  Wed: "周三",
  Thu: "周四",
  Fri: "周五",
  Sat: "周六",
  Sun: "周日",
}

type Person = {
  id: string
  student_id?: string
  name: string
  grade?: string
  center?: string
}

type StudentView = {
  person: Person
  loading: boolean
  points: number
  avatar?: string
  schedules: any[]
  homework: any[]
  leaves: any[]
}

export default function StudentKioskPage() {
  const { t } = useLanguage();
  const [view, setView] = useState<StudentView | null>(null)
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<Person[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 请假表单
  const [leaveForm, setLeaveForm] = useState({ leave_type: "sick", start_date: "", end_date: "", reason: "" })
  const [submitting, setSubmitting] = useState(false)
  const [leaveMsg, setLeaveMsg] = useState<string | null>(null)

  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noticeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 空闲计时器：无操作自动回待机 ──
  const resetIdle = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current)
    idleRef.current = setTimeout(() => {
      setView(null)
      setNotice(null)
      setSearched(false)
      setResults([])
      setKeyword("")
      setLeaveMsg(null)
    }, IDLE_MS)
  }, [])

  useEffect(() => {
    if (!view) return
    resetIdle()
    const clear = () => { if (idleRef.current) clearTimeout(idleRef.current) }
    return clear
  }, [view?.person, resetIdle])

  // 任何点击 / 按键都重置空闲计时器
  useEffect(() => {
    if (!view) return
    const onAny = () => resetIdle()
    window.addEventListener("click", onAny)
    window.addEventListener("keydown", onAny)
    return () => {
      window.removeEventListener("click", onAny)
      window.removeEventListener("keydown", onAny)
    }
  }, [view, resetIdle])

  const flashNotice = useCallback((msg: string) => {
    setNotice(msg)
    if (noticeRef.current) clearTimeout(noticeRef.current)
    noticeRef.current = setTimeout(() => setNotice(null), 3000)
  }, [])

  // ── 刷卡解析（照 TV 看板的 HID 键盘模式：缓冲字符 + 回车）──
  const handleRawCard = useCallback(async (raw: string) => {
    setNotice(null)
    try {
      const res = await fetch("/api/nfc/tap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_uid: raw }),
      })
      const data = await res.json()
      if (res.ok && data.found && data.person_type === "student") {
        setView({ person: data.person, loading: true, points: 0, schedules: [], homework: [], leaves: [] })
        return
      }
      // 未绑定 / 未注册 / 停挂失 / 教师卡 → 回待机并中文提示（不白屏、不抛错）
      goHome()
      const message = data.person_type === "teacher"
        ? "这是教师卡，请使用学生卡"
        : "这张卡未绑定学生"
      flashNotice(message)
    } catch {
      goHome()
      flashNotice("刷卡失败，请重试")
    }
  }, [flashNotice])

  useEffect(() => {
    let buffer = ""
    let lastTime = 0
    let processing = false

    const onKey = (e: KeyboardEvent) => {
      // 输入框内打字不当作刷卡
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return

      const now = Date.now()
      if (now - lastTime > 1000) buffer = ""
      lastTime = now

      if (e.key === "Enter" || e.key === "NumpadEnter") {
        if (buffer && !processing) {
          processing = true
          const card = buffer
          buffer = ""
          handleRawCard(card)
          setTimeout(() => { processing = false }, 800)
        }
        return
      }
      if (/^[0-9a-zA-Z]$/.test(e.key) && e.key.length === 1) {
        buffer += e.key
        if (buffer.length > 32) buffer = buffer.slice(-32)
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleRawCard])

  // ── 加载当前学生的 积分 / 课表 / 作业 / 请假 ──
  useEffect(() => {
    if (!view?.person) return
    let cancelled = false
    const pid = view.person.id
    const canon = gradeCanon(view.person.grade)

    ;(async () => {
      try {
        const [stuRes, coRes, scRes, hwRes, lvRes] = await Promise.all([
          fetch(`/api/pocketbase-proxy/api/collections/students/records/${pid}?fields=id,name,student_id,grade,points,center,avatar`),
          fetch(`/api/pocketbase-proxy/api/collections/courses/records?perPage=200&fields=id,title,subject,grade_level`),
          fetch(`/api/pocketbase-proxy/api/collections/schedules/records?perPage=300&fields=id,course_id,course_title,day_of_week,start_time,end_time,teacher_name`),
          fetch(`/api/pocketbase-proxy/api/collections/homework/records?perPage=100&fields=id,title,subject,grade,dueDate,status`),
          fetch(`/api/student-leave?student_id=${encodeURIComponent(pid)}&limit=50`),
        ])

        const stu = await stuRes.json().catch(() => ({}))
        const courses = (await coRes.json().catch(() => ({ items: [] }))).items || []
        const scheds = (await scRes.json().catch(() => ({ items: [] }))).items || []
        const hws = (await hwRes.json().catch(() => ({ items: [] }))).items || []
        const lv = await lvRes.json().catch(() => ({ data: [] }))

        const courseIds = new Set(courses.filter((c: any) => gradeCanon(c.grade_level) === canon).map((c: any) => c.id))
        const courseTitle = new Map(courses.map((c: any) => [c.id, c.title]))

        const mySchedules = scheds
          .filter((s: any) => courseIds.has(s.course_id))
          .map((s: any) => ({ ...s, courseTitle: s.course_title || courseTitle.get(s.course_id) || "" }))
          .sort((a: any, b: any) =>
            DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week) ||
            String(a.start_time).localeCompare(String(b.start_time))
          )

        const myHomework = hws.filter((h: any) => h.status === "active" && gradeCanon(h.grade) === canon)

        if (!cancelled) {
          setView(prev => prev
            ? { ...prev, loading: false, points: stu.points ?? 0, avatar: stu.avatar || "", schedules: mySchedules, homework: myHomework, leaves: lv.data || [] }
            : prev)
        }
      } catch {
        if (!cancelled) setView(prev => prev ? { ...prev, loading: false } : prev)
      }
    })()

    return () => { cancelled = true }
  }, [view?.person, refreshKey])

  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {}
    if (view) for (const s of view.schedules) (m[s.day_of_week] = m[s.day_of_week] || []).push(s)
    return m
  }, [view?.schedules])

  const doSearch = async () => {
    const q = keyword.trim()
    if (!q) return
    setSearching(true)
    setResults([])
    setSearched(true)
    try {
      const params = new URLSearchParams({
        perPage: "10",
        filter: `name~"${q}" && status="active"`,
        fields: "id,name,student_id,grade,center",
      })
      const res = await fetch(`/api/pocketbase-proxy/api/collections/students/records?${params}`)
      const d = await res.json()
      const arr = d.items || []
      setResults(arr.map((s: any) => ({
        id: s.id,
        student_id: s.student_id || s.id,
        name: s.name,
        grade: s.grade || "",
        center: s.center || "",
      })))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const openStudent = (p: Person) => {
    setView({ person: p, loading: true, points: 0, schedules: [], homework: [], leaves: [] })
    setResults([])
    setKeyword("")
    setLeaveForm({ leave_type: "sick", start_date: "", end_date: "", reason: "" })
    setLeaveMsg(null)
  }

  const submitLeave = async () => {
    if (!view) return
    if (!leaveForm.start_date || !leaveForm.end_date) {
      setLeaveMsg("请选择开始和结束日期")
      return
    }
    setSubmitting(true)
    setLeaveMsg(null)
    try {
      const res = await fetch("/api/student-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: view.person.id,
          leave_type: leaveForm.leave_type,
          start_date: leaveForm.start_date,
          end_date: leaveForm.end_date,
          reason: leaveForm.reason,
          status: "pending",
        }),
      })
      const d = await res.json()
      if (!res.ok || d.success === false) throw new Error(d.error || "提交失败")
      setLeaveMsg("请假申请已提交，等待处理")
      setLeaveForm({ leave_type: "sick", start_date: "", end_date: "", reason: "" })
      setRefreshKey(k => k + 1)
    } catch (e: any) {
      setLeaveMsg(e.message || "提交失败，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  const goHome = () => {
    setView(null)
    setSearched(false)
    setResults([])
    setKeyword("")
    setNotice(null)
    setLeaveMsg(null)
  }

  // ───────────────────────── 待机态 ─────────────────────────
  if (!view) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-8 pl-10 lg:pl-0">{t("学生自助刷卡")}</h1>

          <div className="text-center mb-8">
            <div className="mx-auto w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <CreditCard className="w-16 h-16 sm:w-24 sm:h-24 text-white" />
            </div>
            <p className="mt-8 text-3xl sm:text-5xl font-black text-gray-800 tracking-widest">{t("请刷卡")}</p>
            <p className="mt-2 text-base sm:text-lg text-gray-500">{t("将 NFC 卡片放在读卡器上")}</p>
          </div>

          {notice && (
            <div className="mx-auto max-w-md mb-6 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-center text-sm sm:text-base font-semibold">
              {notice}
            </div>
          )}

          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t("老师代查")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") doSearch() }}
                  placeholder={t("输入学生姓名或学号")}
                  className="min-w-0 flex-1"
                />
                <Button onClick={doSearch} disabled={searching}>
                  <Search className="h-4 w-4 mr-1 pointer-events-none" />
                  {searching ? "查询中…" : "查询"}
                </Button>
              </div>

              {searching && <p className="mt-3 text-sm text-gray-500">{t("查询中…")}</p>}
              {searched && !searching && (
                <div className="mt-3 space-y-2">
                  {results.length === 0 ? (
                    <p className="text-sm text-gray-500">{t("未找到学生")}</p>
                  ) : (
                    results.slice(0, 10).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => openStudent(s)}
                        className="w-full text-left flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 hover:bg-blue-50 transition"
                      >
                        <span className="font-semibold text-gray-800 min-w-0 truncate">{s.name}</span>
                        <span className="text-xs text-gray-500">
                          {s.student_id}
                          {s.grade ? ` · ${gradeLabel(s.grade)}` : ""}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ───────────────────────── 学生态 ─────────────────────────
  const avatarUrl = view.avatar
    ? `/api/pocketbase-proxy/api/files/students/${view.person.id}/${view.avatar}`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pl-10 lg:pl-0">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800">{t("学生自助刷卡")}</h1>
          <Button variant="outline" onClick={goHome}>
            <LogOut className="h-4 w-4 mr-1 pointer-events-none" />
            {t("完成 / 返回")}
          </Button>
        </div>

        {/* 学生信息头 */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-4 p-4 sm:p-6">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={view.person.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
                {view.person.name.charAt(0) || "生"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xl sm:text-2xl font-black text-gray-800 truncate">{view.person.name}</div>
              <div className="text-sm sm:text-base text-gray-500 mt-1 flex flex-wrap gap-2">
                {view.person.grade ? <Badge variant="secondary">{gradeLabel(view.person.grade)}</Badge> : null}
                {view.person.center ? <Badge variant="outline">{view.person.center}</Badge> : null}
                {view.person.student_id ? <span className="text-gray-400">{view.person.student_id}</span> : null}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl px-6 py-4 text-center flex-shrink-0">
              <div className="text-3xl sm:text-4xl font-black leading-none">{view.loading ? "…" : view.points}</div>
              <div className="text-xs sm:text-sm mt-1 font-semibold">{t("积分")}</div>
            </div>
          </CardContent>
        </Card>

        {view.loading ? (
          <div className="text-center text-gray-500 py-16">{t("加载中…")}</div>
        ) : (
          <Tabs defaultValue="points" className="w-full">
            <TabsList className="flex flex-wrap h-auto w-full justify-start">
              <TabsTrigger value="points"><Star className="h-4 w-4 mr-1 pointer-events-none" />{t("我的积分")}</TabsTrigger>
              <TabsTrigger value="schedule"><CalendarDays className="h-4 w-4 mr-1 pointer-events-none" />{t("我的课表")}</TabsTrigger>
              <TabsTrigger value="homework"><BookOpen className="h-4 w-4 mr-1 pointer-events-none" />{t("我的作业")}</TabsTrigger>
              <TabsTrigger value="leave"><CalendarClock className="h-4 w-4 mr-1 pointer-events-none" />{t("我的请假")}</TabsTrigger>
            </TabsList>

            <TabsContent value="points">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-5xl sm:text-6xl font-black text-orange-600">{view.points}</div>
                  <p className="mt-2 text-gray-500">{t("当前积分")}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {view.schedules.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">{t("暂无课表")}</p>
                  ) : (
                    <div className="space-y-4">
                      {DAY_ORDER.map((day) => {
                        const list = byDay[day]
                        if (!list || list.length === 0) return null
                        return (
                          <div key={day}>
                            <div className="text-sm font-bold text-blue-700 mb-2">{DAY_LABEL[day] || day}</div>
                            <div className="space-y-1.5">
                              {list.map((s) => (
                                <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                  <span className="font-semibold text-gray-700 w-24 flex-shrink-0">
                                    {s.start_time}-{s.end_time}
                                  </span>
                                  <span className="font-medium text-gray-800 min-w-0">{s.courseTitle || "—"}</span>
                                  <span className="text-xs text-gray-500 ml-auto">{s.teacher_name || ""}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="homework">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {view.homework.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">{t("暂无作业")}</p>
                  ) : (
                    <div className="space-y-3">
                      {view.homework.map((h) => (
                        <div key={h.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-800 min-w-0">{h.title}</span>
                            {h.subject ? <Badge variant="secondary">{t(h.subject)}</Badge> : null}
                          </div>
                          {h.dueDate ? (
                            <p className="text-xs text-gray-500 mt-1">{t("截止：")}{String(h.dueDate).slice(0, 10)}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leave">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">{t("提交请假申请")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={leaveForm.leave_type}
                        onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                        className="rounded-lg border px-3 py-2 text-sm"
                      >
                        {LEAVE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <Input
                        type="date"
                        value={leaveForm.start_date}
                        onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        type="date"
                        value={leaveForm.end_date}
                        onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                        className="text-sm"
                      />
                      <Input
                        placeholder={t("请假原因（可选）")}
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Button onClick={submitLeave} disabled={submitting}>
                        {submitting ? "提交中…" : "提交请假"}
                      </Button>
                      {leaveMsg && <span className="text-sm text-blue-700">{leaveMsg}</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-2">{t("请假记录")}</h3>
                    {view.leaves.length === 0 ? (
                      <p className="text-center text-gray-500 py-6">{t("暂无请假记录")}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                          <thead>
                            <tr className="border-b text-left text-gray-500">
                              <th className="py-2 pr-3 font-medium">{t("日期")}</th>
                              <th className="py-2 pr-3 font-medium">{t("类型")}</th>
                              <th className="py-2 font-medium">{t("状态")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {view.leaves.map((l) => (
                              <tr key={l.id} className="border-b">
                                <td className="py-2 pr-3">
                                  {String(l.start_date || "").slice(0, 10)} ~ {String(l.end_date || "").slice(0, 10)}
                                </td>
                                <td className="py-2 pr-3">{LEAVE_TYPES.find((t) => t.value === l.leave_type)?.label || l.leave_type}</td>
                                <td className="py-2">
                                  {l.status === "approved" ? "已批准" : l.status === "rejected" ? "已拒绝" : l.status === "cancelled" ? "已取消" : "待处理"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}