import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 根据绩效评估调整薪资结构
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { teacher_id, evaluation_id, adjustment_type, created_by } = data

    if (!teacher_id || !evaluation_id || !adjustment_type || !created_by) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    await authenticateAdmin()

    // 获取绩效评估记录
    const evaluation = await pb.collection('teacher_performance_evaluation').getOne(evaluation_id)
    
    if (evaluation.teacher_id !== teacher_id) {
      return NextResponse.json(
        { success: false, error: '绩效评估记录与教师不匹配' },
        { status: 400 }
      )
    }

    if (evaluation.status !== 'finalized') {
      return NextResponse.json(
        { success: false, error: '绩效评估尚未确认，无法调整薪资' },
        { status: 400 }
      )
    }

    // 获取当前薪资结构
    const currentStructure = await pb.collection('teacher_salary_structure').getList(1, 1, {
      filter: `teacher_id = "${teacher_id}" && status = "active"`,
      sort: '-effective_date'
    })

    if (currentStructure.items.length === 0) {
      return NextResponse.json(
        { success: false, error: '未找到当前薪资结构' },
        { status: 400 }
      )
    }

    const structure = currentStructure.items[0]
    const overallScore = evaluation.overall_score
    const adjustment = calculateSalaryAdjustment(overallScore, adjustment_type)

    // 创建新的薪资结构
    const newStructure = {
      teacher_id: teacher_id,
      base_salary: Math.round(structure.base_salary * (1 + adjustment.baseAdjustment)),
      hourly_rate: structure.hourly_rate ? Math.round(structure.hourly_rate * (1 + adjustment.hourlyAdjustment) * 100) / 100 : null,
      overtime_rate: structure.overtime_rate ? Math.round(structure.overtime_rate * (1 + adjustment.overtimeAdjustment) * 100) / 100 : null,
      allowance_fixed: Math.round(structure.allowance_fixed * (1 + adjustment.allowanceAdjustment)),
      allowance_transport: structure.allowance_transport ? Math.round(structure.allowance_transport * (1 + adjustment.allowanceAdjustment)) : null,
      allowance_meal: structure.allowance_meal ? Math.round(structure.allowance_meal * (1 + adjustment.allowanceAdjustment)) : null,
      allowance_other: structure.allowance_other ? Math.round(structure.allowance_other * (1 + adjustment.allowanceAdjustment)) : null,
      epf_rate: structure.epf_rate,
      socso_rate: structure.socso_rate,
      eis_rate: structure.eis_rate,
      tax_rate: structure.tax_rate,
      salary_type: structure.salary_type,
      effective_date: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: `基于绩效评估调整 - 评分: ${overallScore}/10, 调整类型: ${adjustment_type}`,
      created_by
    }

    // 停用旧结构
    await pb.collection('teacher_salary_structure').update(structure.id, {
      status: 'inactive',
      end_date: new Date().toISOString().split('T')[0]
    })

    // 创建新结构
    const newRecord = await pb.collection('teacher_salary_structure').create(newStructure)

    // 记录调整历史
    const adjustmentRecord = {
      teacher_id: teacher_id,
      evaluation_id: evaluation_id,
      adjustment_type: adjustment_type,
      old_base_salary: structure.base_salary,
      new_base_salary: newStructure.base_salary,
      adjustment_percentage: adjustment.baseAdjustment * 100,
      performance_score: overallScore,
      effective_date: newStructure.effective_date,
      created_by,
      notes: `绩效调整: ${adjustment_type}, 评分: ${overallScore}/10`
    }

    // 这里可以创建一个薪资调整历史记录集合
    // await pb.collection('teacher_salary_adjustment_history').create(adjustmentRecord)

    return NextResponse.json({
      success: true,
      message: '薪资结构已根据绩效评估调整',
      data: {
        teacher_id,
        evaluation_id,
        performance_score: overallScore,
        adjustment_type,
        old_base_salary: structure.base_salary,
        new_base_salary: newStructure.base_salary,
        adjustment_percentage: adjustment.baseAdjustment * 100,
        new_structure_id: newRecord.id,
        effective_date: newStructure.effective_date
      }
    })

  } catch (error) {
    console.error('绩效薪资调整失败:', error)
    return NextResponse.json(
      { success: false, error: '绩效薪资调整失败' },
      { status: 500 }
    )
  }
}

// 计算薪资调整幅度
function calculateSalaryAdjustment(score: number, adjustmentType: string) {
  let baseAdjustment = 0
  let hourlyAdjustment = 0
  let overtimeAdjustment = 0
  let allowanceAdjustment = 0

  // 根据评分和调整类型计算调整幅度
  if (adjustmentType === 'conservative') {
    // 保守调整
    if (score >= 9) {
      baseAdjustment = 0.05      // 5%
      allowanceAdjustment = 0.03 // 3%
    } else if (score >= 8) {
      baseAdjustment = 0.03      // 3%
      allowanceAdjustment = 0.02 // 2%
    } else if (score >= 7) {
      baseAdjustment = 0.01      // 1%
      allowanceAdjustment = 0.01 // 1%
    } else if (score < 5) {
      baseAdjustment = -0.02     // -2%
      allowanceAdjustment = -0.01 // -1%
    }
  } else if (adjustmentType === 'moderate') {
    // 中等调整
    if (score >= 9) {
      baseAdjustment = 0.08      // 8%
      allowanceAdjustment = 0.05 // 5%
    } else if (score >= 8) {
      baseAdjustment = 0.05      // 5%
      allowanceAdjustment = 0.03 // 3%
    } else if (score >= 7) {
      baseAdjustment = 0.02      // 2%
      allowanceAdjustment = 0.01 // 1%
    } else if (score < 5) {
      baseAdjustment = -0.03     // -3%
      allowanceAdjustment = -0.02 // -2%
    }
  } else if (adjustmentType === 'aggressive') {
    // 激进调整
    if (score >= 9) {
      baseAdjustment = 0.12      // 12%
      allowanceAdjustment = 0.08 // 8%
    } else if (score >= 8) {
      baseAdjustment = 0.08      // 8%
      allowanceAdjustment = 0.05 // 5%
    } else if (score >= 7) {
      baseAdjustment = 0.03      // 3%
      allowanceAdjustment = 0.02 // 2%
    } else if (score < 5) {
      baseAdjustment = -0.05     // -5%
      allowanceAdjustment = -0.03 // -3%
    }
  }

  // 时薪和加班费按相同比例调整
  hourlyAdjustment = baseAdjustment
  overtimeAdjustment = baseAdjustment

  return {
    baseAdjustment,
    hourlyAdjustment,
    overtimeAdjustment,
    allowanceAdjustment
  }
}
