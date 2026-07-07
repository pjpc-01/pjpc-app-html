import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

// POST: Adjust student points (+/-)
// Body: { student_id, amount, reason, teacher_id }
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { student_id, amount, reason, teacher_id } = await request.json()

    if (!student_id || amount === undefined) {
      return NextResponse.json({ success: false, error: '缺少 student_id 或 amount' }, { status: 400 })
    }

    if (amount === 0) {
      return NextResponse.json({ success: false, error: '调整金额不能为 0' }, { status: 400 })
    }

    // 1. Get student current points
    const studentRes = await fetch(
      `${PB_URL}/api/collections/students/records/${student_id}`,
      { headers: { Authorization: token } }
    )
    if (!studentRes.ok) {
      return NextResponse.json({ success: false, error: '学生不存在' }, { status: 404 })
    }
    const student = await studentRes.json()
    const currentPoints = student.points || 0
    const newPoints = currentPoints + amount

    // 2. Update student points
    await fetch(
      `${PB_URL}/api/collections/students/records/${student_id}`,
      {
        method: 'PATCH',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints }),
      }
    )

    // 3. Log the transaction
    const logData: any = {
      student: student_id,
      amount: amount,
      reason: reason || '',
      points_before: currentPoints,
      points_after: newPoints,
    }
    if (teacher_id) {
      logData.teacher = teacher_id
    }

    await fetch(
      `${PB_URL}/api/collections/point_logs/records`,
      {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      }
    )

    // 4. Also update the points collection (total_points)
    const pointsFilter = encodeURIComponent(`studentId="${student_id}"`)
    const pointsRes = await fetch(
      `${PB_URL}/api/collections/points/records?perPage=1&filter=${pointsFilter}`,
      { headers: { Authorization: token } }
    )
    const pointsData = await pointsRes.json()
    if (pointsData.items?.length > 0) {
      const pointRecord = pointsData.items[0]
      const oldTotal = pointRecord.total_points || 0
      await fetch(
        `${PB_URL}/api/collections/points/records/${pointRecord.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ total_points: oldTotal + amount }),
        }
      )
    }

    return NextResponse.json({
      success: true,
      student_name: student.name,
      points_before: currentPoints,
      points_after: newPoints,
      amount: amount,
    })
  } catch (error: any) {
    console.error('Points adjust 失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET: Get student's current points
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: '缺少 student_id' }, { status: 400 })
    }

    const studentRes = await fetch(
      `${PB_URL}/api/collections/students/records/${studentId}`,
      { headers: { Authorization: token } }
    )
    if (!studentRes.ok) {
      return NextResponse.json({ error: '学生不存在' }, { status: 404 })
    }
    const student = await studentRes.json()

    return NextResponse.json({
      id: student.id,
      name: student.name,
      student_id: student.student_id,
      grade: student.grade || '',
      center: student.center || '',
      points: student.points || 0,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
