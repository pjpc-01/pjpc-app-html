import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

/**
 * 点名（roll_call）—— 跟刷卡打卡（student_attendance）是两套东西。
 *
 * 打卡 = 学生自己刷 NFC，没刷由 /api/attendance/absent 晚上统一扣分；
 * 点名 = 老师/院长实际看到谁来了，**只写记录，完全不碰积分**。
 *
 * 老板 2026-11-23 原话：「就算点名了依然扣，因为没打卡，点名只是记录真实出勤，没有影响积分的」。
 * 所以：
 *  · 从不写 student_attendance，也不读写它的签到状态
 *  · present / absent / leave / 撤销 都不改 point_logs，也不改 students.points
 */

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function pbList(token: string, collection: string, query: Record<string, string>) {
  const params = new URLSearchParams(query)
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records?${params.toString()}`, {
    headers: { Authorization: token },
  })
  if (!res.ok) return { items: [] }
  return res.json()
}

async function pbCreate(token: string, collection: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`创建 ${collection} 失败: ${res.status} ${await res.text()}`)
  return res.json()
}

async function pbDelete(token: string, collection: string, id: string) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  })
  if (!res.ok && res.status !== 404) throw new Error(`删除 ${collection} 失败: ${res.status} ${await res.text()}`)
}

async function pbUpdate(token: string, collection: string, id: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`更新 ${collection} 失败: ${res.status} ${await res.text()}`)
  return res.json()
}

// ── GET：某段日期的点名记录 ────────────────────
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || todayLocal()
    const endDate = searchParams.get('endDate') || startDate
    const center = searchParams.get('center') || ''

    // PB 的 date 字段存成 "YYYY-MM-DD 00:00:00.000Z"，用排他上限比较
    const addDays = (day: string, n: number) => {
      const dt = new Date(`${day}T00:00:00.000Z`)
      dt.setUTCDate(dt.getUTCDate() + n)
      return dt.toISOString().slice(0, 10)
    }
    let filter = `date >= "${startDate} 00:00:00.000Z" && date < "${addDays(endDate, 1)} 00:00:00.000Z"`
    if (center) filter += ` && center="${center}"`

    const res = await fetch(
      `${PB_URL}/api/collections/roll_call/records?perPage=5000&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: token } },
    ).then(r => r.json())

    return NextResponse.json({ success: true, records: res.items || [] })
  } catch (error: any) {
    console.error('读取点名记录失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST：交一次点名结果 ───────────────────────
// body: { date?: 'YYYY-MM-DD', center?: 'PU1'|'BATU14'|'', present: [studentId], absent: [studentId], markedBy?: string }
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  try {
    const body = await request.json()
    const date: string = body.date || todayLocal()
    const center: string = body.center || ''
    const present: string[] = Array.isArray(body.present) ? body.present : []
    const absent: string[] = Array.isArray(body.absent) ? body.absent : []
    const markedBy: string = body.markedBy || 'manual'

    if (!present.length && !absent.length) {
      return NextResponse.json({ error: '没有要点名的人' }, { status: 400 })
    }

    const token = await pbAuth()

    // 学生档案（拿姓名、年级、中心）
    const ids = [...new Set([...present, ...absent])]
    const studentsRes = await pbList(token, 'students', {
      perPage: String(ids.length + 5),
      filter: ids.map(id => `id="${id}"`).join('||'),
      fields: 'id,name,grade,center,is_peralihan,points_enabled',
    })
    const byId: Record<string, any> = {}
    for (const s of studentsRes.items || []) byId[s.id] = s

    // 当天已有的点名行（同一人同一天只留一条，重交就覆盖）
    const addDays = (day: string, n: number) => {
      const dt = new Date(`${day}T00:00:00.000Z`)
      dt.setUTCDate(dt.getUTCDate() + n)
      return dt.toISOString().slice(0, 10)
    }
    const existingRes = await fetch(
      `${PB_URL}/api/collections/roll_call/records?perPage=500&filter=${encodeURIComponent(
        `date >= "${date} 00:00:00.000Z" && date < "${addDays(date, 1)} 00:00:00.000Z"`,
      )}`,
      { headers: { Authorization: token } },
    ).then(r => r.json())
    const existing: Record<string, any> = {}
    for (const r of existingRes.items || []) existing[r.student_id] = r

    let saved = 0
    const errors: string[] = []

    const write = async (studentId: string, status: 'present' | 'absent') => {
      const s = byId[studentId]
      if (!s) { errors.push(`${studentId} 学生不存在`); return false }
      const payload = {
        student_id: studentId,
        student_name: s.name || '',
        date,
        status,
        center: s.center || center || '',
        grade: s.grade || '',
        notes: status === 'present' ? '点名出席' : '点名缺勤',
        marked_by: markedBy,
      }
      const row = existing[studentId]
      if (row) await pbUpdate(token, 'roll_call', row.id, payload)
      else await pbCreate(token, 'roll_call', payload)
      saved++
      return true
    }

    // 点名只记录「谁来了谁没来」，**不动积分**。
    // 积分只认打卡：没刷卡由 /api/attendance/absent 在晚上统一扣，跟点名是两套。
    for (const id of present) {
      try { await write(id, 'present') } catch (e: any) { errors.push(e.message) }
    }
    for (const id of absent) {
      try { await write(id, 'absent') } catch (e: any) { errors.push(e.message) }
    }

    return NextResponse.json({
      success: true,
      date,
      present: present.length,
      absent: absent.length,
      saved,
      deducted: 0,
      deduct_skipped: absent.length,
      points_absent: 0,
      errors,
    })
  } catch (error: any) {
    console.error('点名失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PATCH：单个学生改点名状态（手机上一人一键） ──
// body: { studentId, date?, status: 'present'|'absent'|'leave'|'none' }
//  · status='none' 就是撤销：删掉当天这条点名，缺勤扣的分原样加回去
//  · 缺勤 → 出席/请假 也会把之前扣的分加回去
//  · 改回缺勤才重新扣（一天只扣一次，靠「扣分 - 撤销」净额判断）
export async function PATCH(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  try {
    const body = await request.json()
    const studentId: string = body.studentId || ''
    const date: string = body.date || todayLocal()
    const status: string = body.status || ''
    const markedBy: string = body.markedBy || 'manual'
    if (!studentId) return NextResponse.json({ error: '缺学生' }, { status: 400 })
    if (!['present', 'absent', 'leave', 'none'].includes(status)) {
      return NextResponse.json({ error: '状态不对' }, { status: 400 })
    }

    const token = await pbAuth()

    // 学生档案
    const stRes = await pbList(token, 'students', { perPage: '1', filter: `id="${studentId}"` })
    const s = (stRes.items || [])[0]
    if (!s) return NextResponse.json({ error: '学生不存在' }, { status: 404 })

    // 当天这条点名
    const addDays = (day: string, n: number) => {
      const dt = new Date(`${day}T00:00:00.000Z`)
      dt.setUTCDate(dt.getUTCDate() + n)
      return dt.toISOString().slice(0, 10)
    }
    const existRes = await fetch(
      `${PB_URL}/api/collections/roll_call/records?perPage=5&filter=${encodeURIComponent(
        `student_id="${studentId}" && date >= "${date} 00:00:00.000Z" && date < "${addDays(date, 1)} 00:00:00.000Z"`,
      )}`,
      { headers: { Authorization: token } },
    ).then(r => r.json())
    const row = (existRes.items || [])[0]

    // 点名只记录出勤，**完全不碰积分**。
    // 积分只认打卡：没刷卡由 /api/attendance/absent 晚上统一扣，跟老师点名是两套，
    // 老师点「出席」也不会把没打卡的扣分退回来（老板 2026-11-23：「就算点名了依然扣，因为没打卡」）。

    // 撤销：只删当天这条点名记录
    if (status === 'none') {
      if (row) await pbDelete(token, 'roll_call', row.id)
      return NextResponse.json({ success: true, status: 'none', refunded: 0, deleted: !!row })
    }

    const payload = {
      student_id: studentId,
      student_name: s.name || '',
      date,
      status,
      center: s.center || '',
      grade: s.grade || '',
      notes: status === 'present' ? '点名出席' : status === 'absent' ? '点名缺勤' : '请假',
      marked_by: markedBy,
    }
    const saved = row
      ? await pbUpdate(token, 'roll_call', row.id, payload)
      : await pbCreate(token, 'roll_call', payload)

    return NextResponse.json({
      success: true,
      status,
      record: saved,
      deducted: 0,
      refunded: 0,
      points_absent: 0,
    })
  } catch (error: any) {
    console.error('改点名状态失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
