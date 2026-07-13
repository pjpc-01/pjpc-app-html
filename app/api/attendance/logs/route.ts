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

export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const type = searchParams.get('type') || 'all'
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const records: any[] = []

    // ── Student records ─────────────────────────
    if (type === 'all' || type === 'student') {
      const filter = `date >= "${date} 00:00:00" && date <= "${date} 23:59:59"`
      const url = `${PB_URL}/api/collections/student_attendance/records?perPage=${pageSize}&sort=-created&filter=${encodeURIComponent(filter)}`
      const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())

      for (const r of (res.items || [])) {
        const notes = r.notes || ''
        const isCheckOut = notes.startsWith('[签退]') || (r.check_out && !notes.startsWith('[签到]'))
        records.push({
          id: r.id,
          person_id: r.student_id,
          person_name: r.student_name,
          person_type: 'student',
          center: r.center || '',
          action: isCheckOut ? '签退' : '签到',
          action_key: isCheckOut ? 'check_out' : 'check_in',
          timestamp: r.check_in || r.created,
          date: r.date,
          method: r.method || 'nfc',
          notes: r.notes || '',
        })
      }
    }

    // ── Teacher records ─────────────────────────
    if (type === 'all' || type === 'teacher') {
      const filter = `created >= "${date} 00:00:00" && created <= "${date} 23:59:59"`
      const url = `${PB_URL}/api/collections/teacher_attendance/records?perPage=${pageSize}&sort=-created&filter=${encodeURIComponent(filter)}`
      const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())

      for (const r of (res.items || [])) {
        const notes = r.notes || ''
        const isCheckOut = notes.startsWith('[签退]') || (r.check_out && !notes.startsWith('[签到]'))
        records.push({
          id: r.id,
          person_id: r.teacher_id,
          person_name: r.teacher_name,
          person_type: 'teacher',
          center: r.center || r.branch_code || '',
          action: isCheckOut ? '签退' : '签到',
          action_key: isCheckOut ? 'check_out' : 'check_in',
          timestamp: r.check_in || r.created,
          date: r.date,
          method: r.method || 'nfc',
          notes: r.notes || '',
        })
      }
    }

    // Sort by timestamp descending
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ success: true, records, total: records.length })
  } catch (error: any) {
    console.error('考勤日志失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
