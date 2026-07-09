import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  
  try {
    // Auth with local PocketBase
    const authRes = await fetch('http://127.0.0.1:8090/api/admins/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }),
    })
    const authData = await authRes.json()
    const token = authData.token
    if (!token) throw new Error('Auth failed')

    // Build filter
    let filter = ''
    if (id) {
      filter = `id="${id}"`
    } else if (email) {
      filter = `email="${email}"`
    }
    const filterParam = filter ? `&filter=${encodeURIComponent(filter)}` : ''

    // Fetch teachers
    const teachersRes = await fetch(
      `http://127.0.0.1:8090/api/collections/teachers/records?perPage=${limit}&sort=name${filterParam}`,
      { headers: { Authorization: token } }
    )
    const teachersData = await teachersRes.json()
    const teachers = teachersData.items || []

    const processed = teachers.map((t: any) => ({
      id: t.id,
      teacher_id: t.id,
      teacher_name: t.name,
      name: t.name,
      email: t.email || '',
      phone: t.phone || '',
      department: t.department || '',
      position: t.position || '',
      cardNumber: t.cardNumber || '',
      status: t.status || 'active',
      hireDate: t.hireDate || '',
      centerId: t.centerId || '',
      center: t.center || '',
    }))

    return NextResponse.json({
      success: true,
      data: processed,
      total: teachersData.totalItems || processed.length,
    })
  } catch (error) {
    console.error('API teachers error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
