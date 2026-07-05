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

// GET — 考勤报告：按人按天汇总签到/签退
// Query: ?date=2026-07-05&type=all|student|teacher
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const type = searchParams.get('type') || 'all'

    const logs: any[] = []

    // Fetch student records
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
          timestamp: isCheckOut ? (r.check_in || r.created) : (r.check_in || r.created),
          raw: r,
        })
      }
    }

    // Fetch teacher records
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
          raw: r,
        })
      }
    }

    // Group by person
    const grouped: Record<string, any> = {}
    for (const log of logs) {
      const key = `${log.person_type}:${log.person_id}`
      if (!grouped[key]) {
        grouped[key] = {
          person_id: log.person_id,
          person_name: log.person_name,
          person_type: log.person_type,
          center: log.center,
          check_ins: [] as string[],
          check_outs: [] as string[],
        }
      }
      if (log.action === 'check_in') {
        grouped[key].check_ins.push(log.timestamp)
      } else {
        grouped[key].check_outs.push(log.timestamp)
      }
    }

    // Build report
    const report = Object.values(grouped).map(p => ({
      ...p,
      check_in: p.check_ins[0] || null,           // first check-in
      last_check_in: p.check_ins[p.check_ins.length - 1] || null,
      check_out: p.check_outs[p.check_outs.length - 1] || null,  // last check-out
      total_scans: p.check_ins.length + p.check_outs.length,
    }))

    // Sort: teachers first, then students; then by name
    report.sort((a, b) => {
      if (a.person_type !== b.person_type) return a.person_type === 'teacher' ? -1 : 1
      return a.person_name.localeCompare(b.person_name, 'zh')
    })

    const stats = {
      total: report.length,
      checkedIn: report.filter(r => r.check_in).length,
      checkedOut: report.filter(r => r.check_out).length,
      notCheckedIn: report.filter(r => !r.check_in).length,
    }

    return NextResponse.json({ success: true, report, stats, date })
  } catch (error: any) {
    console.error('考勤报告失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
