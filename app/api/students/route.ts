import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()
    
    const origin = new URL(request.url).origin.replace('https://', 'http://')
    // Always exclude soft-deleted students
    let pbUrl = `/api/pocketbase-proxy/api/collections/students/records?perPage=500&expand=centerId&filter=(status!='deleted')`
    if (searchParams) pbUrl += `&${searchParams}`
    const proxyUrl = pbUrl
    
    const response = await fetch(`${origin}${proxyUrl}`)
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Proxy error' }, { status: response.status })
    }
    
    const data = await response.json()
    
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...studentData } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required for update' }, { status: 400 })
    }
    
    const response = await fetch(`${new URL(request.url).origin}/api/pocketbase-proxy/api/collections/students/records/${id}`, {
      method: 'PATCH', // PocketBase uses PATCH for updates
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    })
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Proxy update error' }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json({ success: true, student: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
