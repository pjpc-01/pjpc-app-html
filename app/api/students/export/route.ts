import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  try {
    const origin = new URL(request.url).origin.replace('https://', 'http://')
    const response = await fetch(`${origin}/api/pocketbase-proxy/api/collections/students/records?perPage=500`, {
      headers: { 'x-pjpc-internal': process.env.PROXY_INTERNAL_KEY || '' },
    })
    
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Proxy error' }, { status: response.status })
    }
    
    const data = await response.json()
    const students = data.items || []
    
    // Convert to CSV
    const headers = ["Name", "Student ID", "Grade", "DOB", "Parent Phone", "Address", "Gender", "Status"]
    const csvRows = [headers.join(",")]
    
    for (const s of students) {
      const row = [
        `"${s.name || ''}"`,
        `"${s.student_id || ''}"`,
        `"${s.grade || ''}"`,
        `"${s.dob || ''}"`,
        `"${s.parentPhone || ''}"`,
        `"${s.address || ''}"`,
        `"${s.gender || ''}"`,
        `"${s.status || ''}"`
      ]
      csvRows.push(row.join(","))
    }
    
    const csvContent = csvRows.join("\\n")
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=students_export.csv'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
