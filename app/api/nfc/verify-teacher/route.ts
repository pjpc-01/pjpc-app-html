import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

/**
 * POST /api/nfc/verify-teacher
 * Body: { card_uid: string }
 * 
 * Looks up teacher by:
 * 1. nfc_cards table (type=teacher, teacher_id set)
 * 2. teachers table (cardNumber matches)
 * 
 * Returns teacher info if found.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { card_uid } = await request.json()

    if (!card_uid) {
      return NextResponse.json({ success: false, error: '缺少 card_uid' }, { status: 400 })
    }

    // 1. Try nfc_cards (teacher type)
    const nfcRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?filter=(card_uid='${card_uid}')&perPage=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (nfcRes.ok) {
      const nfcData = await nfcRes.json()
      const nfcCard = nfcData.items?.[0]
      if (nfcCard && nfcCard.type === 'teacher' && nfcCard.teacher_id) {
        // Fetch teacher details
        const teacherRes = await fetch(
          `${PB_URL}/api/collections/teachers/records/${nfcCard.teacher_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (teacherRes.ok) {
          const teacher = await teacherRes.json()
          return NextResponse.json({
            success: true,
            teacher: {
              id: teacher.id,
              name: teacher.name,
              teacher_name: teacher.name,
              cardNumber: teacher.cardNumber || '',
            },
          })
        }
      }
    }

    // 2. Try teachers.cardNumber direct match
    const teacherRes = await fetch(
      `${PB_URL}/api/collections/teachers/records?filter=(cardNumber='${card_uid}')&perPage=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (teacherRes.ok) {
      const teacherData = await teacherRes.json()
      const teacher = teacherData.items?.[0]
      if (teacher) {
        return NextResponse.json({
          success: true,
          teacher: {
            id: teacher.id,
            name: teacher.name,
            teacher_name: teacher.name,
            cardNumber: teacher.cardNumber || '',
          },
        })
      }
    }

    return NextResponse.json({ success: false, error: '未找到对应的教师卡' }, { status: 404 })
  } catch (error: any) {
    console.error('verify-teacher 失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
