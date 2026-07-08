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

// Default settings
const DEFAULTS = {
  checkin_deadline: "14:00",   // 迟到线：超过此时间签到 = 迟到
  checkout_minimum: "17:00",   // 早退线：早于此时间签退 = 早退
  points_full_attendance: 2,   // 全勤每日积分数
  points_late: -1,             // 迟到扣分
  points_early: -1,            // 早退扣分
  absent_alert_days: 3,        // 连续缺勤 N 天触发告警
  enable_points: true,         // 是否开启积分联动
}

// GET — 获取考勤设置
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center') || 'default'

    // Try to get settings from a simple PB record
    const res = await fetch(
      `${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="${encodeURIComponent(center)}"`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    const settings = res.items?.[0]?.config || DEFAULTS

    return NextResponse.json({ success: true, settings, center })
  } catch (error: any) {
    // Return defaults if collection doesn't exist yet
    return NextResponse.json({ success: true, settings: DEFAULTS, center: 'default' })
  }
}

// POST — 保存考勤设置
export async function POST(request: NextRequest) {
  try {
    const token = await pbAuth()
    const body = await request.json()
    const { center = 'default', config } = body

    // Check if settings record exists
    const existing = await fetch(
      `${PB_URL}/api/collections/attendance_settings/records?perPage=1&filter=center="${encodeURIComponent(center)}"`,
      { headers: { Authorization: token } }
    ).then(r => r.json())

    let result
    if (existing.items?.length > 0) {
      // Update
      result = await fetch(
        `${PB_URL}/api/collections/attendance_settings/records/${existing.items[0].id}`,
        {
          method: 'PATCH',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ config }),
        }
      ).then(r => r.json())
    } else {
      // Create
      result = await fetch(
        `${PB_URL}/api/collections/attendance_settings/records`,
        {
          method: 'POST',
          headers: { Authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ center, config }),
        }
      ).then(r => r.json())
    }

    return NextResponse.json({ success: true, settings: result.config || config })
  } catch (error: any) {
    console.error('保存考勤设置失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
