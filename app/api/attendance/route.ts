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

// GET - 获取考勤记录
export async function GET(request: NextRequest) {
  try {
    console.log('📊 获取考勤记录请求')
    
    // 管理员认证
    const authSuccess = await authenticateAdmin()
    if (!authSuccess) {
      return NextResponse.json({ error: '认证失败' }, { status: 401 })
    }
    
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const center = searchParams.get('center')
    const studentId = searchParams.get('student')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log('📋 查询参数:', { center, studentId, date, limit })
    
    // 构建过滤条件
    let filter = ''
    if (center) {
      filter += `center = "${center}"`
    }
    if (studentId) {
      if (filter) filter += ' && '
      filter += `student_id = "${studentId}"`
    }
    if (date) {
      if (filter) filter += ' && '
      filter += `date = "${date}"`
    }
    
    console.log('🔍 过滤条件:', filter || '无过滤')
    
    // 查询考勤记录
    let records
    if (filter) {
      records = await pb.collection('student_attendance').getList(1, limit, {
        filter: filter,
        sort: '-timestamp'
      })
    } else {
      records = await pb.collection('student_attendance').getList(1, limit, {
        sort: '-timestamp'
      })
    }
    
    console.log('✅ 查询成功，记录数:', records.items.length)
    
    return NextResponse.json({
      success: true,
      records: records.items,
      total: records.totalItems,
      count: records.items.length,
      query: { center, studentId, date, limit }
    })
    
  } catch (error) {
    console.error('❌ 获取考勤记录失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '获取考勤记录失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// POST - 创建考勤记录
export async function POST(request: NextRequest) {
  try {
    console.log('📝 创建考勤记录请求')
    
    // 管理员认证
    const authSuccess = await authenticateAdmin()
    if (!authSuccess) {
      return NextResponse.json({ error: '认证失败' }, { status: 401 })
    }
    
    // 获取请求数据
    const body = await request.json()
    const { 
      studentId, 
      studentName, 
      center, 
      branchName, 
      date, 
      checkIn, 
      checkOut, 
      status = 'present',
      notes = '',
      teacherId = 'system',
      teacherName = '系统',
      method = 'manual',
      deviceInfo = {}
    } = body
    
    console.log('📋 考勤数据:', { studentId, studentName, center, status })
    
    // 验证必需字段
    if (!studentId || !center) {
      return NextResponse.json(
        { error: '缺少必需字段: studentId, center' },
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
    const today = date || now.toISOString().split('T')[0]
    
    // 智能签到/签退逻辑
    const checkinTimestamp = checkIn || now.toISOString()
    
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
        student_name: studentName || student.student_name,
        center: center,
        branch_name: branchName || center,
        date: today,
        check_in: checkinTimestamp,
        check_out: null,
        status: status,
        notes: notes || `手动考勤 - ${method}`,
        teacher_id: teacherId,
        teacher_name: teacherName,
        device_info: JSON.stringify(deviceInfo),
        method: method,
        timestamp: now.toISOString()
      }
      
      record = await pb.collection('student_attendance').create(attendanceData)
      action = '签到'
      console.log('✅ 学生签到成功:', studentName || student.student_name)
      
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
          student_name: studentName || student.student_name,
          center: center,
          branch_name: branchName || center,
          date: today,
          check_in: checkinTimestamp,
          check_out: null,
          status: status,
          notes: notes || `手动考勤 - ${method} (第${existingRecords.items.length + 1}次)`,
          teacher_id: teacherId,
          teacher_name: teacherName,
          device_info: JSON.stringify(deviceInfo),
          method: method,
          timestamp: now.toISOString()
        }
        
        record = await pb.collection('student_attendance').create(attendanceData)
        action = '签到'
        console.log('✅ 学生新签到成功:', studentName || student.student_name)
        
      } else {
        // 可以签退
        console.log('🔄 开始执行签退更新...')
        
        const updateData = {
          check_out: checkinTimestamp,
          notes: existingRecord.notes + ` | 手动签退 - ${method}`,
          device_info: JSON.stringify({
            ...JSON.parse(existingRecord.device_info || '{}'),
            checkOut: {
              deviceInfo: deviceInfo,
              method: method,
              timestamp: checkinTimestamp
            }
          })
        }
        
        console.log('🔍 签退更新数据:', updateData)
        
        record = await pb.collection('student_attendance').update(existingRecord.id, updateData)
        
        console.log('✅ 签退更新结果:', record)
        
        action = '签退'
        console.log('✅ 学生签退成功:', studentName || student.student_name)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: record,
      action: action,
      message: `学生${action}记录已保存`,
      student: {
        id: studentId,
        name: studentName || student.student_name
      }
    })
    
  } catch (error) {
    console.error('❌ 创建考勤记录失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '创建考勤记录失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}