import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'
import { gradeRank } from '@/lib/grades'

export const dynamic = 'force-dynamic'

// 资源上传接受的最大文件（与 PB 集合 file 上限 50MB 一致）
const MAX_FILE = 50 * 1024 * 1024

function fileUrlOf(record: any): string | null {
  if (!record?.file) return null
  return `/api/pocketbase-proxy/api/files/resources/${record.id}/${record.file}`
}

// 列表 + 搜索 + 科目/年级/类型 筛选
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1') || 1
    const perPage = parseInt(searchParams.get('per_page') || '12') || 12
    const q = searchParams.get('q')?.trim()
    const subject = searchParams.get('subject')?.trim()
    const grade = searchParams.get('grade')?.trim()
    const type = searchParams.get('type')?.trim()

    // 软删一律排除
    const conds = ['(deleted != true)']
    if (q) {
      const like = `title ~ "${q}" || description ~ "${q}" || tags ~ "${q}"`
      conds.push(`(${like})`)
    }
    if (subject && subject !== 'all') conds.push(`subject = "${subject}"`)
    if (grade && grade !== 'all') conds.push(`grade = "${grade}"`)
    if (type && type !== 'all') conds.push(`type = "${type}"`)

    const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

    const result = await pb.collection('resources').getList(page, perPage, {
      filter: conds.join(' && '),
      sort: '-created',
    })

    // 对每个有文件的条目做一次 HEAD 拿文件大小（真实字节数，用于卡片「大小」展示）。
    // PB 集合 viewRule 为 null（本项目惯例），文件访问必须有管理员 token。
    const adminToken = (pb as any).authStore?.token as string | undefined
    const withFile = result.items.filter((r: any) => r.file)
    const sizeMap = new Map<string, number>()
    await Promise.all(withFile.map(async (r: any) => {
      try {
        const head = await fetch(`${POCKETBASE_URL}/api/files/resources/${r.id}/${r.file}`, {
          method: 'HEAD',
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        })
        const len = Number(head.headers.get('content-length') || 0)
        if (len > 0) sizeMap.set(r.id, len)
      } catch { /* 忽略单条失败 */ }
    }))

    // 默认排序：年级(canonical 顺序,一年级→中六) → 科目 → 类型 → 最新上传。
    // 年级顺序取 lib/grades.ts 的 gradeRank（全站唯一真源，别在这儿自己写顺序表）。
    // 注：先拿 PB 分页再排，所以是「每页内部有序」；资源数小于 perPage 时即等于全局有序。
    const ordered = [...result.items].sort((a: any, b: any) => {
      const byGrade = gradeRank(a.grade) - gradeRank(b.grade)
      if (byGrade) return byGrade
      const bySubject = String(a.subject || '').localeCompare(String(b.subject || ''), 'zh')
      if (bySubject) return bySubject
      const byType = String(a.type || '').localeCompare(String(b.type || ''), 'zh')
      if (byType) return byType
      return String(b.created || '').localeCompare(String(a.created || ''))
    })

    const items = ordered.map((r: any) => ({
      id: r.id,
      title: r.title || '',
      description: r.description || '',
      subject: r.subject || '',
      grade: r.grade || '',
      type: r.type || '',
      tags: r.tags || '',
      link: r.link || '',
      file: r.file || '',
      uploadedBy: r.uploadedBy || '',
      uploaderName: r.uploaderName || '',
      downloads: Number(r.downloads || 0),
      center: r.center || '',
      status: r.status || 'active',
      created: r.created,
      fileUrl: fileUrlOf(r),
      fileSize: sizeMap.get(r.id) || null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        totalItems: result.totalItems,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('❌ 获取资源列表失败:', error)
    return NextResponse.json(
      { error: '获取资源列表失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// 新建资源（multipart/form-data）：title 必填；file 与 link 至少一个
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin()

    const form = await request.formData()
    const title = String(form.get('title') || '').trim()
    const subject = String(form.get('subject') || '').trim()
    const grade = String(form.get('grade') || '').trim()
    const type = String(form.get('type') || '').trim()
    const tags = String(form.get('tags') || '').trim()
    const description = String(form.get('description') || '').trim()
    const link = String(form.get('link') || '').trim()
    const uploadedBy = String(form.get('uploadedBy') || '').trim()
    const uploaderName = String(form.get('uploaderName') || '').trim()
    const center = String(form.get('center') || '').trim()
    const file = form.get('file')

    if (!title) {
      return NextResponse.json({ error: '缺少必需字段: title' }, { status: 400 })
    }
    const hasLink = !!link
    const hasFile = !!file && typeof file !== 'string' && (file as File).size > 0
    if (!hasFile && !hasLink) {
      return NextResponse.json({ error: '请上传文件或填写在线链接' }, { status: 400 })
    }
    if (hasFile && (file as File).size > MAX_FILE) {
      return NextResponse.json({ error: '文件大小超出 50MB 上限' }, { status: 400 })
    }

    const data: Record<string, any> = {
      title,
      description,
      subject,
      grade,
      type,
      tags,
      link,
      uploadedBy,
      uploaderName,
      center,
      status: 'active',
      downloads: 0,
    }
    if (hasFile) data.file = file

    const record = await pb.collection('resources').create(data)

    return NextResponse.json({ success: true, data: { ...record, fileUrl: fileUrlOf(record) } })
  } catch (error) {
    console.error('❌ 创建资源失败:', error)
    return NextResponse.json(
      { error: '创建资源失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}