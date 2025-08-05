import { NextRequest, NextResponse } from 'next/server'
import { nfcManager } from '@/lib/nfc-rfid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      uid, 
      deviceType, 
      deviceId, 
      deviceName, 
      location, 
      frequency 
    } = body

    // 验证必要参数
    if (!uid || !deviceType || !deviceId || !deviceName || !location) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 验证设备类型
    if (!['RFID', 'NFC'].includes(deviceType)) {
      return NextResponse.json(
        { error: 'Invalid device type. Must be RFID or NFC' },
        { status: 400 }
      )
    }

    // 验证频率
    if (deviceType === 'RFID' && frequency !== '125KHz') {
      return NextResponse.json(
        { error: 'RFID devices must use 125KHz frequency' },
        { status: 400 }
      )
    }

    if (deviceType === 'NFC' && frequency !== '13.56MHz') {
      return NextResponse.json(
        { error: 'NFC devices must use 13.56MHz frequency' },
        { status: 400 }
      )
    }

    // 处理打卡 - 使用统一的API
    const attendanceRecord = await nfcManager.processAttendance(
      uid, // 使用UID作为cardNumber
      deviceId,
      deviceName,
      location,
      {
        deviceType,
        frequency,
        uid
      }
    )

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: `${deviceType} attendance recorded successfully`,
      deviceInfo: {
        type: deviceType,
        frequency,
        location
      }
    })

  } catch (error) {
    console.error(`${deviceType} attendance error:`, error)
    
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
    const deviceType = searchParams.get('deviceType') // RFID or NFC
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
      limit,
      deviceType || undefined
    )

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length,
      deviceType: deviceType || 'all'
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