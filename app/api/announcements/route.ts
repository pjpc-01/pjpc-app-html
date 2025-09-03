import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const authorId = searchParams.get('author_id')

    await authenticateAdmin()

    let filter = ''
    const conditions = []
    if (type) conditions.push(`type = "${type}"`)
    if (priority) conditions.push(`priority = "${priority}"`)
    if (status) conditions.push(`status = "${status}"`)
    if (authorId) conditions.push(`author_id = "${authorId}"`)

    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    const announcements = await pb.collection('announcements').getList(page, perPage, {
      filter,
      sort: '-publish_date',
      expand: 'author_id'
    })

    return NextResponse.json({ success: true, data: announcements })
  } catch (error) {
    console.error('❌ 获取公告列表失败:', error)
    return NextResponse.json(
      { error: '获取公告列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const {
      title, content, type = 'general', priority = 'medium',
      author_id, target_audience, publish_date, expiry_date,
      status = 'draft', attachments
    } = body

    if (!title || !content || !author_id) {
      return NextResponse.json(
        { error: '缺少必需字段: title, content, author_id' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    const announcementData = {
      title,
      content,
      type,
      priority,
      author_id,
      target_audience: target_audience || { type: 'all' },
      publish_date: publish_date || new Date().toISOString().split('T')[0],
      expiry_date: expiry_date || null,
      status,
      attachments: attachments || []
    }

    const announcement = await pb.collection('announcements').create(announcementData)
    return NextResponse.json({ success: true, data: announcement })
  } catch (error) {
    console.error('❌ 创建公告失败:', error)
    return NextResponse.json(
      { error: '创建公告失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}