import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'

/**
 * 上传收据照片 / PDF 到报销单。
 * 只能传自己的单子；每个单子最多 10 个文件、单个 50MB。
 */
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error
  const { session } = gate

  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const fd = await request.formData()
    const id = String(fd.get('id') || '')
    if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 })

    const rec: any = await pb.collection('claim_forms').getOne(id)
    const isOwner = rec.created_by === session.id
    const isAdmin = ['admin', 'office_admin'].includes(session.role)
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: '没有权限' }, { status: 403 })
    }

    const files = fd.getAll('files').filter(f => f instanceof File) as File[]
    if (!files.length) return NextResponse.json({ success: false, error: '没有选文件' }, { status: 400 })

    const existing = Array.isArray(rec.receipts) ? rec.receipts.length : 0
    if (existing + files.length > 10) {
      return NextResponse.json({ success: false, error: `最多 10 个文件，已上传 ${existing} 个` }, { status: 400 })
    }

    const upload = new FormData()
    for (const f of files) {
      if (f.size > 50 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: `${f.name} 超过 50MB` }, { status: 400 })
      }
      upload.append('receipts', f, f.name)
    }

    const updated = await pb.collection('claim_forms').update(id, upload)
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('上传收据失败:', error)
    return NextResponse.json({ success: false, error: error?.message || '上传失败' }, { status: 500 })
  }
}
