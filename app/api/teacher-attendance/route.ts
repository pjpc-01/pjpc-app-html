import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase-optimized'

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

    // 使用优化的PocketBase实例（自动处理认证）
    const pb = await getPocketBase()
    console.log('🔍 开始处理教师考勤记录...')
    console.log('🔍 处理类型:', type)
    console.log('✅ PocketBase实例已就绪，认证状态:', pb.authStore.isValid ? '有效' : '无效')

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
        filter: `teacher_id = "${teacherId}" && (branch_code = "${branchId || centerId}" || branch_name = "${branchName || centerName || centerId}") && date = "${today}"`,
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
    const teacherName = searchParams.get('teacherName')
    const status = searchParams.get('status')
    const type = searchParams.get('type') // 'teacher' 或 'student'
    
    console.log('🔍 服务器收到请求参数:', searchParams.toString())
    console.log('🔍 API接收到的参数:', { centerId, date, startDate, endDate, teacherName, status, type })
    console.log('🔍 请求URL:', request.url)

    // 使用优化的PocketBase实例（自动处理认证）
    const pb = await getPocketBase()
    console.log('🔍 开始获取考勤数据...')
    console.log('✅ PocketBase实例已就绪，认证状态:', pb.authStore.isValid ? '有效' : '无效')

    if (type === 'teacher') {
      // 构建过滤条件
      let filter = ''
      if (centerId) {
        filter += `(branch_code = "${centerId}" || branch_name = "${centerId}")`
      }
      if (date) {
        if (filter) filter += ' && '
        filter += `(date ~ "${date}" || date >= "${date}" || date <= "${date}")`
      }
      if (startDate) {
        if (filter) filter += ' && '
        filter += `(date >= "${startDate}" || date ~ "${startDate}")`
      }
      if (endDate) {
        if (filter) filter += ' && '
        filter += `(date <= "${endDate}" || date ~ "${endDate}")`
      }
      if (teacherName) {
        if (filter) filter += ' && '
        filter += `teacher_name ~ "${teacherName}"`
      }
      if (status) {
        if (filter) filter += ' && '
        filter += `status = "${status}"`
      }
      
      console.log('🔍 教师考勤过滤条件:', filter || '无过滤')
      
      // 查询教师考勤记录 - 先获取所有记录进行调试
      const page = parseInt(searchParams.get('page') || '1')
      const pageSize = parseInt(searchParams.get('pageSize') || '50')
      const limit = pageSize
      const offset = (page - 1) * pageSize
      
      console.log('🔍 应用过滤条件:', filter || '无过滤')
      
      // 应用过滤条件，但使用更宽松的日期匹配
      const allRecords = await pb.collection('teacher_attendance').getList(page, limit, {
        filter: filter || undefined,
        sort: '-created'
      })
      
      console.log('🔍 教师考勤记录查询结果:', allRecords.items.length, '条')
      console.log('🔍 总记录数:', allRecords.totalItems)
      console.log('🔍 记录示例:', allRecords.items.slice(0, 3).map(r => ({
        id: r.id,
        teacher_id: r.teacher_id,
        teacher_name: r.teacher_name,
        date: r.date,
        check_in: r.check_in,
        check_out: r.check_out,
        branch_code: r.branch_code,
        branch_name: r.branch_name,
        center: r.center
      })))
      
      // 额外调试：检查是否有任何教师考勤记录
      const allTeacherRecords = await pb.collection('teacher_attendance').getList(1, 5, {
        sort: '-created'
      })
      console.log('🔍 数据库中所有教师考勤记录数量:', allTeacherRecords.totalItems)
      if (allTeacherRecords.items.length > 0) {
        console.log('🔍 最新教师考勤记录:', allTeacherRecords.items[0])
        console.log('🔍 最新记录的日期:', allTeacherRecords.items[0].date)
      } else {
        console.log('❌ 数据库中没有找到任何教师考勤记录！')
      }
      
      // 检查不同日期的教师考勤记录
      const recentRecords = await pb.collection('teacher_attendance').getList(1, 10, {
        sort: '-created'
      })
      console.log('🔍 最近10条教师考勤记录:')
      recentRecords.items.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.teacher_name} - ${record.date} - ${record.check_in || 'N/A'}`)
      })
      
      const todayRecords = allRecords.items
      console.log('🔍 返回教师考勤记录:', todayRecords.length, '条')

      return NextResponse.json({
        success: true,
        records: todayRecords,
        total: allRecords.totalItems,
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
