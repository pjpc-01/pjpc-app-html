import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { normalizeCardUid, getCardUidSearchTerms } from '@/lib/utils'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error('Admin auth failed')
  return (await res.json()).token
}

function generatePassword(): string {
  return crypto.randomBytes(16).toString('hex')
}

// POST: NFC card → find user by card_id → authenticate
export async function POST(request: NextRequest) {
  try {
    const adminToken = await pbAuth()
    const { card_uid: rawUid } = await request.json()

    if (!rawUid) {
      return NextResponse.json({ success: false, error: '缺少 card_uid' }, { status: 400 })
    }

    const canonical = normalizeCardUid(rawUid)
    const terms = getCardUidSearchTerms(rawUid)

    // Search for any user with this card_id
    const userFilters = terms.map(t => `card_id="${t}"`).join(' || ')
    const userRes = await fetch(
      `${PB_URL}/api/collections/users/records?perPage=1&filter=${encodeURIComponent(userFilters)}`,
      { headers: { Authorization: adminToken } }
    )
    const userData = await userRes.json()

    if (!userData.items || userData.items.length === 0) {
      return NextResponse.json({ success: false, error: '没有匹配的账号' }, { status: 404 })
    }

    const userRecord = userData.items[0]
    const password = generatePassword()

    // Update password (don't touch anything else)
    await fetch(
      `${PB_URL}/api/collections/users/records/${userRecord.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: adminToken },
        body: JSON.stringify({
          password: password,
          passwordConfirm: password,
        }),
      }
    )

    // Authenticate
    const authRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: userRecord.email,
        password: password,
      }),
    })

    if (!authRes.ok) {
      console.error('Auth failed:', await authRes.text())
      return NextResponse.json({ success: false, error: '认证失败' }, { status: 500 })
    }

    const authData = await authRes.json()

    return NextResponse.json({
      success: true,
      pb_token: authData.token,
      pb_record: authData.record,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        role: userRecord.role || 'teacher',
      },
    })
  } catch (error: any) {
    console.error('NFC Login 失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
