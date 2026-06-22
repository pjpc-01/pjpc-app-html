import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import PocketBase from 'pocketbase'

const POCKETBASE_URL = 'http://127.0.0.1:8090'
const ADMIN_EMAIL = 'final_admin@test.com'
const ADMIN_PASSWORD = 'final_pass'

// Collections that support centerId filtering
const CENTER_AWARE_COLLECTIONS = new Set([
  'students', 'teachers', 'courses',
  'schedules',  // uses 'center' text field (override below)
])

// Map collection name to its centerId field name (default: 'centerId')
const CENTER_FIELD_OVERRIDES: Record<string, string> = {
  'schedules': 'center',  // schedules uses text field 'center', not relation 'centerId'
}

function injectCenterFilter(targetUrl: string, centerId: string): string {
  const url = new URL(targetUrl)
  const pathParts = url.pathname.split('/')
  // Find collection name in path
  // Pattern: /api/collections/{name}/records
  let collectionName = ''
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (pathParts[i] === 'collections' && i + 1 < pathParts.length) {
      collectionName = pathParts[i + 1]
      break
    }
  }

  if (!collectionName || !CENTER_AWARE_COLLECTIONS.has(collectionName)) {
    return targetUrl // Not a center-aware collection, pass through
  }

  // Only inject filter for GET list operations (not single record / expand)
  const isRecordList = url.pathname.endsWith('/records') || 
                       url.pathname.includes('/records?')
  if (!isRecordList && !url.pathname.includes('?')) {
    return targetUrl
  }

  const centerField = CENTER_FIELD_OVERRIDES[collectionName] || 'centerId'
  const existingFilter = url.searchParams.get('filter')
  // Pass raw filter — url.searchParams.set() handles URL encoding
  const centerFilter = `${centerField}="${centerId}"`

  if (existingFilter) {
    // Merge with AND logic using PB's && operator
    // Both existingFilter and centerFilter are decoded — set() will re-encode
    url.searchParams.set('filter', `(${existingFilter})&&(${centerFilter})`)
  } else {
    url.searchParams.set('filter', centerFilter)
  }

  return url.toString()
}

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

    let targetUrl = `${POCKETBASE_URL}${path}${searchParams ? `?${searchParams}` : ''}`

    // Inject center filter from cookie (set by sidebar branch tabs)
    const centerId = request.cookies.get('selectedCenter')?.value
    if (centerId && centerId !== 'all') {
      targetUrl = injectCenterFilter(targetUrl, centerId)
    }
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
    const targetUrl = `${POCKETBASE_URL}${path}`
    
    const contentType = request.headers.get('content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')
    
    if (isMultipart) {
      // Forward multipart/form-data as-is (for file uploads like expense receipts)
      const formData = await request.formData()
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do NOT set Content-Type — fetch will set it with the correct boundary
        },
        body: formData
      })
      const data = await response.text()
      return new NextResponse(data, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      // Existing JSON logic
      const body = await request.text()
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
    }
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
