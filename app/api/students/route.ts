import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()
    
    // Forward the request to the authenticated proxy
    // This avoids rewriting every single frontend hook and ensures Admin auth is used
    const proxyUrl = `/api/pocketbase-proxy/api/collections/students/records${searchParams ? `?${searchParams}` : ''}`
    
    const response = await fetch(`${new URL(request.url).origin}${proxyUrl}`)
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Proxy error' }, { status: response.status })
    }
    
    const data = await response.json()
    
    // PocketBase returns records in an 'items' array
    return NextResponse.json({
      success: true,
      students: data.items || []
    })
  } catch (error: any) {
    console.error('Students API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetch(`${new URL(request.url).origin}/api/pocketbase-proxy/api/collections/students/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Proxy create error' }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json({ success: true, student: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
