"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Target } from "lucide-react"
import { useLanguage } from "@/contexts/language-context";

/* ============================================================
   考试目标（幻灯片 widget / 独立页面共用）
   - mode="overview"：全班总览表
   - mode="rotate"  ：每人一屏，自动轮播

   配色跟「成绩管理 / 学生报告」页面保持一致：
     分数 ≥80 → 绿(emerald-600)   50–79 → 深灰(slate-700)   <50 → 红(red-600)
     ≥80 的行加淡绿底；卡片白底 / 边框 slate-200 / 文字 slate
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

/** 分数文字色（与成绩页一致：≥80 绿 / 50–79 深灰 / <50 红） */
const toneText = (v: number | null) =>
  v === null ? "text-slate-300"
    : v >= 80 ? "text-emerald-600"
    : v >= 50 ? "text-slate-700"
    : "text-red-600"

/** 进度条色（同色系） */
const toneBar = (v: number | null) =>
  v === null ? "bg-slate-200"
    : v >= 80 ? "bg-emerald-500"
    : v >= 50 ? "bg-slate-400"
    : "bg-red-500"

/** 均分色（成绩页口径：≥70 绿 / ≥50 灰 / <50 红） */
const avgText = (v: number | null) =>
  v === null ? "text-slate-300"
    : v >= 70 ? "text-emerald-600"
    : v >= 50 ? "text-slate-700"
    : "text-red-600"

export function useExamGoals(refreshMs = 0) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<GoalStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const r = await fetch("/api/exam-targets", { cache: "no-store" })
        const j = await r.json()
        if (!alive) return
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
        if (alive) setError(String(e))
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    if (refreshMs > 0) {
      const t = setInterval(load, refreshMs)
      return () => { alive = false; clearInterval(t) }
    }
    return () => { alive = false }
  }, [refreshMs])

  return { subjects, students, loading, error }
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
              <div className={`text-4xl font-bold mt-2 tabular-nums ${toneText(v)}`}>{v ?? "—"}</div>
              <div className="h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${toneBar(v)}`} style={{ width: `${v ?? 0}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2.5 mt-5 flex-wrap">
        <div className="flex-1 min-w-[150px] rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">{t("七科平均目标")}</div>
          <div className={`text-3xl font-bold tabular-nums mt-0.5 ${avgText(st.avg)}`}>{st.avg ?? "—"}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{t("已填")} {st.filled}/{subjects.length} {t("科")}</div>
        </div>
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

/* ---------------- 全班总览表 ---------------- */
export function GoalsOverview({ students, subjects, limit = 0 }: { students: GoalStudent[]; subjects: Subject[]; limit?: number }) {
  const { t } = useLanguage();
  const list = limit > 0 ? students.slice(0, limit) : students
  return (
    <div className="w-full h-full flex flex-col">
      <div className="grid items-center gap-x-2 pb-2 border-b border-slate-200 text-slate-500 text-sm shrink-0"
        style={{ gridTemplateColumns: `minmax(190px,1.6fr) repeat(${subjects.length}, 1fr) 0.8fr` }}>
        <div className="text-left pl-1">{t("学生")}</div>
        {subjects.map(s => <div key={s.key} className="text-center">{s.abbr}</div>)}
        <div className="text-center">{t("均分")}</div>
      </div>
      <div className="flex-1 overflow-hidden">
        {list.map((st, i) => {
          const allHigh = subjects.every(s => { const v = val(st.scores[s.key]); return v !== null && v >= 80 })
          return (
            <div key={st.id}
              className={`grid items-center gap-x-2 py-[5px] border-b border-slate-100 ${
                allHigh ? "bg-emerald-50/60" : i % 2 ? "bg-slate-50/70" : "bg-white"
              }`}
              style={{ gridTemplateColumns: `minmax(190px,1.6fr) repeat(${subjects.length}, 1fr) 0.8fr` }}>
              <div className="text-left pl-1 min-w-0">
                <div className="text-[15px] font-semibold text-slate-800 truncate">{st.name}</div>
              </div>
              {subjects.map(s => {
                const v = val(st.scores[s.key])
                return (
                  <div key={s.key} className={`text-center text-lg font-semibold tabular-nums ${toneText(v)}`}>
                    {v ?? <span className="font-normal">—</span>}
                  </div>
                )
              })}
              <div className={`text-center text-lg font-bold tabular-nums ${avgText(st.avg)}`}>
                {st.avg ?? <span className="font-normal">—</span>}
              </div>
            </div>
          )
        })}
      </div>
      <div className="pt-2.5 mt-1 border-t border-slate-200 text-[11px] flex flex-wrap gap-x-4 items-center shrink-0">
        <span className="text-emerald-600 font-semibold">80+</span>
        <span className="text-slate-600 font-semibold">50–79</span>
        <span className="text-red-600 font-semibold">{t("50 以下")}</span>
        <span className="text-slate-400">{t("— 尚未填写")}</span>
        <span className="ml-auto text-slate-400">{t("共")} {students.length} {t("人")}</span>
      </div>
    </div>
  )
}

/* ---------------- 幻灯片 widget 出口 ---------------- */
export default function ExamTargetsWidget({
  settings,
}: {
  settings?: { mode?: "rotate" | "overview"; interval?: number; limit?: number; grade?: string }
}) {
  const { t } = useLanguage();
  const mode = settings?.mode || "rotate"
  const intervalMs = Math.max(3, settings?.interval || 7) * 1000
  const { subjects, students, loading, error } = useExamGoals(mode === "rotate" ? 60000 : 0)
  const list = useMemo(
    () => (settings?.grade ? students.filter(s => s.grade === settings.grade) : students),
    [students, settings?.grade]
  )
  const [i, setI] = useState(0)

  useEffect(() => {
    if (mode !== "rotate" || list.length <= 1) return
    const t2 = setInterval(() => setI(p => (p + 1) % list.length), intervalMs)
    return () => clearInterval(t2)
  }, [mode, list.length, intervalMs])

  if (loading) return <div className="h-full grid place-items-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (error) return <div className="h-full grid place-items-center text-red-600 text-sm">{t("加载失败：")}{error}</div>
  if (!list.length) return <div className="h-full grid place-items-center text-slate-400 text-sm">{t("还没有考试目标数据")}</div>

  if (mode === "overview") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-3 shrink-0">
          <Target className="h-4 w-4 text-indigo-500" /><span>{t("考试目标 · 全班总览")}</span>
          <span className="ml-auto text-slate-400 text-xs">{t("每 60 秒自动刷新")}</span>
        </div>
        <div className="flex-1 min-h-0">
          <GoalsOverview students={list} subjects={subjects} limit={settings?.limit || 0} />
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
