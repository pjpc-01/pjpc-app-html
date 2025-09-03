import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

// 获取作业统计数据
export async function GET(request: NextRequest) {
  try {
    const pb = await getPocketBase()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const subject = searchParams.get('subject')
    const classId = searchParams.get('class_id')

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
    let assignmentFilter = ''
    const conditions = []
    
    if (teacherId) {
      conditions.push(`teacher_id = "${teacherId}"`)
    }
    
    if (subject) {
      conditions.push(`subject = "${subject}"`)
    }
    
    if (classId) {
      conditions.push(`class_id = "${classId}"`)
    }
    
    if (conditions.length > 0) {
      assignmentFilter = conditions.join(' && ')
    }

    // 获取作业列表
    const assignments = await pb.collection('assignments').getList(1, 1000, {
      filter: assignmentFilter,
      sort: '-created'
    })

    // 获取所有作业记录（包含提交和成绩信息）
    const records = await pb.collection('assignment_records').getList(1, 1000, {
      sort: '-created',
      expand: 'assignment_id,student_id,graded_by'
    })

    // 计算统计数据
    const stats = {
      totalAssignments: assignments.totalItems,
      totalSubmissions: records.items.filter(record => record.status === 'submitted' || record.status === 'graded').length,
      totalGraded: records.items.filter(record => record.score !== null && record.score !== undefined).length,
      averageScore: 0,
      submissionRate: 0,
      subjectStats: {},
      classStats: {},
      recentActivity: []
    }

    // 计算平均分
    const gradedRecords = records.items.filter(record => record.score !== null && record.score !== undefined)
    if (gradedRecords.length > 0) {
      const totalScore = gradedRecords.reduce((sum, record) => sum + (record.score || 0), 0)
      stats.averageScore = Math.round((totalScore / gradedRecords.length) * 100) / 100
    }

    // 计算提交率
    if (assignments.totalItems > 0) {
      stats.submissionRate = Math.round((stats.totalSubmissions / assignments.totalItems) * 100) / 100
    }

    // 按科目统计
    const subjectGroups = {}
    gradedRecords.forEach(record => {
      const subject = record.expand?.assignment_id?.subject || '未知科目'
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = { total: 0, count: 0, scores: [] }
      }
      subjectGroups[subject].total += record.score || 0
      subjectGroups[subject].count += 1
      subjectGroups[subject].scores.push(record.score || 0)
    })

    Object.keys(subjectGroups).forEach(subject => {
      const group = subjectGroups[subject]
      stats.subjectStats[subject] = {
        average: Math.round((group.total / group.count) * 100) / 100,
        count: group.count,
        max: Math.max(...group.scores),
        min: Math.min(...group.scores)
      }
    })

    // 按班级统计
    const classGroups = {}
    gradedRecords.forEach(record => {
      const className = record.expand?.assignment_id?.class_id || '未知班级'
      if (!classGroups[className]) {
        classGroups[className] = { total: 0, count: 0, scores: [] }
      }
      classGroups[className].total += record.score || 0
      classGroups[className].count += 1
      classGroups[className].scores.push(record.score || 0)
    })

    Object.keys(classGroups).forEach(className => {
      const group = classGroups[className]
      stats.classStats[className] = {
        average: Math.round((group.total / group.count) * 100) / 100,
        count: group.count,
        max: Math.max(...group.scores),
        min: Math.min(...group.scores)
      }
    })

    // 最近活动
    const recentSubmissions = records.items
      .filter(record => record.submitted_at)
      .slice(0, 10)
      .map(record => ({
        type: 'submission',
        student_name: record.expand?.student_id?.student_name || '未知学生',
        assignment_title: record.expand?.assignment_id?.title || '未知作业',
        time: record.submitted_at,
        status: record.status
      }))

    const recentGrades = records.items
      .filter(record => record.graded_at)
      .slice(0, 10)
      .map(record => ({
        type: 'grade',
        student_name: record.expand?.student_id?.student_name || '未知学生',
        assignment_title: record.expand?.assignment_id?.title || '未知作业',
        score: record.score,
        time: record.graded_at
      }))

    stats.recentActivity = [...recentSubmissions, ...recentGrades]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('❌ 获取作业统计数据失败:', error)
    return NextResponse.json(
      { 
        error: '获取作业统计数据失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
