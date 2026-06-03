import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import PocketBase from 'pocketbase'

const POCKETBASE_URL = 'http://127.0.0.1:8090'
const ADMIN_EMAIL = 'final_admin@test.com'
const ADMIN_PASSWORD = 'final_pass'

async function getAdminToken() {
  try {
    const response = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    })

    if (!response.ok) {
      console.error('❌ Auth Request Failed:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('❌ Auth Fetch Error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAdminToken()
    if (!token) return NextResponse.json({ error: 'Admin Token missing' }, { status: 401 })

    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    const searchParams = url.searchParams.toString()
    
    const targetUrl = `${POCKETBASE_URL}${path}${searchParams ? `?${searchParams}` : ''}`
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: 'Proxy GET failed', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAdminToken()
    if (!token) return NextResponse.json({ error: 'Admin Token missing' }, { status: 401 })

    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    const body = await request.text()
    
    const targetUrl = `${POCKETBASE_URL}${path}`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body
    })
    
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Proxy POST failed', details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getAdminToken()
    if (!token) return NextResponse.json({ error: 'Admin Token missing' }, { status: 401 })

    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    const body = await request.text()
    
    const targetUrl = `${POCKETBASE_URL}${path}`
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body
    })
    
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Proxy PUT failed', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getAdminToken()
    if (!token) return NextResponse.json({ error: 'Admin Token missing' }, { status: 401 })

    const url = new URL(request.url)
    const path = url.pathname.replace('/api/pocketbase-proxy', '')
    
    const targetUrl = `${POCKETBASE_URL}${path}`
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
    
    const data = await response.text()
    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Proxy DELETE failed', details: error.message }, { status: 500 })
  }
}
