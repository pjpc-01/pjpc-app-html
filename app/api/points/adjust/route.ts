import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { applyPoints } from '@/lib/points'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

// POST: Adjust student points (+/-)
// Body: { student_id, amount, reason, teacher_id }
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  try {
    const token = await pbAuth()
    const { student_id, amount, reason, teacher_id } = await request.json()

    if (!student_id || amount === undefined) {
      return NextResponse.json({ success: false, error: '缺少 student_id 或 amount' }, { status: 400 })
    }

    if (Number(amount) === 0) {
      return NextResponse.json({ success: false, error: '调整金额不能为 0' }, { status: 400 })
    }

    // 唯一写入口：并发安全 + 必写流水 + 写失败抛错
    // 这个入口原来允许扣成负数（业务未定），所以不设 floorAtZero
    const result = await applyPoints({
      studentId: student_id,
      delta: Number(amount),
      reason: String(reason || '').trim() || '老师手动调整',
      teacherId: teacher_id,
      token,
    })

    return NextResponse.json({
      success: true,
      student_name: result.studentName,
      points_before: result.before,
      points_after: result.after,
      amount: result.applied,
      log_id: result.logId,
    })
  } catch (error: any) {
    console.error('Points adjust 失败:', error)
    const status = Number(error?.httpStatus) || 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}

// GET: Get student's current points
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
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
