import { NextRequest, NextResponse } from 'next/server'
import { formatGrade } from '@/lib/utils'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  return (await res.json()).token
}

async function pbCreate(token: string, collection: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
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
    const dateFilter = `${idField}="${person_id}" && created >= "${today} 00:00:00"`
    const prevRes = await fetch(
      `${PB_URL}/api/collections/${collectionName}/records?perPage=10&sort=-created&filter=${encodeURIComponent(dateFilter)}`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    let action: 'check_in' | 'check_out'
    const prev = prevRes.items?.[0]
    // Check if there's already a check_in today — only allow one
    const hasCheckIn = prevRes.items?.some((r: any) => {
      const notes = r.notes || ''
      return notes.startsWith('[签到]') || (!notes.startsWith('[签退]') && !r.check_out)
    })
    if (!prev) {
      action = 'check_in'
    } else if (hasCheckIn) {
      // Already checked in today — try check_out if not done yet
      const hasCheckOut = prevRes.items?.some((r: any) => (r.notes || '').startsWith('[签退]') || r.check_out)
      if (hasCheckOut) {
        // Both check-in and check-out exist today
        if (prev.notes?.startsWith('[签到]') || (!prev.notes?.startsWith('[签退]') && !prev.check_out)) {
          // Last was check-in, allow another check_out
          action = 'check_out'
        } else {
          return NextResponse.json({ error: '今天已完成签到和签退', action: 'none' }, { status: 200 })
        }
      } else {
        action = 'check_out'
      }
    } else {
      action = 'check_in'
    }

    const actionLabel = action === 'check_in' ? '签到' : '签退'
    const actionNotes = `[${actionLabel}] ${notes || `NFC打卡 - ${method}`}`

    // ── Create record ────────────────────────────
    const recordData: any = {
      [idField]: person_id,
      [nameField]: resolvedName,
      center: resolvedCenter,
      date: today,
      check_in: now.toISOString(),
      check_out: '',
      status: 'present',
      method,
      notes: actionNotes,
      device_info: JSON.stringify({ method, action, source: 'nfc' }),
    }
    if (isTeacher) {
      recordData.branch_code = resolvedCenter
      recordData.branch_name = resolvedCenter
    }

    const record = await pbCreate(token, collectionName, recordData)

    // ── Points integration ─────────────────────
    let pointsResult: any = null
    if (!isTeacher && action === 'check_in') {
      try {
        pointsResult = await handlePointsIntegration(token, person_id, resolvedCenter, record)
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

async function handlePointsIntegration(
  token: string, studentId: string, center: string, record: any
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

  // Get student grade for per-grade deadline
  let deadline = settings.checkin_deadline
  try {
    const studentRes = await fetch(
      `${PB_URL}/api/collections/students/records/${studentId}?fields=grade`,
      { headers: { Authorization: token } }
    ).then(r => r.json())
    const grade = studentRes.grade
    if (grade) {
      const normalized = formatGrade(grade)
      const go = (settings.grade_overrides || []).find((g: any) => {
        const goGrade = g.grade
        return goGrade === normalized || goGrade === grade || formatGrade(goGrade) === normalized
      })
      if (go) {
        deadline = go.checkin_deadline
        console.log(`[POINTS DEBUG] grade=${grade} deadline=${deadline} (override)`)
      }
    }
  } catch { /* use global deadline */ }

  // Check if check-in is late
  const checkinTime = record.check_in || record.created
  const t = new Date(checkinTime)
  const timeStr = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`

  const isLate = timeStr > deadline
  const points = isLate ? settings.points_late : (settings.points_checkin ?? 2)
  const reason = isLate ? `考勤迟到 (${timeStr}, 线 ${deadline})` : '考勤打卡签到'
  console.log(`[POINTS DEBUG] timeStr=${timeStr} deadline=${deadline} isLate=${isLate} points=${points}`)

  // Check if student already got points today (avoid duplicate)
  const today = todayLocal()
  const ptsFilter = `studentId="${studentId}" && created >= "${today} 00:00:00" && reason ~ "考勤"`
  const existingPts = await fetch(
    `${PB_URL}/api/collections/points/records?perPage=1&filter=${encodeURIComponent(ptsFilter)}`,
    { headers: { Authorization: token } }
  ).then(r => r.json())

  if (existingPts.items?.length > 0) {
    console.log(`[POINTS DEBUG] 今日已有点数记录: studentId=${studentId}, ptsFilter=${ptsFilter}`)
    return { skipped: true, reason: '今日已发放考勤积分' }
  }

  // Get current student points
  const student = await fetch(
    `${PB_URL}/api/collections/students/records/${studentId}`,
    { headers: { Authorization: token } }
  ).then(r => r.json())

  const currentPoints = student.points || 0
  const newPoints = Math.max(0, currentPoints + points)

  // Update student points
  await fetch(`${PB_URL}/api/collections/students/records/${studentId}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: newPoints }),
  })

  // Create points log
  await pbCreate(token, 'points', {
    studentId,
    points: points,
    reason,
    teacher_id: 'system',
    created: nowStr(),
  })

  // Create point_logs (transaction history)
  await pbCreate(token, 'point_logs', {
    student: studentId,
    amount: points,
    points_before: currentPoints,
    points_after: newPoints,
    reason,
    teacher: null,
    created: nowStr(),
  })

  return {
    granted: true,
    points,
    is_late: isLate,
    reason,
    points_before: currentPoints,
    points_after: newPoints,
  }
}
