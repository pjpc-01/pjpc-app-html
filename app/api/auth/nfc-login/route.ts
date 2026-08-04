import { NextRequest, NextResponse } from 'next/server'
import { getCardUidSearchTerms } from '@/lib/utils'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(PB_URL + '/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

export async function POST(request: NextRequest) {
  try {
    const { card_uid } = await request.json()

    if (!card_uid) {
      return NextResponse.json({ success: false, error: '缺少 card_uid' }, { status: 400 })
    }

    const token = await pbAuth()

    const terms = getCardUidSearchTerms(card_uid)
    const cardFilters = terms.map(t => 'card_uid="' + t + '"').join(' || ')

    // 1. Find the NFC card
    const cardRes = await fetch(
      PB_URL + '/api/collections/nfc_cards/records?perPage=1&filter=' + encodeURIComponent(cardFilters),
      { headers: { Authorization: 'Bearer ' + token } },
    )
    const cardData = await cardRes.json()

    if (!cardData.items || cardData.items.length === 0) {
      return NextResponse.json({ success: false, error: '找不到该卡' })
    }

    const card = cardData.items[0]

    // 2. Find user — three paths
    let user: any = null

    // Path A: Direct card link (try both PB record id and card_uid)
    const userARes = await fetch(
      PB_URL + '/api/collections/users/records?perPage=1&filter=' + 
        encodeURIComponent('card_id="' + card.id + '" || card_id="' + card.card_uid + '"'),
      { headers: { Authorization: 'Bearer ' + token } },
    )
    const userAData = await userARes.json()
    if (userAData.items?.[0]) user = userAData.items[0]

    // Path B: Through teacher profile
    if (!user && card.teacherId) {
      const userBRes = await fetch(
        PB_URL + '/api/collections/users/records?perPage=1&filter=' + encodeURIComponent('teacher_id="' + card.teacherId + '"'),
        { headers: { Authorization: 'Bearer ' + token } },
      )
      const userBData = await userBRes.json()
      if (userBData.items?.[0]) user = userBData.items[0]
    }

    // Path C: Through student profile
    if (!user && card.studentId) {
      const userCRes = await fetch(
        PB_URL + '/api/collections/users/records?perPage=1&filter=' + encodeURIComponent('student_id="' + card.studentId + '"'),
        { headers: { Authorization: 'Bearer ' + token } },
      )
      const userCData = await userCRes.json()
      if (userCData.items?.[0]) user = userCData.items[0]
    }

    if (!user) {
      return NextResponse.json({ success: false, error: '未绑定账户，请在用户管理中绑定档案' })
    }

    // 3. Card verified, user found — use admin token directly (no password needed)
    return NextResponse.json({
      success: true,
      pb_token: token,
      pb_record: user,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (error: any) {
    console.error('NFC login failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
