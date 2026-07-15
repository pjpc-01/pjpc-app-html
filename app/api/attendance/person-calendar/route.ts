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

// GET — 单人月度考勤日历
// Query: ?person_id=B10&person_type=student&month=2026-07
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const person_id = searchParams.get('person_id')
    const person_type = searchParams.get('person_type') || 'student'
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

    if (!person_id) {
      return NextResponse.json({ error: '缺少 person_id' }, { status: 400 })
    }

    const isTeacher = person_type === 'teacher'
    const collection = isTeacher ? 'teacher_attendance' : 'student_attendance'
    const idField = isTeacher ? 'teacher_id' : 'student_id'

    // Fetch all records for this person in the given month
    const startDate = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const endDate = new Date(y, m, 0).toISOString().split('T')[0] // last day of month

    const filter = `${idField}="${person_id}" && created >= "${startDate} 00:00:00" && created <= "${endDate} 23:59:59"`

    const url = `${PB_URL}/api/collections/${collection}/records?perPage=100&sort=created&filter=${encodeURIComponent(filter)}`
    const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())

    // Build calendar map: date → { check_ins: [...], check_outs: [...] }
    const calendar: Record<string, { check_ins: string[]; check_outs: string[] }> = {}

    for (const r of (res.items || [])) {
      const date = (r.date || r.created || '').split('T')[0].split(' ')[0]
      if (!date) continue

      if (!calendar[date]) calendar[date] = { check_ins: [], check_outs: [] }

      const notes = r.notes || ''
      const ts = r.check_in || r.created
      if (notes.startsWith('[签退]') || r.check_out) {
        calendar[date].check_outs.push(ts)
      } else {
        calendar[date].check_ins.push(ts)
      }
    }

    // Also get person name
    const personCollection = isTeacher ? 'teachers' : 'students'
    const personRes = await fetch(
      `${PB_URL}/api/collections/${personCollection}/records?perPage=1&filter=id="${person_id}"`,
      { headers: { Authorization: token } }
    ).then(r => r.json())
    const personName = personRes.items?.[0]?.name || person_id

    return NextResponse.json({
      success: true,
      person_id,
      person_type,
      person_name: personName,
      month,
      calendar,
      total_days: Object.keys(calendar).length,
    })
  } catch (error: any) {
    console.error('个人考勤报告失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
