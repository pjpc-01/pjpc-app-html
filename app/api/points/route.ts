import { NextRequest, NextResponse } from 'next/server'
import { requireRoles } from '@/lib/api-auth'
import { generateIdentifierVariants } from '@/lib/uid-normalizer'
import { applyPoints } from '@/lib/points'
import { validatePointsDelta } from '@/lib/points-guard'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

// POST — 加分/减分
// Body: { card_uid?, student_id?, points, reason?, mode? }
// mode="direct" → 直接用 student_id，跳过查卡
export async function POST(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const token = await pbAuth()
    const { card_uid, student_id, points = 1, reason = '', mode } = await request.json()

    if (!card_uid && !student_id) return NextResponse.json({ error: '缺少 card_uid 或 student_id' }, { status: 400 })

    // 上限校验：防误输入/浮点异常写出天文数字
    const deltaErr = validatePointsDelta(points)
    if (deltaErr) return NextResponse.json({ error: deltaErr }, { status: 400 })

    let student: any

    if (mode === 'direct' && student_id) {
      // 直接查学生
      const sRes = await fetch(
        `${PB_URL}/api/collections/students/records/${student_id}`,
        { headers: { Authorization: token } }
      ).then(r => r.json())
      if (!sRes.id) return NextResponse.json({ error: '学生不存在' }, { status: 404 })
      student = sRes
    } else if (card_uid) {
      // 生成所有变体，逐个匹配（支持手机NFC hex UID和十进制卡号）
      const variants = generateIdentifierVariants(card_uid)
      let card: any = null
      for (const v of variants.all) {
        const cardRes = await fetch(
          `${PB_URL}/api/collections/nfc_cards/records?perPage=1&expand=studentId&filter=card_uid="${v}"`,
          { headers: { Authorization: token } }
        ).then(r => r.json())
        if (cardRes.items?.length) {
          card = cardRes.items[0]
          break
        }
      }

      if (!card) return NextResponse.json({ error: '未注册的卡片' }, { status: 404 })
      if (card.type !== 'student' || !card.studentId) return NextResponse.json({ error: '仅支持学生卡' }, { status: 400 })
      student = card.expand?.studentId
      if (!student) return NextResponse.json({ error: '卡片未绑定学生' }, { status: 404 })
    }

    // 唯一写入口：锁内重读、写分数、回读校验、必写流水（以前这里只改分数不写流水，
    // 导致总分和流水长期对不上）
    const result = await applyPoints({
      studentId: student.id,
      delta: Number(points),
      reason: String(reason || '').trim() || (Number(points) > 0 ? '老师加分' : '老师扣分'),
      floorAtZero: true, // 保留这个入口原来的「不低于 0」语义
      token,
    })

    return NextResponse.json({
      success: true,
      skipped: result.skipped || undefined,
      student: {
        id: student.id,
        name: student.name,
        points_before: result.before,
        points_added: result.applied,
        points_total: result.after,
      },
      log_id: result.logId,
      reason,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET — 获取学生积分排行
export async function GET(request: NextRequest) {
  const gate = await requireRoles(request, ['admin', 'teacher', 'office_admin'])
  if ('error' in gate) return gate.error

  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const res = await fetch(
              `${PB_URL}/api/collections/students/records?perPage=${limit}&sort=-points&filter=points_enabled!=false%26%26status%3D%22active%22&fields=id,name,points,center,grade,student_id,avatar,title,title_icon`,
              { headers: { Authorization: token } }
            ).then(r => r.json())

    return NextResponse.json({
      success: true,
      students: (res.items || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        points: s.points || 0,
        center: s.center || '',
        grade: s.grade || '',
        student_id: s.student_id || '',
        avatar: s.avatar || '',
        title: s.title || '',
        title_icon: s.title_icon || '',
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
