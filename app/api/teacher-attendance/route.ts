import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

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
      method,        // 'manual', 'nfc', 'url'
      status,        // 'success', 'failed'
      // 缺席相关字段
      studentId,
      studentName,
      absenceReason,
      absenceDetail,
      absenceDate
    } = body

    // 验证必需字段
    if (!teacherId || !teacherName || !centerId || !type) {
      return NextResponse.json(
        { error: '缺少必需字段: teacherId, teacherName, centerId, type' },
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
      // 教师签到签退
      const attendanceData = {
        teacher_id: teacherId,
        teacher_name: teacherName,
        branch_code: branchId || centerId,
        branch_name: branchName || centerName || centerId,
        date: new Date(timestamp || new Date()).toISOString().split('T')[0],
        check_in: type === 'check-in' ? new Date(timestamp || new Date()).toISOString() : null,
        check_out: type === 'check-out' ? new Date(timestamp || new Date()).toISOString() : null,
        status: 'present',
        method: method || 'manual',
        device_info: deviceName || 'unknown',
        notes: `教师${type === 'check-in' ? '签到' : '签退'}，方式: ${method || 'manual'}`
      }

      // 保存到PocketBase的teacher_attendance集合
      const record = await pb.collection('teacher_attendance').create(attendanceData)

      return NextResponse.json({
        success: true,
        data: record,
        message: `教师${type === 'check-in' ? '签到' : '签退'}记录已保存`
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const centerId = searchParams.get('center')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const type = searchParams.get('type') // 'teacher' 或 'student'

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

    if (type === 'teacher') {
      // 获取教师考勤数据
      const filter = `date = "${date}"`
      const records = await pb.collection('teacher_attendance').getList(1, 50, {
        filter,
        sort: '-created'
      })

      return NextResponse.json({
        success: true,
        data: records.items,
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
