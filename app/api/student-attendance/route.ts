import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  return (await res.json()).token
}

// GET - 获取考勤记录（统一学生+教师，支持筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const personType = searchParams.get('type') // 'student' | 'teacher' | 'all'
    const date = searchParams.get('date')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const limit = Math.min(pageSize, 200)

    const token = await pbAuth()

    let allRecords: any[] = []

    // Fetch student attendance
    if (!personType || personType === 'all' || personType === 'student') {
      const studentFilters: string[] = []
      if (center) studentFilters.push(`center="${center}"`)
      if (date) studentFilters.push(`date >= "${date} 00:00:00" && date <= "${date} 23:59:59"`)
      if (search) studentFilters.push(`(student_name~"${search}" || student_id~"${search}")`)

      const sFilter = studentFilters.join(' && ')
      const sUrl = `${PB_URL}/api/collections/student_attendance/records?page=1&perPage=${limit}&sort=-created${sFilter ? `&filter=${encodeURIComponent(sFilter)}` : ''}`
      const sRes = await fetch(sUrl, { headers: { Authorization: token } })
      const sData = await sRes.json()

      for (const r of (sData.items || [])) {
        allRecords.push({
          id: r.id,
          person_id: r.student_id,
          person_name: r.student_name,
          person_type: 'student',
          center: r.center || r.branch_name || '',
          date: r.date,
          check_in: r.check_in || '',
          check_out: r.check_out || '',
          status: r.check_out ? 'completed' : r.check_in ? 'checked_in' : 'absent',
          method: r.method || '',
          notes: r.notes || '',
          collection: 'student_attendance',
        })
      }
    }

    // Fetch teacher attendance
    if (!personType || personType === 'all' || personType === 'teacher') {
      const teacherFilters: string[] = []
      if (center) teacherFilters.push(`center="${center}"`)
      if (date) teacherFilters.push(`date >= "${date} 00:00:00" && date <= "${date} 23:59:59"`)
      if (search) teacherFilters.push(`(teacher_name~"${search}" || teacher_id~"${search}")`)

      const tFilter = teacherFilters.join(' && ')
      const tUrl = `${PB_URL}/api/collections/teacher_attendance/records?page=1&perPage=${limit}&sort=-created${tFilter ? `&filter=${encodeURIComponent(tFilter)}` : ''}`
      const tRes = await fetch(tUrl, { headers: { Authorization: token } })
      const tData = await tRes.json()

      for (const r of (tData.items || [])) {
        allRecords.push({
          id: r.id,
          person_id: r.teacher_id,
          person_name: r.teacher_name,
          person_type: 'teacher',
          center: r.center || r.branch_name || '',
          date: r.date,
          check_in: r.check_in || '',
          check_out: r.check_out || '',
          status: r.check_out ? 'completed' : r.check_in ? 'checked_in' : 'absent',
          method: r.method || '',
          notes: r.notes || '',
          collection: 'teacher_attendance',
        })
      }
    }

    // Sort by check_in time descending
    allRecords.sort((a, b) => {
      const aTime = a.check_in || ''
      const bTime = b.check_in || ''
      return bTime.localeCompare(aTime)
    })

    // Paginate
    const total = allRecords.length
    const start = (page - 1) * pageSize
    const paginated = allRecords.slice(start, start + pageSize)

    return NextResponse.json({
      success: true,
      records: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error: any) {
    console.error('获取考勤记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取考勤记录失败', details: error.message },
      { status: 500 }
    )
  }
}
