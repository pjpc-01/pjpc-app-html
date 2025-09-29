import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const teacherId = searchParams.get('teacher_id')
    const center = searchParams.get('center')
    const status = searchParams.get('status')

    await authenticateAdmin(pb)

    let filter = ''
    const conditions = []
    if (teacherId) conditions.push(`teacher_id = "${teacherId}"`)
    if (center) conditions.push(`center.name = "${center}"`)
    if (status) conditions.push(`status = "${status}"`)

    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    try {
      const classes = await pb.collection('classes').getList(page, perPage, {
        filter,
        sort: '-created',
        expand: 'course_id,teacher_id'
      })

      return NextResponse.json({ success: true, data: classes })
    } catch (collectionError: any) {
      console.log('⚠️ classes 集合可能不存在，返回空结果')
      return NextResponse.json({ 
        success: true, 
        data: { 
          items: [], 
          totalItems: 0, 
          totalPages: 0, 
          page: 1, 
          perPage: 50 
        } 
      })
    }
  } catch (error) {
    console.error('❌ 获取班级列表失败:', error)
    return NextResponse.json(
      { error: '获取班级列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const {
      name, course_id, teacher_id, center, room, schedule,
      max_capacity, status = 'active'
    } = body

    if (!name || !course_id || !teacher_id) {
      return NextResponse.json(
        { error: '缺少必需字段: name, course_id, teacher_id' },
        { status: 400 }
      )
    }

    await authenticateAdmin(pb)

    const classData = {
      name,
      course_id,
      teacher_id,
      center: center || '',
      room: room || '',
      schedule: schedule || {},
      max_capacity: max_capacity || 30,
      current_students: 0,
      status
    }

    const newClass = await pb.collection('classes').create(classData)
    return NextResponse.json({ success: true, data: newClass })
  } catch (error) {
    console.error('❌ 创建班级失败:', error)
    return NextResponse.json(
      { error: '创建班级失败', details: error instanceof Error ? error.message : '未知错误' },
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
        { error: '缺少班级ID' },
        { status: 400 }
      )
    }

    await authenticateAdmin(pb)

    const classRecord = await pb.collection('classes').update(id, updateData)
    return NextResponse.json({ success: true, data: classRecord })
  } catch (error) {
    console.error('❌ 更新班级失败:', error)
    return NextResponse.json(
      { error: '更新班级失败', details: error instanceof Error ? error.message : '未知错误' },
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
        { error: '缺少班级ID' },
        { status: 400 }
      )
    }

    await authenticateAdmin(pb)

    await pb.collection('classes').delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ 删除班级失败:', error)
    return NextResponse.json(
      { error: '删除班级失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}