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

// GET — 获取所有卡片 + 学生/教师映射
export async function GET() {
  try {
    const token = await pbAuth()

    const [cardsRes, studentsRes, teachersRes] = await Promise.all([
      fetch(`${PB_URL}/api/collections/nfc_cards/records?perPage=500&sort=-created`, {
        headers: { Authorization: token },
      }).then(r => r.json()),
      fetch(`${PB_URL}/api/collections/students/records?perPage=200&fields=id,name,cardNumber,center,status,student_name`, {
        headers: { Authorization: token },
      }).then(r => r.json()),
      fetch(`${PB_URL}/api/collections/teachers/records?perPage=200&fields=id,name,cardNumber`, {
        headers: { Authorization: token },
      }).then(r => r.json()),
    ])

    const sMap: Record<string, { id: string; name: string; cardNumber?: string; center?: string; status?: string }> = {}
    for (const s of (studentsRes.items || [])) {
      sMap[s.id] = { id: s.id, name: s.student_name || s.name, cardNumber: s.cardNumber, center: s.center, status: s.status }
    }

    const tMap: Record<string, { id: string; name: string; cardNumber?: string }> = {}
    for (const t of (teachersRes.items || [])) {
      tMap[t.id] = { id: t.id, name: t.name, cardNumber: t.cardNumber }
    }

    return NextResponse.json({
      success: true,
      cards: cardsRes.items || [],
      students: sMap,
      teachers: tMap,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
