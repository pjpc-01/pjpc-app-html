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

async function pbGet(token: string, collection: string, filter: string) {
  const url = `${PB_URL}/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(filter)}`
  const res = await fetch(url, { headers: { Authorization: token } })
  return res.json()
}

async function pbCreate(token: string, collection: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function pbUpdate(token: string, collection: string, id: string, data: any) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

// POST — 统一考勤（学生 + 教师）
// Body: { person_id, person_type: 'student'|'teacher', person_name, center, method?, notes? }
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

    if (!person_id || !center) {
      return NextResponse.json({ error: '缺少必需参数: person_id, center' }, { status: 400 })
    }

    // 1. Auth
    let token: string
    try {
      token = await pbAuth()
    } catch {
      return NextResponse.json({ error: 'PocketBase 认证失败' }, { status: 401 })
    }

    // 2. Determine collection and ID field based on person_type
    const isTeacher = person_type === 'teacher'
    const collectionName = isTeacher ? 'teacher_attendance' : 'student_attendance'
    const idField = isTeacher ? 'teacher_id' : 'student_id'
    const nameField = isTeacher ? 'teacher_name' : 'student_name'

    // 3. Resolve name if not provided
    let resolvedName = person_name || person_id
    if (!person_name && !isTeacher) {
      try {
        const studentRes = await pbGet(token, 'students', `student_id="${person_id}"`)
        if (studentRes.items?.length > 0) {
          resolvedName = studentRes.items[0].name || person_id
        }
      } catch { /* use person_id as fallback */ }
    }

    // 4. Look up today's existing attendance record
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const dateFilter = isTeacher
      ? `${idField}="${person_id}" && check_in >= "${today}"`
      : `${idField}="${person_id}" && date >= "${today} 00:00:00" && date <= "${today} 23:59:59"`

    const existingRes = await fetch(
      `${PB_URL}/api/collections/${collectionName}/records?perPage=1&sort=-created&filter=${encodeURIComponent(dateFilter)}`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    let record: any
    let action: string

    if (!existingRes.items || existingRes.items.length === 0) {
      // === CHECK-IN ===
      const recordData: any = {
        [idField]: person_id,
        [nameField]: resolvedName,
        center,
        date: today,
        check_in: now.toISOString(),
        status: 'present',
        method,
        notes: notes || `NFC打卡 - ${method}`,
        device_info: JSON.stringify({ method, source: 'nfc' }),
      }

      // Add branch fields for teacher
      if (isTeacher) {
        recordData.branch_code = center
        recordData.branch_name = center
      }

      record = await pbCreate(token, collectionName, recordData)
      action = '签到'
    } else {
      const lastRecord = existingRes.items[0]
      const hasCheckOut = lastRecord.check_out && lastRecord.check_out !== ''

      if (!hasCheckOut) {
        // === CHECK-OUT ===
        record = await pbUpdate(token, collectionName, lastRecord.id, {
          check_out: now.toISOString(),
          notes: (lastRecord.notes || '') + ` | NFC签退 - ${method}`,
        })
        action = '签退'
      } else {
        // === CHECK-IN AGAIN ===
        const recordData: any = {
          [idField]: person_id,
          [nameField]: resolvedName,
          center,
          date: today,
          check_in: now.toISOString(),
          status: 'present',
          method,
          notes: notes || `NFC打卡 - ${method}`,
          device_info: JSON.stringify({ method, source: 'nfc' }),
        }
        if (isTeacher) {
          recordData.branch_code = center
          recordData.branch_name = center
        }
        record = await pbCreate(token, collectionName, recordData)
        action = '签到'
      }
    }

    return NextResponse.json({
      success: true,
      action,
      message: `${action}成功`,
      person_type,
      data: record,
      person: { id: person_id, name: resolvedName, type: person_type },
    })
  } catch (error: any) {
    console.error('统一考勤失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
