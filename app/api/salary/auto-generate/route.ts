import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// 自动生成月度薪资记录
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { year, month, teacher_id, created_by } = data

    if (!year || !month || !created_by) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const pb = await getPocketBase()
    await authenticateAdmin()

    const results = []

    // 获取要处理的教师列表
    let teachers = []
    if (teacher_id) {
      // 处理单个教师
      const teacher = await pb.collection('teachers').getOne(teacher_id)
      teachers = [teacher]
    } else {
      // 处理所有活跃教师
      const teacherList = await pb.collection('teachers').getList(1, 100, {
        filter: 'status = "active"'
      })
      teachers = teacherList.items
    }

    for (const teacher of teachers) {
      try {
        // 检查是否已存在该月的薪资记录
        const existingRecord = await pb.collection('teacher_salary_record').getList(1, 1, {
          filter: `teacher_id = "${teacher.id}" && year = ${year} && month = ${month}`
        })

        if (existingRecord.items.length > 0) {
          results.push({
            teacher_id: teacher.id,
            teacher_name: teacher.name,
            status: 'skipped',
            message: '薪资记录已存在'
          })
          continue
        }

        // 获取教师的薪资结构
        const salaryStructure = await pb.collection('teacher_salary_structure').getList(1, 1, {
          filter: `teacher_id = "${teacher.id}" && status = "active"`,
          sort: '-effective_date'
        })

        if (salaryStructure.items.length === 0) {
          results.push({
            teacher_id: teacher.id,
            teacher_name: teacher.name,
            status: 'error',
            message: '未找到薪资结构'
          })
          continue
        }

        const structure = salaryStructure.items[0]

        // 获取该月的排班记录
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
        const endDate = new Date(year, month, 0).toISOString().split('T')[0] // 月末日期

        const schedules = await pb.collection('schedules').getList(1, 100, {
          filter: `teacher_id = "${teacher.id}" && date >= "${startDate}" && date <= "${endDate}"`
        })

        // 计算工作时长
        let totalHours = 0
        let overtimeHours = 0

        schedules.items.forEach(schedule => {
          if (schedule.start_time && schedule.end_time) {
            const start = new Date(`2000-01-01T${schedule.start_time}`)
            const end = new Date(`2000-01-01T${schedule.end_time}`)
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            
            totalHours += hours
            
            // 检查是否加班（超过8小时）
            if (hours > 8) {
              overtimeHours += hours - 8
            }
          }
        })

        // 计算薪资
        const baseSalary = structure.base_salary || 0
        const hourlyRate = structure.hourly_rate || (baseSalary / 160) // 假设月工作160小时
        const overtimeRate = structure.overtime_rate || (hourlyRate * 1.5)
        
        const overtimePay = overtimeHours * overtimeRate
        const allowances = (structure.allowance_fixed || 0) + 
                         (structure.allowance_transport || 0) + 
                         (structure.allowance_meal || 0) + 
                         (structure.allowance_other || 0)
        
        const grossSalary = baseSalary + overtimePay + allowances

        // 计算扣除项
        const epfDeduction = grossSalary * (structure.epf_rate || 0.11)
        const socsoDeduction = grossSalary * (structure.socso_rate || 0.005)
        const eisDeduction = grossSalary * (structure.eis_rate || 0.002)
        const taxDeduction = grossSalary * (structure.tax_rate || 0)
        
        const totalDeductions = epfDeduction + socsoDeduction + eisDeduction + taxDeduction
        const netSalary = grossSalary - totalDeductions

        // 创建薪资记录
        const salaryRecord = {
          teacher_id: teacher.id,
          salary_period: `${year}-${month.toString().padStart(2, '0')}`,
          year,
          month,
          base_salary: baseSalary,
          hours_worked: totalHours,
          overtime_hours: overtimeHours,
          overtime_pay: overtimePay,
          allowances,
          gross_salary: grossSalary,
          epf_deduction: epfDeduction,
          socso_deduction: socsoDeduction,
          eis_deduction: eisDeduction,
          tax_deduction: taxDeduction,
          other_deductions: 0,
          net_salary: netSalary,
          status: 'draft',
          created_by,
          notes: `自动生成 - 基于${schedules.items.length}个排班记录`
        }

        const record = await pb.collection('teacher_salary_record').create(salaryRecord)

        results.push({
          teacher_id: teacher.id,
          teacher_name: teacher.name,
          status: 'success',
          message: '薪资记录生成成功',
          record_id: record.id,
          gross_salary: grossSalary,
          net_salary: netSalary,
          hours_worked: totalHours,
          overtime_hours: overtimeHours
        })

      } catch (error) {
        console.error(`处理教师 ${teacher.name} 薪资失败:`, error)
        results.push({
          teacher_id: teacher.id,
          teacher_name: teacher.name,
          status: 'error',
          message: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
        })
      }
    }

    // 统计结果
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      error: results.filter(r => r.status === 'error').length
    }

    return NextResponse.json({
      success: true,
      message: `薪资生成完成: ${summary.success}成功, ${summary.skipped}跳过, ${summary.error}失败`,
      summary,
      results
    })

  } catch (error) {
    console.error('自动生成薪资失败:', error)
    return NextResponse.json(
      { success: false, error: '自动生成薪资失败' },
      { status: 500 }
    )
  }
}
