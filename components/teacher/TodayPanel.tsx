"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { Clock, CalendarCheck, CheckCircle2, AlertCircle, Megaphone, Users, FileCheck2, RefreshCw } from "lucide-react"

/**
 * 教师工作台「今日待办」。
 *
 * 三件事：今天几节课 / 待批作业 / 今天谁没来，另外一键点名和公告。
 * 数据来自 /api/teacher/today（服务端按登录老师的 teacher_id 取）。
 */
export default function TodayPanel({ teacherId }: { teacherId?: string }) {
  const { t } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 一键点名
  const [rollOpen, setRollOpen] = useState(false)
  const [rollGrade, setRollGrade] = useState("")
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [rollMsg, setRollMsg] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const url = teacherId ? `/api/teacher/today?teacherId=${encodeURIComponent(teacherId)}` : "/api/teacher/today"
      const r = await fetch(url)
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setData(d)
      setError("")
      if (!rollGrade && d.my_grades?.length) setRollGrade(d.my_grades[0])
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [teacherId])

  const studentsOfGrade = (grade: string) => (data?.my_students || []).filter((s: any) => String(s.grade) === grade)

  const markAllPresent = () => {
    const next: Record<string, string> = { ...marks }
    studentsOfGrade(rollGrade).forEach((s: any) => { if (!next[s.id]) next[s.id] = "present" })
    setMarks(next)
  }

  const saveRoll = async () => {
    const list = studentsOfGrade(rollGrade)
    if (!list.length) { setRollMsg(t("这一年级没有学生")); return }
    setSaving(true); setRollMsg("")
    let ok = 0, fail = 0, skipped = 0
    try {
      for (const s of list) {
        const status = marks[s.id] || "present"
        // 缺勤的不打「签到」—— 打了就等于到课。系统有专门的缺勤结算（会按规则扣分），
        // 这里只做到课签到，没签到的由考勤结算按缺勤处理。
        if (status === "absent") { skipped++; continue }
        const r = await fetch("/api/attendance/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person_id: s.id,
            person_type: "student",
            person_name: s.name,
            center: s.center || data?.teacher?.center || "",
            method: "manual",
            notes: `点名 ${rollGrade} ${new Date().toISOString().slice(0, 10)}`,
          }),
        })
        if (r.ok) ok++; else fail++
      }
      setRollMsg(
        `${t("已记录")} ${ok} ${t("人")}${skipped ? `，${t("缺勤")} ${skipped} ${t("人")}（系统到点按缺勤结算）` : ""}${fail ? `，${t("失败")} ${fail} ${t("人")}` : ""}`
      )
      setRollOpen(false)
      setMarks({})
      await load()
    } catch (e: any) {
      setRollMsg(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-sm text-gray-500">{t("加载中...")}</CardContent></Card>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-gray-600 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-orange-500" />{error}</span>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-1" />{t("重试")}</Button>
        </CardContent>
      </Card>
    )
  }

  const today = data?.today || { classes: [] }
  const classes = today.classes || []
  const notices = data?.notices || []

  return (
    <div className="space-y-4">
      {/* 今日待办三行 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" />{t("今日待办")}</CardTitle>
          <CardDescription>{today.weekday_zh} · {today.date}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 今天的课 */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-gray-500" />{t("今天的课")} · {classes.length} {t("节")}
              </span>
              <Button size="sm" variant="outline" onClick={() => { setRollOpen(v => !v); setRollMsg("") }}>
                {rollOpen ? t("收起点名") : t("一键点名")}
              </Button>
            </div>
            {classes.length === 0 ? (
              <p className="text-xs text-gray-500 mt-2">{t("今天没有排课")}</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {classes.map((c: any) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.start_time}–{c.end_time} · {c.course}{c.grade ? ` · ${c.grade}` : ""}</span>
                    <span className="text-xs text-gray-500">{c.room || ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 待批作业 */}
          <div className="rounded-lg border p-3 flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-gray-500" />{t("待批作业")}
              <Badge variant={data?.pending_grading ? "default" : "secondary"} className="text-[10px]">{data?.pending_grading ?? 0}</Badge>
            </span>
            <Link href="/homework" className="text-sm text-blue-600 hover:underline">{t("去批改")}</Link>
          </div>

          {/* 今天没来 */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />{t("今天没来")} · {(data?.absent_today || []).length} {t("人")}
              </span>
              <Link href="/teacher-workspace/attendance" className="text-sm text-blue-600 hover:underline">{t("看考勤")}</Link>
            </div>
            {(data?.absent_today || []).length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {(data.absent_today || []).map((a: any) => a.name).filter(Boolean).join("、")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 一键点名面板 */}
      {rollOpen && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("一键点名")}</CardTitle>
            <CardDescription>{t("选年级 → 默认全部到课，把没来的改成缺勤 → 保存")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <select className="h-9 rounded-md border px-2 text-sm" value={rollGrade} onChange={(e) => { setRollGrade(e.target.value); setMarks({}) }}>
                {(data?.my_grades || []).map((g: string) => <option key={g} value={g}>{g}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={markAllPresent}>{t("全部到课")}</Button>
              <span className="text-xs text-gray-500">{t("共")} {studentsOfGrade(rollGrade).length} {t("人")}</span>
            </div>
            <div className="max-h-72 overflow-auto divide-y rounded-lg border">
              {studentsOfGrade(rollGrade).map((s: any) => {
                const st = marks[s.id] || "present"
                return (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{s.name} <span className="text-xs text-gray-400">{s.student_id}</span></span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setMarks(m => ({ ...m, [s.id]: "present" }))}
                        className={`px-2 py-1 rounded text-xs ${st === "present" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
                      >{t("到课")}</button>
                      <button
                        onClick={() => setMarks(m => ({ ...m, [s.id]: "absent" }))}
                        className={`px-2 py-1 rounded text-xs ${st === "absent" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
                      >{t("缺勤")}</button>
                    </div>
                  </div>
                )
              })}
              {studentsOfGrade(rollGrade).length === 0 && <p className="px-3 py-4 text-sm text-gray-500">{t("这一年级没有学生")}</p>}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveRoll} disabled={saving}>{saving ? t("保存中…") : t("保存点名")}</Button>
              {rollMsg && <span className="text-sm text-gray-600">{rollMsg}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 公告 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4" />{t("公告")}</CardTitle>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? <p className="text-sm text-gray-500 py-2">{t("暂时没有公告")}</p> : (
            <ul className="divide-y">
              {notices.map((n: any) => (
                <li key={n.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{n.title}</p>
                    <span className="text-xs text-gray-400">{String(n.date || "").slice(0, 10)}</span>
                  </div>
                  {n.description && <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{n.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
