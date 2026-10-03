import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// PATCH：更新字段；或给下载计数 +1（{ incrementDownloads: true }）
// DELETE：软删除（deleted: true，不真删）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await getPocketBase()
    await authenticateAdmin()

    const existing = await pb.collection('resources').getOne(id)
    if (existing?.deleted) {
      return NextResponse.json({ error: '资源不存在或已删除' }, { status: 404 })
    }

    const body = await request.json()

    if (body?.incrementDownloads) {
      const current = Number(existing.downloads || 0)
      const record = await pb.collection('resources').update(id, { downloads: current + 1 })
      return NextResponse.json({ success: true, data: { ...record, incrementDownloads: true } })
    }

    // 普通字段更新：只允许更新这些可编辑字段
    const editable = ['title', 'description', 'subject', 'grade', 'type', 'tags', 'link'] as const
    const patch: Record<string, string> = {}
    for (const key of editable) {
      if (body[key] !== undefined) patch[key] = String(body[key])
    }
    const record = await pb.collection('resources').update(id, patch)

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('❌ 更新资源失败:', error)
    return NextResponse.json(
      { error: '更新资源失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// 软删除：deleted:true，保留记录与附件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await getPocketBase()
    await authenticateAdmin()

    const existing = await pb.collection('resources').getOne(id)
    if (existing?.deleted) {
      return NextResponse.json({ error: '资源不存在或已删除' }, { status: 404 })
    }

    await pb.collection('resources').update(id, { deleted: true })
    return NextResponse.json({ success: true, message: '资源已删除' })
  } catch (error) {
    console.error('❌ 删除资源失败:', error)
    return NextResponse.json(
      { error: '删除资源失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}