import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

async function pbGet(token: string, path: string) {
  const res = await fetch(`${PB_URL}${path}`, { headers: { Authorization: token } })
  return res.json()
}

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// POST — 处理今日缺勤扣分
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const center = body.center || ''
    const today = todayLocal()

    const token = await pbAuth()

    // 1. Get attendance settings
    const settingsRes = await fetch(`${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="${encodeURIComponent(center || 'default')}"`, {
      headers: { Authorization: token },
    }).then(r => r.json())

    let settings = settingsRes.items?.[0]?.config
    if (!settings) {
      const fallback = await fetch(`${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="default"`, {
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

    // 2. Get all active students with points enabled
    const allStudents = await pbGet(token, `/api/collections/students/records?perPage=500&fields=id,name,points,center&filter=status="active"&&points_enabled!=false`)
    const targetStudents = center
      ? (allStudents.items || []).filter((s: any) => s.center === center)
      : (allStudents.items || [])

    if (targetStudents.length === 0) {
      return NextResponse.json({ success: true, message: '无学生', absent: 0 })
    }

    // 3. Get students who checked in today
        const checkins = await pbGet(token, `/api/collections/student_attendance/records?perPage=500&fields=student_id&filter=date>="${today} 00:00:00"`) 
    const checkedInIds = new Set((checkins.items || []).map((r: any) => r.student_id))

    // 4. Find absent students
    const absentIds = targetStudents.filter((s: any) => !checkedInIds.has(s.id)).map((s: any) => s.id)
    const absentStudents = targetStudents.filter((s: any) => absentIds.includes(s.id))

    if (absentStudents.length === 0) {
      return NextResponse.json({ success: true, message: '今日全勤', absent: 0 })
    }

    // 5. Check if already deducted today
    const alreadyFilter = absentIds.map((id: string) => `student="${id}"`).join('||')
    const existingLogs = await pbGet(token, `/api/collections/point_logs/records?perPage=500&fields=student&filter=(${encodeURIComponent(alreadyFilter)})&&reason~"缺勤"&&created>="${today} 00:00:00"`)
    const alreadyDeducted = new Set((existingLogs.items || []).map((r: any) => r.student))

    // 6. Deduct points for each absent student
    let processed = 0
    for (const s of absentStudents) {
      if (alreadyDeducted.has(s.id)) continue

      const currentPoints = s.points || 0
      const newPoints = Math.max(0, currentPoints + pointsAbsent)

      // Update student points
      await fetch(`${PB_URL}/api/collections/students/records/${s.id}`, {
        method: 'PATCH',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints }),
      })

      // Create point_logs
      await fetch(`${PB_URL}/api/collections/point_logs/records`, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: s.id,
          amount: pointsAbsent,
          points_before: currentPoints,
          points_after: newPoints,
          reason: `缺勤扣分 (${today})`,
          teacher: null,
          created: new Date().toISOString(),
        }),
      })

      processed++
    }

    return NextResponse.json({
      success: true,
      absent: processed,
      total: absentStudents.length,
      skipped: absentStudents.length - processed,
      message: `已处理 ${processed} 人缺勤扣分`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
