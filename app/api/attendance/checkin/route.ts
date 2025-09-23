import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

// 创建PocketBase实例
const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')

// 管理员认证
async function authenticateAdmin() {
  try {
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ 管理员认证成功')
    return true
  } catch (error) {
    console.error('❌ 管理员认证失败:', error)
    return false
  }
}

// POST - NFC自动考勤
export async function POST(request: NextRequest) {
  try {
    console.log('📱 NFC自动考勤请求')
    
    // 管理员认证
    const authSuccess = await authenticateAdmin()
    if (!authSuccess) {
      return NextResponse.json({ error: '认证失败' }, { status: 401 })
    }
    
    // 获取请求数据
    const body = await request.json()
    const { 
      studentId, 
      center, 
      timestamp, 
      method = 'nfc_card_number', 
      nfcType = 'hardware_id',
      notes = ''
    } = body
    
    console.log('📋 NFC考勤数据:', { studentId, center, method, nfcType })
    
    // 验证必需字段
    if (!studentId || !center) {
      return NextResponse.json(
        { error: '缺少必需参数: studentId, center' },
        { status: 400 }
      )
    }
    
    // 获取学生信息
    const studentResponse = await pb.collection('students').getList(1, 1, {
      filter: `student_id = "${studentId}"`
    })
    
    if (studentResponse.items.length === 0) {
      return NextResponse.json(
        { error: '学生不存在' },
        { status: 404 }
      )
    }
    
    const student = studentResponse.items[0]
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // 检查今天是否已经考勤
    const existingRecord = await pb.collection('student_attendance').getList(1, 1, {
      filter: `student_id = "${studentId}" && center = "${center}" && date = "${today}"`
    })
    
    if (existingRecord.items.length > 0) {
      console.log('⚠️ 今天已经考勤过了')
      return NextResponse.json({
        success: true,
        message: '今天已经考勤过了',
        data: existingRecord.items[0],
        student: {
          id: studentId,
          name: student.student_name
        }
      })
    }
    
    // 智能签到/签退逻辑
    const checkinTimestamp = now.toISOString()
    
    // 检查今天是否已有考勤记录
    const existingRecords = await pb.collection('student_attendance').getList(1, 1, {
      filter: `student_id = "${studentId}" && center = "${center}" && date = "${today}"`,
      sort: '-created'
    })
    
    console.log('🔍 检查现有记录:', {
      studentId,
      center,
      today,
      existingCount: existingRecords.items.length,
      existingRecord: existingRecords.items[0] || null
    })
    
    let record = null
    let action = ''
    
    if (existingRecords.items.length === 0) {
      // 第一次操作 - 签到
      const attendanceData = {
        student_id: studentId,
        student_name: student.student_name,
        center: center,
        branch_name: center,
        date: today,
        check_in: checkinTimestamp,
        check_out: null,
        status: 'present',
        notes: notes || `NFC自动考勤 - ${method}`,
        teacher_id: 'system',
        teacher_name: '系统',
        device_info: JSON.stringify({ 
          method, 
          nfcType, 
          timestamp: timestamp || now.toISOString(),
          source: 'nfc_auto'
        }),
        method: method,
        timestamp: now.toISOString()
      }
      
      record = await pb.collection('student_attendance').create(attendanceData)
      action = '签到'
      console.log('✅ 学生签到成功:', student.student_name)
      
    } else {
      // 已有记录，检查是否可以签退
      const existingRecord = existingRecords.items[0]
      
      console.log('🔍 检查现有记录状态:', {
        hasCheckIn: !!existingRecord.check_in,
        hasCheckOut: !!existingRecord.check_out,
        checkIn: existingRecord.check_in,
        checkOut: existingRecord.check_out
      })
      
      if (existingRecord.check_out) {
        // 已经完成签到签退，创建新的记录（允许多次签到签退）
        console.log('🔄 已有完整记录，创建新的签到记录...')
        
        const attendanceData = {
          student_id: studentId,
          student_name: student.student_name,
          center: center,
          branch_name: center,
          date: today,
          check_in: checkinTimestamp,
          check_out: null,
          status: 'present',
          notes: notes || `NFC自动考勤 - ${method} (第${existingRecords.items.length + 1}次)`,
          teacher_id: 'system',
          teacher_name: '系统',
          device_info: JSON.stringify({ 
            method, 
            nfcType, 
            timestamp: timestamp || now.toISOString(),
            source: 'nfc_auto'
          }),
          method: method,
          timestamp: now.toISOString()
        }
        
        record = await pb.collection('student_attendance').create(attendanceData)
        action = '签到'
        console.log('✅ 学生新签到成功:', student.student_name)
        
      } else {
        // 可以签退
        console.log('🔄 开始执行签退更新...')
        
        const updateData = {
          check_out: checkinTimestamp,
          notes: existingRecord.notes + ` | NFC自动签退 - ${method}`,
          device_info: JSON.stringify({
            ...JSON.parse(existingRecord.device_info || '{}'),
            checkOut: {
              method,
              nfcType,
              timestamp: checkinTimestamp,
              source: 'nfc_auto'
            }
          })
        }
        
        console.log('🔍 签退更新数据:', updateData)
        
        record = await pb.collection('student_attendance').update(existingRecord.id, updateData)
        
        console.log('✅ 签退更新结果:', record)
        
        action = '签退'
        console.log('✅ 学生签退成功:', student.student_name)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: record,
      action: action,
      message: `NFC${action}记录成功`,
      student: {
        id: studentId,
        name: student.student_name
      }
    })
    
  } catch (error) {
    console.error('❌ NFC考勤记录失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '考勤记录失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}