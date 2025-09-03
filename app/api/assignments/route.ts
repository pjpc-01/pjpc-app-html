import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

// 获取作业列表
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const teacherId = searchParams.get('teacher_id')
    const subject = searchParams.get('subject')
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
    
    if (teacherId) {
      conditions.push(`teacher_id = "${teacherId}"`)
    }
    
    if (subject) {
      conditions.push(`subject = "${subject}"`)
    }
    
    if (status) {
      conditions.push(`status = "${status}"`)
    }
    
    if (conditions.length > 0) {
      filter = conditions.join(' && ')
    }

    // 获取作业列表
    const assignments = await pb.collection('assignments').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'teacher_id,class_id'
    })

    return NextResponse.json({
      success: true,
      data: assignments
    })

  } catch (error) {
    console.error('❌ 获取作业列表失败:', error)
    return NextResponse.json(
      { 
        error: '获取作业列表失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 创建新作业
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const body = await request.json()
    const { 
      title,
      description,
      subject,
      class_id,
      teacher_id,
      due_date,
      max_score = 100,
      status = 'active'
    } = body

    // 验证必需字段
    if (!title || !subject || !teacher_id) {
      return NextResponse.json(
        { error: '缺少必需字段: title, subject, teacher_id' },
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

    // 创建作业记录
    const assignmentData = {
      title,
      description: description || '',
      subject,
      class_id: class_id || null,
      teacher_id,
      due_date: due_date || null,
      max_score,
      status
    }

    const assignment = await pb.collection('assignments').create(assignmentData)

    return NextResponse.json({
      success: true,
      data: assignment
    })

  } catch (error) {
    console.error('❌ 创建作业失败:', error)
    return NextResponse.json(
      { 
        error: '创建作业失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
