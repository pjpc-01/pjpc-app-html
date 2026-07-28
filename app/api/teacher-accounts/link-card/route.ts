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

// PATCH: link a user to a card by card_uid
export async function PATCH(request: NextRequest) {
  try {
    const { user_id, card_uid } = await request.json()
    if (!user_id || !card_uid) {
      return NextResponse.json({ success: false, error: '缺少 user_id 或 card_uid' }, { status: 400 })
    }

    const token = await pbAuth()

    // 1. Find card by UID
    const cardRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&filter=card_uid="${card_uid}"`,
      { headers: { Authorization: token } }
    )
    const cardData = await cardRes.json()
    if (!cardData.items?.length) {
      return NextResponse.json({ success: false, error: '未找到该卡片' }, { status: 404 })
    }
    const card = cardData.items[0]

    // 2. Update user's card_id
    const updateRes = await fetch(
      `${PB_URL}/api/collections/users/records/${user_id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ card_id: card.id }),
      }
    )

    if (!updateRes.ok) {
      const err = await updateRes.json()
      return NextResponse.json({ success: false, error: err.message || '更新失败' }, { status: 400 })
    }

    return NextResponse.json({ success: true, card_id: card.id, card_uid: card.card_uid })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
