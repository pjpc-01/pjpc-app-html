import { NextRequest, NextResponse } from 'next/server'
import { normalizeCardUid, getCardUidSearchTerms } from '@/lib/utils'

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

// POST: NFC card tapped — resolve card_uid → person (student or teacher)
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { card_uid: rawUid } = await request.json()

    if (!rawUid) {
      return NextResponse.json({ error: '缺少 card_uid' }, { status: 400 })
    }

    // Normalize & get all searchable formats (phone & reader both work)
    const canonical = normalizeCardUid(rawUid)
    const terms = getCardUidSearchTerms(rawUid)
    // Build filter: card_uid IN (all variants) OR nfc_uid IN (all variants)
    const cardFilters = terms.map(t => `card_uid="${t}"`).join(' || ')
    const nfcFilters = terms.map(t => `nfc_uid="${t}"`).join(' || ')
    const filter = encodeURIComponent(`(${cardFilters}) || (${nfcFilters})`)

    // 1. Look up NFC card
    const cardRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=1&expand=studentId,teacherId&filter=${filter}`,
      { headers: { Authorization: token } }
    )
    const cardData = await cardRes.json()

    if (!cardData.items || cardData.items.length === 0) {
      return NextResponse.json({ found: false, error: '未注册的卡片' }, { status: 404 })
    }

    const card = cardData.items[0]

    if (card.status !== 'active') {
      const statusMap: Record<string, string> = { lost: '挂失', inactive: '停用' }
      return NextResponse.json({
        found: false,
        error: `卡片已${statusMap[card.status] || card.status}`,
        card: { uid: card.card_uid, status: card.status },
      }, { status: 403 })
    }

    // 2. Resolve person based on card type
    const personType = card.type || 'student'

    if (personType === 'teacher') {
      const teachers = card.expand?.teacherId
      if (!teachers || (Array.isArray(teachers) && teachers.length === 0)) {
        return NextResponse.json({ found: false, error: '卡片未绑定教师' }, { status: 404 })
      }
      const teacher = Array.isArray(teachers) ? teachers[0] : teachers

      return NextResponse.json({
        found: true,
        person_type: 'teacher',
        person: {
          id: teacher.id,
          teacher_id: teacher.id,
          name: teacher.name,
          center: teacher.centerId || teacher.center_assignment || teacher.center || 'BATU14',
          position: teacher.position || '',
        },
        card: {
          uid: card.card_uid,
          type: card.type,
          issued_date: card.issued_date,
        },
      })
    }

    // Default: student
    const students = card.expand?.studentId
    if (!students || (Array.isArray(students) && students.length === 0)) {
      return NextResponse.json({ found: false, error: '卡片未绑定学生' }, { status: 404 })
    }

    const student = Array.isArray(students) ? students[0] : students

    return NextResponse.json({
      found: true,
      person_type: 'student',
      person: {
        id: student.id,
        student_id: student.student_id || student.id,
        name: student.name,
        center: student.center || '',
        grade: student.grade || '',
      },
      card: {
        uid: card.card_uid,
        type: card.type,
        issued_date: card.issued_date,
      },
    })
  } catch (error: any) {
    console.error('NFC Tap 失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
