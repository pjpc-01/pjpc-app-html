import { NextRequest, NextResponse } from "next/server"
import { getAdminToken } from "@/lib/pb-admin-token"

const PB_URL = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
const enc = (s: string) => encodeURIComponent(s)

async function pb(path: string, init: RequestInit = {}) {
  const token = await getAdminToken()
  const res = await fetch(`${PB_URL}/api/collections/${path}`, {
    ...init,
    headers: { Authorization: token, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  })
  const raw = await res.text()
  const body = raw ? JSON.parse(raw) : {}
  if (!res.ok) throw new Error(`PB ${res.status}: ${raw.slice(0, 200)}`)
  return body
}

/** 科目定义（顺序即显示顺序） */
const SUBJECTS = [
  { key: "bm", abbr: "BM", cn: "马来文" },
  { key: "bi", abbr: "BI", cn: "英文" },
  { key: "bc", abbr: "BC", cn: "华文" },
  { key: "mt", abbr: "MT", cn: "数学" },
  { key: "sc", abbr: "SC", cn: "科学" },
  { key: "sej", abbr: "SEJ", cn: "历史" },
  { key: "geo", abbr: "GEO", cn: "地理" },
]

const num = (v: any) => (v === null || v === undefined || v === "" ? null : Number(v))

/** GET /api/exam-targets — 列出学生考试目标 */
export async function GET(req: NextRequest) {
  try {
    const term = new URL(req.url).searchParams.get("term") || ""
    const filter = term ? `deleted != true && term = "${term}"` : "deleted != true"
    const r = await pb(`exam_targets/records?perPage=300&sort=grade,student_name&filter=${enc(filter)}`)
    const rows = (r.items || []).map((x: any) => {
      const scores: Record<string, number | null> = {}
      for (const s of SUBJECTS) scores[s.key] = num(x[s.key])
      const vals = SUBJECTS.map(s => scores[s.key]).filter((v): v is number => typeof v === "number")
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
      return {
        id: x.id, studentId: x.student_id || "", name: x.student_name || "", grade: x.grade || "",
        term: x.term || "", year: x.year || null, scores, avg,
        filled: vals.length, note: x.note || "",
      }
    })
    return NextResponse.json({ success: true, data: { subjects: SUBJECTS, students: rows, total: rows.length } })
  } catch (e) {
    console.error("[exam-targets] GET 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** POST /api/exam-targets — 新增一行目标 */
export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    if (!b?.name) return NextResponse.json({ success: false, error: "missing_name" }, { status: 400 })
    const payload: any = {
      student_id: b.studentId || "", student_name: String(b.name).trim(), grade: b.grade || "",
      term: b.term || "", year: b.year ? Number(b.year) : null, note: b.note || "", deleted: false,
    }
    for (const s of SUBJECTS) payload[s.key] = num(b.scores?.[s.key] ?? b[s.key])
    const r = await pb("exam_targets/records", { method: "POST", body: JSON.stringify(payload) })
    return NextResponse.json({ success: true, data: r })
  } catch (e) {
    console.error("[exam-targets] POST 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** PATCH /api/exam-targets?id=xxx — 改某行（学生目标改动频繁，支持逐格改） */
export async function PATCH(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 })
    const b = await req.json()
    const payload: any = {}
    for (const k of ["student_id", "student_name", "grade", "term", "note"]) if (k in b) payload[k] = b[k]
    if ("year" in b) payload.year = b.year ? Number(b.year) : null
    for (const s of SUBJECTS) {
      const v = b.scores?.[s.key] ?? b[s.key]
      if (v !== undefined) payload[s.key] = num(v)
    }
    const r = await pb(`exam_targets/records/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
    return NextResponse.json({ success: true, data: r })
  } catch (e) {
    console.error("[exam-targets] PATCH 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}

/** DELETE /api/exam-targets?id=xxx — 软删除 */
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return NextResponse.json({ success: false, error: "missing_id" }, { status: 400 })
    await pb(`exam_targets/records/${id}`, { method: "PATCH", body: JSON.stringify({ deleted: true }) })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[exam-targets] DELETE 失败:", e)
    return NextResponse.json({ success: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}
