import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const recipientId = searchParams.get('recipient_id')
    const type = searchParams.get('type')
    const isRead = searchParams.get('is_read')

    await authenticateAdmin()

    let filter = ''
    const conditions = []
    if (recipientId) conditions.push(`recipient_id = "${recipientId}"`)
    if (type) conditions.push(`type = "${type}"`)
    if (isRead !== null && isRead !== undefined) {
      conditions.push(`is_read = ${isRead === 'true'}`)
    }

    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    const notifications = await pb.collection('notifications').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'sender_id,recipient_id'
    })

    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    console.error('❌ 获取通知列表失败:', error)
    return NextResponse.json(
      { error: '获取通知列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const {
      title, message, type = 'system', sender_id, recipient_id,
      is_read = false
    } = body

    if (!title || !message || !sender_id || !recipient_id) {
      return NextResponse.json(
        { error: '缺少必需字段: title, message, sender_id, recipient_id' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    const notificationData = {
      title,
      message,
      type,
      sender_id,
      recipient_id,
      is_read,
      read_at: null
    }

    const notification = await pb.collection('notifications').create(notificationData)
    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    console.error('❌ 创建通知失败:', error)
    return NextResponse.json(
      { error: '创建通知失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { id, is_read } = body

    if (!id || is_read === undefined) {
      return NextResponse.json(
        { error: '缺少必需字段: id, is_read' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    const updateData: any = { is_read }
    if (is_read) {
      updateData.read_at = new Date().toISOString()
    }

    const notification = await pb.collection('notifications').update(id, updateData)
    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    console.error('❌ 更新通知状态失败:', error)
    return NextResponse.json(
      { error: '更新通知状态失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}