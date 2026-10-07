"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Target, Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context";

/* ============================================================
   考试目标（幻灯片 widget / 独立页面共用）
   - mode="overview"：全班总览表（按 Form 1 → 2 → 3 分组，组标题在名字上面）
   - mode="rotate"  ：每人一屏，自动轮播
   - editable=true：总览表里每格分数可直接改（失焦/回车保存）

   配色：分数 ≥80 → 绿；40–79 → 深灰；**<40 才红**（老板定）
   等级字母 A≥80 B70 C60 D50 E40 F<40（小灰字，跟在分数右边）
   注意：PB 数字字段空值会存成 0，而目标分 0 没有意义 → 0 一律视为「尚未填写」，显示为 —
   ============================================================ */

export type Subject = { key: string; abbr: string; cn: string }
export type GoalStudent = {
  id: string; studentId: string; name: string; grade: string
  term: string; year: number | null; scores: Record<string, number | null>
  avg: number | null; filled: number; note: string
}

/** 0 视为未填 */
const val = (v: number | null | undefined): number | null =>
  v === null || v === undefined || Number(v) === 0 ? null : Number(v)

/** 分数文字色（老板定：<40 才红） */
const toneText = (v: number | null) =>
  v === null ? "text-slate-300"
    : v >= 80 ? "text-emerald-600"
    : v >= 40 ? "text-slate-700"
    : "text-red-600"

/** 进度条色（同色系） */
const toneBar = (v: number | null) =>
  v === null ? "bg-slate-200"
    : v >= 80 ? "bg-emerald-500"
    : v >= 40 ? "bg-slate-400"
    : "bg-red-500"

/** 分数 → 等级字母（A≥80 B70 C60 D50 E40 F<40） */
const gradeLetter = (v: number | null): string =>
  v === null ? "" : v >= 80 ? "A" : v >= 70 ? "B" : v >= 60 ? "C" : v >= 50 ? "D" : v >= 40 ? "E" : "F"

/** 年级排序权重（Form 1 → 2 → 3 → …，其他排最后） */
const gradeRank = (g: string): number => {
  const s = (g || "").toLowerCase()
  if (s.includes("peralihan")) return 0
  const n = s.match(/\d+/)?.[0]
  if (n) return Number(n)
  const zh: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 }
  for (const k in zh) if (s.includes(k)) return zh[k]
  return 99
}

/** 年级中文名 */
const gradeZh = (g: string): string => {
  const s = (g || "").toLowerCase()
  if (s.includes("peralihan")) return "预备班"
  const n = gradeRank(g)
  return n <= 6 ? ["", "中一", "中二", "中三", "中四", "中五", "中六"][n] || "" : ""
}

export function useExamGoals(refreshMs = 0) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<GoalStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/exam-targets", { cache: "no-store" })
      const j = await r.json()
      if (j?.success) {
        setSubjects(j.data.subjects || [])
        setStudents((j.data.students || []).map((s: any) => {
          const vals = (Object.values(s.scores || {}) as (number | null)[]).map(val).filter((x): x is number => x !== null)
          return {
            ...s,
            avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
            filled: vals.length,
          }
        }))
      } else setError(j?.error || "load_failed")
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    if (refreshMs > 0) {
      const t = setInterval(load, refreshMs)
      return () => clearInterval(t)
    }
  }, [load, refreshMs])

  return { subjects, students, loading, error, reload: load }
}

