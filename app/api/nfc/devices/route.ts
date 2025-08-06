import { NextRequest, NextResponse } from 'next/server'
import { nfcManager } from '@/lib/nfc-rfid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, location, deviceType, status, ipAddress, macAddress, firmwareVersion, notes } = body

    // 验证必要参数
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // 添加新设备
    const newDevice = await nfcManager.addDevice({
      name,
      location,
      deviceType: deviceType || 'NFC',
      status: status || 'online',
      ipAddress,
      macAddress,
      firmwareVersion,
      cardCount: 0,
      errorCount: 0,
      notes,
    })

    return NextResponse.json({
      success: true,
      data: newDevice,
      message: 'Device added successfully'
    })

  } catch (error) {
    console.error('Error adding NFC device:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to add device',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取所有设备
    const devices = await nfcManager.getAllDevices()

    return NextResponse.json({
      success: true,
      data: devices,
      count: devices.length
    })

  } catch (error) {
    console.error('Error fetching NFC devices:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch devices',
        success: false
      },
      { status: 500 }
    )
  }
} 