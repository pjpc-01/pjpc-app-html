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
    let lo: string, hi: string
    if (startDate && endDate) {
      lo = `${startDate} 00:00:00`
      hi = `${endDate} 23:59:59`
    } else if (date) {
      lo = `${date} 00:00:00`
      hi = `${date} 23:59:59`
    } else {
      // 默认今天
      lo = `${today} 00:00:00`
      hi = `${today} 23:59:59`
    }
    const loDay = lo.split(' ')[0]
    const hiDay = hi.split(' ')[0]
    // date 字段区间（按天）用 (date >= "loDay" && date <= "hiDay")
    const dayFilter = `date >= "${loDay}" && date <= "${hiDay}"`
    const createdFilter = `created >= "${lo}" && created <= "${hi}"`

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
      const filter = createdFilter
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
