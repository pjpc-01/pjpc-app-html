import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// 公告数据源统一为 activities 集合（PB 没有 announcements 表）。
// TV 看板 / 教育概览都从 activities 读活动与公告。
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const center = searchParams.get('center')

    let filter = ''
    if (center && center !== 'all') {
      filter = `(center = "${center}" || center = "all")`
    }

    const acts = await pb.collection('activities').getList(page, perPage, {
      ...(filter ? { filter } : {}),
      sort: '-date',
    })

    const items = acts.items.map((a: any) => ({
      id: a.id,
      title: a.title || '',
      content: a.description || '',
      priority: 'normal',
      type: a.category || 'general',
      date: a.date,
      center: a.center || 'all',
      created: a.created,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        totalItems: acts.totalItems,
        page: acts.page,
        perPage: acts.perPage,
        totalPages: acts.totalPages,
      },
    })
  } catch (error) {
    console.error('❌ 获取公告列表失败:', error)
    return NextResponse.json(
      { error: '获取公告列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// 新建公告 = 新建活动（写入 activities）
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const body = await request.json()
    const { title, content, type = 'general', publish_date, center } = body

    if (!title) {
      return NextResponse.json({ error: '缺少必需字段: title' }, { status: 400 })
    }

    const record = await pb.collection('activities').create({
      title,
      description: content || '',
      category: type,
      center: center || 'all',
      date: publish_date || new Date().toISOString().split('T')[0],
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('❌ 创建公告失败:', error)
    return NextResponse.json(
      { error: '创建公告失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
