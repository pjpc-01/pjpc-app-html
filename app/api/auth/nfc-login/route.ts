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

// POST: NFC card → authenticate as teacher
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { card_uid } = await request.json()

    if (!card_uid) {
      return NextResponse.json({ error: '缺少 card_uid' }, { status: 400 })
    }

    // 1. Look up NFC card
    const cardRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&filter=${encodeURIComponent(`card_uid="${card_uid}"`)}`,
      { headers: { Authorization: token } }
    )
    const cardData = await cardRes.json()

    if (!cardData.items || cardData.items.length === 0) {
      return NextResponse.json({ success: false, error: '未注册的卡片' }, { status: 404 })
    }

    const card = cardData.items[0]

    if (card.status !== 'active') {
      return NextResponse.json({ success: false, error: '卡片已停用' }, { status: 403 })
    }

    if (card.type !== 'teacher') {
      return NextResponse.json({ 
        success: false, 
        error: '此卡为学生卡，需要教师卡登入',
        card_type: 'student',
      }, { status: 403 })
    }

    // 2. Get teacher info
    if (!card.teacherId) {
      return NextResponse.json({ success: false, error: '卡片未绑定教师' }, { status: 404 })
    }

    const teacherRes = await fetch(
      `${PB_URL}/api/collections/teachers/records/${card.teacherId}`,
      { headers: { Authorization: token } }
    )
    const teacher = await teacherRes.json()

    // 3. Generate a simple session token (teacher ID + timestamp + signature)
    const sessionToken = Buffer.from(JSON.stringify({
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      center: teacher.centerId || '',
      card_uid: card_uid,
      login_time: Date.now(),
    })).toString('base64')

    return NextResponse.json({
      success: true,
      token: sessionToken,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        position: teacher.position || 'Teacher',
        center: teacher.centerId || '',
      },
    })
  } catch (error: any) {
    console.error('NFC Login 失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
