import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function POST(request: NextRequest) {
  try {
    const attendanceData = await request.json()
    
    console.log('📝 API: 教师考勤记录请求', attendanceData)
    
    // 使用IP地址连接PocketBase
    const pb = new PocketBase('http://175.143.222.30:8090')
    
    // 管理员认证
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ API: PocketBase管理员认证成功')
    
    // 检查今日考勤记录（支持check-in和check-out）
    const today = new Date().toISOString().split('T')[0]
    const existingAttendance = await pb.collection('teacher_attendance').getList(1, 1, {
      filter: `teacher_id = "${attendanceData.teacher_id}" && check_in >= "${today}"`,
      sort: '-check_in'
    })
    
    let attendanceType = 'check_in'
    let existingRecord = null
    
    if (existingAttendance.items.length > 0) {
      existingRecord = existingAttendance.items[0]
      // 如果已有check_in但没有check_out，则这次是check_out
      if (existingRecord.check_in && !existingRecord.check_out) {
        attendanceType = 'check_out'
        console.log('📤 API: 教师check-out', { 
          teacherName: attendanceData.teacher_name,
          lastCheckIn: existingRecord.check_in
        })
      } else {
        // 如果已有check_out，则创建新的check_in记录
        attendanceType = 'check_in'
        console.log('📥 API: 教师新的check-in', { 
          teacherName: attendanceData.teacher_name,
          lastCheckOut: existingRecord.check_out
        })
      }
    } else {
      console.log('📥 API: 教师首次check-in', { 
        teacherName: attendanceData.teacher_name
      })
    }
    
    let attendanceRecord
    
    if (attendanceType === 'check_out' && existingRecord) {
      // 更新现有记录的check_out字段
      const updateData = {
        check_out: attendanceData.attendance_time,
        status: 'present' // 保持present状态
      }
      
      console.log('🔧 API: 更新教师check-out记录', {
        recordId: existingRecord.id,
        updateData,
        existingRecord: {
          check_in: existingRecord.check_in,
          check_out: existingRecord.check_out,
          status: existingRecord.status
        }
      })
      
      attendanceRecord = await pb.collection('teacher_attendance').update(existingRecord.id, updateData)
      
      console.log('✅ API: 教师check-out记录更新成功', {
        attendanceId: attendanceRecord.id,
        teacherName: attendanceData.teacher_name,
        checkIn: existingRecord.check_in,
        checkOut: attendanceData.attendance_time,
        center: attendanceData.center
      })
    } else {
      // 创建新的check_in记录
      const recordData = {
        teacher_id: attendanceData.teacher_id,
        teacher_name: attendanceData.teacher_name,
        center: attendanceData.center,
        check_in: attendanceData.attendance_time,
        status: attendanceType === 'check_in' ? 'present' : 'completed',
        device_info: `${attendanceData.device_name} (${attendanceData.device_id})`,
        method: 'nfc'
      }
      
      attendanceRecord = await pb.collection('teacher_attendance').create(recordData)
      
      console.log('✅ API: 教师check-in记录创建', {
        attendanceId: attendanceRecord.id,
        teacherName: attendanceData.teacher_name,
        checkIn: attendanceData.attendance_time,
        center: attendanceData.center
      })
    }
    
    console.log('✅ API: 教师考勤记录成功', {
      attendanceId: attendanceRecord.id,
      teacherName: attendanceData.teacher_name,
      attendanceTime: attendanceData.attendance_time,
      center: attendanceData.center
    })
    
    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: '教师考勤记录成功'
    })
    
  } catch (error) {
    console.error('❌ API: 教师考勤记录失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}