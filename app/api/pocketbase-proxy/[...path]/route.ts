import { NextRequest, NextResponse } from 'next/server'

const POCKETBASE_URL = 'http://127.0.0.1:8090'
const ADMIN_EMAIL = 'final_admin@test.com'
const ADMIN_PASSWORD = 'final_pass'

async function getAdminToken() {
  const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.token
}

export async function GET(request: NextRequest) {
  const token = await getAdminToken()
  if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 500 })

  const url = new URL(request.url)
  const path = url.pathname.replace('/api/pocketbase-proxy', '')
  const targetUrl = `${POCKETBASE_URL}${path}${url.search}`

  const response = await fetch(targetUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: NextRequest) {
  const token = await getAdminToken()
  if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 500 })

  const url = new URL(request.url)
  const path = url.pathname.replace('/api/pocketbase-proxy', '')
  const targetUrl = `${POCKETBASE_URL}${path}`

  const body = await request.text()
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body
  })

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function PATCH(request: NextRequest) {
  const token = await getAdminToken()
  if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 500 })

  const url = new URL(request.url)
  const path = url.pathname.replace('/api/pocketbase-proxy', '')
  const targetUrl = `${POCKETBASE_URL}${path}`

  const body = await request.text()
  const response = await fetch(targetUrl, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body
  })

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function DELETE(request: NextRequest) {
  const token = await getAdminToken()
  if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 500 })

  const url = new URL(request.url)
  const path = url.pathname.replace('/api/pocketbase-proxy', '')
  const targetUrl = `${POCKETBASE_URL}${path}`

  const response = await fetch(targetUrl, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  })
}
