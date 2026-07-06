import { NextRequest, NextResponse } from 'next/server'

const POCKETBASE_URL = 'http://127.0.0.1:8090'
const ADMIN_EMAIL = 'final_admin@test.com'
const ADMIN_PASSWORD = 'final_pass'

// Token cache — avoid re-auth on every request
let cachedToken: string | null = null
let tokenExpiry = 0

async function getAdminToken() {
  const now = Date.now()
  if (cachedToken && now < tokenExpiry) return cachedToken

  const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!response.ok) return null
  const data = await response.json()
  cachedToken = data.token
  tokenExpiry = now + 120_000 // 2 min cache
  return data.token
}

async function proxyRequest(method: string, request: NextRequest) {
  const token = await getAdminToken()
  if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 500 })

  const url = new URL(request.url)
  const path = url.pathname.replace('/api/pocketbase-proxy', '')
  const targetUrl = `${POCKETBASE_URL}${path}${method === 'GET' ? url.search : ''}`

  const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` }
  let body: string | undefined

  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json'
    body = await request.text()
  }

  const response = await fetch(targetUrl, { method, headers, body })

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const data = await response.text()
  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function GET(req: NextRequest)    { return proxyRequest('GET', req) }
export async function POST(req: NextRequest)   { return proxyRequest('POST', req) }
export async function PATCH(req: NextRequest)  { return proxyRequest('PATCH', req) }
export async function DELETE(req: NextRequest) { return proxyRequest('DELETE', req) }
