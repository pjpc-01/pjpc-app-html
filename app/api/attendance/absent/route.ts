import { NextRequest, NextResponse } from 'next/server'
import { participatesInPoints } from '@/lib/enrollment'
import { applyPoints } from '@/lib/points'
import { requireRoles } from '@/lib/api-auth'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

// pbGet: path 里带 filter 时传 { filter } 分开，避免 URL 编码问题
async function pbGet(token: string, collection: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) params.set(k, v)
  const qs = params.toString()
  const url = `${PB_URL}/api/collections/${collection}/records${qs ? '?' + qs : ''}`
  const res = await fetch(url, { headers: { Authorization: token } })
  return res.json()
}

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function isWeekend(d: Date) {
  const day = d.getDay() // 0=Sun, 6=Sat
  return day === 0 || day === 6
}

// POST — 处理今日缺勤扣分
// 内部定时器（lib/absent-scheduler.ts）没有用户会话，靠 x-pjpc-internal 头进入；
// 带 dryRun 时只算不改（用来核对今天会扣谁）。
export async function POST(request: NextRequest) {
  const internal = request.headers.get('x-pjpc-internal') === process.env.PROXY_INTERNAL_KEY
  if (!internal) {
    const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
    if ('error' in gate) return gate.error
  }
  try {
    const body = await request.json().catch(() => ({}))
    const center = body.center || ''
    const dryRun = body.dryRun === true || request.nextUrl.searchParams.get('dryRun') === '1'
    const today = todayLocal()

    // 周末不扣分（安亲班周末不上课，缺勤不算）
    if (isWeekend(new Date())) {
      return NextResponse.json({ success: true, message: '周末不执行缺勤扣分', absent: 0 })
    }

    const token = await pbAuth()

    // 1. Get attendance settings
    const settingsRes = await fetch(`${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=${encodeURIComponent(`center="${center || 'default'}"`)}`, {
      headers: { Authorization: token },
    }).then(r => r.json())

    let settings = settingsRes.items?.[0]?.config
    if (!settings) {
      const fallback = await fetch(`${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=${encodeURIComponent('center="default"')}`, {
        headers: { Authorization: token },
      }).then(r => r.json())
      settings = fallback.items?.[0]?.config
    }

    if (!settings?.enable_points) {
      return NextResponse.json({ success: true, message: '积分未启用', absent: 0 })
    }

    const pointsAbsent = settings.points_absent ?? -3
    if (pointsAbsent >= 0) {
      return NextResponse.json({ success: true, message: '缺勤扣分为0或正数，跳过', absent: 0 })
    }

    // 2. 选人：在读 + 参与积分，且排除「只上拳课」和「明年新生」
    //    只看 points_enabled 不够 —— 明年新生 许宸嫣 的 points_enabled 是 true，
    //    结果连扣 4 天 −3，人还没入学（2026-11-20 事故）。
    const allStudents = await pbGet(token, 'students', {
      perPage: '500',
      fields: 'id,name,points,center,points_enabled,grade,student_id,status',
      filter: 'status="active"&&points_enabled=true',
    })
    const targetStudents = (allStudents.items || [])
      .filter((s: any) => participatesInPoints(s))
      .filter((s: any) => !center || s.center === center)

    if (targetStudents.length === 0) {
      return NextResponse.json({ success: true, message: '无学生', absent: 0 })
    }

    // 3. Get students who checked in today
    const checkins = await pbGet(token, 'student_attendance', {
      perPage: '500',
      fields: 'student_id',
      filter: `date>="${today} 00:00:00"`,
    })
    const checkedInIds = new Set((checkins.items || []).map((r: any) => r.student_id))

    // 3b. 已批准请假的学生当天不算缺勤（student_leave_record；表不存在也不影响）
    const onLeave = new Set<string>()
    try {
      const leaves = await pbGet(token, 'student_leave_record', {
        perPage: '500', fields: 'student_id',
        filter: `status="approved" && start_date <= "${today} 23:59:59" && end_date >= "${today} 00:00:00"`,
      })
      for (const r of (leaves.items || [])) onLeave.add(r.student_id)
    } catch { /* ignore */ }

    // 3c. 点名不算豁免：老板 2026-11-23「就算点名了依然扣，因为没打卡，点名只是记录真实出勤」
    //     → 没刷卡就扣，老师点没点「出席」都不影响。

    // 4. Find absent students（只排除已签到 + 已批准请假）
    const absentIds = targetStudents
      .filter((s: any) => !checkedInIds.has(s.id) && !onLeave.has(s.id))
      .map((s: any) => s.id)
    const absentStudents = targetStudents.filter((s: any) => absentIds.includes(s.id))

    if (absentStudents.length === 0) {
      return NextResponse.json({ success: true, message: '今日全勤', absent: 0 })
    }

    // 5. Check if already deducted today
    const alreadyFilter = absentIds.map((id: string) => `student="${id}"`).join('||')
    const fullFilter = `(${alreadyFilter})&&reason~"缺勤"&&created>="${today} 00:00:00"`
    const existingLogs = await pbGet(token, 'point_logs', {
      perPage: '500',
      fields: 'student',
      filter: fullFilter,
    })
    const alreadyDeducted = new Set((existingLogs.items || []).map((r: any) => r.student))

    // 6. Deduct points for each absent student
    let processed = 0
    const wouldDeduct: string[] = []
    for (const s of absentStudents) {
      if (alreadyDeducted.has(s.id)) continue

      // 积分守卫：积分系统已关闭的学生拒绝扣分
      if (s.points_enabled === false) continue

      wouldDeduct.push(`${s.name || s.id}(${s.center || '-'})`)
      if (dryRun) continue

      // 唯一写入口：锁内重读、写分数、回读校验、必写流水；失败不影响其余学生
      try {
        const r = await applyPoints({
          studentId: s.id,
          delta: pointsAbsent,
          reason: `缺勤扣分 (${today})`,
          dedupeTerms: ['缺勤扣分'],
          token,
        })
        if (!r.skipped) processed++
      } catch (e: any) {
        console.error(`[ABSENT] ${s.name || s.id} 扣分失败:`, e?.message || e)
      }
    }

    return NextResponse.json({
      success: true,
      absent: processed,
      total: absentStudents.length,
      skipped: absentStudents.length - processed,
      dryRun,
      wouldDeduct,
      message: dryRun ? `预演：今天会扣 ${wouldDeduct.length} 人` : `已处理 ${processed} 人缺勤扣分`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
