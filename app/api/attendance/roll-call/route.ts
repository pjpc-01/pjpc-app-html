import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'
import { applyPoints } from '@/lib/points'

/**
 * 点名（roll_call）—— 跟刷卡打卡（student_attendance）是两套东西。
 *
 * 打卡 = 学生自己刷 NFC，愿不愿意刷取决于学生；
 * 点名 = 老师/院长实际看到谁来了，写这里，谁没来就扣分。
 *
 * 所以：
 *  · 从不写 student_attendance，也不读写它的签到状态
 *  · 出席不挪积分；缺勤按 attendance_settings 的 points_absent 扣
 *  · 扣分带「缺勤」字样，现有 /api/attendance/absent 的防重复守卫会认（reason~"缺勤"）
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

async function settingsFor(token: string, center: string) {
  const tries = [center, 'default'].filter(Boolean)
  for (const c of tries) {
    const r = await pbList(token, 'attendance_settings', {
      perPage: '1',
      filter: `center="${c}"`,
    })
    const cfg = r.items?.[0]?.config
    if (cfg) return cfg
  }
  return null
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

    const cfg = await settingsFor(token, center)
    const pointsAbsent: number = cfg?.points_absent ?? -3
    const pointsOn: boolean = cfg?.enable_points !== false

    let saved = 0
    let skippedAbsent = 0
    let deducted = 0
    let deductSkipped = 0
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

    // 出席：只记录，不挪积分
    for (const id of present) {
      try { await write(id, 'present') } catch (e: any) { errors.push(e.message) }
    }

    // 缺勤：记录 + 扣分（当天已扣过「缺勤」类的不再扣）
    for (const id of absent) {
      try {
        const ok = await write(id, 'absent')
        if (!ok) continue
        const s = byId[id]
        if (!pointsOn || pointsAbsent >= 0) { deductSkipped++; skippedAbsent++; continue }
        if (s?.points_enabled === false) { deductSkipped++; skippedAbsent++; continue }

        // 当天已经因为缺勤扣过（刷卡那套或之前点过名）→ 不再扣
        const already = await fetch(
          `${PB_URL}/api/collections/point_logs/records?perPage=1&filter=${encodeURIComponent(
            `student="${id}"&&reason~"缺勤"&&created>="${date} 00:00:00"`,
          )}`,
          { headers: { Authorization: token } },
        ).then(r => r.json())
        if ((already.items || []).length) { deductSkipped++; skippedAbsent++; continue }

        await applyPoints({
          studentId: id,
          delta: pointsAbsent,
          reason: `点名缺勤 (${date})`,
          dedupeTerms: ['缺勤'],
        })
        deducted++
      } catch (e: any) {
        errors.push(`${id}: ${e.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      date,
      present: present.length,
      absent: absent.length,
      saved,
      deducted,
      deduct_skipped: deductSkipped,
      points_absent: pointsAbsent,
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

    // 当天缺勤扣分净额（扣过的减掉已撤销的）
    const netDeducted = async () => {
      const r = await fetch(
        `${PB_URL}/api/collections/point_logs/records?perPage=50&filter=${encodeURIComponent(
          `student="${studentId}" && reason~"${date}" && (reason~"点名缺勤" || reason~"撤销点名缺勤")`,
        )}`,
        { headers: { Authorization: token } },
      ).then(x => x.json())
      let net = 0
      for (const l of r.items || []) {
        const amt = Math.abs(Number(l.amount || 0))
        net += String(l.reason || '').includes('撤销') ? -amt : amt
      }
      return net
    }

    const cfg = await settingsFor(token, s.center || '')
    const pointsAbsent: number = cfg?.points_absent ?? -3
    const pointsOn: boolean = cfg?.enable_points !== false
    let refunded = 0
    let deducted = 0

    // 撤销：删记录 + 把扣的分加回去
    if (status === 'none') {
      const net = await netDeducted()
      if (net > 0) {
        await applyPoints({
          studentId,
          delta: net,
          reason: `撤销点名缺勤 (${date})`,
        })
        refunded = net
      }
      if (row) await pbDelete(token, 'roll_call', row.id)
      return NextResponse.json({ success: true, status: 'none', refunded, deleted: !!row })
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

    // 积分：只有缺勤扣，出席/请假不扣
    const net = await netDeducted()
    if (status === 'absent') {
      if (net <= 0 && pointsOn && pointsAbsent < 0 && s?.points_enabled !== false) {
        await applyPoints({
          studentId,
          delta: pointsAbsent,
          reason: `点名缺勤 (${date})`,
          dedupeTerms: ['缺勤'],
        })
        deducted = pointsAbsent
      }
    } else if (net > 0) {
      await applyPoints({
        studentId,
        delta: net,
        reason: `撤销点名缺勤 (${date})`,
      })
      refunded = net
    }

    return NextResponse.json({
      success: true,
      status,
      record: saved,
      deducted,
      refunded,
      points_absent: pointsAbsent,
    })
  } catch (error: any) {
    console.error('改点名状态失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
