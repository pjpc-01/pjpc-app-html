import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const classId = searchParams.get('class_id')
    const studentId = searchParams.get('student_id')
    const status = searchParams.get('status')

    await authenticateAdmin()

    let filter = ''
    const conditions = []
    if (classId) conditions.push(`class_id = "${classId}"`)
    if (studentId) conditions.push(`student_id = "${studentId}"`)
    if (status) conditions.push(`status = "${status}"`)

    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    const enrollments = await pb.collection('class_enrollments').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'class_id,student_id'
    })

    return NextResponse.json({ success: true, data: enrollments })
  } catch (error) {
    console.error('❌ 获取班级注册列表失败:', error)
    return NextResponse.json(
      { error: '获取班级注册列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { class_id, student_id, enrollment_date, status = 'active' } = body

    if (!class_id || !student_id) {
      return NextResponse.json(
        { error: '缺少必需字段: class_id, student_id' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    // 检查是否已经注册
    const existingEnrollment = await pb.collection('class_enrollments').getList(1, 1, {
      filter: `class_id = "${class_id}" && student_id = "${student_id}" && status = "active"`
    })

    if (existingEnrollment.items.length > 0) {
      return NextResponse.json(
        { error: '学生已经在该班级中' },
        { status: 400 }
      )
    }

    const enrollmentData = {
      class_id,
      student_id,
      enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
      status
    }

    const enrollment = await pb.collection('class_enrollments').create(enrollmentData)

    // 更新班级当前学生数
    const classRecord = await pb.collection('classes').getOne(class_id)
    const currentStudents = await pb.collection('class_enrollments').getList(1, 1000, {
      filter: `class_id = "${class_id}" && status = "active"`
    })

    await pb.collection('classes').update(class_id, {
      current_students: currentStudents.totalItems
    })

    return NextResponse.json({ success: true, data: enrollment })
  } catch (error) {
    console.error('❌ 创建班级注册失败:', error)
    return NextResponse.json(
      { error: '创建班级注册失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}