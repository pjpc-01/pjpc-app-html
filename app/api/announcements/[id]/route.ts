import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// 获取单个公告
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const announcement = await pb.collection('announcements').getOne(params.id, {
      expand: 'author_id'
    })

    return NextResponse.json({ success: true, data: announcement })
  } catch (error) {
    console.error('❌ 获取公告详情失败:', error)
    return NextResponse.json(
      { error: '获取公告详情失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// 更新公告
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const {
      title, content, type, priority, status, target_audience, publish_date, expiry_date, attachments
    } = body

    // 先获取公告信息，检查权限
    await authenticateAdmin()
    const existingAnnouncement = await pb.collection('announcements').getOne(params.id)
    
    // 检查是否是公告作者（这里简化处理，实际应该检查当前用户）
    // 由于使用管理员权限，暂时允许所有操作
    console.log('更新公告:', params.id, '作者:', existingAnnouncement.author_id)

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (type !== undefined) updateData.type = type
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (target_audience !== undefined) updateData.target_audience = target_audience
    if (publish_date !== undefined) updateData.publish_date = publish_date
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date
    if (attachments !== undefined) updateData.attachments = attachments

    const announcement = await pb.collection('announcements').update(params.id, updateData)
    return NextResponse.json({ success: true, data: announcement })
  } catch (error) {
    console.error('❌ 更新公告失败:', error)
    return NextResponse.json(
      { error: '更新公告失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getPocketBase()
    
    // 先获取公告信息，检查权限
    await authenticateAdmin()
    const existingAnnouncement = await pb.collection('announcements').getOne(params.id)
    
    // 检查是否是公告作者（这里简化处理，实际应该检查当前用户）
    // 由于使用管理员权限，暂时允许所有操作
    console.log('删除公告:', params.id, '作者:', existingAnnouncement.author_id)

    await pb.collection('announcements').delete(params.id)
    return NextResponse.json({ success: true, message: '公告删除成功' })
  } catch (error) {
    console.error('❌ 删除公告失败:', error)
    return NextResponse.json(
      { error: '删除公告失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
