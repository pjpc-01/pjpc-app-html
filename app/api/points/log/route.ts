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

// GET: Points history for a student
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!studentId) {
      return NextResponse.json({ error: '缺少 student_id' }, { status: 400 })
    }

    const filter = encodeURIComponent(`student="${studentId}"`)
    const res = await fetch(
      `${PB_URL}/api/collections/point_logs/records?perPage=${limit}&sort=-created&filter=${filter}&expand=teacher`,
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
      created: item.created,
    }))

    return NextResponse.json({ logs, total: data.totalItems || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
