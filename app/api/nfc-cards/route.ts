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

// GET: list NFC cards
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const url = new URL(request.url)
    const cardUid = url.searchParams.get('card_uid')
    const studentId = url.searchParams.get('studentId')
    const status = url.searchParams.get('status')
    const page = url.searchParams.get('page') || '1'
    const perPage = url.searchParams.get('perPage') || '100'

    const filters: string[] = []
    if (cardUid) filters.push(`card_uid="${cardUid}"`)
    if (studentId) filters.push(`studentId="${studentId}"`)
    if (status) filters.push(`status="${status}"`)
    const filter = filters.join(' && ')

    const queryUrl = `${PB_URL}/api/collections/nfc_cards/records?page=${page}&perPage=${perPage}&sort=-created&expand=studentId&filter=${encodeURIComponent(filter)}`
    const res = await fetch(queryUrl, { headers: { Authorization: token } })
    const data = await res.json()

    return NextResponse.json({ success: true, data: data })
  } catch (error: any) {
    return NextResponse.json({ error: '获取 NFC 卡片失败', details: error.message }, { status: 500 })
  }
}

// POST: register a new NFC card
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { card_uid, studentId, type, notes } = body

    if (!card_uid) {
      return NextResponse.json({ error: '缺少 card_uid' }, { status: 400 })
    }

    // Resolve student: accept either display ID (B10) or PocketBase record ID
    let pbStudentId = studentId || ''
    if (studentId && !studentId.match(/^[a-z0-9]{10,}$/i)) {
      // Looks like a display ID (e.g. "B10"), resolve to PocketBase record ID
      const stuRes = await fetch(
        `${PB_URL}/api/collections/students/records?perPage=1&filter=${encodeURIComponent(`student_id="${studentId}"`)}`,
        { headers: { Authorization: token } }
      )
      const stuData = await stuRes.json()
      if (stuData.items?.length > 0) {
        pbStudentId = stuData.items[0].id
      } else {
        return NextResponse.json({ error: `学生 ${studentId} 不存在` }, { status: 404 })
      }
    }

    // Check if card already exists
    const checkRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&filter=${encodeURIComponent(`card_uid="${card_uid}"`)}`,
      { headers: { Authorization: token } }
    )
    const checkData = await checkRes.json()
    if (checkData.items?.length > 0) {
      return NextResponse.json({ error: '该卡已被注册' }, { status: 409 })
    }

    // Create card
    const createRes = await fetch(`${PB_URL}/api/collections/nfc_cards/records`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_uid,
        studentId: pbStudentId,
        status: 'active',
        type: type || 'student',
        issued_date: new Date().toISOString().split('T')[0],
        notes: notes || '',
      }),
    })
    const data = await createRes.json()
    if (!createRes.ok) return NextResponse.json({ error: data.message || '创建失败' }, { status: createRes.status })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: '创建 NFC 卡片失败', details: error.message }, { status: 500 })
  }
}

// PATCH: update card status
export async function PATCH(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    const res = await fetch(`${PB_URL}/api/collections/nfc_cards/records/${id}`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.message || '更新失败' }, { status: res.status })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: '更新 NFC 卡片失败', details: error.message }, { status: 500 })
  }
}

// DELETE: remove card
export async function DELETE(request: NextRequest) {
  try {
    const token = await pbAuth()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    const res = await fetch(`${PB_URL}/api/collections/nfc_cards/records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    })
    if (!res.ok) {
      const data = await res.json()
      return NextResponse.json({ error: data.message || '删除失败' }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: '删除 NFC 卡片失败', details: error.message }, { status: 500 })
  }
}
