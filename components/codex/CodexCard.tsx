"use client"
import { useLanguage } from "@/contexts/language-context";

/**
 * 学生图鉴 CODEX —— 卡牌逻辑与渲染（老师端的网格、学生端的单卡都用这一份）
 * 数据来自 PocketBase 集合 codex_students（字段：student_id/name/name_en/form/centre/targets/observe/scores/role）
 */

export const SUBJECTS = ["马来文", "英文", "华文", "数学", "科学", "历史", "地理"]
const ANG = SUBJECTS.map((_, i) => -90 + i * (360 / SUBJECTS.length))
const FCOL: Record<number, string> = { 1: "#4ea1ff", 2: "#f5b93b", 3: "#5be49b", 4: "#c88bff", 5: "#c88bff" }

export interface CodexScore {
  sub: string
  got: number
  max: number
  label?: string
  confidence?: string
  source?: string
}

export interface CodexObserve {
  likes?: [string, string][]
  traits?: string[]
  weak?: string
  advice?: string[]
  notes?: string[]
}

export interface CodexStudent {
  id: string
  student_id: string
  name: string
  name_en?: string
  form: number
  centre?: string
  targets?: Record<string, number>
  observe?: CodexObserve | null
  scores?: CodexScore[]
  role?: string | null
}

/* ---------- 等级：交卷数累积 EXP ---------- */
const EXP_PER_PAPER = 40
const LV_TH = [0, 30, 90, 180, 300, 450, 630, 840, 1080, 1350, 1650, 1980, 2340, 2730, 3150]
export function expOf(s: CodexStudent) { return (s.scores || []).length * EXP_PER_PAPER }
export function needFor(n: number) {
  return n - 1 < LV_TH.length ? LV_TH[n - 1] : LV_TH[LV_TH.length - 1] + (n - LV_TH.length) * 450
}
export function lvOfExp(e: number) { let n = 1; while (needFor(n + 1) <= e && n < 30) n++; return n }
export function titleOf(n: number) {
  return n >= 10 ? "LEGEND 传说" : n >= 8 ? "MASTER 大师" : n >= 6 ? "ELITE 精锐"
    : n >= 4 ? "ADEPT 熟练" : n >= 2 ? "APPRENTICE 学徒" : "ROOKIE 见习"
}
export function expPct(e: number) {
  const L = lvOfExp(e), c = needFor(L), x = needFor(L + 1)
  return Math.max(0, Math.min(100, ((e - c) / (x - c)) * 100))
}

/* ---------- 实际成绩：该科得分率平均 ---------- */
export function actual(s: CodexStudent) {
  const agg: Record<string, [number, number]> = {}
  ;(s.scores || []).forEach(r => {
    if (!agg[r.sub]) agg[r.sub] = [0, 0]
    agg[r.sub][0] += Number(r.got) || 0
    agg[r.sub][1] += Number(r.max) || 0
  })
  const out: Record<string, number> = {}
  Object.keys(agg).forEach(k => { out[k] = agg[k][1] ? Math.round((agg[k][0] / agg[k][1]) * 100) : 0 })
  return out
}

export type Judge = { t: string; c: "none" | "bad" | "warn" | "ok" | "up"; d?: number }
export function judge(a?: number, t?: number): Judge {
  if (a === undefined) return { t: "无成绩", c: "none" }
  if (t === undefined) return { t: "无目标", c: "none" }
  const d = a - t
  if (d <= -15) return { t: "重点补", c: "bad", d }
  if (d < 0) return { t: "偏弱", c: "warn", d }
  if (d <= 10) return { t: "达标", c: "ok", d }
  return { t: "可加快", c: "up", d }
}

export function summary(s: CodexStudent) {
  const a = actual(s), t = s.targets || {}
  let bad = 0, ok = 0, up = 0, tested = 0
  SUBJECTS.forEach(k => {
    const a1 = a[k]
    if (a1 === undefined) return
    tested++
    const j = judge(a1, t[k])
    if (j.c === "bad") bad++
    else if (j.c === "ok") ok++
    else if (j.c === "up") up++
  })
  return { bad, ok, up, tested }
}

