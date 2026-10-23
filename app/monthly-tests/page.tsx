"use client"

/**
 * 安亲班月测成绩录入。
 *
 * 学校的期中/期末在「成绩管理」，这里是安亲班自己每月考的。
 * 选 年 / 月 / 年级 / 中心 → 出「学生 × 科目」表格，填完一次保存。
 * 已经有记录的会覆盖，清空某一格再保存 = 删掉那条。
 */
import { useCallback, useEffect, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { GRADE_CANON_ALL, gradeLabel } from "@/lib/grades"
import { AlertCircle, Save, ClipboardList } from "lucide-react"

type Any_ = Record<string, any>

const now = new Date()

export default function MonthlyTestsPage() {
  const { t } = useLanguage()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [grade, setGrade] = useState("")
  const [center, setCenter] = useState("")

  const [subjects, setSubjects] = useState<string[]>([])
  const [students, setStudents] = useState<Any_[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const key = (sid: string, subj: string) => `${sid}|${subj}`

  const load = useCallback(async () => {
    if (!grade) { setStudents([]); setSubjects([]); setDraft({}); return }
    setLoading(true); setError(""); setMsg("")
    try {
      const qs = new URLSearchParams({ year: String(year), month: String(month), grade })
      if (center) qs.set("center", center)
      const r = await fetch(`/api/monthly-tests?${qs.toString()}`)
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `加载失败（HTTP ${r.status}）`)
      setSubjects(d.subjects || [])
      setStudents(d.students || [])
      const next: Record<string, string> = {}
      for (const s of d.scores || []) {
        if (Number(s.year) === Number(year) && Number(s.month) === Number(month)) {
          next[key(String(s.studentId), String(s.subject))] = s.score === null || s.score === undefined ? "" : String(s.score)
        }
      }
      setDraft(next)
    } catch (e: any) {
      setError(String(e?.message || e))
      setStudents([]); setSubjects([])
    } finally {
      setLoading(false)
    }
  }, [year, month, grade, center])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setBusy(true); setMsg(""); setError("")
    try {
      const rows: Any_[] = []
      for (const s of students) {
        for (const subj of subjects) {
          const v = draft[key(s.id, subj)]
          if (v === undefined) continue
          rows.push({
            studentId: s.id,
            student_name: s.name,
            subject: subj,
            score: v === "" ? null : Number(v),
            center: s.center || center,
          })
        }
      }
      if (rows.length === 0) { setMsg(t("没有要保存的内容")); setBusy(false); return }
      const r = await fetch("/api/monthly-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, center, rows }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || !d?.success) throw new Error(d?.error || `保存失败（HTTP ${r.status}）`)
      setMsg(`${t("已保存")} ${d.saved} ${t("条")}${d.removed ? `，${t("删除")} ${d.removed}` : ""}`)
      await load()
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const filled = students.reduce((acc, s) => acc + subjects.filter((subj) => (draft[key(s.id, subj)] ?? "") !== "").length, 0)
  const totalCells = students.length * subjects.length

  return (
    <PageLayout title={t("安亲班月测成绩")} description={t("安亲班自己每月考的，跟学校的期中期末分开")}>
      <div className="p-4 md:p-6 max-w-6xl space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" />{t("选择月份和年级")}</CardTitle>
            <CardDescription>{t("填完一次保存；清空某格再保存等于删掉那条")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="grid gap-1.5">
                <Label>{t("年份")}</Label>
                <select className="h-9 rounded-md border px-2 text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("月份")}</Label>
                <select className="h-9 rounded-md border px-2 text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m} {t("月")}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("年级")}</Label>
                <select className="h-9 rounded-md border px-2 text-sm" value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">{t("请选择年级")}</option>
                  {GRADE_CANON_ALL.map((g) => <option key={g} value={g}>{gradeLabel(g)}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>{t("中心")}</Label>
                <select className="h-9 rounded-md border px-2 text-sm" value={center} onChange={(e) => setCenter(e.target.value)}>
                  <option value="">{t("全部")}</option>
                  <option value="PU1">PU1</option>
                  <option value="BATU14">BATU14</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" disabled={busy || !grade || students.length === 0} onClick={save}>
                  <Save className="mr-2 h-4 w-4" />{busy ? t("保存中…") : t("保存")}
                </Button>
              </div>
            </div>

            {msg && <p className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">{msg}</p>}
            {error && <p className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}
          </CardContent>
        </Card>

        {loading ? (
          <p className="py-10 text-center text-gray-500">{t("加载中...")}</p>
        ) : !grade ? (
          <Card><CardContent className="py-10 text-center text-sm text-gray-500">{t("先选年级")}</CardContent></Card>
        ) : students.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-gray-500">{t("这个年级没有学生")}</CardContent></Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{gradeLabel(grade)} · {year} {t("年")} {month} {t("月")}</CardTitle>
              <CardDescription>{t("已录")} {filled} / {totalCells}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="sticky left-0 bg-white py-2 pr-2 text-left">{t("学生")}</th>
                      {subjects.map((s) => <th key={s} className="py-2 px-1 text-center">{t(s)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="sticky left-0 bg-white py-1.5 pr-2">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-[11px] text-gray-400">{s.student_id}{s.center ? ` · ${s.center}` : ""}</div>
                        </td>
                        {subjects.map((subj) => (
                          <td key={subj} className="px-1 py-1.5">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={draft[key(s.id, subj)] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value
                                setDraft((prev) => ({ ...prev, [key(s.id, subj)]: v }))
                              }}
                              className="h-8 w-16 text-center text-sm"
                              placeholder="-"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