/* ---------------- 单人一屏 ---------------- */
export function StudentGoalCard({ st, subjects }: { st: GoalStudent; subjects: Subject[] }) {
  const { t } = useLanguage();
  const best = useMemo(() => {
    let bi = -1, bv = -1
    subjects.forEach((s, i) => { const v = val(st.scores[s.key]); if (v !== null && v > bv) { bv = v; bi = i } })
    return bi
  }, [st, subjects])
  const worst = useMemo(() => {
    let wi = -1, wv = 999
    subjects.forEach((s, i) => { const v = val(st.scores[s.key]); if (v !== null && v < wv) { wv = v; wi = i } })
    return wi
  }, [st, subjects])

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-4xl font-bold text-slate-900 tracking-tight">{st.name.split(" ")[0]}</span>
        <span className="text-lg text-slate-500">{st.name}</span>
        {st.grade && (
          <span className="text-xs text-slate-500 border border-slate-200 bg-slate-50 rounded-full px-2.5 py-0.5">{t(st.grade)}</span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2.5 mt-6">
        {subjects.map(s => {
          const v = val(st.scores[s.key])
          return (
            <div key={s.key} className="rounded-xl bg-white border border-slate-200 px-2 py-3 text-center shadow-sm">
              <div className="text-sm text-slate-500 font-semibold">{s.abbr}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.cn}</div>
              <div className={`text-4xl font-bold mt-2 tabular-nums ${toneText(v)}`}>
                {v ?? "—"}
                {v !== null && <span className="text-base font-normal ml-1 text-slate-400">{gradeLetter(v)}</span>}
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${toneBar(v)}`} style={{ width: `${v ?? 0}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <div className="flex-1 min-w-[150px] rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">{t("最高目标")}</div>
          <div className="text-3xl font-bold mt-0.5 text-slate-900">
            {best >= 0 ? `${subjects[best].abbr} ${val(st.scores[subjects[best].key])}` : "—"}
          </div>
        </div>
        <div className="flex-1 min-w-[150px] rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">{t("最需加油")}</div>
          <div className="text-3xl font-bold mt-0.5 text-slate-900">
            {worst >= 0 ? `${subjects[worst].abbr} ${val(st.scores[subjects[worst].key])}` : "—"}
          </div>
        </div>
        {st.note && (
          <div className="flex-1 min-w-[150px] rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <div className="text-xs text-amber-700/70">{t("备注")}</div>
            <div className="text-lg font-semibold mt-0.5 text-amber-800">{st.note}</div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 text-[11px] text-slate-400">{t("目标不是枷锁 —— 是每天进步一点的方向")}</div>
    </div>
  )
}

/* ---------------- 全班总览表（按年级分组） ---------------- */
export function GoalsOverview({
  students, subjects, limit = 0, editable = false, onSave, savingKey = "",
}: {
  students: GoalStudent[]; subjects: Subject[]; limit?: number
  editable?: boolean
  onSave?: (studentId: string, subjectKey: string, raw: string) => void
  savingKey?: string
}) {
  const { t } = useLanguage();
  const list = limit > 0 ? students.slice(0, limit) : students
  const cols = `minmax(190px,1.6fr) repeat(${subjects.length}, 1fr)`

  // 按年级分组：Form 1 → 2 → 3 → 其他；组内保持后端给的顺序（年级,姓名）
  const groups = useMemo(() => {
    const m = new Map<string, GoalStudent[]>()
    for (const st of list) {
      const g = st.grade || "（未填年级）"
      if (!m.has(g)) m.set(g, [])
      m.get(g)!.push(st)
    }
    return [...m.entries()].sort((a, b) => gradeRank(a[0]) - gradeRank(b[0]))
  }, [list])

  return (
    <div className="w-full h-full flex flex-col">
      <div className="grid items-center gap-x-2 pb-2 border-b border-slate-200 text-slate-500 text-sm shrink-0"
        style={{ gridTemplateColumns: cols }}>
        <div className="text-left pl-1">{t("学生")}</div>
        {subjects.map(s => <div key={s.key} className="text-center">{s.abbr}</div>)}
      </div>

      <div className={`flex-1 ${editable ? "overflow-y-auto" : "overflow-hidden"}`}>
        {groups.map(([grade, rows]) => (
          <div key={grade}>
            {/* 年级分组标题 */}
            <div className="flex items-center gap-2 bg-slate-100 border-y border-slate-200 px-2 py-[5px]">
              <span className="text-[13px] font-bold text-slate-700 tracking-wide">{grade}</span>
              {gradeZh(grade) && <span className="text-[12px] text-slate-500">{gradeZh(grade)}</span>}
              <span className="text-[11px] text-slate-400 ml-auto">{rows.length} {t("人")}</span>
            </div>
            {rows.map((st, i) => {
              const allHigh = subjects.every(s => { const v = val(st.scores[s.key]); return v !== null && v >= 80 })
              return (
                <div key={st.id}
                  className={`grid items-center gap-x-2 py-[5px] border-b border-slate-100 ${
                    allHigh ? "bg-emerald-50/60" : i % 2 ? "bg-slate-50/70" : "bg-white"
                  }`}
                  style={{ gridTemplateColumns: cols }}>
                  <div className="text-left pl-1 min-w-0">
                    <div className="text-[15px] font-semibold text-slate-800 truncate">{st.name}</div>
                  </div>
                  {subjects.map(s => {
                    const v = val(st.scores[s.key])
                    const busy = savingKey === `${st.id}:${s.key}`
                    if (editable) {
                      return (
                        <div key={s.key} className="flex items-center justify-center">
                          <input
                            key={`${st.id}-${s.key}-${v ?? "e"}`}
                            type="number" min={0} max={100} inputMode="numeric"
                            defaultValue={v ?? ""}
                            placeholder="—"
                            disabled={busy}
                            onBlur={e => onSave?.(st.id, s.key, e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                            className={`w-14 h-8 text-center text-base tabular-nums rounded-md border border-slate-300 bg-white
                              focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
                              ${busy ? "opacity-50" : ""} ${toneText(v)} font-semibold`}
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={s.key} className={`text-center text-lg font-semibold tabular-nums ${toneText(v)}`}>
                        {v ?? <span className="font-normal">—</span>}
                        {v !== null && <span className="text-[10px] ml-0.5 font-normal text-slate-400">{gradeLetter(v)}</span>}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="pt-2.5 mt-1 border-t border-slate-200 text-[11px] flex flex-wrap gap-x-4 items-center shrink-0">
        <span className="text-slate-500">{t("等级")}</span>
        <span className="text-emerald-600 font-semibold">A ≥80</span>
        <span className="text-slate-600">B ≥70</span>
        <span className="text-slate-600">C ≥60</span>
        <span className="text-slate-600">D ≥50</span>
        <span className="text-slate-600">E ≥40</span>
        <span className="text-red-600 font-semibold">F &lt;40</span>
        <span className="text-slate-400">{t("— 尚未填写")}</span>
        <span className="ml-auto text-slate-400">{t("共")} {students.length} {t("人")}</span>
      </div>
    </div>
  )
}

/* ---------------- 幻灯片 widget 出口 ---------------- */
export default function ExamTargetsWidget({
  settings,
  editable = false,
}: {
  settings?: { mode?: "rotate" | "overview"; interval?: number; limit?: number; grade?: string }
  editable?: boolean
}) {
  const { t } = useLanguage();
  const mode = settings?.mode || "rotate"
  const intervalMs = Math.max(3, settings?.interval || 7) * 1000
  const { subjects, students, loading, error, reload } = useExamGoals(mode === "rotate" ? 60000 : 0)
  const list = useMemo(
    () => (settings?.grade ? students.filter(s => s.grade === settings.grade) : students),
    [students, settings?.grade]
  )
  const [i, setI] = useState(0)
  const [savingKey, setSavingKey] = useState("")
  const [savedTick, setSavedTick] = useState(false)
  // —— 总览表分页（幻灯片里自动翻页）——
  const [pageSize, setPageSize] = useState(10)
  const [pg, setPg] = useState(0)

  useEffect(() => {
    if (mode !== "rotate" || list.length <= 1) return
    const t2 = setInterval(() => setI(p => (p + 1) % list.length), intervalMs)
    return () => clearInterval(t2)
  }, [mode, list.length, intervalMs])

  // 每页人数：视口高度换算（表头 34 + 预留 2 个组标题 52，每行 30 保守估），封顶 12
  useEffect(() => {
    const calc = () => {
      const vh = typeof window === "undefined" ? 1080 : window.innerHeight
      setPageSize(Math.max(4, Math.min(10, Math.floor((vh * 0.75 - 86) / 30))))
    }
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  const pageTotal = Math.max(1, Math.ceil(list.length / pageSize))
  useEffect(() => { setPg(0) }, [pageSize, list.length])
  // 幻灯片里自动翻页（编辑态不翻，全部平铺可滚动）
  useEffect(() => {
    if (editable || pageTotal <= 1) return
    const t3 = setInterval(() => setPg(p => (p + 1) % pageTotal), 8000)
    return () => clearInterval(t3)
  }, [editable, pageTotal])

  /** 改一格分数（空 = 清成未填） */
  const handleSave = async (studentId: string, subjectKey: string, raw: string) => {
    const trimmed = String(raw).trim()
    const num = trimmed === "" ? 0 : Math.max(0, Math.min(100, Math.round(Number(trimmed))))
    if (Number.isNaN(num)) return
    const st = students.find(x => x.id === studentId)
    const cur = st ? Number(val(st.scores[subjectKey]) ?? 0) : 0
    if (num === cur) return
    setSavingKey(`${studentId}:${subjectKey}`)
    try {
      const r = await fetch(`/api/exam-targets?id=${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: { [subjectKey]: num } }),
      })
      const j = await r.json()
      if (!j?.success) throw new Error(j?.error || "save_failed")
      setSavedTick(true)
      setTimeout(() => setSavedTick(false), 1800)
    } catch (e) {
      alert(`${t("保存失败")}：${e instanceof Error ? e.message : e}`)
    } finally {
      setSavingKey("")
      await reload()
    }
  }

  if (loading) return <div className="h-full grid place-items-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (error) return <div className="h-full grid place-items-center text-red-600 text-sm">{t("加载失败：")}{error}</div>
  if (!list.length) return <div className="h-full grid place-items-center text-slate-400 text-sm">{t("还没有考试目标数据")}</div>

  if (mode === "overview") {
    const shown = editable ? list : list.slice(pg * pageSize, (pg + 1) * pageSize)
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-3 shrink-0">
          <Target className="h-4 w-4 text-indigo-500" /><span>{t("考试目标 · 全班总览")}</span>
          {editable && <span className="text-[11px] text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">{t("点分数即可改，改完按回车")}</span>}
          {savingKey && <span className="text-[11px] text-slate-400">{t("保存中…")}</span>}
          {savedTick && <span className="text-[11px] text-emerald-600 flex items-center gap-0.5"><Check className="h-3 w-3" />{t("已保存")}</span>}
          {!editable && pageTotal > 1 && (
            <span className="text-[11px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 tabular-nums">
              {t("第")} {pg + 1} / {pageTotal} {t("页")}
            </span>
          )}
          <span className="ml-auto text-slate-400 text-xs">
            {editable ? "" : pageTotal > 1 ? t("每 8 秒翻页") : t("每 60 秒自动刷新")}
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <GoalsOverview
            students={shown} subjects={subjects} limit={editable ? (settings?.limit || 0) : 0}
            editable={editable} onSave={handleSave} savingKey={savingKey}
          />
        </div>
      </div>
    )
  }

  const st = list[i % list.length]
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-3 shrink-0">
        <Target className="h-4 w-4 text-indigo-500" />
        <span>{t("考试目标")}</span>
        <span className="ml-auto tabular-nums text-slate-400">{i + 1} / {list.length}</span>
      </div>
      <div className="flex-1 min-h-0">
        <StudentGoalCard st={st} subjects={subjects} />
      </div>
    </div>
  )
}
