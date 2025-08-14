import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, centerId, type, timestamp, deviceId, deviceName } = body

    // 验证必需字段
    if (!studentId || !centerId || !type) {
      return NextResponse.json(
        { error: '缺少必需字段' },
        { status: 400 }
      )
    }

    // 创建考勤记录
    const attendanceData = {
      studentId,
      centerId,
      type, // 'check-in' 或 'check-out'
      timestamp: timestamp || new Date().toISOString(),
      status: 'success',
      deviceId,
      deviceName
    }

    // 保存到PocketBase
    const record = await pb.collection('attendance').create(attendanceData)

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    console.error('考勤记录失败:', error)
    return NextResponse.json(
      { error: '考勤记录失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const centerId = searchParams.get('center')
    const studentId = searchParams.get('student')
    const date = searchParams.get('date')

    let filter = ''

    if (centerId) {
      filter += `centerId = "${centerId}"`
    }

    if (studentId) {
      if (filter) filter += ' && '
      filter += `studentId = "${studentId}"`
    }

    if (date) {
      if (filter) filter += ' && '
      filter += `timestamp >= "${date}T00:00:00.000Z" && timestamp <= "${date}T23:59:59.999Z"`
    }

    const records = await pb.collection('attendance').getList(1, 50, {
      filter: filter || undefined,
      sort: '-timestamp'
    })

    return NextResponse.json({
      success: true,
      data: records.items
    })

  } catch (error) {
    console.error('查询考勤记录失败:', error)
    return NextResponse.json(
      { error: '查询考勤记录失败' },
      { status: 500 }
    )
  }
}
