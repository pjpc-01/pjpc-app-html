import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const date = searchParams.get('date') || ''
    const startDate = searchParams.get('startDate') || null
    const endDate = searchParams.get('endDate') || null
    const type = searchParams.get('type') || 'all'
    const pageSize = parseInt(searchParams.get('pageSize') || '500')

    // date 单日：date 区间；否则用 startDate~endDate 区间。
    // 优先用 startDate/endDate（区间查询），无则退回单日 date
    let loDay: string, hiDay: string
    if (startDate && endDate) {
      loDay = startDate
      hiDay = endDate
    } else if (date) {
      loDay = date
      hiDay = date
    } else {
      // 默认今天
      loDay = today
      hiDay = today
    }
    // ⚠️ 时区陷阱（踩过）：PB 的 date 字段实际存成 "YYYY-MM-DD 00:00:00.000Z"，
    //   created 则是真实 UTC 时刻。若用 created 过滤，本地早上 8 点前的打卡其 UTC 还落在前一天 → 捞不到人。
    //   统一改用 date 字段，并用【排他上限 = 次日 00:00:00.000Z】，避免字符串比较漏掉带时分秒的值。
    const addDays = (day: string, n: number) => {
      const dt = new Date(`${day}T00:00:00.000Z`)
      dt.setUTCDate(dt.getUTCDate() + n)
      return dt.toISOString().slice(0, 10)
    }
    const lo = `${loDay} 00:00:00.000Z`
    const hiExclusive = `${addDays(hiDay, 1)} 00:00:00.000Z`
    const dayFilter = `date >= "${lo}" && date < "${hiExclusive}"`

    const records: any[] = []

    // ── Student records ─────────────────────────
    if (type === 'all' || type === 'student') {
      const filter = dayFilter
      const url = `${PB_URL}/api/collections/student_attendance/records?perPage=${pageSize}&sort=-created&filter=${encodeURIComponent(filter)}`
      const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())

      for (const r of (res.items || [])) {
        const notes = r.notes || ''
        const isCheckOut = notes.startsWith('[签退]') || (r.check_out && !notes.startsWith('[签到]'))
        records.push({
          id: r.id,
          person_id: r.student_id,
          person_name: r.student_name,
          person_type: 'student',
          center: r.center || '',
          action: isCheckOut ? '签退' : '签到',
          action_key: isCheckOut ? 'check_out' : 'check_in',
          timestamp: r.check_in || r.created,
          date: r.date,
          method: r.method || 'nfc',
          notes: r.notes || '',
        })
      }
    }

    // ── Teacher records ─────────────────────────
    if (type === 'all' || type === 'teacher') {
      // 同样用 date 字段（原用 created，会因 UTC 偏移漏掉早上 8 点前的打卡）
      const filter = dayFilter
      const url = `${PB_URL}/api/collections/teacher_attendance/records?perPage=${pageSize}&sort=-created&filter=${encodeURIComponent(filter)}`
      const res = await fetch(url, { headers: { Authorization: token } }).then(r => r.json())

      for (const r of (res.items || [])) {
        const notes = r.notes || ''
        const isCheckOut = notes.startsWith('[签退]') || (r.check_out && !notes.startsWith('[签到]'))
        records.push({
          id: r.id,
          person_id: r.teacher_id,
          person_name: r.teacher_name,
          person_type: 'teacher',
          center: r.center || r.branch_code || '',
          action: isCheckOut ? '签退' : '签到',
          action_key: isCheckOut ? 'check_out' : 'check_in',
          timestamp: r.check_in || r.created,
          date: r.date,
          method: r.method || 'nfc',
          notes: r.notes || '',
        })
      }
    }

    // Sort by timestamp descending
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ success: true, records, total: records.length })
  } catch (error: any) {
    console.error('考勤日志失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
