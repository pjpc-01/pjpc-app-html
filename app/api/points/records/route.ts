import { NextRequest, NextResponse } from 'next/server'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

// GET — 获取所有学生的积分记录（含分行筛选）
export async function GET(request: NextRequest) {
  try {
    const token = await pbAuth()
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center') || ''
    const limit = parseInt(searchParams.get('limit') || '200')
    const page = parseInt(searchParams.get('page') || '1')

    let filter = ''
        if (center && center !== 'all') {
          filter = `center="${encodeURIComponent(center)}"`
        }

        // 积分榜只显示 active 学生
        const baseFilter = `status="active"`

        const params = new URLSearchParams({
          perPage: String(limit),
          page: String(page),
          sort: '-points,name',
          fields: 'id,name,points,grade,center,status,student_id,avatar',
        })
        if (filter) params.set('filter', `${filter} && points_enabled!=false && ${baseFilter}`)
        else params.set('filter', `points_enabled!=false && ${baseFilter}`)

        const res = await fetch(
          `${PB_URL}/api/collections/students/records?${params}`,
          { headers: { Authorization: token } }
        ).then(r => r.json())

        // Get total count
        const countParams = new URLSearchParams({ perPage: '1' })
        if (filter) countParams.set('filter', `${filter} && ${baseFilter}`)
        else countParams.set('filter', baseFilter)
        const countRes = await fetch(
          `${PB_URL}/api/collections/students/records?${countParams}`,
          { headers: { Authorization: token } }
        ).then(r => r.json())

    return NextResponse.json({
      success: true,
      students: (res.items || []).map((s: any) => {
        const gm: Record<string, string> = {
          '1': '一年级', '2': '二年级', '3': '三年级', '4': '四年级', '5': '五年级', '6': '六年级',
          'Standard 1': '一年级', 'Standard 2': '二年级', 'Standard 3': '三年级',
          'Standard 4': '四年级', 'Standard 5': '五年级', 'Standard 6': '六年级',
          'Peralihan': '预备班',
          '7': '中一', '8': '中二', '9': '中三', '10': '中四', '11': '中五', '12': '中六',
          'Form 1': '中一', 'Form 2': '中二', 'Form 3': '中三', 'Form 4': '中四', 'Form 5': '中五',
          'y7': '中一', 'y8': '中二', 'y9': '中三', 'y10': '中四', 'y11': '中五', 'y12': '中六',
        }
        return {
          id: s.id,
          name: s.name,
          points: s.points || 0,
          grade: gm[s.grade] || s.grade || '',
          center: s.center || '',
          status: s.status || 'active',
          student_id: s.student_id || '',
          avatar: s.avatar || '',
        }
      }),
      total: countRes.totalItems || 0,
      page,
      perPage: limit,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
