import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 接收到的教师考勤数据:', body)
    
    const { 
      teacherId, 
      teacherName,
      centerId, 
      centerName,
      branchId,      
      branchName,    
      type,          // 'check-in', 'check-out', 'mark-absence'
      timestamp, 
      deviceId, 
      deviceName,
      method,        // 'manual', 'nfc_card_number', 'url'
      status,        // 'success', 'failed'
      // WiFi网络验证相关字段
      wifiNetwork,
      wifiVerified,
      networkInfo,
      // 缺席相关字段
      studentId,
      studentName,
      absenceReason,
      absenceDetail,
      absenceDate
    } = body

    console.log('🔍 解析后的字段:', { teacherId, teacherName, centerId, type })

    // 验证必需字段
    if (!teacherId || !teacherName || !centerId || !type) {
      console.error('❌ 缺少必需字段:', { teacherId, teacherName, centerId, type })
      return NextResponse.json(
        { error: '缺少必需字段: teacherId, teacherName, centerId, type' },
        { status: 400 }
      )
    }

    // 进行管理员认证（因为集合有创建规则）
    console.log('🔍 开始处理教师考勤记录...')
    console.log('🔍 处理类型:', type)
    
    try {
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    if (type === 'mark-absence') {
      // 标记学生缺席
      if (!studentId || !studentName || !absenceReason || !absenceDate) {
        return NextResponse.json(
          { error: '标记缺席缺少必需字段: studentId, studentName, absenceReason, absenceDate' },
          { status: 400 }
        )
      }

      // 创建学生缺席记录
      const absenceData = {
        student_id: studentId,
        student_name: studentName,
        branch_code: branchId || centerId,
        branch_name: branchName || centerName || centerId,
        date: absenceDate,
        status: 'absent',
        reason: absenceReason,
        reason_detail: absenceDetail || '',
        marked_by: teacherId,
        marked_at: new Date().toISOString(),
        notes: `由教师 ${teacherName} 标记，原因: ${absenceReason}`
      }

      const record = await pb.collection('student_attendance').create(absenceData)

      return NextResponse.json({
        success: true,
        data: record,
        message: '学生缺席记录已保存'
      })
    } else {
      // 教师智能签到/签退逻辑（完全按照学生逻辑）
      console.log('🔍 进入教师签到/签退逻辑')
      const today = new Date(timestamp || new Date()).toISOString().split('T')[0]
      const checkinTimestamp = new Date(timestamp || new Date()).toISOString()
      console.log('🔍 时间参数:', { today, checkinTimestamp })
      
      // 检查今天是否已有考勤记录
      // 使用日期范围查询，因为date字段可能包含时间
      const startOfDay = `${today} 00:00:00`
      const endOfDay = `${today} 23:59:59`
      const existingRecords = await pb.collection('teacher_attendance').getList(1, 1, {
        filter: `teacher_id = "${teacherId}" && branch_code = "${branchId || centerId}" && date >= "${startOfDay}" && date <= "${endOfDay}"`,
        sort: '-created'
      })
      
      console.log('🔍 检查教师现有记录:', {
        teacherId,
        branchId: branchId || centerId,
        today,
        existingCount: existingRecords.items.length,
        existingRecord: existingRecords.items[0] || null
      })
      
      let record = null
      let action = ''
      
      if (existingRecords.items.length === 0) {
        // 第一次操作 - 签到
        const attendanceData = {
          teacher_id: teacherId,
          teacher_name: teacherName,
          branch_code: branchId || centerId,
          branch_name: branchName || centerName || centerId,
          date: today,
          check_in: checkinTimestamp,
          check_out: null,
          status: 'present',
          method: method || 'manual',
          device_info: deviceName || 'unknown',
          notes: `桌面端签到 - ${method || 'manual'}`
        }
        
        record = await pb.collection('teacher_attendance').create(attendanceData)
        action = '签到'
        console.log('✅ 教师签到成功:', teacherName)
        
      } else {
        // 已有记录，检查是否可以签退
        const existingRecord = existingRecords.items[0]
        
        console.log('🔍 检查教师现有记录状态:', {
          hasCheckIn: !!existingRecord.check_in,
          hasCheckOut: !!existingRecord.check_out,
          checkIn: existingRecord.check_in,
          checkOut: existingRecord.check_out
        })
        
        if (existingRecord.check_out) {
          // 已经完成签到签退，创建新的记录（允许多次签到签退）
          console.log('🔄 已有完整记录，创建新的签到记录...')
          
          const attendanceData = {
            teacher_id: teacherId,
            teacher_name: teacherName,
            branch_code: branchId || centerId,
            branch_name: branchName || centerName || centerId,
            date: today,
            check_in: checkinTimestamp,
            check_out: null,
            status: 'present',
            method: method || 'manual',
            device_info: deviceName || 'unknown',
            notes: `桌面端签到 - ${method || 'manual'} (第${existingRecords.items.length + 1}次)`
          }
          
          record = await pb.collection('teacher_attendance').create(attendanceData)
          action = '签到'
          console.log('✅ 教师新签到成功:', teacherName)
          
        } else {
          // 可以签退
          console.log('🔄 开始执行教师签退更新...')
          
          const updateData = {
            check_out: checkinTimestamp,
            notes: existingRecord.notes + ` | 桌面端签退 - ${method || 'manual'}`,
            device_info: existingRecord.device_info + ` | 签退设备: ${deviceName || 'unknown'}`
          }
          
          console.log('🔍 教师签退更新数据:', updateData)
          
          record = await pb.collection('teacher_attendance').update(existingRecord.id, updateData)
          
          console.log('✅ 教师签退更新结果:', record)
          
          action = '签退'
          console.log('✅ 教师签退成功:', teacherName)
        }
      }

      return NextResponse.json({
        success: true,
        data: record,
        action: action,
        message: `教师${action}记录已保存`
      })
    }

  } catch (error: any) {
    console.error('❌ 教师考勤记录失败:', error)
    console.error('❌ 错误详情:', {
      message: error.message,
      status: error.status,
      data: error.data,
      stack: error.stack
    })
    return NextResponse.json(
      { 
        error: '教师考勤记录失败', 
        details: error.message || '未知错误',
        status: error.status,
        data: error.data
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const centerId = searchParams.get('center')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') // 'teacher' 或 'student'
    
    console.log('🔍 API接收到的参数:', { centerId, date, startDate, endDate, type })

    // 进行管理员认证（因为集合有查看规则）
    console.log('🔍 开始获取考勤数据...')
    
    try {
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }

    if (type === 'teacher') {
      // 简单查询：获取所有教师考勤记录，然后在前端过滤
      const records = await pb.collection('teacher_attendance').getList(1, 100, {
        sort: '-created'
      })
      
      console.log('🔍 获取到所有教师考勤记录:', records.items.length, '条')
      
      // 过滤今日记录
      const todayRecords = records.items.filter(record => {
        const recordDate = new Date(record.check_in || record.date).toISOString().split('T')[0]
        return recordDate === date
      })
      
      console.log('🔍 今日考勤记录:', todayRecords.length, '条')
      console.log('🔍 记录详情:', todayRecords.map(r => ({
        id: r.id,
        teacher_name: r.teacher_name,
        date: r.date,
        check_in: r.check_in,
        check_out: r.check_out
      })))

      return NextResponse.json({
        success: true,
        records: todayRecords,
        total: todayRecords.length,
        message: '教师考勤数据获取成功'
      })
    } else {
      // 获取学生考勤数据（包括缺席记录）
      const filter = `date = "${date}"`
      const records = await pb.collection('student_attendance').getList(1, 100, {
        filter,
        sort: '-created'
      })

      return NextResponse.json({
        success: true,
        data: records.items,
        message: '学生考勤数据获取成功'
      })
    }

  } catch (error: any) {
    console.error('获取考勤数据失败:', error)
    return NextResponse.json(
      { 
        error: '获取考勤数据失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
