import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// GET — 查询接送记录
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '100')

    await authenticateAdmin()

    const conditions: string[] = []
    if (studentId) conditions.push(`studentId = "${studentId}"`)
    if (date) conditions.push(`pickup_date = "${date}"`)
    if (status) conditions.push(`status = "${status}"`)
    const filter = conditions.join(' && ')

    const result = await pb.collection('pickup_records').getList(page, perPage, {
      filter,
      sort: '-pickup_date,-pickup_time',
      expand: 'studentId,teacherId',
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('❌ 获取接送记录失败:', error)
    return NextResponse.json(
      { error: '获取接送记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST — 登记接送
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { studentId, pickup_date, pickup_time, pickup_by, relationship, phone, vehicle_plate, notes, teacherId, parent_confirmed } = body

    if (!studentId || !pickup_date || !pickup_by) {
      return NextResponse.json({ error: '缺少必需字段: studentId, pickup_date, pickup_by' }, { status: 400 })
    }

    await authenticateAdmin()

    const record = await pb.collection('pickup_records').create({
      studentId,
      pickup_date,
      pickup_time: pickup_time || '',
      pickup_by,
      relationship: relationship || 'other',
      phone: phone || '',
      vehicle_plate: vehicle_plate || '',
      status: 'picked_up',
      notes: notes || '',
      teacherId: teacherId || '',
      parent_confirmed: parent_confirmed ?? false,
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('❌ 登记接送失败:', error)
    return NextResponse.json(
      { error: '登记接送失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// PATCH — 更新接送状态
export async function PATCH(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { id, status, pickup_time, notes, parent_confirmed } = body

    if (!id) {
      return NextResponse.json({ error: '缺少必需字段: id' }, { status: 400 })
    }

    await authenticateAdmin()

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (pickup_time !== undefined) updates.pickup_time = pickup_time
    if (notes !== undefined) updates.notes = notes
    if (parent_confirmed !== undefined) updates.parent_confirmed = parent_confirmed

    const record = await pb.collection('pickup_records').update(id, updates)
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('❌ 更新接送失败:', error)
    return NextResponse.json(
      { error: '更新接送失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
