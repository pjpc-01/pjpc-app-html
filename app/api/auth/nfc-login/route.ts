import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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

// POST: NFC card → create/authenticate PocketBase user → return token
export async function POST(request: NextRequest) {
  try {
    const adminToken = await pbAuth()
    const { card_uid } = await request.json()

    if (!card_uid) {
      return NextResponse.json({ error: '缺少 card_uid' }, { status: 400 })
    }

    // 1. Look up NFC card — search both card_uid and nfc_uid
    const filter = encodeURIComponent(`card_uid="${card_uid}" || nfc_uid="${card_uid}"`)
    const cardRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&filter=${filter}`,
      { headers: { Authorization: adminToken } }
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
      { headers: { Authorization: adminToken } }
    )
    const teacher = await teacherRes.json()

    // 3. Find or create PocketBase user for this card
    const existingUserRes = await fetch(
      `${PB_URL}/api/collections/users/records?perPage=1&filter=${encodeURIComponent(`card_id="${card_uid}"`)}`,
      { headers: { Authorization: adminToken } }
    )
    const existingUserData = await existingUserRes.json()

    let userRecord: any
    let password: string

    if (existingUserData.items && existingUserData.items.length > 0) {
      // User exists — update name/center if changed
      userRecord = existingUserData.items[0]
      password = generatePassword() // Reset password each login for security

      // Update user
      const updateRes = await fetch(
        `${PB_URL}/api/collections/users/records/${userRecord.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: adminToken },
          body: JSON.stringify({
            name: teacher.name,
            center: teacher.centerId || userRecord.center || '',
            password: password,
            passwordConfirm: password,
          }),
        }
      )
      userRecord = await updateRes.json()
    } else {
      // Create new user
      password = generatePassword()
      const placeholderEmail = `card${card_uid.slice(-8)}@nfc.pjpc`

      const createRes = await fetch(
        `${PB_URL}/api/collections/users/records`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: adminToken },
          body: JSON.stringify({
            email: placeholderEmail,
            username: card_uid,
            emailVisibility: false,
            password: password,
            passwordConfirm: password,
            name: teacher.name,
            role: 'teacher',
            card_id: card_uid,
            teacher_id: teacher.id,
            center: teacher.centerId || '',
            verified: true,
          }),
        }
      )

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}))
        console.error('Create user failed:', errData)
        return NextResponse.json({ success: false, error: '创建用户账号失败' }, { status: 500 })
      }

      userRecord = await createRes.json()
    }

    // 4. Authenticate with PocketBase (via username)
    const authRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: card_uid,  // Use card_uid as username
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
      // PocketBase auth data
      pb_token: authData.token,
      pb_record: authData.record,
      // Teacher info for display
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
