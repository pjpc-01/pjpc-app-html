import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

// POST — 加分/减分
// Body: { card_uid?, student_id?, points, reason?, mode? }
// mode="direct" → 直接用 student_id，跳过查卡
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { card_uid, student_id, points = 1, reason = '', mode } = await request.json()

    if (!card_uid && !student_id) return NextResponse.json({ error: '缺少 card_uid 或 student_id' }, { status: 400 })

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
      // 查卡找人
      const cardRes = await fetch(
        `${PB_URL}/api/collections/nfc_cards/records?perPage=1&expand=studentId&filter=card_uid="${card_uid}"`,
        { headers: { Authorization: token } }
      ).then(r => r.json())

      if (!cardRes.items?.length) return NextResponse.json({ error: '未注册的卡片' }, { status: 404 })
      const card = cardRes.items[0]
      if (card.type !== 'student' || !card.studentId) return NextResponse.json({ error: '仅支持学生卡' }, { status: 400 })
      student = card.expand?.studentId
      if (!student) return NextResponse.json({ error: '卡片未绑定学生' }, { status: 404 })
    }

    const currentPoints = student.points || 0
    const newPoints = Math.max(0, currentPoints + points)  // 不低于0

    await fetch(`${PB_URL}/api/collections/students/records/${student.id}`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: newPoints }),
    })

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        points_before: currentPoints,
        points_added: points,
        points_total: newPoints,
      },
      reason,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET — 获取学生积分排行
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const res = await fetch(
      `${PB_URL}/api/collections/students/records?perPage=${limit}&sort=-points&fields=id,name,points,center&filter=points>0`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    return NextResponse.json({
      success: true,
      students: (res.items || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        points: s.points || 0,
        center: s.center || '',
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
