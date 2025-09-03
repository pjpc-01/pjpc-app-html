import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const teacherId = searchParams.get('teacher_id')
    const status = searchParams.get('status')

    await authenticateAdmin()

    let filter = ''
    const conditions = []
    if (teacherId) conditions.push(`teacher_id = "${teacherId}"`)
    if (status) conditions.push(`status = "${status}"`)

    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    const courses = await pb.collection('courses').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'teacher_id'
    })

    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    console.error('❌ 获取课程列表失败:', error)
    return NextResponse.json(
      { error: '获取课程列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const {
      title, description, subject, grade_level, teacher_id, duration,
      max_students, status = 'active', start_date, end_date
    } = body

    if (!title || !subject || !teacher_id) {
      return NextResponse.json(
        { error: '缺少必需字段: title, subject, teacher_id' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    const courseData = {
      title,
      description: description || '',
      subject,
      grade_level: grade_level || '',
      teacher_id,
      duration: duration || 60,
      max_students: max_students || 30,
      status,
      start_date: start_date || null,
      end_date: end_date || null
    }

    const course = await pb.collection('courses').create(courseData)
    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error('❌ 创建课程失败:', error)
    return NextResponse.json(
      { error: '创建课程失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: '缺少课程ID' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    const course = await pb.collection('courses').update(id, updateData)
    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    console.error('❌ 更新课程失败:', error)
    return NextResponse.json(
      { error: '更新课程失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '缺少课程ID' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    await pb.collection('courses').delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ 删除课程失败:', error)
    return NextResponse.json(
      { error: '删除课程失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}