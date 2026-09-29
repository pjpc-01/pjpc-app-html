import { NextRequest, NextResponse } from 'next/server'
import { formatGrade } from '@/lib/utils'
import { gradeCanon } from '@/lib/grades'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

async function pbCreate(token: string, collection: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function pbUpdate(token: string, collection: string, id: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

function nowStr() { return new Date().toISOString() }

// 本地日期 YYYY-MM-DD (不用UTC)
function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// POST — 统一考勤打卡 + 积分联动
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      person_id, person_type = 'student', person_name,
      center, method = 'nfc', notes = '',
    } = body

    if (!person_id) {
      return NextResponse.json({ error: '缺少必需参数: person_id' }, { status: 400 })
    }
    const resolvedCenter = center || 'BATU14'

    let token: string
    try { token = await pbAuth() }
    catch { return NextResponse.json({ error: 'PocketBase 认证失败' }, { status: 401 }) }

    const isTeacher = person_type === 'teacher'
    const collectionName = isTeacher ? 'teacher_attendance' : 'student_attendance'
    const idField = isTeacher ? 'teacher_id' : 'student_id'
    const nameField = isTeacher ? 'teacher_name' : 'student_name'

    let resolvedName = person_name || person_id

    const now = new Date()
    const today = todayLocal()

    // ── Determine action ─────────────────────────
    // 用 date 字段（todayLocal() 写入的本地日期）判断“今天已有的记录”。
    // ⚠️ 不要用 created 比较：PB 的 created 是 UTC，本地 00:00-08:00 打卡的记录会被漏掉，
    // 导致同一天被判定成两次“签到”（而不是签到+签退），积分也会重复发。
    // ⚠️ date 是 PB 的 date 类型字段（存成 "2026-09-28 00:00:00.000Z"），
    //    用 date = "2026-09-28" 永远查不到（实测 0 条）→ action 会永远判成「签到」。
    //    必须用范围比较。
    const dateFilter = `${idField}="${person_id}" && date >= "${today} 00:00:00" && date <= "${today} 23:59:59"`
    const prevRes = await fetch(
      `${PB_URL}/api/collections/${collectionName}/records?perPage=10&sort=-created&filter=${encodeURIComponent(dateFilter)}`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    const prev = prevRes.items?.[0]
    // 今天那条「已签到、还没签退」的行 —— 签退要 PATCH 它
    let openRow = (prevRes.items || []).find((r: any) =>
      (r.notes || '').startsWith('[签到]') && !r.check_out
    )
    // 今天是否已完整走过一次「签到 + 签退」
    const completedToday = (prevRes.items || []).some((r: any) => !!r.check_out)

    let action: 'check_in' | 'check_out'
    if (openRow) {
      action = 'check_out'
    } else if (!prev) {
      action = 'check_in'
    } else if (completedToday) {
      // 已有完整一进一出 → 不再新建。以前这里会退回新建，产生 check_in=check_out 的脏行。
      return NextResponse.json(
        { success: false, action: 'none', action_key: 'none', error: '今天已完成签到和签退',
          person_type, person: { id: person_id, name: resolvedName, type: person_type } },
        { status: 200 }
      )
    } else {
      // 今天还没记录：可能是跨天（昨晚来、现在凌晨走）→ 回看 24h 有没有「已签到未签退」的行
      openRow = await findOpenRowWithin24h(token, collectionName, idField, person_id)
      action = openRow ? 'check_out' : 'check_in'
    }

    // ── 防误刷：同一人两次刷卡间隔过短 = 重复读卡，不写库（实测有 1.2 秒误刷被判签退 → 工时算 0）
    const MIN_SCAN_GAP_MS = 60 * 1000
    const lastStamp = action === 'check_out' && openRow
      ? (openRow.check_in || openRow.created)
      : (prev ? (prev.check_out || prev.check_in || prev.created) : null)
    if (lastStamp) {
      const gapMs = now.getTime() - new Date(lastStamp).getTime()
      if (gapMs >= 0 && gapMs < MIN_SCAN_GAP_MS) {
        return NextResponse.json(
          { success: false, action: 'none', action_key: 'none',
            message: `重复刷卡（间隔 ${Math.round(gapMs / 1000)} 秒），已忽略`,
            person_type, person: { id: person_id, name: resolvedName, type: person_type } },
          { status: 200 }
        )
      }
    }

    const actionLabel = action === 'check_in' ? '签到' : '签退'
    const actionNotes = `[${actionLabel}] ${notes || `NFC打卡 - ${method}`}`

    // ── Write record ─────────────────────────────
    // 签到：新建一条记录。
    // 签退：更新「今天那条还没签退的签到记录」的 check_out —— 以前无论签到签退都新建，
    //       导致 check_out 永远为空、签退时间被塞进新行的 check_in，薪资按 check_out
    //       算工时的老师因此算成 0。
    const baseData: any = {
      [idField]: person_id,
      [nameField]: resolvedName,
      center: resolvedCenter,
      date: today,
      status: 'present',
      method,
      device_info: JSON.stringify({ method, action, source: 'nfc' }),
    }
    if (isTeacher) {
      baseData.branch_code = resolvedCenter
      baseData.branch_name = resolvedCenter
    }

    let record: any
    if (action === 'check_out') {
      // 今天没有开着的签到行 → 回看 24 小时（晚上来、凌晨走，签退落到新一天）
      const target = openRow
      if (target) {
        record = await pbUpdate(token, collectionName, target.id, {
          check_out: now.toISOString(),
          notes: `${target.notes} | [签退] ${method}`,
        })
      } else {
        // 历史脏数据：退回新建，绝不丢打卡
        record = await pbCreate(token, collectionName, {
          ...baseData,
          check_in: now.toISOString(),
          check_out: now.toISOString(),
          notes: actionNotes,
        })
      }
    } else {
      record = await pbCreate(token, collectionName, {
        ...baseData,
        check_in: now.toISOString(),
        check_out: '',
        notes: actionNotes,
      })
    }

    // ── Points integration ─────────────────────
    let pointsResult: any = null
    if (!isTeacher) {
      try {
        pointsResult = await handlePointsIntegration(token, person_id, resolvedCenter, record, action)
      } catch { /* points failure shouldn't block attendance */ }
    }

    return NextResponse.json({
      success: true,
      action: actionLabel,
      action_key: action,
      message: `${actionLabel}成功`,
      person_type,
      data: record,
      person: { id: person_id, name: resolvedName, type: person_type },
      points: pointsResult,
    })
  } catch (error: any) {
    console.error('考勤打卡失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── Points Integration ──────────────────────────

async function resolveGradeLines(token: string, studentId: string, settings: any) {
  let deadline = settings.checkin_deadline
  let minimum = settings.checkout_minimum
  try {
    const studentRes = await fetch(
      `${PB_URL}/api/collections/students/records/${studentId}?fields=grade`,
      { headers: { Authorization: token } }
    ).then(r => r.json())
    const raw = studentRes.grade
    if (raw) {
      const canon = gradeCanon(raw)
      const go = (settings.grade_overrides || []).find((g: any) => {
        const goGrade = g.grade
        return goGrade === canon || goGrade === raw || gradeCanon(goGrade) === canon || formatGrade(goGrade) === canon
      })
      if (go) {
        if (go.checkin_deadline) deadline = go.checkin_deadline
        if (go.checkout_minimum) minimum = go.checkout_minimum
      }
    }
  } catch { /* 用全局默认 */ }
  return { deadline, minimum }
}

async function handlePointsIntegration(
  token: string, studentId: string, center: string, record: any, action: 'check_in' | 'check_out' = 'check_in'
) {
  // Load settings
  let settings: any = {
    checkin_deadline: "14:00",
    checkout_minimum: "17:00",
    points_checkin: 2,
    points_late: -1,
    points_early: -1,
    points_absent: -3,
    enable_points: true,
    grade_overrides: [] as any[],
    teacher_overrides: [] as any[],
  }
  try {
    // Try center-specific first
    let settingsUrl = `${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="${encodeURIComponent(center)}"`
    let settingsRes = await fetch(settingsUrl, { headers: { Authorization: token } }).then(r => r.json())
    if (!settingsRes.items?.[0]?.config) {
      // Fallback to default
      settingsUrl = `${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="default"`
      settingsRes = await fetch(settingsUrl, { headers: { Authorization: token } }).then(r => r.json())
    }
    if (settingsRes.items?.[0]?.config) {
      settings = { ...settings, ...settingsRes.items[0].config }
    }
  } catch { /* use defaults */ }

  if (!settings.enable_points) return { skipped: true }

  // 年级专属的截止 / 最低签退时间
  const { deadline, minimum } = await resolveGradeLines(token, studentId, settings)

  // ── 签退：早退扣分（points_early 以前从未被读过）──
  if (action === 'check_out') {
    if (!minimum) return { skipped: true, reason: '未配置最低签退时间' }
    const outStr = hhmm(record.check_out || record.created)
    if (!(outStr < minimum)) return { skipped: true, reason: `正常签退（${outStr} ≥ ${minimum}）` }
    const pts = settings.points_early ?? -1
    if (!pts) return { skipped: true, reason: '早退不扣分（points_early=0）' }
    const reason = `考勤早退 (${outStr}, 线 ${minimum})`
    console.log(`[POINTS DEBUG] early-out outStr=${outStr} minimum=${minimum} points=${pts}`)
    return await applyAttendancePoints(token, studentId, pts, reason, ['考勤早退'])
  }

  // ── 签到：迟到 / 准时 ──
  const timeStr = hhmm(record.check_in || record.created)
  const isLate = !!deadline && timeStr > deadline
  const points = isLate ? (settings.points_late ?? -1) : (settings.points_checkin ?? 2)
  const reason = isLate ? `考勤迟到 (${timeStr}, 线 ${deadline})` : '考勤打卡签到'
  console.log(`[POINTS DEBUG] checkin timeStr=${timeStr} deadline=${deadline} isLate=${isLate} points=${points}`)
  const res = await applyAttendancePoints(token, studentId, points, reason,
    isLate ? ['考勤迟到', '考勤打卡签到'] : ['考勤打卡签到', '考勤迟到'])
  return { ...res, is_late: isLate }
}

/** 本地 HH:MM */
function hhmm(iso: string): string {
  const t = new Date(iso)
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
}

/** 写考勤积分：当日「同类型」去重 + 积分守卫。dedupTerms 用 PB 的 ~ 匹配 reason */
async function applyAttendancePoints(
  token: string, studentId: string, points: number, reason: string, dedupTerms: string[]
) {
  const today = todayLocal()
  // ⚠️ point_logs 的 created 是 UTC：本地"今天"= UTC [昨天16:00, 今天16:00)
  const localDayStart = new Date(`${today}T00:00:00+08:00`)
  const utcFmt = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ')
  const termExpr = dedupTerms.map(t => `reason ~ "${t}"`).join(' || ')
  const ptsFilter = `student="${studentId}" && created >= "${utcFmt(localDayStart)}" && created < "${utcFmt(new Date(localDayStart.getTime() + 86400000))}" && (${termExpr})`
  const existingPts = await fetch(
    `${PB_URL}/api/collections/point_logs/records?perPage=1&filter=${encodeURIComponent(ptsFilter)}`,
    { headers: { Authorization: token } }
  ).then(r => r.json())
  if (existingPts.items?.length > 0) return { skipped: true, reason: '今日同类考勤积分已发放' }

  const student = await fetch(
    `${PB_URL}/api/collections/students/records/${studentId}`,
    { headers: { Authorization: token } }
  ).then(r => r.json())
  if (student.points_enabled === false) return { skipped: true, reason: '积分系统已关闭' }

  const currentPoints = student.points || 0
  const newPoints = currentPoints + points
  await fetch(`${PB_URL}/api/collections/students/records/${studentId}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: newPoints }),
  })
  await pbCreate(token, 'points', {
    studentId, points, reason, teacher_id: 'system', created: nowStr(),
  })
  await pbCreate(token, 'point_logs', {
    student: studentId, amount: points, points_before: currentPoints, points_after: newPoints,
    reason, teacher: null, created: nowStr(),
  })
  return { granted: true, points, reason, points_before: currentPoints, points_after: newPoints }
}

/** 找该人最近 24h 内「已签到未签退」的行（跨天签退） */
async function findOpenRowWithin24h(token: string, collection: string, idField: string, personId: string) {
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    const filter = `${idField}="${personId}" && created >= "${since}"`
    const res = await fetch(
      `${PB_URL}/api/collections/${collection}/records?perPage=20&sort=-created&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: token } }
    ).then(r => r.json())
    return (res.items || []).find((r: any) => (r.notes || '').startsWith('[签到]') && !r.check_out) || null
  } catch { return null }
}
