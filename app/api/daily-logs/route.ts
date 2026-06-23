import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// GET — 查询每日日志
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')
    const centerId = searchParams.get('centerId')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '100')

    await authenticateAdmin()

    let filter = ''
    const conditions = []
    if (date) conditions.push(`date = "${date}"`)
    if (studentId) conditions.push(`studentId = "${studentId}"`)
    if (teacherId) conditions.push(`teacherId = "${teacherId}"`)
    if (centerId) conditions.push(`centerId = "${centerId}"`)
    if (conditions.length > 0) filter = conditions.join(' && ')

    const result = await pb.collection('daily_logs').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'studentId,teacherId,centerId',
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('❌ 获取每日日志失败:', error)
    return NextResponse.json(
      { error: '获取每日日志失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST — 创建每日日志
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { studentId, teacherId, date, homework_done, nap, meal, mood, behavior_note, centerId } = body

    if (!studentId || !teacherId || !date) {
      return NextResponse.json({ error: '缺少必需字段: studentId, teacherId, date' }, { status: 400 })
    }

    await authenticateAdmin()

    // 检查是否已有今天的日志（同一学生同一天）
    try {
      const existing = await pb.collection('daily_logs').getList(1, 1, {
        filter: `studentId = "${studentId}" && date = "${date}"`,
      })
      if (existing.items.length > 0) {
        return NextResponse.json(
          { error: '该学生今天已有日志记录', data: existing.items[0] },
          { status: 409 }
        )
      }
    } catch {
      // 未找到，继续创建
    }

    const log = await pb.collection('daily_logs').create({
      studentId,
      teacherId,
      date,
      homework_done: homework_done ?? false,
      nap: nap ?? false,
      meal: meal || '',
      mood: mood || '',
      behavior_note: behavior_note || '',
      centerId: centerId || '',
      parent_viewed: false,
    })

    return NextResponse.json({ success: true, data: log })
  } catch (error) {
    console.error('❌ 创建每日日志失败:', error)
    return NextResponse.json(
      { error: '创建每日日志失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// PATCH — 更新每日日志
export async function PATCH(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: '缺少日志ID' }, { status: 400 })
    }

    await authenticateAdmin()

    const log = await pb.collection('daily_logs').update(id, updateData)
    return NextResponse.json({ success: true, data: log })
  } catch (error) {
    console.error('❌ 更新每日日志失败:', error)
    return NextResponse.json(
      { error: '更新每日日志失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
