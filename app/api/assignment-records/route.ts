import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

// 获取作业记录列表
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const assignmentId = searchParams.get('assignment_id')
    const studentId = searchParams.get('student_id')
    const teacherId = searchParams.get('teacher_id')
    const status = searchParams.get('status')

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

    // 构建过滤条件
    let filter = ''
    const conditions = []
    
    if (assignmentId) {
      conditions.push(`assignment_id = "${assignmentId}"`)
    }
    
    if (studentId) {
      conditions.push(`student_id = "${studentId}"`)
    }
    
    if (teacherId) {
      conditions.push(`teacher_id = "${teacherId}"`)
    }
    
    if (status) {
      conditions.push(`status = "${status}"`)
    }
    
    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    // 获取作业记录列表
    const records = await pb.collection('assignment_records').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'assignment_id,student_id,graded_by'
    })

    return NextResponse.json({
      success: true,
      data: records
    })

  } catch (error) {
    console.error('❌ 获取作业记录列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取作业记录列表失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 创建或更新作业记录
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { 
      assignment_id,
      student_id,
      student_name,
      content,
      attachments,
      score,
      feedback,
      graded_by,
      status = 'pending'
    } = body

    // 验证必需字段
    if (!assignment_id || !student_id) {
      return NextResponse.json(
        { error: '缺少必需字段: assignment_id, student_id' },
        { status: 400 }
      )
    }

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

    // 检查是否已存在记录
    let existingRecord
    try {
      existingRecord = await pb.collection('assignment_records').getFirstListItem(
        `assignment_id = "${assignment_id}" && student_id = "${student_id}"`
      )
    } catch (error) {
      // 如果没有找到记录，继续创建新记录
    }

    const recordData = {
      assignment_id,
      student_id,
      content: content || '',
      attachments: attachments || [],
      score: score ? parseFloat(score) : null,
      max_score: 100,
      feedback: feedback || '',
      graded_by: graded_by || null,
      graded_at: score ? new Date().toISOString() : null,
      status,
      submitted_at: content ? new Date().toISOString() : null
    }

    let record
    if (existingRecord) {
      // 更新现有记录
      record = await pb.collection('assignment_records').update(existingRecord.id, recordData)
    } else {
      // 创建新记录
      record = await pb.collection('assignment_records').create(recordData)
    }

    return NextResponse.json({
      success: true,
      data: record
    })

  } catch (error) {
    console.error('❌ 创建/更新作业记录失败:', error)
    return NextResponse.json(
      { 
        error: '创建/更新作业记录失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
