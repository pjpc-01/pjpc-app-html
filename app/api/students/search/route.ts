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

/**
 * GET /api/students/search?q=<query>
 * Searches students by name or student_id (partial match).
 * Returns up to 20 results with id, name, student_id, grade, center, points.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ students: [] })
    }

    const escaped = q.replace(/'/g, "\\'")
    const filter = `(name~'${escaped}' || student_id~'${escaped}') && status!='deleted' && status!='inactive'`
    
    const res = await fetch(
      `${PB_URL}/api/collections/students/records?filter=${encodeURIComponent(filter)}&perPage=20&sort=name`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      return NextResponse.json({ students: [] })
    }
    const data = await res.json()
    const students = (data.items || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      student_id: s.student_id || '',
      grade: s.grade || '',
      center: s.center || '',
      points: s.points || 0,
    }))

    return NextResponse.json({ students })
  } catch (error: any) {
    console.error('Student search failed:', error)
    return NextResponse.json({ students: [], error: error.message }, { status: 500 })
  }
}
