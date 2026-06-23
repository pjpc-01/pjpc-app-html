import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// GET — 查询积分记录
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '50')
    const sort = searchParams.get('sort') || '-total_points'

    await authenticateAdmin()

    let filter = ''
    if (studentId) filter = `studentId = "${studentId}"`

    const result = await pb.collection('points').getList(page, perPage, {
      filter,
      sort,
      expand: 'studentId',
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('❌ 获取积分失败:', error)
    return NextResponse.json(
      { error: '获取积分失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST — 创建/更新学生积分
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { studentId, points: pts, reason, category, operatorId, nfc_card_uid } = body

    if (!studentId || pts === undefined) {
      return NextResponse.json({ error: '缺少必需字段: studentId, points' }, { status: 400 })
    }

    await authenticateAdmin()

    // 查找或创建 points 记录
    let pointRecord
    try {
      const existing = await pb.collection('points').getList(1, 1, {
        filter: `studentId = "${studentId}"`,
      })
      if (existing.items.length > 0) {
        pointRecord = existing.items[0]
      }
    } catch { /* not found, will create */ }

    const today = new Date().toISOString().split('T')[0]

    if (pointRecord) {
      // 更新积分
      const newTotal = Math.max(0, (pointRecord.total_points || 0) + pts)
      const newWeekly = Math.max(0, (pointRecord.weekly_points || 0) + pts)
      const newMonthly = Math.max(0, (pointRecord.monthly_points || 0) + pts)
      await pb.collection('points').update(pointRecord.id, {
        total_points: newTotal,
        weekly_points: newWeekly,
        monthly_points: newMonthly,
      })
    } else {
      // 创建新记录
      pointRecord = await pb.collection('points').create({
        studentId,
        total_points: Math.max(0, pts),
        weekly_points: Math.max(0, pts),
        monthly_points: Math.max(0, pts),
      })
    }

    // 创建积分交易记录
    const transaction = await pb.collection('points_transactions').create({
      studentId,
      points: pts,
      reason: reason || '',
      category: category || 'other',
      operatorId: operatorId || '',
      nfc_card_uid: nfc_card_uid || '',
      date: today,
    })

    return NextResponse.json({
      success: true,
      data: { points: pointRecord, transaction },
    })
  } catch (error) {
    console.error('❌ 积分操作失败:', error)
    return NextResponse.json(
      { error: '积分操作失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
