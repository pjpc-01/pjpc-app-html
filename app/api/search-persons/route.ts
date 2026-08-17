import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

// GET — 搜索学生/教师
// Query: ?q=张
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const q = request.nextUrl.searchParams.get('q') || ''
    if (q.length < 1) return NextResponse.json({ students: [], teachers: [] })

    // 学生/教师都只显示 active（排除 deleted/inactive/lost/graduated/withdrawn/transferred）
    const studentFilter = `name~"${q}" && status="active"`
    const teacherFilter = `name~"${q}" && status="active"`
    const encStudent = encodeURIComponent(studentFilter)
    const encTeacher = encodeURIComponent(teacherFilter)

    const [sRes, tRes] = await Promise.all([
      fetch(`${PB_URL}/api/collections/students/records?perPage=8&filter=${encStudent}`, {
        headers: { Authorization: token },
      }).then(r => r.json()),
      fetch(`${PB_URL}/api/collections/teachers/records?perPage=8&filter=${encTeacher}`, {
        headers: { Authorization: token },
      }).then(r => r.json()),
    ])

    return NextResponse.json({
      success: true,
      students: (sRes.items || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'student',
      })),
      teachers: (tRes.items || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        type: 'teacher',
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}