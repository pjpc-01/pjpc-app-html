import { NextRequest, NextResponse } from 'next/server'

const PB_URL = 'http://127.0.0.1:8090'
const PB_ADMIN = { email: 'admin@pjpc.com', password: '1234567890' }

async function pbAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN.email, password: PB_ADMIN.password }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  return (await res.json()).token
}

async function pbCreate(token: string, collection: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// POST — 统一考勤打卡
// 每次刷卡 = 一条独立记录。自动判断签到/签退（基于今日上次操作）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      person_id,
      person_type = 'student',
      person_name,
      center,
      method = 'nfc',
      notes = '',
    } = body

    if (!person_id) {
      return NextResponse.json({ error: '缺少必需参数: person_id' }, { status: 400 })
    }
    const resolvedCenter = center || 'BATU14'

    // Auth
    let token: string
    try { token = await pbAuth() }
    catch { return NextResponse.json({ error: 'PocketBase 认证失败' }, { status: 401 }) }

    // Determine collection + fields
    const isTeacher = person_type === 'teacher'
    const collectionName = isTeacher ? 'teacher_attendance' : 'student_attendance'
    const idField = isTeacher ? 'teacher_id' : 'student_id'
    const nameField = isTeacher ? 'teacher_name' : 'student_name'

    // Resolve name
    let resolvedName = person_name || person_id

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Look up today's LAST record for this person to decide 签到 vs 签退
    const dateFilter = `${idField}="${person_id}" && created >= "${today} 00:00:00"`
    const prevRes = await fetch(
      `${PB_URL}/api/collections/${collectionName}/records?perPage=1&sort=-created&filter=${encodeURIComponent(dateFilter)}`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    let action: 'check_in' | 'check_out'
    const prev = prevRes.items?.[0]

    if (!prev) {
      // No record today → 签到
      action = 'check_in'
    } else {
      // Check the last action from notes prefix
      const lastAction = (prev.notes || '').startsWith('[签退]') ? 'check_out' :
                         (prev.notes || '').startsWith('[签到]') ? 'check_in' :
                         prev.check_out ? 'check_out' : 'check_in'
      // Toggle: 签到 → 签退, 签退 → 签到
      action = lastAction === 'check_in' ? 'check_out' : 'check_in'
    }

    const actionLabel = action === 'check_in' ? '签到' : '签退'
    const actionNotes = `[${actionLabel}] ${notes || `NFC打卡 - ${method}`}`

    // ALWAYS create a NEW record
    const recordData: any = {
      [idField]: person_id,
      [nameField]: resolvedName,
      center: resolvedCenter,
      date: today,
      check_in: now.toISOString(),
      check_out: '',
      status: 'present',
      method,
      notes: actionNotes,
      device_info: JSON.stringify({ method, action, source: 'nfc' }),
    }

    if (isTeacher) {
      recordData.branch_code = resolvedCenter
      recordData.branch_name = resolvedCenter
    }

    const record = await pbCreate(token, collectionName, recordData)

    return NextResponse.json({
      success: true,
      action: actionLabel,
      action_key: action,
      message: `${actionLabel}成功`,
      person_type,
      data: record,
      person: { id: person_id, name: resolvedName, type: person_type },
    })
  } catch (error: any) {
    console.error('考勤打卡失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
