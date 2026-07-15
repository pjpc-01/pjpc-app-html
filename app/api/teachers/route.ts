import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  
  try {
    // Auth with local PocketBase
    const authRes = await fetch('http://127.0.0.1:8090/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: process.env.POCKETBASE_ADMIN_EMAIL || 'final_admin@test.com', password: process.env.POCKETBASE_ADMIN_PASSWORD || 'final_pass' }),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔧 API: creating teacher from form data:', body)

    // Auth
    const authRes = await fetch('http://127.0.0.1:8090/api/collections/_superusers/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: process.env.POCKETBASE_ADMIN_EMAIL || 'final_admin@test.com', password: process.env.POCKETBASE_ADMIN_PASSWORD || 'final_pass' }),
    })
    const authData = await authRes.json()
    const token = authData.token
    if (!token) throw new Error('Auth failed')

    // Map form fields to PB teacher fields
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const v = body[k]
        if (v !== undefined) return v
      }
      return undefined
    }

    const data: any = {}
    if (get('name') !== undefined) data.name = get('name')
    if (get('email') !== undefined && get('email') !== '') data.email = get('email')
    if (get('phone') !== undefined) data.phone = get('phone')
    if (get('department') !== undefined) data.department = get('department')
    if (get('hireDate') !== undefined) data.hireDate = get('hireDate')
    if (get('nfc_card_number', 'cardNumber') !== undefined) data.cardNumber = get('nfc_card_number', 'cardNumber')
    if (get('resignationDate') !== undefined && get('resignationDate') !== '') data.resignationDate = get('resignationDate')

    // Defaults
    data.status = 'active'

    console.log('🔧 Creating teacher with data:', data)

    const res = await fetch('http://127.0.0.1:8090/api/collections/teachers/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify(data),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('❌ PB create teacher failed:', result)
      return NextResponse.json({
        success: false,
        error: result.message || '创建教师失败',
      }, { status: 500 })
    }

    console.log('✅ Teacher created:', result)

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        name: result.name,
        email: result.email || '',
        phone: result.phone || '',
        department: result.department || '',
        position: result.position || '',
        cardNumber: result.cardNumber || '',
        status: result.status || 'active',
        hireDate: result.hireDate || '',
      },
      message: '教师添加成功',
    })
  } catch (error) {
    console.error('API create teacher error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
