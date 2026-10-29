"use client"

import { useEffect, useMemo, useState } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { CodexGridCard, CodexSheet, CodexWatch, type CodexStudent } from "@/components/codex/CodexCard"

const P = "/api/pocketbase-proxy/api/collections/codex_students/records"

/** 学生图鉴（老师/管理员看全部中学学情卡） */
export default function StudentCodexPage() {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const [students, setStudents] = useState<CodexStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [curF, setCurF] = useState("all")
  const [kw, setKw] = useState("")
  const [open, setOpen] = useState<CodexStudent | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`${P}?perPage=200&sort=form,name`)
        if (!r.ok) { setLoading(false); return }
        const d = await r.json()
        if (alive) setStudents((d.items || []) as CodexStudent[])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const forms = useMemo(
    () => [...new Set(students.map(s => Number(s.form) || 0))].filter(Boolean).sort((a, b) => a - b),
    [students]
  )

  const shown = useMemo(() => {
    return students.filter(s => {
      if (curF !== "all" && String(s.form) !== curF) return false
      if (!kw) return true
      const hay = `${s.name} ${s.name_en || ""} ${s.student_id}`.toLowerCase()
      return hay.includes(kw.toLowerCase())
    })
  }, [students, curF, kw])

  return (
    <PageLayout
      title={t("学生图鉴")}
      description={t("中学学情卡：目标、实际、弱点、下一步")}
      userRole={userProfile?.role || "admin"}
      status={t("系统正常")}
      background="bg-gray-50"
      backUrl={userProfile?.role === "teacher" ? "/teacher-workspace" : "/"}
    >
      <div className="codex-wrap">
        <h1 className="codex-h">{t("图鉴")}<small>CODEX · PJPC</small></h1>
        <div className="codex-meta">
          {loading
            ? t("加载中...")
            : `${t("共")} ${students.length} ${t("人")} · ${forms.map(f => `Form ${f} ${students.filter(s => Number(s.form) === f).length} ${t("人")}`).join(" / ")}`}
        </div>

        {!loading && <CodexWatch students={students} />}

        <div className="codex-bar">
          <button className={`codex-tab${curF === "all" ? " on" : ""}`} onClick={() => setCurF("all")}>
            {`${t("全部")} ${students.length} ${t("人")}`}
          </button>
          {forms.map(f => (
            <button key={f} className={`codex-tab${curF === String(f) ? " on" : ""}`} onClick={() => setCurF(String(f))}>
              {`Form ${f}`}
            </button>
          ))}
          <input className="codex-q" value={kw} onChange={e => setKw(e.target.value)} placeholder={t("搜名字 / 学生ID...")} />
        </div>

        {loading ? (
          <div className="codex-lockmsg">{t("加载中...")}</div>
        ) : shown.length === 0 ? (
          <div className="codex-lockmsg">{t("没有符合条件的学生。")}</div>
        ) : (
          <div className="codex-grid">
            {shown.map(s => <CodexGridCard key={s.id} s={s} onClick={() => setOpen(s)} />)}
          </div>
        )}

        <div className="codex-foot">
          {t("目标分是学生自定目标，不是考出来的成绩。等级 Lv ＝ 交卷数累积 EXP，与分数无关。雷达虚线＝目标，实线＝实际。")}
        </div>

        {open && <CodexSheet s={open} onClose={() => setOpen(null)} />}
      </div>
    </PageLayout>
  )
}
