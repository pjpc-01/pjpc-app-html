import { NextRequest, NextResponse } from 'next/server'
import { pb } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nfcData, deviceInfo, centerId } = body

    if (!nfcData) {
      return NextResponse.json({ 
        success: false, 
        error: 'NFC数据不能为空' 
      }, { status: 400 })
    }

    // 解析NFC数据
    let studentIdentifier = null
    let nfcType = 'unknown'

    // 尝试解析NFC数据格式
    if (nfcData.records && nfcData.records.length > 0) {
      // Web NFC API格式
      for (const record of nfcData.records) {
        if (record.recordType === 'url') {
          const textDecoder = new TextDecoder()
          const url = textDecoder.decode(record.data)
          studentIdentifier = url
          nfcType = 'url'
          break
        } else if (record.recordType === 'text') {
          const textDecoder = new TextDecoder()
          const text = textDecoder.decode(record.data)
          studentIdentifier = text
          nfcType = 'text'
          break
        }
      }
    } else if (typeof nfcData === 'string') {
      // 直接字符串格式
      studentIdentifier = nfcData
      nfcType = 'string'
    } else if (nfcData.id) {
      // NFC卡片ID格式
      studentIdentifier = nfcData.id
      nfcType = 'card_id'
    }

    if (!studentIdentifier) {
      return NextResponse.json({ 
        success: false, 
        error: '无法解析NFC数据' 
      }, { status: 400 })
    }

    console.log('NFC读取数据:', {
      identifier: studentIdentifier,
      type: nfcType,
      deviceInfo,
      centerId
    })

    // 查找学生信息
    let student = null
    
    try {
      // 首先尝试通过studentUrl查找
      const studentsByUrl = await pb.collection('students').getList(1, 1, {
        filter: `studentUrl = "${studentIdentifier}"`
      })
      
      if (studentsByUrl.items.length > 0) {
        student = studentsByUrl.items[0]
      } else {
        // 尝试通过student_id查找
        const studentsById = await pb.collection('students').getList(1, 1, {
          filter: `student_id = "${studentIdentifier}"`
        })
        
        if (studentsById.items.length > 0) {
          student = studentsById.items[0]
        }
      }
    } catch (error) {
      console.error('查找学生失败:', error)
      return NextResponse.json({ 
        success: false, 
        error: '查找学生信息失败' 
      }, { status: 500 })
    }

    if (!student) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到对应的学生信息',
        nfcData: studentIdentifier,
        nfcType
      }, { status: 404 })
    }

    // 验证学生状态
    if (student.status !== 'active') {
      return NextResponse.json({ 
        success: false, 
        error: `学生状态异常: ${student.status}`,
        student: {
          id: student.id,
          name: student.student_name,
          status: student.status
        }
      }, { status: 400 })
    }

    // 创建考勤记录
    const attendanceData = {
      studentId: student.student_id || student.id,
      centerId: centerId || 'unknown',
      type: 'check-in',
      timestamp: new Date().toISOString(),
      status: 'success',
      deviceId: deviceInfo?.deviceId || 'unknown',
      deviceName: deviceInfo?.deviceName || 'unknown',
      nfcType: nfcType,
      nfcData: studentIdentifier
    }

    try {
      const attendanceRecord = await pb.collection('attendance').create(attendanceData)
      
      return NextResponse.json({
        success: true,
        message: '考勤记录成功',
        student: {
          id: student.id,
          studentId: student.student_id,
          name: student.student_name,
          center: student.center,
          status: student.status
        },
        attendance: attendanceRecord,
        nfcInfo: {
          type: nfcType,
          data: studentIdentifier
        }
      })
    } catch (error) {
      console.error('创建考勤记录失败:', error)
      return NextResponse.json({ 
        success: false, 
        error: '创建考勤记录失败' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('NFC读取API错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'NFC读取API',
    status: 'active',
    methods: ['POST'],
    description: '用于读取NFC卡片数据并记录考勤'
  })
}
