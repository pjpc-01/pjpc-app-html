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

// GET: list all devices
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const url = new URL(request.url)
    const center = url.searchParams.get('center')

    let filter = ''
    if (center) filter = `center="${center}"`

    const res = await fetch(
      `${PB_URL}/api/collections/nfc_devices/records?perPage=100&sort=-created&filter=${encodeURIComponent(filter)}`,
      { headers: { Authorization: token } }
    )
    const data = await res.json()
    return NextResponse.json({ success: true, data: data.items || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: register a new device
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()

    const res = await fetch(`${PB_URL}/api/collections/nfc_devices/records`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: body.name || 'New Device',
        location: body.location || '',
        deviceType: body.deviceType || 'nfc',
        status: body.status || 'offline',
        ipAddress: body.ipAddress || '',
        port: body.port || null,
        center: body.center || '',
        notes: body.notes || '',
      }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: update device
export async function PATCH(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const res = await fetch(`${PB_URL}/api/collections/nfc_devices/records/${id}`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
