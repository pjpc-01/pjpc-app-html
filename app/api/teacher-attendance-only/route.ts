import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 动态路由配置
export const dynamic = 'force-dynamic'

// GET - 获取教师考勤记录（只返回教师数据）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const teacherId = searchParams.get('teacherId')
    const teacherName = searchParams.get('teacherName')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const limit = pageSize
    
    console.log('👨‍🏫 获取教师考勤记录请求:', { center, teacherId, teacherName, date, status, page, pageSize })
    
    const pb = await getPocketBase()
    
    // 管理员认证
    try {
      await authenticateAdmin()
      console.log('✅ 管理员认证成功')
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError)
      return NextResponse.json(
        { 
          success: false,
          error: 'PocketBase认证失败', 
          details: '无法以管理员身份登录'
        },
        { status: 500 }
      )
    }
    
    // 构建过滤条件 - 直接查询teacher_attendance集合
    let filter = ''
    
    // 添加过滤条件
    if (center) {
      filter += `branch_code = "${center}"`
    }
    if (teacherId) {
      filter += filter ? ` && teacher_id = "${teacherId}"` : `teacher_id = "${teacherId}"`
    }
    if (teacherName) {
      filter += filter ? ` && teacher_name ~ "${teacherName}"` : `teacher_name ~ "${teacherName}"`
    }
    if (date) {
      filter += filter ? ` && date = "${date}"` : `date = "${date}"`
    }
    if (status) {
      filter += filter ? ` && status = "${status}"` : `status = "${status}"`
    }

    console.log('🔍 教师考勤过滤条件:', filter)

    // 直接查询teacher_attendance集合
    const records = await pb.collection('teacher_attendance').getList(page, limit, {
      filter: filter || undefined, // 如果filter为空字符串，传undefined
      sort: '-created'
    })

    console.log('✅ 教师考勤查询成功，记录数:', records.items.length)
    console.log('🔍 教师记录:', records.items.map(r => `${r.teacher_name} (${r.teacher_id})`))
    
    return NextResponse.json({
      success: true,
      records: records.items,
      total: records.totalItems,
      count: records.items.length,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(records.totalItems / pageSize),
      query: { center, teacherId, teacherName, date, status, page, pageSize }
    })
    
  } catch (error) {
    console.error('❌ 获取教师考勤记录失败:', error)
    console.error('❌ 错误详情:', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        success: false,
        error: '获取教师考勤记录失败',
        details: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST - 创建教师考勤记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
      wifiNetwork,
      wifiVerified,
      networkInfo,
      studentId,
      studentName,
      absenceReason,
      absenceDetail,
      absenceDate
    } = body

    console.log('🔍 接收到的教师考勤数据:', body)
    
    // 验证必需字段
    if (!teacherId || !teacherName || !centerId || !type) {
      console.error('❌ 缺少必需字段:', { teacherId, teacherName, centerId, type })
      return NextResponse.json(
        { error: '缺少必需字段: teacherId, teacherName, centerId, type' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 进行管理员认证
    console.log('🔍 开始处理教师考勤记录...')
    console.log('🔍 处理类型:', type)
    
    try {
      await authenticateAdmin()
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
        check_in: null,
        check_out: null,
        status: 'absent',
        reason: absenceReason,
        detail: absenceDetail || '',
        notes: `教师标记缺席 - ${teacherName}`,
        teacher_id: teacherId,
        teacher_name: teacherName,
        device_info: JSON.stringify({
          deviceId: deviceId || 'manual',
          deviceName: deviceName || '教师手动标记',
          method: 'teacher_mark_absence',
          timestamp: timestamp || new Date().toISOString()
        }),
        method: 'teacher_mark_absence'
      }
      
      const record = await pb.collection('student_attendance').create(absenceData)
      
      return NextResponse.json({
        success: true,
        data: record,
        action: '标记缺席',
        message: '学生缺席记录已保存'
      })
    } else {
      // 教师智能签到/签退逻辑
      console.log('🔍 进入教师签到/签退逻辑')
      const today = new Date(timestamp || new Date()).toISOString().split('T')[0]
      const checkinTimestamp = new Date(timestamp || new Date()).toISOString()
      console.log('🔍 时间参数:', { today, checkinTimestamp })
      
      // 检查今天是否已有考勤记录
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
          device_info: JSON.stringify({
            deviceId: deviceId || 'unknown',
            deviceName: deviceName || '教师考勤系统',
            method: method || 'manual',
            timestamp: checkinTimestamp,
            wifiNetwork: wifiNetwork,
            wifiVerified: wifiVerified,
            networkInfo: networkInfo
          }),
          notes: `教师考勤系统 - ${method || 'manual'}`
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
            device_info: JSON.stringify({
              deviceId: deviceId || 'unknown',
              deviceName: deviceName || '教师考勤系统',
              method: method || 'manual',
              timestamp: checkinTimestamp,
              wifiNetwork: wifiNetwork,
              wifiVerified: wifiVerified,
              networkInfo: networkInfo
            }),
            notes: `教师考勤系统 - ${method || 'manual'} (第${existingRecords.items.length + 1}次)`
          }
          
          record = await pb.collection('teacher_attendance').create(attendanceData)
          action = '签到'
          console.log('✅ 教师新签到成功:', teacherName)
          
        } else {
          // 可以签退
          console.log('🔄 开始执行教师签退更新...')
          
          const updateData = {
            check_out: checkinTimestamp,
            notes: existingRecord.notes + ` | 教师考勤系统 - ${method || 'manual'}`,
            device_info: JSON.stringify({
              ...JSON.parse(existingRecord.device_info || '{}'),
              checkOut: {
                deviceId: deviceId || 'unknown',
                deviceName: deviceName || '教师考勤系统',
                method: method || 'manual',
                timestamp: checkinTimestamp,
                wifiNetwork: wifiNetwork,
                wifiVerified: wifiVerified,
                networkInfo: networkInfo
              }
            })
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
    console.error('教师考勤记录失败:', error)
    return NextResponse.json(
      { 
        error: '教师考勤记录失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
