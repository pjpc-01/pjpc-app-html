import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

// ═══════════════════════════════════════════════
// 考勤设置 — 支持分年级、分老师的迟到/早退线
// ═══════════════════════════════════════════════

interface GradeOverride {
  grade: string          // e.g. "一年级", "二年级", "all"
  checkin_deadline: string  // e.g. "13:00"
  checkout_minimum: string  // e.g. "17:00"
}

interface TeacherOverride {
  teacher_id: string
  teacher_name: string
  checkin_deadline: string
  checkout_minimum: string
}

interface AttendanceConfig {
  checkin_deadline: string       // global default: "14:00"
  checkout_minimum: string       // global default: "17:00"
  points_full_attendance: number // +N for on-time
  points_late: number           // -N for late
  points_early: number          // -N for early
  absent_alert_days: number     // consecutive absent days for alert
  enable_points: boolean
  grade_overrides: GradeOverride[]
  teacher_overrides: TeacherOverride[]
}

const DEFAULTS: AttendanceConfig = {
  checkin_deadline: "14:00",
  checkout_minimum: "17:00",
  points_full_attendance: 2,
  points_late: -1,
  points_early: -1,
  absent_alert_days: 3,
  enable_points: true,
  grade_overrides: [],
  teacher_overrides: [],
}

// GET — 获取设置
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center') || 'default'

    const res = await fetch(
      `${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="${encodeURIComponent(center)}"`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    const settings: AttendanceConfig = {
      ...DEFAULTS,
      ...(res.items?.[0]?.config || {}),
      grade_overrides: res.items?.[0]?.config?.grade_overrides || [],
      teacher_overrides: res.items?.[0]?.config?.teacher_overrides || [],
    }

    return NextResponse.json({ success: true, settings, center })
  } catch (error: any) {
    return NextResponse.json({ success: true, settings: DEFAULTS, center: 'default' })
  }
}

// POST — 保存设置
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { center = 'default', config } = body

    // Validate time format
    const timeRe = /^\d{2}:\d{2}$/
    if (!timeRe.test(config.checkin_deadline) || !timeRe.test(config.checkout_minimum)) {
      return NextResponse.json({ error: '时间格式错误，需为 HH:MM' }, { status: 400 })
    }

    const existing = await fetch(
      `${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="${encodeURIComponent(center)}"`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    let result
    if (existing.items?.length > 0) {
      result = await fetch(
        `${PB_URL}/api/collections/attendance_settings/records/${existing.items[0].id}`,
        {
          method: 'PATCH',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ config }),
        }
      ).then(r => r.json())
    } else {
      result = await fetch(
        `${PB_URL}/api/collections/attendance_settings/records`,
        {
          method: 'POST',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ center, config }),
        }
      ).then(r => r.json())
    }

    return NextResponse.json({ success: true, settings: result.config || config })
  } catch (error: any) {
    console.error('保存考勤设置失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── Helper: resolve deadline for a specific person ───

export function resolveDeadlines(
  settings: AttendanceConfig,
  grade?: string,
  teacherId?: string
): { deadline: string; minimum: string } {
  // Teacher override takes priority
  if (teacherId && settings.teacher_overrides) {
    const to = settings.teacher_overrides.find(t => t.teacher_id === teacherId)
    if (to) return { deadline: to.checkin_deadline, minimum: to.checkout_minimum }
  }
  // Grade override
  if (grade && settings.grade_overrides) {
    const go = settings.grade_overrides.find(g => g.grade === grade)
    if (go) return { deadline: go.checkin_deadline, minimum: go.checkout_minimum }
  }
  // Global default
  return {
    deadline: settings.checkin_deadline,
    minimum: settings.checkout_minimum,
  }
}
