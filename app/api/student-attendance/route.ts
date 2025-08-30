import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

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

    // 创建学生考勤记录 - 支持移动端考勤和缺席标记
    const attendanceData = {
      student_id: student_id,
      student_name: student_name,
      center: center,
      date: date || new Date(timestamp || new Date()).toISOString().split('T')[0],
      time: time || new Date(timestamp || new Date()).toISOString(),
      status: status, // 'present', 'late', 'absent'
      timestamp: timestamp || new Date().toISOString(),
      method: method, // 'mobile', 'manual', 'nfc', 'url'
      // 新增缺席相关字段
      reason: reason || '',
      detail: detail || '',
      teacher_id: teacher_id || 'system',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
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
    const center = searchParams.get('center')
    const studentId = searchParams.get('student')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    let filter = ''

    if (center) {
      filter += `center = "${center}"`
    }

    if (date) {
      if (filter) filter += ' && '
      filter += `date = "${date}"`
    }

    if (status) {
      if (filter) filter += ' && '
      filter += `status = "${status}"`
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

    // 格式化考勤记录数据 - 支持移动端考勤格式
    const formattedRecords = records.items.map(record => {
      return {
        id: record.id,
        student_id: record.student_id || '无学号',
        student_name: record.student_name || '未知姓名',
        center: record.center || record.branch_code || '未指定',
        date: record.date || '未指定',
        time: record.time || record.check_in || '未指定',
        status: record.status || 'unknown',
        timestamp: record.timestamp || record.created || '未指定',
        method: record.method || 'manual',
        // 添加缺席相关字段
        reason: record.reason || '',
        detail: record.detail || '',
        teacher_id: record.teacher_id || '',
        created: record.created,
        updated: record.updated
      };
    })

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      totalItems: records.totalItems,
      totalPages: records.totalPages,
      page: records.page,
      perPage: records.perPage
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
