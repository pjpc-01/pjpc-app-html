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
 * GET /api/teacher-accounts/generate
 *
 * Scans all teacher NFC cards and creates PocketBase user accounts
 * for any teacher who doesn't already have one.
 *
 * Returns: { success, created, skipped, total }
 */
export async function GET(_request: NextRequest) {
  try {
    const token = await pbAuth()

    // 1. Fetch all teacher-type NFC cards
    const cardsRes = await fetch(
      `${PB_URL}/api/collections/nfc_cards/records?perPage=500&sort=-created&filter=${encodeURIComponent("type='teacher'")}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!cardsRes.ok) {
      return NextResponse.json({ error: '获取 NFC 卡片失败' }, { status: 500 })
    }
    const cardsData = await cardsRes.json()
    const cards: any[] = cardsData.items || []

    let created = 0
    let skipped = 0

    for (const card of cards) {
      // 2. Check if a user already exists bound to this card
      const userFilter = `card_id="${card.id}"`
      const userCheckRes = await fetch(
        `${PB_URL}/api/collections/users/records?perPage=1&filter=${encodeURIComponent(userFilter)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!userCheckRes.ok) {
        console.error(`Error checking user for card ${card.id}: ${userCheckRes.status}`)
        skipped++
        continue
      }
      const userCheckData = await userCheckRes.json()

      if (userCheckData.items?.length > 0) {
        skipped++
        continue
      }

      // 3. Fetch the linked teacher record for email / name / center
      let teacher: any = {}
      if (card.teacherId) {
        const teacherRes = await fetch(
          `${PB_URL}/api/collections/teachers/records/${card.teacherId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        if (teacherRes.ok) {
          teacher = await teacherRes.json()
        }
      }

      // 4. Build user payload
      const teacherEmail = teacher.email || ''
      const email = teacherEmail || `teacher_${card.teacherId || 'unknown'}@pjpc.local`
      const teacherName = teacher.name || ''
      const center =
        teacher.center || teacher.centerId || teacher.center_assignment || ''

      // 5. Create the auth user record
      const createRes = await fetch(`${PB_URL}/api/collections/users/records`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'pjpc123456',
          passwordConfirm: 'pjpc123456',
          name: teacherName,
          role: 'teacher',
          teacher_id: card.teacherId || '',
          card_id: card.id,
          center,
        }),
      })

      if (createRes.ok) {
        created++
      } else {
        const errBody = await createRes.text()
        console.error(`Failed to create user for card ${card.id}: ${errBody}`)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: cards.length,
    })
  } catch (error: any) {
    console.error('Teacher account generation failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
