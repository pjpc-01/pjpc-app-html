import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { authenticateAdmin } from '@/lib/auth-utils'
import { TeacherPerformanceEvaluation } from '@/lib/pocketbase-schema'

// 获取教师绩效评估记录
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const year = searchParams.get('year')
    const quarter = searchParams.get('quarter')
    const status = searchParams.get('status')

    let filter = '1=1'
    if (teacherId) {
      filter += ` && teacher_id = "${teacherId}"`
    }
    if (year) {
      filter += ` && year = ${year}`
    }
    if (quarter) {
      filter += ` && quarter = ${quarter}`
    }
    if (status) {
      filter += ` && status = "${status}"`
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const records = await pb.collection('teacher_performance_evaluation').getList(page, limit, {
      filter,
      expand: 'teacher_id,evaluator_id',
      sort: '-year,-quarter'
    })

    return NextResponse.json({
      success: true,
      data: records.items,
      total: records.totalItems,
      page,
      totalPages: records.totalPages
    })
  } catch (error) {
    console.error('获取教师绩效评估记录失败:', error)
    return NextResponse.json(
      { success: false, error: '获取教师绩效评估记录失败' },
      { status: 500 }
    )
  }
}

// 创建绩效评估
export async function POST(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const {
      teacher_id,
      evaluation_period,
      year,
      quarter,
      evaluator_id,
      teaching_quality,
      student_satisfaction,
      attendance_score,
      punctuality_score,
      teamwork_score,
      communication_score,
      strengths,
      areas_for_improvement,
      goals_next_period,
      recommendations,
      notes
    } = body

    // 计算总分
    const overall_score = Math.round(
      (teaching_quality + student_satisfaction + attendance_score + 
       punctuality_score + teamwork_score + communication_score) / 6
    )

    const evaluation: Partial<TeacherPerformanceEvaluation> = {
      teacher_id,
      evaluation_period,
      year,
      quarter,
      evaluator_id,
      teaching_quality,
      student_satisfaction,
      attendance_score,
      punctuality_score,
      teamwork_score,
      communication_score,
      overall_score,
      strengths: Array.isArray(strengths) ? strengths : [],
      areas_for_improvement: Array.isArray(areas_for_improvement) ? areas_for_improvement : [],
      goals_next_period: Array.isArray(goals_next_period) ? goals_next_period : [],
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      status: 'draft',
      evaluation_date: new Date().toISOString(),
      notes
    }

    const record = await pb.collection('teacher_performance_evaluation').create(evaluation)

    return NextResponse.json({
      success: true,
      data: record,
      message: '绩效评估创建成功'
    })
  } catch (error) {
    console.error('创建绩效评估失败:', error)
    return NextResponse.json(
      { success: false, error: '创建绩效评估失败' },
      { status: 500 }
    )
  }
}

// 更新绩效评估
export async function PUT(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const body = await request.json()
    const { id, ...updateData } = body

    // 如果更新了评分，重新计算总分
    if (updateData.teaching_quality || updateData.student_satisfaction || 
        updateData.attendance_score || updateData.punctuality_score || 
        updateData.teamwork_score || updateData.communication_score) {
      
      // 获取当前记录
      const currentRecord = await pb.collection('teacher_performance_evaluation').getOne(id)
      
      const teaching_quality = updateData.teaching_quality ?? currentRecord.teaching_quality
      const student_satisfaction = updateData.student_satisfaction ?? currentRecord.student_satisfaction
      const attendance_score = updateData.attendance_score ?? currentRecord.attendance_score
      const punctuality_score = updateData.punctuality_score ?? currentRecord.punctuality_score
      const teamwork_score = updateData.teamwork_score ?? currentRecord.teamwork_score
      const communication_score = updateData.communication_score ?? currentRecord.communication_score

      updateData.overall_score = Math.round(
        (teaching_quality + student_satisfaction + attendance_score + 
         punctuality_score + teamwork_score + communication_score) / 6
      )
    }

    // 如果状态变为reviewed，设置review_date
    if (updateData.status === 'reviewed') {
      updateData.review_date = new Date().toISOString()
    }

    const record = await pb.collection('teacher_performance_evaluation').update(id, updateData)

    return NextResponse.json({
      success: true,
      data: record,
      message: '绩效评估更新成功'
    })
  } catch (error) {
    console.error('更新绩效评估失败:', error)
    return NextResponse.json(
      { success: false, error: '更新绩效评估失败' },
      { status: 500 }
    )
  }
}

// 删除绩效评估
export async function DELETE(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    await authenticateAdmin(pb)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    await pb.collection('teacher_performance_evaluation').delete(id)

    return NextResponse.json({
      success: true,
      message: '绩效评估删除成功'
    })
  } catch (error) {
    console.error('删除绩效评估失败:', error)
    return NextResponse.json(
      { success: false, error: '删除绩效评估失败' },
      { status: 500 }
    )
  }
}
