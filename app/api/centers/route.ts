import { NextRequest, NextResponse } from 'next/server'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'final_admin@test.com', password: 'final_pass' }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Auth failed: ${res.status} ${text.slice(0, 100)}`)
  }
  const data = await res.json()
  return data.token
}

export async function GET() {
  try {
    const token = await getAdminToken()
    
    // Get centers via fetch
    const centersRes = await fetch(`${PB_URL}/api/collections/centers/records?sort=name&perPage=100`, {
      headers: { Authorization: token },
    })
    if (!centersRes.ok) {
      const text = await centersRes.text()
      return NextResponse.json({ success: false, error: text.slice(0, 200) }, { status: 500 })
    }
    const centersData = await centersRes.json()
    const records = centersData.items || []
    
    // Get student counts
    const studentsRes = await fetch(`${PB_URL}/api/collections/students/records?perPage=500&fields=id,centerId,center,status`, {
      headers: { Authorization: token },
    })
    const studentsData = await studentsRes.json()
    const students = studentsData.items || []

    const countMap: Record<string, number> = {}
    students.forEach((s: any) => {
      const id = s.centerId || s.center
      if (id && s.status === 'active') {
        countMap[id] = (countMap[id] || 0) + 1
      }
    })

    const data = records.map((r: any) => ({
      ...r,
      studentCount: countMap[r.id] || 0,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[centers] GET error:', error?.message, error?.stack?.slice(0, 200))
    return NextResponse.json(
      { success: false, error: error?.message || '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const body = await request.json()
    
    const res = await fetch(`${PB_URL}/api/collections/centers/records`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text.slice(0, 200))
    }
    
    const record = await res.json()
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const body = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    
    const res = await fetch(`${PB_URL}/api/collections/centers/records/${id}`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text.slice(0, 200))
    }
    
    const record = await res.json()
    return NextResponse.json({ success: true, data: record })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getAdminToken()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    
    const res = await fetch(`${PB_URL}/api/collections/centers/records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    })
    
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text.slice(0, 200))
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
