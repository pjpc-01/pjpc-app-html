import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      studentId, 
      studentName,
      centerId, 
      centerName,
      branchId,      // 分行ID
      branchName,    // 分行名称
      type,          // 'check-in' 或 'check-out'
      timestamp, 
      deviceId, 
      deviceName,
      method,        // 'nfc', 'url', 'manual'
      status         // 'success', 'failed'
    } = body

    // 验证必需字段
    if (!studentId || !studentName || !centerId || !type) {
      return NextResponse.json(
        { error: '缺少必需字段: studentId, studentName, centerId, type' },
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

    // 创建学生考勤记录 - 根据实际字段结构
    const attendanceData = {
      student_id: studentId,
      student_name: studentName,
      branch_code: branchId || centerId,        // 分行代码
      branch_name: branchName || centerName || centerId, // 分行名称
      date: new Date(timestamp || new Date()).toISOString().split('T')[0], // 日期格式 YYYY-MM-DD
      check_in: type === 'check-in' ? new Date(timestamp || new Date()).toISOString() : null, // 签到时间
      check_out: type === 'check-out' ? new Date(timestamp || new Date()).toISOString() : null, // 签退时间
      status: 'present', // 默认状态为出席
      notes: `打卡方式: ${method || 'manual'}, 设备: ${deviceName || 'unknown'}`
    }

    // 保存到PocketBase的student_attendance集合
    const record = await pb.collection('student_attendance').create(attendanceData)

    return NextResponse.json({
      success: true,
      data: record,
      message: '学生考勤记录已保存'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const centerId = searchParams.get('center')
    const branchId = searchParams.get('branch')
    const studentId = searchParams.get('student')
    const date = searchParams.get('date')
    const type = searchParams.get('type') // 'check-in' 或 'check-out'

    let filter = ''

    if (centerId) {
      filter += `branch_code = "${centerId}"`
    }

    if (branchId) {
      if (filter) filter += ' && '
      filter += `branch_code = "${branchId}"`
    }

    if (studentId) {
      if (filter) filter += ' && '
      filter += `student_id = "${studentId}"`
    }

    if (date) {
      if (filter) filter += ' && '
      filter += `date = "${date}"`
    }

    if (type) {
      if (filter) filter += ' && '
      filter += `check_in != ""`
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

    const records = await pb.collection('student_attendance').getList(1, 100, {
      filter: filter || undefined,
      sort: '-created'
    })

    return NextResponse.json({
      success: true,
      data: records.items,
      count: records.totalItems
    })

  } catch (error: any) {
    console.error('查询学生考勤记录失败:', error)
    return NextResponse.json(
      { 
        error: '查询学生考勤记录失败',
        details: error.message || '未知错误'
      },
      { status: 500 }
    )
  }
}
