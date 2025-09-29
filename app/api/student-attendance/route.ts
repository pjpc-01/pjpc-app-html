import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

// GET - 获取学生考勤记录
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const studentId = searchParams.get('studentId')
    const studentName = searchParams.get('studentName')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const limit = pageSize
    
    console.log('📊 获取学生考勤记录请求:', { center, studentId, studentName, date, startDate, endDate, status, page, pageSize })
    
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
    
    // 构建过滤条件
    let filter = ''
    if (center) {
      filter += `center = "${center}"`
    }
    if (studentId) {
      if (filter) filter += ' && '
      filter += `student_id = "${studentId}"`
    }
    if (studentName) {
      if (filter) filter += ' && '
      filter += `student_name ~ "${studentName}"`
    }
    if (date) {
      if (filter) filter += ' && '
      filter += `date = "${date}"`
    }
    if (startDate) {
      if (filter) filter += ' && '
      filter += `date >= "${startDate}"`
    }
    if (endDate) {
      if (filter) filter += ' && '
      filter += `date <= "${endDate}"`
    }
    if (status) {
      if (filter) filter += ' && '
      filter += `status = "${status}"`
    }
    
    console.log('🔍 初始过滤条件:', filter || '无过滤')
    
    // 查询考勤记录 - 过滤掉教师数据
    let records
    let finalFilter = filter
    
    // 添加过滤条件：排除教师数据（ADM, T, TEACHER开头的ID）
    const excludeTeachers = `student_id != "ADM01" && student_id != "ADM02" && student_id != "T1" && student_id != "T2" && student_id != "T3"`
    if (finalFilter) {
      finalFilter += ` && ${excludeTeachers}`
    } else {
      finalFilter = excludeTeachers
    }
    
    console.log('🔍 最终过滤条件:', finalFilter)
    
    records = await pb.collection('student_attendance').getList(page, limit, {
      filter: finalFilter,
      sort: '-created'
    })
    
    console.log('✅ 查询成功，记录数:', records.items.length)
    console.log('🔍 原始学生ID列表:', records.items.map(r => r.student_id))
    
    // 后端过滤：排除教师数据
    const filteredRecords = records.items.filter(record => {
      const studentId = record.student_id
      const isTeacher = studentId && (
        studentId.startsWith('ADM') || 
        studentId.startsWith('T') ||
        studentId.startsWith('TEACHER')
      )
      console.log(`🔍 检查记录: ${record.student_name} (${studentId}) - 是否教师: ${isTeacher}`)
      return !isTeacher
    })
    
    console.log('🔍 过滤后记录数:', filteredRecords.length)
    console.log('🔍 过滤后学生ID列表:', filteredRecords.map(r => r.student_id))
    
    return NextResponse.json({
      success: true,
      records: filteredRecords,
      total: filteredRecords.length,
      count: filteredRecords.length,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(filteredRecords.length / pageSize),
      query: { center, studentId, studentName, date, status, page, pageSize }
    })
    
  } catch (error) {
    console.error('❌ 获取学生考勤记录失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '获取学生考勤记录失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      student_id, 
      student_name,
      center, 
      date,
      time,
      status,
      timestamp,
      // 新增缺席相关字段
      reason,
      detail,
      teacher_id,
      teacher_name,
      device_info,
      method = 'mobile'
    } = body

    // 验证必需字段
    if (!student_id || !student_name || !center || !status) {
      return NextResponse.json(
        { error: '缺少必需字段: student_id, student_name, center, status' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    
    // 使用新的认证函数
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

    // 智能签到/签退逻辑
    const today = date || new Date(timestamp || new Date()).toISOString().split('T')[0]
    const checkinTimestamp = time || new Date(timestamp || new Date()).toISOString()
    
    // 检查今天是否已有考勤记录
    // 使用日期范围查询，因为date字段可能包含时间
    const startOfDay = `${today} 00:00:00`
    const endOfDay = `${today} 23:59:59`
    const existingRecords = await pb.collection('student_attendance').getList(1, 1, {
      filter: `student_id = "${student_id}" && center = "${center}" && date >= "${startOfDay}" && date <= "${endOfDay}"`,
      sort: '-created'
    })
    
    console.log('🔍 检查现有记录:', {
      student_id,
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
        student_id: student_id,
        student_name: student_name,
        center: center,
        branch_name: center,
        date: today,
        check_in: checkinTimestamp,
        check_out: null,
        status: 'present',
        reason: reason || '',
        detail: detail || '',
        notes: `桌面端签到 - ${method}`,
        teacher_id: teacher_id || 'system',
        teacher_name: teacher_name || '系统',
        device_info: device_info ? JSON.stringify(device_info) : '',
        method: method
      }
      
      record = await pb.collection('student_attendance').create(attendanceData)
      action = '签到'
      console.log('✅ 学生签到成功:', student_name)
      
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
          student_id: student_id,
          student_name: student_name,
          center: center,
          branch_name: center,
          date: today,
          check_in: checkinTimestamp,
          check_out: null,
          status: 'present',
          reason: reason || '',
          detail: detail || '',
          notes: `桌面端签到 - ${method} (第${existingRecords.items.length + 1}次)`,
          teacher_id: teacher_id || 'system',
          teacher_name: teacher_name || '系统',
          device_info: device_info ? JSON.stringify(device_info) : '',
          method: method
        }
        
        record = await pb.collection('student_attendance').create(attendanceData)
        action = '签到'
        console.log('✅ 学生新签到成功:', student_name)
        
      } else {
        // 可以签退
        console.log('🔄 开始执行签退更新...')
        
        const updateData = {
          check_out: checkinTimestamp,
          notes: existingRecord.notes + ` | 桌面端签退 - ${method}`,
          device_info: JSON.stringify({
            ...JSON.parse(existingRecord.device_info || '{}'),
            checkOut: {
              deviceInfo: device_info,
              method: method,
              timestamp: checkinTimestamp
            }
          })
        }
        
        console.log('🔍 签退更新数据:', updateData)
        
        record = await pb.collection('student_attendance').update(existingRecord.id, updateData)
        
        console.log('✅ 签退更新结果:', record)
        
        action = '签退'
        console.log('✅ 学生签退成功:', student_name)
      }
    }

    return NextResponse.json({
      success: true,
      data: record,
      action: action,
      message: `学生${action}记录已保存`
    })

  } catch (error: any) {
    console.error('学生考勤记录失败:', error)
    return NextResponse.json(
      { 
        error: '学生考勤记录失败', 
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}