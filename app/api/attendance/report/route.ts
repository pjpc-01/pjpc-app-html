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

function parseTime(iso: string | null): Date | null {
  if (!iso) return null
  try { return new Date(iso) } catch { return null }
}

function timeStr(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// GET — 增强考勤报告：含迟到/早退/缺勤（分年级/分老师阈值）
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const type = searchParams.get('type') || 'all'
    const center = searchParams.get('center') || ''

    // ── Load settings ──────────────────────────────
    let settings: any = {
      checkin_deadline: "14:00",
      checkout_minimum: "17:00",
      grade_overrides: [] as any[],
      teacher_overrides: [] as any[],
      enable_points: true,
    }
    try {
      const settingsFilter = center ? `center="${encodeURIComponent(center)}"` : ''
      const settingsUrl = `${PB_URL}/api/collections/attendance_settings/records?perPage=1` +
        (settingsFilter ? `&filter=${encodeURIComponent(settingsFilter)}` : '')
      const settingsRes = await fetch(settingsUrl, { headers: { Authorization: token } }).then(r => r.json())
      if (settingsRes.items?.[0]?.config) {
        settings = { ...settings, ...settingsRes.items[0].config }
      }
    } catch { /* use defaults */ }

    const globalDeadline = settings.checkin_deadline
    const globalMinimum = settings.checkout_minimum

    // ── Pre-fetch student grades (for per-grade deadlines) ──
    const studentGrades: Record<string, string> = {}
    try {
      const studentsUrl = `${PB_URL}/api/collections/students/records?perPage=500&fields=id,grade`
      const studentsRes = await fetch(studentsUrl, { headers: { Authorization: token } }).then(r => r.json())
      for (const s of (studentsRes.items || [])) {
        studentGrades[s.id] = s.grade || ''
      }
    } catch { /* ignore */ }

    // Helper: get deadline for a person
    function getDeadlines(studentId?: string, teacherId?: string): { dl: string; min: string } {
      // Teacher override
      if (teacherId) {
        const to = (settings.teacher_overrides || []).find((t: any) => t.teacher_id === teacherId)
        if (to) return { dl: to.checkin_deadline, min: to.checkout_minimum }
      }
      // Grade override
      if (studentId) {
        const grade = studentGrades[studentId]
        if (grade) {
          const go = (settings.grade_overrides || []).find((g: any) => g.grade === grade)
          if (go) return { dl: go.checkin_deadline, min: go.checkout_minimum }
        }
      }
      return { dl: globalDeadline, min: globalMinimum }
    }

    const logs: any[] = []

    // ── Fetch student records ─────────────────────
    if (type === 'all' || type === 'student') {
      const filter = `date >= "${date} 00:00:00" && date <= "${date} 23:59:59"`
      const url = `${PB_URL}/api/collections/student_attendance/records?perPage=500&sort=created&filter=${encodeURIComponent(filter)}`
      const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())

      for (const r of (res.items || [])) {
        const notes = r.notes || ''
        const isCheckOut = notes.startsWith('[签退]') || (r.check_out && !notes.startsWith('[签到]'))
        logs.push({
          person_id: r.student_id,
          person_name: r.student_name,
          person_type: 'student',
          center: r.center,
          action: isCheckOut ? 'check_out' : 'check_in',
          timestamp: r.check_in || r.created,
          student_id: r.student_id,
        })
      }
    }

    // ── Fetch teacher records ─────────────────────
    if (type === 'all' || type === 'teacher') {
      const filter = `created >= "${date} 00:00:00" && created <= "${date} 23:59:59"`
      const url = `${PB_URL}/api/collections/teacher_attendance/records?perPage=500&sort=created&filter=${encodeURIComponent(filter)}`
      const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())

      for (const r of (res.items || [])) {
        const notes = r.notes || ''
        const isCheckOut = notes.startsWith('[签退]') || (r.check_out && !notes.startsWith('[签到]'))
        logs.push({
          person_id: r.teacher_id,
          person_name: r.teacher_name,
          person_type: 'teacher',
          center: r.center || r.branch_code,
          action: isCheckOut ? 'check_out' : 'check_in',
          timestamp: r.check_in || r.created,
          teacher_id: r.teacher_id,
        })
      }
    }

    // ── Group by person ─────────────────────────
    const grouped: Record<string, any> = {}
    for (const log of logs) {
      const key = `${log.person_type}:${log.person_id}`
      if (!grouped[key]) {
        grouped[key] = {
          person_id: log.person_id,
          person_name: log.person_name,
          person_type: log.person_type,
          center: log.center,
          student_id: log.student_id,
          teacher_id: log.teacher_id,
          check_ins: [] as { time: string; iso: string }[],
          check_outs: [] as { time: string; iso: string }[],
        }
      }
      const t = parseTime(log.timestamp)
      const entry = { time: t ? timeStr(t) : '', iso: log.timestamp }
      if (log.action === 'check_in') {
        grouped[key].check_ins.push(entry)
      } else {
        grouped[key].check_outs.push(entry)
      }
    }

    // ── Build report with per-person deadlines ──
    const report = Object.values(grouped).map(p => {
      const firstIn = p.check_ins[0] || null
      const lastOut = p.check_outs[p.check_outs.length - 1] || null

      const { dl, min } = getDeadlines(p.student_id, p.teacher_id)

      const isLate = firstIn ? firstIn.time > dl : false
      const isEarly = lastOut ? lastOut.time < min : false

      return {
        person_id: p.person_id,
        person_name: p.person_name,
        person_type: p.person_type,
        center: p.center,
        check_in: firstIn?.iso || null,
        check_in_time: firstIn?.time || null,
        check_out: lastOut?.iso || null,
        check_out_time: lastOut?.time || null,
        total_scans: p.check_ins.length + p.check_outs.length,
        is_late: isLate,
        is_early: isEarly,
        status: !firstIn ? 'absent' : isLate ? 'late' : 'on_time',
        deadline_used: dl,
        minimum_used: min,
      }
    })

    report.sort((a, b) => {
      if (a.person_type !== b.person_type) return a.person_type === 'teacher' ? -1 : 1
      return a.person_name.localeCompare(b.person_name, 'zh')
    })

    // ── Absent students ──────────────────────────
    let absentStudents: any[] = []
    try {
      let studentFilter = 'status="active"'
      if (center) studentFilter += ` && center="${encodeURIComponent(center)}"`
      const studentsUrl = `${PB_URL}/api/collections/students/records?perPage=500&fields=id,name,center,grade&filter=${encodeURIComponent(studentFilter)}`
      const studentsRes = await fetch(studentsUrl, { headers: { Authorization: token } }).then(r => r.json())

      const checkedInIds = new Set(report.filter(r => r.person_type === 'student').map(r => r.person_id))
      absentStudents = (studentsRes.items || [])
        .filter((s: any) => !checkedInIds.has(s.id))
        .map((s: any) => ({
          person_id: s.id,
          person_name: s.name,
          person_type: 'student',
          center: s.center,
          grade: s.grade,
        }))
    } catch { /* ignore */ }

    // ── Stats ────────────────────────────────────
    const checkedIn = report.filter(r => r.check_in).length
    const lateCount = report.filter(r => r.is_late).length
    const earlyCount = report.filter(r => r.is_early).length

    const stats = {
      total: report.length,
      checkedIn,
      checkedOut: report.filter(r => r.check_out).length,
      notCheckedIn: report.filter(r => !r.check_in).length,
      late: lateCount,
      early: earlyCount,
      absent: absentStudents.length,
    }

    return NextResponse.json({
      success: true,
      report,
      stats,
      absent_students: absentStudents,
      date,
      settings: {
        deadline: globalDeadline,
        minimum: globalMinimum,
        grade_overrides: settings.grade_overrides,
        teacher_overrides: settings.teacher_overrides,
        enable_points: settings.enable_points,
      },
    })
  } catch (error: any) {
    console.error('考勤报告失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
