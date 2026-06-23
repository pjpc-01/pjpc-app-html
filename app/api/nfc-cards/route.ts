import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// GET — 查询所有 NFC 卡片
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const cardUid = searchParams.get('card_uid')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '100')

    await authenticateAdmin()

    const conditions = []
    if (cardUid) conditions.push(`card_uid = "${cardUid}"`)
    if (studentId) conditions.push(`studentId = "${studentId}"`)
    if (status) conditions.push(`status = "${status}"`)
    const filter = conditions.join(' && ')

    const result = await pb.collection('nfc_cards').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'studentId',
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('❌ 获取 NFC 卡片失败:', error)
    return NextResponse.json(
      { error: '获取 NFC 卡片失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST — 创建 NFC 卡片（绑定学生）
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { card_uid, studentId, type, issued_date, notes } = body

    if (!card_uid) {
      return NextResponse.json({ error: '缺少必需字段: card_uid' }, { status: 400 })
    }

    await authenticateAdmin()

    // 检查 card_uid 是否已存在
    try {
      const existing = await pb.collection('nfc_cards').getList(1, 1, {
        filter: `card_uid = "${card_uid}"`,
      })
      if (existing.items.length > 0) {
        return NextResponse.json({ error: '该卡已被注册' }, { status: 409 })
      }
    } catch { /* not found, okay */ }

    const record = await pb.collection('nfc_cards').create({
      card_uid,
      studentId: studentId || '',
      status: 'active',
      type: type || 'student',
      issued_date: issued_date || new Date().toISOString().split('T')[0],
      notes: notes || '',
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('❌ 创建 NFC 卡片失败:', error)
    return NextResponse.json(
      { error: '创建 NFC 卡片失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// PATCH — 更新 NFC 卡片状态
export async function PATCH(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { id, status, studentId, notes } = body

    if (!id) {
      return NextResponse.json({ error: '缺少必需字段: id' }, { status: 400 })
    }

    await authenticateAdmin()

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (studentId !== undefined) updates.studentId = studentId
    if (notes !== undefined) updates.notes = notes

    const record = await pb.collection('nfc_cards').update(id, updates)
    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('❌ 更新 NFC 卡片失败:', error)
    return NextResponse.json(
      { error: '更新 NFC 卡片失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
