import { NextRequest, NextResponse } from 'next/server'
import { normalizeCardUid, getCardUidSearchTerms } from '@/lib/utils'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@pjpc.com', password: '1234567890' }),
  })
  if (!res.ok) throw new Error('Auth failed')
  return (await res.json()).token
}

async function resolveId(token: string, collection: string, lookupField: string, lookupValue: string): Promise<string | null> {
  const res = await fetch(
    `${PB_URL}/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(`${lookupField}="${lookupValue}"`)}`,
    { headers: { Authorization: token } }
  )
  const data = await res.json()
  if (data.items?.length > 0) return data.items[0].id
  return null
}

// GET: list NFC cards (supports filtering by studentId, teacherId, type, status)
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const url = new URL(request.url)
    const rawUid = url.searchParams.get('card_uid')
    const studentId = url.searchParams.get('studentId')
    const teacherId = url.searchParams.get('teacherId')
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const page = url.searchParams.get('page') || '1'
    const perPage = url.searchParams.get('perPage') || '100'

    const filters: string[] = []
    if (rawUid) {
      // Multi-format search: match phone & reader scans
      const terms = getCardUidSearchTerms(rawUid)
      const uidFilters = terms.map(t => `card_uid="${t}"`).join(' || ')
      filters.push(`(${uidFilters})`)
    }
    if (studentId) filters.push(`studentId="${studentId}"`)
    if (teacherId) filters.push(`teacherId="${teacherId}"`)
    if (type) filters.push(`type="${type}"`)
    if (status) filters.push(`status="${status}"`)
    const filter = filters.join(' && ')

    const queryUrl = `${PB_URL}/api/collections/nfc_cards/records?page=${page}&perPage=${perPage}&sort=-created&expand=studentId,teacherId&filter=${encodeURIComponent(filter)}`
    const res = await fetch(queryUrl, { headers: { Authorization: token } })
    const data = await res.json()

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: '获取 NFC 卡片失败', details: error.message }, { status: 500 })
  }
}

// POST: register a new NFC card (student or teacher)
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { card_uid: rawUid, studentId, teacherId, type, notes } = body

    if (!rawUid) {
      return NextResponse.json({ error: '缺少 card_uid' }, { status: 400 })
    }

    // Normalize to canonical decimal format before storing
    const card_uid = normalizeCardUid(rawUid)
    const personType = type || (teacherId ? 'teacher' : 'student')

    // Resolve student ID
    let pbStudentId = ''
    let pbTeacherId = ''

    if (personType === 'student' && studentId) {
      if (studentId.match(/^[a-z0-9]{10,}$/i)) {
        pbStudentId = studentId
      } else {
        const resolved = await resolveId(token, 'students', 'student_id', studentId)
        if (!resolved) return NextResponse.json({ error: `学生 ${studentId} 不存在` }, { status: 404 })
        pbStudentId = resolved
      }
    }

    if (personType === 'teacher' && teacherId) {
      if (teacherId.match(/^[a-z0-9]{10,}$/i)) {
        pbTeacherId = teacherId
      } else {
        // Try to resolve by PocketBase ID first, then by name
        let resolved = await resolveId(token, 'teachers', 'id', teacherId)
        if (!resolved) resolved = await resolveId(token, 'teachers', 'name', teacherId)
        if (!resolved) return NextResponse.json({ error: `教师 "${teacherId}" 不存在` }, { status: 404 })
        pbTeacherId = resolved
      }
    }

    // Check if card already exists (search all formats)
    const checkTerms = getCardUidSearchTerms(rawUid)
    const checkFilters = checkTerms.map(t => `card_uid="${t}"`).join(' || ')
    const checkRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&filter=${encodeURIComponent(checkFilters)}`,
      { headers: { Authorization: token } }
    )
    const checkData = await checkRes.json()
    if (checkData.items?.length > 0) {
      return NextResponse.json({ error: '该卡已被注册' }, { status: 409 })
    }

    // Create card
    const cardData: any = {
      card_uid,
      status: 'active',
      type: personType,
      issued_date: new Date().toISOString().split('T')[0],
      notes: notes || '',
    }

    if (personType === 'student' && pbStudentId) {
      cardData.studentId = pbStudentId
    }
    if (personType === 'teacher' && pbTeacherId) {
      cardData.teacherId = pbTeacherId
    }

    const createRes = await fetch(`${PB_URL}/api/collections/nfc_cards/records`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData),
    })
    const data = await createRes.json()
    if (!createRes.ok) return NextResponse.json({ error: data.message || '创建失败' }, { status: createRes.status })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: '创建 NFC 卡片失败', details: error.message }, { status: 500 })
  }
}

// PATCH: update card (status, rebind, etc.)
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
