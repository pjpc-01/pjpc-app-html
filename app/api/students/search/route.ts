import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
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
    const filter = `(name~'${escaped}' || student_id~'${escaped}') && status='active' && points_enabled!=false`
    
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
