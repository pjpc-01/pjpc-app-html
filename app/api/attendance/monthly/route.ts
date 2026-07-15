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

// GET — 月考勤汇总
// Query: ?month=2026-07&center=BATU14&type=student|teacher|all
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
    const center = searchParams.get('center') || ''
    const type = searchParams.get('type') || 'student'

    // ── Load settings ──────────────────────────────
    let settings: any = {
      checkin_deadline: "14:00",
      checkout_minimum: "17:00",
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

    const deadline = settings.checkin_deadline

    // ── Calculate date range ──────────────────────
    const [y, m] = month.split('-').map(Number)
    const startDate = `${month}-01`
    const lastDay = new Date(y, m, 0).getDate()  // m is 1-indexed here, 0 gives last day of prev month
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`
    const workingDays = getWorkingDays(y, m)  // Mon-Fri count

    // ── Fetch all students if needed ──────────────
    let students: any[] = []
    if (type === 'student' || type === 'all') {
      let filter = 'status="active"'
      if (center) filter += ` && center="${encodeURIComponent(center)}"`
      const url = `${PB_URL}/api/collections/students/records?perPage=500&fields=id,name,center,grade&filter=${encodeURIComponent(filter)}`
      const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())
      students = res.items || []
    }

    // ── Fetch attendance for the month ────────────
    const monthFilter = `date >= "${startDate} 00:00:00" && date <= "${endDate} 23:59:59"`
    const attUrl = `${PB_URL}/api/collections/student_attendance/records?perPage=10000&sort=created&filter=${encodeURIComponent(monthFilter)}`
    const attRes = await fetch(attUrl, { headers: { Authorization: token } }).then(r => r.json())
    const records = attRes.items || []

    // ── Group by student ──────────────────────────
    const studentDays: Record<string, Set<string>> = {}       // studentId -> Set of unique dates
    const studentLate: Record<string, number> = {}            // studentId -> late count
    const studentEarly: Record<string, number> = {}           // studentId -> early count
    const studentRecords: Record<string, any[]> = {}          // studentId -> records

    for (const r of records) {
      const sid = r.student_id
      if (!studentDays[sid]) {
        studentDays[sid] = new Set()
        studentLate[sid] = 0
        studentEarly[sid] = 0
        studentRecords[sid] = []
      }
      studentDays[sid].add((r.date || '').split(' ')[0])
      studentRecords[sid].push(r)

      // Check late/early
      const notes = r.notes || ''
      const isCheckOut = notes.startsWith('[签退]')
      const t = r.check_in || r.created
      try {
        const d = new Date(t)
        const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        if (!isCheckOut && timeStr > deadline) {
          studentLate[sid] = (studentLate[sid] || 0) + 1
        }
      } catch { /* ignore */ }
    }

    // ── Build summary ─────────────────────────────
    const summary = students.map(s => {
      const present = studentDays[s.id]?.size || 0
      const absent = Math.max(0, workingDays - present)
      const late = studentLate[s.id] || 0
      const rate = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0
      const records = studentRecords[s.id] || []

      return {
        student_id: s.id,
        student_name: s.name,
        center: s.center,
        grade: s.grade,
        working_days: workingDays,
        present_days: present,
        absent_days: absent,
        late_count: late,
        attendance_rate: rate,
        records_count: records.length,
      }
    })

    // Sort: worst attendance first
    summary.sort((a, b) => a.attendance_rate - b.attendance_rate)

    // ── Aggregated stats ──────────────────────────
    const total = summary.length
    const avgRate = total > 0 ? Math.round(summary.reduce((s, x) => s + x.attendance_rate, 0) / total) : 0
    const perfectAttendance = summary.filter(x => x.absent_days === 0).length

    return NextResponse.json({
      success: true,
      month,
      working_days: workingDays,
      summary,
      stats: {
        total_students: total,
        average_rate: avgRate,
        perfect_attendance: perfectAttendance,
        total_absent: summary.reduce((s, x) => s + x.absent_days, 0),
        total_late: summary.reduce((s, x) => s + x.late_count, 0),
      },
      settings: { deadline },
    })
  } catch (error: any) {
    console.error('月考勤汇总失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Count Mon-Fri days in a month
function getWorkingDays(year: number, month: number): number {
  let count = 0
  const days = new Date(year, month, 0).getDate()
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow !== 0 && dow !== 6) count++  // Mon-Fri
  }
  return count
}
