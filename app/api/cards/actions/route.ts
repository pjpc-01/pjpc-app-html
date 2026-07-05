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

// POST — 发卡
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { card_uid, type, personId, notes } = body

    if (!card_uid || !personId) {
      return NextResponse.json({ error: '缺少 card_uid 或 personId' }, { status: 400 })
    }

    const payload: any = { card_uid, type: type || 'student', status: 'active', notes: notes || '手动发卡' }
    if (type === 'teacher') payload.teacherId = personId
    else payload.studentId = personId

    const res = await fetch(`${PB_URL}/api/collections/nfc_cards/records`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const card = await res.json()

    // Also update profile cardNumber
    const collection = type === 'teacher' ? 'teachers' : 'students'
    await fetch(`${PB_URL}/api/collections/${collection}/records/${personId}`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardNumber: card_uid }),
    })

    return NextResponse.json({ success: true, card })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH — 停用/恢复卡片
export async function PATCH(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { cardId, status } = body
    if (!cardId) return NextResponse.json({ error: '缺少 cardId' }, { status: 400 })

    const res = await fetch(`${PB_URL}/api/collections/nfc_cards/records/${cardId}`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status || 'inactive' }),
    })

    return NextResponse.json({ success: true, card: await res.json() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — 删除卡片
export async function DELETE(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('id')
    if (!cardId) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    await fetch(`${PB_URL}/api/collections/nfc_cards/records/${cardId}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