/* ---------- 职业：看目标偏哪一系 ---------- */
export function vacOf(s: CodexStudent) {
  const t = s.targets || {}
  if (!Object.keys(t).length) return "未定职 ???"
  const g = (ks: string[]) => {
    const v = ks.filter(k => t[k] !== undefined)
    return v.length ? v.reduce((a, k) => a + t[k], 0) / v.length : null
  }
  const lang = g(["马来文", "英文", "华文"]), sci = g(["数学", "科学"]), arts = g(["历史", "地理"])
  const arr = ([[lang, "语文系 LANG"], [sci, "理工系 SCI-TECH"], [arts, "文科系 ARTS"]] as [number | null, string][])
    .filter(x => x[0] !== null)
  if (!arr.length) return "未定职 ???"
  arr.sort((x, y) => (y[0] as number) - (x[0] as number))
  if (arr.length > 1 && ((arr[0][0] as number) - (arr[arr.length - 1][0] as number)) < 8) return "均衡系 BALANCED"
  return arr[0][1]
}

/* ---------- 段位：最近 5 份实际成绩 ---------- */
const RANKS: [string, number][] = [["王者 KING", 95], ["钻石 DIAMOND", 85], ["铂金 PLATINUM", 70], ["黄金 GOLD", 55], ["白银 SILVER", 40], ["青铜 BRONZE", 0]]
export function rankOf(s: CodexStudent): { t: string; v: number | null } {
  const sc = (s.scores || []).slice(-5)
  if (!sc.length) return { t: "未定级", v: null }
  const avg = sc.reduce((a, r) => a + (Number(r.got) / (Number(r.max) || 1)) * 100, 0) / sc.length
  const tag = sc.length < 3 ? "（暂定）" : ""
  for (const r of RANKS) if (avg >= r[1]) return { t: r[0] + tag, v: Math.round(avg) }
  return { t: "青铜 BRONZE" + tag, v: Math.round(avg) }
}

/* ---------- 雷达 ---------- */
function xy(cx: number, cy: number, r: number, i: number) {
  const A = (ANG[i] * Math.PI) / 180
  return [cx + Math.cos(A) * r, cy + Math.sin(A) * r] as [number, number]
}

