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

// GET: Points transaction log
//   ?student_id=xxx  → single student history
//   (no student_id)  → all transactions (paginated)
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')
    const center = searchParams.get('center') || ''

    let filter = ''
    if (studentId) {
      filter = `student="${studentId}"`
    }
    if (center && center !== 'all') {
      const cf = `student.center="${center}"`
      filter = filter ? `${filter}&&${cf}` : cf
    }

    const params = new URLSearchParams({
      perPage: String(limit),
      page: String(page),
      sort: '-created',
      expand: 'teacher,student',
    })
    if (filter) params.set('filter', filter)

    const res = await fetch(
      `${PB_URL}/api/collections/point_logs/records?${params}`,
      { headers: { Authorization: token } }
    )
    const data = await res.json()

    const logs = (data.items || []).map((item: any) => ({
      id: item.id,
      amount: item.amount,
      reason: item.reason || '',
      points_before: item.points_before,
      points_after: item.points_after,
      teacher_name: item.expand?.teacher?.name || '系统',
      student_name: item.expand?.student?.name || '未知',
      student_id: item.student || '',
      created: item.created,
    }))

    return NextResponse.json({ logs, total: data.totalItems || 0, page, totalPages: data.totalPages || 1 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
