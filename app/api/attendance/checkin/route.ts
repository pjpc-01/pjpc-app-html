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
  const data = await res.json()
  return data.token
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

// POST - NFC自动考勤（签到/签退）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, center, method = 'nfc', notes = '' } = body

    if (!studentId || !center) {
      return NextResponse.json({ error: '缺少必需参数: studentId, center' }, { status: 400 })
    }

    // 1. 认证
    let token: string
    try {
      token = await pbAuth()
    } catch {
      return NextResponse.json({ error: 'PocketBase 认证失败' }, { status: 401 })
    }

    // 2. 查找学生
    const studentRes = await pbGet(token, 'students', `student_id="${studentId}"`)
    if (!studentRes.items || studentRes.items.length === 0) {
      return NextResponse.json({ error: '学生不存在', studentId }, { status: 404 })
    }
    const student = studentRes.items[0]

    // 3. 查找今日考勤（date 字段用范围匹配）
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const dateFilter = `student_id="${studentId}" && date >= "${today} 00:00:00" && date <= "${today} 23:59:59"`
    const existingRes = await fetch(
      `${PB_URL}/api/collections/student_attendance/records?perPage=1&sort=-created&filter=${encodeURIComponent(dateFilter)}`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    let record: any
    let action: string

    if (!existingRes.items || existingRes.items.length === 0) {
      // 签到
      record = await pbCreate(token, 'student_attendance', {
        student_id: studentId,
        student_name: student.name || student.student_name || studentId,
        center,
        branch_name: center,
        date: today,
        check_in: now.toISOString(),
        status: 'present',
        method,
        notes: notes || `NFC打卡 - ${method}`,
        device_info: JSON.stringify({ method, source: 'nfc' }),
      })
      action = '签到'
    } else {
      const lastRecord = existingRes.items[0]
      const hasCheckOut = lastRecord.check_out && lastRecord.check_out !== ''
      if (!hasCheckOut) {
        // 签退
        record = await pbUpdate(token, 'student_attendance', lastRecord.id, {
          check_out: now.toISOString(),
          notes: (lastRecord.notes || '') + ` | NFC签退 - ${method}`,
        })
        action = '签退'
      } else {
        // 再次签到
        record = await pbCreate(token, 'student_attendance', {
          student_id: studentId,
          student_name: student.name || student.student_name || studentId,
          center,
          branch_name: center,
          date: today,
          check_in: now.toISOString(),
          status: 'present',
          method,
          notes: notes || `NFC打卡 - ${method}`,
          device_info: JSON.stringify({ method, source: 'nfc' }),
        })
        action = '签到'
      }
    }

    return NextResponse.json({
      success: true,
      action,
      message: `${action}成功`,
      data: record,
      student: { id: studentId, name: student.name || student.student_name },
    })
  } catch (error: any) {
    console.error('NFC考勤失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
