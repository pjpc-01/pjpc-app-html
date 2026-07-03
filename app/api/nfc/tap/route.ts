import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

// POST: NFC card tapped — resolve card_uid → student info
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { card_uid } = await request.json()

    if (!card_uid) {
      return NextResponse.json({ error: '缺少 card_uid' }, { status: 400 })
    }

    // 1. Look up NFC card
    const cardRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&expand=studentId&filter=${encodeURIComponent(`card_uid="${card_uid}"`)}`,
      { headers: { Authorization: token } }
    )
    const cardData = await cardRes.json()

    if (!cardData.items || cardData.items.length === 0) {
      return NextResponse.json({ found: false, error: '未注册的卡片' }, { status: 404 })
    }

    const card = cardData.items[0]

    if (card.status !== 'active') {
      return NextResponse.json({
        found: false,
        error: `卡片已${card.status === 'lost' ? '挂失' : card.status === 'inactive' ? '停用' : card.status}`,
        card: { uid: card.card_uid, status: card.status },
      }, { status: 403 })
    }

    // 2. Extract student info from expanded relation
    const expandedStudents = card.expand?.studentId
    if (!expandedStudents || (Array.isArray(expandedStudents) && expandedStudents.length === 0)) {
      return NextResponse.json({ found: false, error: '卡片未绑定学生' }, { status: 404 })
    }

    const student = Array.isArray(expandedStudents) ? expandedStudents[0] : expandedStudents

    return NextResponse.json({
      found: true,
      student: {
        id: student.student_id,
        name: student.name,
        center: student.center,
        grade: student.grade,
      },
      card: {
        uid: card.card_uid,
        type: card.type,
        issued_date: card.issued_date,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
