import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()
    
    // Always exclude soft-deleted students
    let pbUrl = `/api/pocketbase-proxy/api/collections/students/records?perPage=500&expand=centerId&filter=(status!='deleted')`
    if (searchParams) pbUrl += `&${searchParams}`
    
    const response = await fetch(`http://127.0.0.1:3001${pbUrl}`, {
      headers: { 'x-pjpc-internal': process.env.PROXY_INTERNAL_KEY || '' },
    })
    
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
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json()
    const response = await fetch(`http://127.0.0.1:3001/api/pocketbase-proxy/api/collections/students/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-pjpc-internal': process.env.PROXY_INTERNAL_KEY || '' },
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
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const body = await request.json()
    const { id, ...studentData } = body
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Student ID is required for update' }, { status: 400 })
    }
    
    const proxyUrl = `http://127.0.0.1:3001/api/pocketbase-proxy/api/collections/students/records/${id}`
    console.log('PUT student:', id, 'keys:', Object.keys(studentData))
    
    const response = await fetch(proxyUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-pjpc-internal': process.env.PROXY_INTERNAL_KEY || '' },
      body: JSON.stringify(studentData)
    })
    
    const respText = await response.text()
    console.log('PB response:', response.status, respText.substring(0, 200))
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: `PB: ${respText}` }, { status: response.status })
    }
    
    return NextResponse.json({ success: true, student: JSON.parse(respText) })
  } catch (error: any) {
    console.error('PUT /api/students ERROR:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