export function CodexRadar({ s, size, gid }: { s: CodexStudent; size: number; gid: string }) {
  const { t } = useLanguage();
  const cx = size / 2, cy = size / 2, R = size * 0.325
  const col = FCOL[s.form] || "#888"
  const a = actual(s), tg = s.targets || {}
  const paths: React.ReactNode[] = []

  for (let k = 1; k <= 4; k++) {
    const pts = ANG.map((_, i) => xy(cx, cy, (R * k) / 4, i).map(n => n.toFixed(1)).join(",")).join(" ")
    paths.push(<polygon key={`g${k}`} points={pts} fill="none" stroke={`rgba(255,255,255,${k === 4 ? ".15" : ".065"})`} strokeWidth={1} />)
  }
  ANG.forEach((_, i) => {
    const p = xy(cx, cy, R, i)
    const miss = a[SUBJECTS[i]] === undefined && tg[SUBJECTS[i]] === undefined
    paths.push(<line key={`ax${i}`} x1={cx} y1={cy} x2={p[0].toFixed(1)} y2={p[1].toFixed(1)}
      stroke={`rgba(255,255,255,${miss ? ".08" : ".16"})`} strokeWidth={1} strokeDasharray={miss ? "3 4" : undefined} />)
  })

  const tidx = SUBJECTS.map((k, i) => (tg[k] !== undefined ? i : -1)).filter(i => i >= 0)
  if (tidx.length >= 3) {
    const pts = tidx.map(i => { const p = xy(cx, cy, (R * Math.max(3, tg[SUBJECTS[i]])) / 100, i); return `${p[0].toFixed(1)},${p[1].toFixed(1)}` }).join(" ")
    paths.push(<polygon key="tgt" points={pts} fill="none" stroke="rgba(255,255,255,.42)" strokeWidth={1.6} strokeDasharray="5 4" />)
  } else {
    tidx.forEach(i => {
      const p = xy(cx, cy, (R * Math.max(4, tg[SUBJECTS[i]])) / 100, i)
      paths.push(<line key={`tl${i}`} x1={cx} y1={cy} x2={p[0].toFixed(1)} y2={p[1].toFixed(1)} stroke="rgba(255,255,255,.4)" strokeWidth={2} strokeDasharray="4 3" />)
    })
  }

  const aidx = SUBJECTS.map((k, i) => (a[k] !== undefined ? i : -1)).filter(i => i >= 0)
  if (aidx.length >= 3) {
    const pts = aidx.map(i => { const p = xy(cx, cy, (R * Math.max(4, a[SUBJECTS[i]])) / 100, i); return `${p[0].toFixed(1)},${p[1].toFixed(1)}` }).join(" ")
    paths.push(<polygon key="act" points={pts} fill={`url(#${gid})`} stroke={col} strokeWidth={2} strokeLinejoin="round" />)
  } else {
    aidx.forEach(i => {
      const p = xy(cx, cy, (R * Math.max(6, a[SUBJECTS[i]])) / 100, i)
      paths.push(<line key={`al${i}`} x1={cx} y1={cy} x2={p[0].toFixed(1)} y2={p[1].toFixed(1)} stroke={col} strokeWidth={3} strokeLinecap="round" />)
    })
  }
  aidx.forEach(i => {
    const p = xy(cx, cy, (R * Math.max(4, a[SUBJECTS[i]])) / 100, i)
    paths.push(<circle key={`c${i}`} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={size > 200 ? 3 : 2} fill={col} />)
  })
  if (!aidx.length && !tidx.length) {
    paths.push(<text key="lock" x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fill="#4a5568" letterSpacing={2}>{t("未解锁")}</text>)
  }

  const fs = size > 200 ? 10.5 : 8.6
  ANG.forEach((deg, i) => {
    const p = xy(cx, cy, R * 1.29, i), ca = Math.cos((deg * Math.PI) / 180)
    const anc = Math.abs(ca) < 0.2 ? "middle" : ca > 0 ? "start" : "end"
    const has = a[SUBJECTS[i]] !== undefined || tg[SUBJECTS[i]] !== undefined
    paths.push(<text key={`sn${i}`} x={p[0].toFixed(1)} y={(p[1] - 1).toFixed(1)} textAnchor={anc} fontSize={fs}
      fill={has ? "#aab6cb" : "#5d6b82"}>{SUBJECTS[i]}</text>)
    if (size > 200) {
      const at = a[SUBJECTS[i]], tt = tg[SUBJECTS[i]]
      const txt = (at === undefined ? "—" : at) + (tt !== undefined ? ` /${tt}` : "")
      paths.push(<text key={`sv${i}`} x={p[0].toFixed(1)} y={(p[1] + fs + 2).toFixed(1)} textAnchor={anc} fontSize={fs - 0.8}
        fontWeight={700} fill={at === undefined ? "#3a4354" : col}>{txt}</text>)
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0%" stopColor={col} stopOpacity={0.5} />
          <stop offset="100%" stopColor={col} stopOpacity={0.12} />
        </radialGradient>
      </defs>
      {paths}
    </svg>
  )
}

/* ---------- 网格卡 ---------- */
export function CodexGridCard({ s, onClick }: { s: CodexStudent; onClick: () => void }) {
  const { t } = useLanguage();
  const col = FCOL[s.form] || "#888"
  const exp = expOf(s), lvl = lvOfExp(exp), sm = summary(s)
  const chips: React.ReactNode[] = []
  if (sm.tested === 0) chips.push(<span key="u" className="codex-chip">{t("未测")}</span>)
  else {
    chips.push(<span key="t" className="codex-chip">{`已测 ${sm.tested}/7`}</span>)
    if (sm.bad) chips.push(<span key="b" className="codex-chip bad">{`待补 ${sm.bad}`}</span>)
    if (sm.ok) chips.push(<span key="o" className="codex-chip ok">{`达标 ${sm.ok}`}</span>)
    if (sm.up) chips.push(<span key="p" className="codex-chip up">{`可加快 ${sm.up}`}</span>)
  }
  if (!(s.targets && Object.keys(s.targets).length)) chips.push(<span key="n" className="codex-chip">{t("未填目标")}</span>)
  const rk = rankOf(s)

  return (
    <article className={`codex-card${(s.scores || []).length ? "" : " empty"}`}
      style={{ ["--ac" as string]: col }} onClick={onClick}>
      <div className="codex-crow">
        <div className="codex-ava">{s.name.charAt(0)}</div>
        <div className="codex-nm">{s.name}<small>{s.name_en}</small></div>
        <div className="codex-fb">{`F${s.form}`}</div>
      </div>
      <div className={`codex-role${s.role ? " fun" : ""}`}>{s.role || "未观察 · UNSEEN"}</div>
      <div className="codex-vacrow">
        <span className="codex-vac">{vacOf(s)}</span>
        <span className="codex-vac rank">{rk.t}</span>
      </div>
      <div className="codex-mini"><CodexRadar s={s} size={138} gid={`m-${s.id}`} /></div>
      <div className="codex-lvrow">
        {exp === 0 ? <><b className="q">LV 1</b><span>{t("未交卷")}</span></> : <><b>{`Lv ${lvl}`}</b><span>{titleOf(lvl).split(" ")[1]}</span></>}
      </div>
      <div className="codex-expbar"><i style={{ width: `${expPct(exp)}%` }} /></div>
      <div className="codex-exptxt">{`EXP `}<b>{exp}</b>{` / ${needFor(lvl + 1)} · ${(s.scores || []).length} 份`}</div>
      <div className="codex-chips">{chips}</div>
    </article>
  )
}

/* ---------- 详情卡 ---------- */
export function CodexSheet({ s, onClose, inline }: { s: CodexStudent; onClose?: () => void; inline?: boolean }) {
  const { t } = useLanguage();
  const col = FCOL[s.form] || "#888"
  const a = actual(s), tg = s.targets || {}
  const exp = expOf(s), lvl = lvOfExp(exp), sm = summary(s), rk = rankOf(s)
  const o = s.observe

  const body = (
      <div className="codex-sheet" style={{ ["--ac" as string]: col, ...(inline ? { maxHeight: "none", boxShadow: "none" } : {}) }}>
        {!inline && <button className="codex-sx" onClick={onClose}>×</button>}
        <div className="codex-shead">
          <div className="codex-sav">{s.name.charAt(0)}</div>
          <div>
            <div className="codex-sname">{s.name}<small>{s.name_en}</small></div>
            <div className="codex-sid">{s.student_id}</div>
            <div className="codex-srole">
              {`${s.role || "未观察 · UNSEEN"}　·　${vacOf(s)}　·　${rk.t}`}
              {rk.v !== null ? `（近 5 份均分 ${rk.v}%）` : ""}
            </div>
          </div>
          <div className="codex-sf">
            <div className="badge">{`FORM ${s.form} · ${s.centre || ""}`}</div>
            <div className="lvb">
              {(s.scores || []).length === 0
                ? <><b className="codex-q3">LV 1</b><span> {t("未交卷")}</span></>
                : <><b>{`Lv ${lvl}`}</b><span> {titleOf(lvl)}</span></>}
            </div>
          </div>
        </div>

        <div className="codex-cols">
          <div className="codex-colL">
            <div className="codex-blk">
              <div className="codex-bt">{t("喜好 // LIKES")}</div>
              <div className="codex-kv">
                {o && o.likes && o.likes.length
                  ? o.likes.map((r, i) => (
                    <div key={i} style={{ display: "contents" }}>
                      <div className="k">{r[0]}</div>
                      <div>{r[1] === "???" ? <span className="codex-q3">???</span> : r[1]}</div>
                    </div>
                  ))
                  : <><div className="k">{t("资料")}</div><div className="codex-q3">???</div></>}
              </div>
            </div>
            <div className="codex-blk">
              <div className="codex-bt">{t("性格 // TRAITS")}</div>
              <div className="codex-tags">
                {o && o.traits && o.traits.length
                  ? o.traits.map((x, i) => <span key={i} className="codex-tag">{x}</span>)
                  : <span className="codex-tag">???</span>}
              </div>
            </div>
            <div className="codex-blk">
              <div className="codex-bt">{t("已练过的卷子 // COVERED")}</div>
              {(s.scores || []).length
                ? <div className="codex-tags">
                  {[...new Set((s.scores || []).map(r => r.label || "未命名"))].map((l, i) => <span key={i} className="codex-tag">{l}</span>)}
                </div>
                : <div className="codex-lockmsg">{t("还没练过任何卷子。")}</div>}
            </div>
          </div>

          <div className="codex-colR">
            <div className="codex-bt">{t("七科对照 // TARGET vs ACTUAL")}</div>
            <div className="codex-radarleg">
              <span><i style={{ borderColor: "rgba(255,255,255,.5)", borderTopStyle: "dashed" }} />{t("目标")}</span>
              <span><i style={{ borderColor: col }} />{t("实际")}</span>
            </div>
            <div className="codex-radarbox"><CodexRadar s={s} size={250} gid={`p-${s.id}`} /></div>
            <div className="codex-expbar" style={{ margin: "8px 0 4px" }}><i style={{ width: `${expPct(exp)}%` }} /></div>
            <div className="codex-exptxt" style={{ textAlign: "left" }}>
              {`EXP `}<b>{exp}</b>{` / ${needFor(lvl + 1)} · 共 ${(s.scores || []).length} 份答卷`}
            </div>
          </div>
        </div>

        <div className="codex-full">
          <div className="codex-blk">
            <div className="codex-bt">{t("七科判断 // VERDICT")}</div>
            <table className="codex-tr">
              <thead>
                <tr><th>{t("科目")}</th><th>{t("目标")}</th><th>{t("实际")}</th><th>{t("差距")}</th><th>{t("判断")}</th></tr>
              </thead>
              <tbody>
                {SUBJECTS.map(k => {
                  const at = a[k], tt = tg[k], j = judge(at, tt)
                  return (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{tt === undefined ? "–" : tt}</td>
                      <td>{at === undefined ? "–" : at}</td>
                      <td>{j.d === undefined ? "–" : (j.d > 0 ? `+${j.d}` : j.d)}</td>
                      <td className={`j ${j.c}`}>{j.t}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 10, color: "#8794a9", marginTop: 5 }}>
              {t("判断规则：低于目标 15 分以上＝重点补 · 差 0–15＝偏弱 · 达标＝维持 · 超出 10 分＝可加快。")}
            </div>
          </div>

          <div className="codex-blk">
            <div className="codex-bt">{t("弱点 // WEAKNESS")}</div>
            {o && o.weak ? <div className="codex-wbox">{o.weak}</div>
              : <div className="codex-lockmsg"><b>{t("未解锁")}</b> {t("—— 等他交第一份卷子，或老师补一条观察记录。")}</div>}
          </div>

          <div className="codex-blk">
            <div className="codex-bt">{t("下一步计划 // NEXT STEPS")}</div>
            {o && o.advice && o.advice.length
              ? <ol className="codex-adv">{o.advice.map((x, i) => <li key={i}>{x}</li>)}</ol>
              : <div className="codex-lockmsg">{t("未解锁")}</div>}
          </div>

          <div className="codex-blk">
            <div className="codex-bt">{t("老师笔记 // TEACHER NOTES")}</div>
            <div className="codex-tnote">
              <ul>{(o && o.notes && o.notes.length ? o.notes : ["尚无笔记。"]).map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          </div>

          <div className="codex-blk" style={{ marginBottom: 14 }}>
            <div className="codex-bt">{t("每次成绩 // HISTORY")}</div>
            {(s.scores || []).length
              ? (
                <table className="codex-sc">
                  <tbody>
                    {(s.scores || []).map((r, i) => (
                      <tr key={i}>
                        <td className="l">{r.label || r.sub}</td>
                        <td className="v">{`${r.got} / ${r.max}`}</td>
                        <td className="c">{({ signed: "", inferred: "≈推断", disputed: "?争议" } as Record<string, string>)[r.confidence || ""] || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
              : <div className="codex-lockmsg">{t("尚未测出任何成绩。")}<br />{t("第一份卷子交上来，这里就会长出实际能力值。")}</div>}
          </div>
          <div style={{ fontSize: 10, color: "#8794a9" }}>
            {t("目标分是学生自定目标，不是考出来的成绩。等级 Lv ＝ 交卷数累积 EXP（每份 +40），与分数无关。雷达虚线＝目标，实线＝实际。")}
          </div>
        </div>
      </div>
  )

  if (inline) return body
  return (
    <div className="codex-mask" style={{ position: "fixed" }} onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
      {body}
    </div>
  )
}

/* ---------- 顶部：本周盯谁 ---------- */
export function CodexWatch({ students }: { students: CodexStudent[] }) {
  const { t } = useLanguage();
  const noScore = students.filter(s => (s.scores || []).length === 0 && s.targets && Object.keys(s.targets).length)
  const badL: { name: string; n: number }[] = []
  students.forEach(s => {
    const a = actual(s), t = s.targets || {}
    const n = SUBJECTS.filter(k => a[k] !== undefined && t[k] !== undefined && a[k] - t[k] <= -15).length
    if (n) badL.push({ name: s.name, n })
  })
  badL.sort((x, y) => y.n - x.n)
  return (
    <div className="codex-watch">
      <div className="codex-wt">{t("本周盯谁 // WATCH LIST")}</div>
      <div className="codex-wl">
        <b>{`① 有目标但零成绩（${noScore.length} 人）`}</b>{t("：")}
        <span className="nm">{noScore.slice(0, 8).map(s => s.name).join("·") + (noScore.length > 8 ? " 等" : "")}</span>
        {" → 先让交第一份卷"}
      </div>
      <div className="codex-wl">
        <b>{t("② 实际低于目标 15 分以上")}</b>{t("：")}
        <span className="nm">{badL.slice(0, 6).map(x => `${x.name}（${x.n}科）`).join("·") || "—"}</span>
      </div>
    </div>
  )
}
