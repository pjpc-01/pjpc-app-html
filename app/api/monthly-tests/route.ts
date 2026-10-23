import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { reportSubjectsForGrade } from '@/lib/report-subjects'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 安亲班月测成绩（不是学校的期中/期末，是安亲班自己每月考的）。
 *
 * GET  ?year=2026&month=10&grade=Form 1&center=PU1
 *      → 该年级该月所有学生的成绩 + 该年级科目表（老师照着填）
 * GET  ?studentId=xxx&year=2026
 *      → 某个学生整年的月测（成绩单用）
 * POST { year, month, center, rows: [{studentId, student_name, subject, score}] }
 *      → 批量 upsert（同一学生+科目+年月覆盖）
 */
type Any_ = Record<string, any>

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin', 'student'])
  if ('error' in gate) return gate.error

  const { searchParams } = new URL(request.url)
  const studentId = String(searchParams.get('studentId') || '')
  const year = Number(searchParams.get('year') || new Date().getFullYear())
  const month = Number(searchParams.get('month') || 0)
  const grade = String(searchParams.get('grade') || '')
  const center = String(searchParams.get('center') || '')

  try {
    const token = await getAdminToken()
    const H = { Authorization: token }
    const get = async (path: string) => {
      const r = await fetch(`${PB_URL}/api/collections/${path}`, { headers: H, cache: 'no-store' })
      return r.ok ? r.json() : { items: [] }
    }

    // 学生只能看自己的
    const isStudent = gate.session.role === 'student'
    const sid = isStudent ? String(gate.session.studentId || '') : studentId
    if (isStudent && !sid) {
      return NextResponse.json({ success: false, error: '这个账号还没绑定学生资料' }, { status: 403 })
    }

    // A) 单个学生整年月测（成绩单）
    if (sid) {
      const rows = await get(`monthly_test_scores/records?perPage=300&sort=month,subject&filter=${encodeURIComponent(`studentId="${sid}" && year=${year}`)}`)
      return NextResponse.json({ success: true, year, studentId: sid, rows: rows.items || [] })
    }

    // B) 按年级+月，给录入界面用
    if (!grade) {
      return NextResponse.json({ success: false, error: '缺少年级' }, { status: 400 })
    }
    const filter = `grade="${grade}" && status!="inactive"${center ? ` && center="${center}"` : ''}`
    const students = await get(`students/records?perPage=300&sort=name&fields=id,name,student_id,grade,center&filter=${encodeURIComponent(filter)}`)
    const monthFilter = `year=${year}${month ? ` && month=${month}` : ''}${center ? ` && center="${center}"` : ''}`
    const scores = await get(`monthly_test_scores/records?perPage=1000&filter=${encodeURIComponent(monthFilter)}`)

    return NextResponse.json({
      success: true,
      year,
      month,
      grade,
      center,
      subjects: reportSubjectsForGrade(grade),
      students: students.items || [],
      scores: scores.items || [],
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  let body: Any_ = {}
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: '请求格式不对' }, { status: 400 }) }

  const year = Number(body.year)
  const month = Number(body.month)
  const center = String(body.center || '')
  const rows: Any_[] = Array.isArray(body.rows) ? body.rows : []

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ success: false, error: '年月不对' }, { status: 400 })
  }
  if (rows.length === 0) return NextResponse.json({ success: false, error: '没有要保存的成绩' }, { status: 400 })

  try {
    const token = await getAdminToken()
    const H = { 'Content-Type': 'application/json', Authorization: token }

    // 现有记录：同一学生+科目 → id，用来覆盖而不是新增
    const existing = await fetch(
      `${PB_URL}/api/collections/monthly_test_scores/records?perPage=1000&filter=${encodeURIComponent(`year=${year} && month=${month}`)}`,
      { headers: { Authorization: token }, cache: 'no-store' }
    ).then((r) => (r.ok ? r.json() : { items: [] }))
    const key = (sid: string, subject: string) => `${sid}|${subject}`
    const idMap = new Map<string, string>()
    for (const x of existing.items || []) idMap.set(key(String(x.studentId), String(x.subject)), x.id)

    let saved = 0
    let removed = 0
    for (const row of rows) {
      const sid = String(row.studentId || '')
      const subject = String(row.subject || '').trim()
      if (!sid || !subject) continue
      const raw = row.score
      const empty = raw === null || raw === undefined || raw === ''
      const score = empty ? null : Number(raw)
      if (!empty && !Number.isFinite(score)) continue

      const existId = idMap.get(key(sid, subject))

      if (empty) {
        // 清空 = 删掉这条
        if (existId) {
          await fetch(`${PB_URL}/api/collections/monthly_test_scores/records/${existId}`, { method: 'DELETE', headers: { Authorization: token } })
          removed++
        }
        continue
      }

      const payload = {
        studentId: sid,
        student_name: String(row.student_name || ''),
        subject,
        year, month,
        score,
        full_marks: Number(row.full_marks || 100),
        center: String(row.center || center || ''),
        notes: String(row.notes || ''),
      }

      const url = existId
        ? `${PB_URL}/api/collections/monthly_test_scores/records/${existId}`
        : `${PB_URL}/api/collections/monthly_test_scores/records`
      const r = await fetch(url, { method: existId ? 'PATCH' : 'POST', headers: H, body: JSON.stringify(payload) })
      if (r.ok) saved++
    }

    return NextResponse.json({ success: true, saved, removed })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '保存失败' }, { status: 500 })
  }
}
