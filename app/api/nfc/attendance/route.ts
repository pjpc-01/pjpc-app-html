import { NextRequest, NextResponse } from 'next/server'
import { nfcManager } from '@/lib/nfc-rfid'

// 静态导出配置
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardNumber, deviceId, deviceName, location } = body

    // 验证必要参数
    if (!cardNumber || !deviceId || !deviceName || !location) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 处理打卡
    const attendanceRecord = await nfcManager.processAttendance(
      cardNumber,
      deviceId,
      deviceName,
      location
    )

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance recorded successfully'
    })

  } catch (error) {
    console.error('NFC attendance error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process attendance',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    // 解析日期
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    // 获取打卡记录
    const records = await nfcManager.getAttendanceRecords(
      studentId || undefined,
      start,
      end,
      limit
    )

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length
    })

  } catch (error) {
    console.error('Error fetching attendance records:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch records',
        success: false
      },
      { status: 500 }
    )
  }
} 