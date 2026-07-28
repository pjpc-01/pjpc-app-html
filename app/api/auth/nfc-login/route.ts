import { NextRequest, NextResponse } from 'next/server'
import { getCardUidSearchTerms } from '@/lib/utils'

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
 * POST /api/auth/nfc-login
 *
 * Authenticates a teacher via NFC card tap.
 * Looks up the card by UID, resolves the bound user account,
 * and returns a PocketBase auth token.
 *
 * Body: { card_uid: string }
 * Success: { success: true, token, user: { id, email, name, role } }
 * Failure: { success: false, error: "<message>" }
 */
export async function POST(request: NextRequest) {
  try {
    const { card_uid } = await request.json()

    if (!card_uid) {
      return NextResponse.json(
        { success: false, error: '缺少 card_uid' },
        { status: 400 },
      )
    }

    const token = await pbAuth()

    // Build multi-format search filter (handles both phone NFC hex and
    // dedicated reader decimal formats)
    const terms = getCardUidSearchTerms(card_uid)
    const cardFilters = terms.map(t => `card_uid="${t}"`).join(' || ')

    // 1. Look up the NFC card by UID
    const cardRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&filter=${encodeURIComponent(cardFilters)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const cardData = await cardRes.json()

    if (!cardData.items || cardData.items.length === 0) {
      return NextResponse.json({ success: false, error: '无效教师卡' })
    }

    const card = cardData.items[0]

    // 2. Only teacher cards can log in via this endpoint
    if (card.type !== 'teacher') {
      return NextResponse.json({ success: false, error: '无效教师卡' })
    }

    // 3. Find the user account bound to this card
    const userFilter = `card_id="${card.id}"`
    const userRes = await fetch(
      `${PB_URL}/api/collections/users/records?perPage=1&filter=${encodeURIComponent(userFilter)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const userData = await userRes.json()

    if (!userData.items || userData.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '未绑定账户，请先生成账号',
      })
    }

    const user = userData.items[0]

    // 4. Attempt password auth with the default credential
    const authRes = await fetch(
      `${PB_URL}/api/collections/users/auth-with-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: user.email,
          password: 'pjpc123456',
        }),
      },
    )

    if (!authRes.ok) {
      return NextResponse.json({
        success: false,
        error: '密码已更改，请用邮箱登录',
      })
    }

    const authData = await authRes.json()

    return NextResponse.json({
      success: true,
      pb_token: authData.token,
      pb_record: authData.record,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('NFC login failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
