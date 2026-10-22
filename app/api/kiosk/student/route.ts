import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'

/**
 * 学生自助刷卡机（kiosk）专用只读口。
 *
 * 为什么：kiosk 是免登录设备，原来直接用代理读 students/courses/schedules/homework。
 * 代理现在要求登录（必须的），于是刷卡后详情全空。这里给 kiosk 开一个最小面：
 * 只回显示必需字段，不带地址/家长电话/IC/邮箱，和电视看板一个口径。
 *
 * GET /api/kiosk/student?id=<学生记录id>            → 详情（档案+课表+作业）
 * GET /api/kiosk/student?q=<姓名或学号>              → 老师代查（最多 10 条）
 */
const STUDENT_FIELDS = 'id,name,student_id,grade,points,center,avatar,status'

async function pb(path: string, token: string) {
  const r = await fetch(`${PB_URL}/api/collections/${path}`, {
    headers: { Authorization: token },
    cache: 'no-store',
  })
  if (!r.ok) return { items: [] as any[] }
  return r.json()
}

export async function GET(request: NextRequest) {
  const token = await getAdminToken()
  const { searchParams } = new URL(request.url)
  const id = (searchParams.get('id') || '').trim()
  const q = (searchParams.get('q') || '').trim()

  try {
    // 老师代查
    if (q) {
      const f = encodeURIComponent(`(name~"${q}" || student_id~"${q}") && status="active"`)
      const d = await pb(`students/records?perPage=10&fields=${STUDENT_FIELDS}&filter=${f}`, token)
      return NextResponse.json({
        success: true,
        results: (d.items || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          student_id: s.student_id,
          grade: s.grade,
          center: s.center,
        })),
      })
    }

    if (!id) return NextResponse.json({ success: false, error: '缺少 id 或 q' }, { status: 400 })

    // 详情：档案 + 课表 + 作业（只读、字段裁剪）
    const sRes = await fetch(`${PB_URL}/api/collections/students/records/${encodeURIComponent(id)}?fields=${STUDENT_FIELDS}`, {
      headers: { Authorization: token },
      cache: 'no-store',
    })
    if (!sRes.ok) return NextResponse.json({ success: false, error: '找不到学生' }, { status: 404 })
    const s = await sRes.json()

    const [courses, schedules, homework] = await Promise.all([
      pb('courses/records?perPage=200&fields=id,title,subject,grade_level', token),
      pb('schedules/records?perPage=300&fields=id,course_id,course_title,day_of_week,start_time,end_time,teacher_name', token),
      pb('homework/records?perPage=100&sort=-dueDate&fields=id,title,subject,grade,dueDate,status', token),
    ])

    return NextResponse.json({
      success: true,
      student: s,
      courses: courses.items || [],
      schedules: schedules.items || [],
      homework: homework.items || [],
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : '查询失败' }, { status: 500 })
  }
}
