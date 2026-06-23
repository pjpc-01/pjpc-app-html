import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export const dynamic = 'force-dynamic'

// GET — 查询成绩
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const subject = searchParams.get('subject')
    const term = searchParams.get('term')
    const year = searchParams.get('year')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '200')
    const sort = searchParams.get('sort') || '-year'

    await authenticateAdmin()

    const conditions: string[] = []
    if (studentId) conditions.push(`studentId = "${studentId}"`)
    if (subject) conditions.push(`subject = "${subject}"`)
    if (term) conditions.push(`term = "${term}"`)
    if (year) conditions.push(`year = ${year}`)
    const filter = conditions.join(' && ')

    const result = await pb.collection('grades').getList(page, perPage, {
      filter,
      sort,
      expand: 'studentId,teacherId',
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('❌ 获取成绩失败:', error)
    return NextResponse.json(
      { error: '获取成绩失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST — 录入成绩
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { studentId, subject, term, year, score, grade_letter, teacher_comment, teacherId } = body

    if (!studentId || !subject || !term || !year) {
      return NextResponse.json(
        { error: '缺少必需字段: studentId, subject, term, year' },
        { status: 400 }
      )
    }

    await authenticateAdmin()

    // Check if grade already exists (upsert)
    try {
      const existing = await pb.collection('grades').getList(1, 1, {
        filter: `studentId = "${studentId}" && subject = "${subject}" && term = "${term}" && year = ${year}`,
      })
      if (existing.items.length > 0) {
        // Update existing
        const record = await pb.collection('grades').update(existing.items[0].id, {
          score: score ?? null,
          grade_letter: grade_letter ?? '',
          teacher_comment: teacher_comment ?? '',
          teacherId: teacherId ?? '',
        })
        return NextResponse.json({ success: true, data: record })
      }
    } catch { /* not found, create new */ }

    // Auto-calculate grade letter if not provided
    let finalGradeLetter = grade_letter
    if (!finalGradeLetter && score !== null && score !== undefined) {
      if (score >= 80) finalGradeLetter = 'A'
      else if (score >= 70) finalGradeLetter = 'B'
      else if (score >= 60) finalGradeLetter = 'C'
      else if (score >= 50) finalGradeLetter = 'D'
      else finalGradeLetter = 'F'
    }

    const record = await pb.collection('grades').create({
      studentId,
      subject,
      term,
      year,
      score: score ?? null,
      grade_letter: finalGradeLetter ?? '',
      teacher_comment: teacher_comment ?? '',
      teacherId: teacherId ?? '',
    })

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('❌ 录入成绩失败:', error)
    return NextResponse.json(
      { error: '录入成绩失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
