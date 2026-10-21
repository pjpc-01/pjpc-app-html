import { NextRequest, NextResponse } from 'next/server'

/**
 * 电视看板专用数据口（唯一对未登录开放的读接口）
 *
 * 为什么要有它：
 *   看板挂在墙上，没人登录。以前它直接调 /api/students 等接口，
 *   而那些接口当时是谁都能读 → 学生地址、家长电话、IC 全在公网上。
 *   所以现在：看板只准从这里拿数据，这里只返回【显示需要的字段】。
 *
 * 做法：内部转发到原接口（带 x-pjpc-internal），再白名单挑字段。
 */
export const dynamic = 'force-dynamic'

const ORIGIN = 'http://127.0.0.1:3001'

/** 资源 → 原来的接口路径 */
const RESOURCE_PATH: Record<string, string> = {
  students: '/api/students',
  points: '/api/points',
  teachers: '/api/teachers',
  centers: '/api/centers',
  announcements: '/api/announcements',
}

/** 学生字段白名单：只是屏幕要显示的东西（名字/年级/中心/头像/生日/卡号用于本地刷卡比对） */
const STUDENT_FIELDS = ['id', 'name', 'student_id', 'grade', 'center', 'avatar', 'dob', 'cardNumber', 'status']

function pickStudent(s: any, extra: string[] = []) {
  const out: Record<string, any> = {}
  for (const f of [...STUDENT_FIELDS, ...extra]) if (s?.[f] !== undefined) out[f] = s[f]
  if (s?.centerId && typeof s.centerId === 'object') {
    out.centerId = { code: s.centerId.code, name: s.centerId.name }
  }
  return out
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const resource = url.searchParams.get('resource') || 'students'
  const target = RESOURCE_PATH[resource]
  if (!target) {
    return NextResponse.json({ success: false, error: '不支持的 resource' }, { status: 400 })
  }

  // 原样带上调用方的查询参数（center / limit / page / transactions …）
  const qs = new URLSearchParams(url.searchParams)
  qs.delete('resource')
  const q = qs.toString()

  try {
    const res = await fetch(`${ORIGIN}${target}${q ? `?${q}` : ''}`, {
      headers: { 'x-pjpc-internal': process.env.PROXY_INTERNAL_KEY || '' },
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `上游 ${res.status}` }, { status: res.status })
    }
    const data = await res.json()

    // 学生（含积分榜里的学生）→ 去掉地址/邮箱/IC/家长电话等
    if (Array.isArray(data?.students)) {
      const list = data.students
      if (resource === 'points') {
        // 看板要的是「积分记录 + student 对象」：current_points / student.student_name。
        // /api/points 现在返回的是「学生 + points 字段」，这里转成看板认识的结构。
        data.students = list.map((s: any) => ({
          id: `pts-${s.id}`,
          student_id: s.id,
          current_points: Number(s.points ?? s.total_points ?? 0),
          total_earned: Number(s.points ?? s.total_points ?? 0),
          total_spent: 0,
          season_id: 'default-season',
          student: {
            id: s.id,
            student_id: s.student_id,
            student_name: s.name,
            center: s.center,
            grade: s.grade,
            avatar: s.avatar,
          },
        }))
      } else {
        data.students = list.map((s: any) => ({ ...pickStudent(s), student_name: s.name, student_id_code: s.student_id }))
      }
      // 分行过滤：原来靠前端比字符串（经常对不上，把别院学生也显示出来），这里按 center 参数先滤一遍
      const wantCenter = (url.searchParams.get('center') || '').trim().toUpperCase()
      if (wantCenter) {
        data.students = data.students.filter((s: any) => String(s?.student?.center ?? s?.center ?? '').trim().toUpperCase() === wantCenter)
      }
    }
    if (Array.isArray(data?.items)) {
      data.items = data.items.map((s: any) => pickStudent(s))
    }
    // 老师：只留名字和 id（看板只显示姓名）
    for (const key of ['teachers', 'data']) {
      if (Array.isArray(data?.[key]) && resource === 'teachers') {
        data[key] = data[key].map((t: any) => ({ id: t.id, name: t.name, status: t.status }))
      }
    }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 })
  }
}
