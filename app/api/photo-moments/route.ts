import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '50')

    await authenticateAdmin()

    const conditions: string[] = []
    if (studentId) conditions.push(`studentId = "${studentId}"`)
    if (date) conditions.push(`date = "${date}"`)
    const filter = conditions.join(' && ')

    const result = await pb.collection('photo_moments').getList(page, perPage, {
      filter,
      sort: '-date,-created',
      expand: 'studentId,teacherId',
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { studentId, teacherId, image_url, caption, category, date } = body

    if (!studentId || !image_url || !date) {
      return NextResponse.json({ error: '缺少必需字段' }, { status: 400 })
    }

    await authenticateAdmin()

    const record = await pb.collection('photo_moments').create({
      studentId,
      teacherId: teacherId || '',
      image_url,
      caption: caption || '',
      category: category || 'other',
      date,
      parent_viewed: false,
      liked: false,
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    return NextResponse.json({ error: '发布失败' }, { status: 500 })
  }
}
