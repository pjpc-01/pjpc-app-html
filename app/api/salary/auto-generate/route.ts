import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// SOCSO wage bracket table (2025 rates)
const SOCSO_BRACKETS = [
  { max: 30, employee: 0.00, employer: 1.75 },
  { max: 50, employee: 0.10, employer: 3.35 },
  { max: 70, employee: 0.20, employer: 5.45 },
  { max: 100, employee: 0.40, employer: 9.10 },
  { max: 140, employee: 0.70, employer: 14.75 },
  { max: 200, employee: 1.10, employer: 21.75 },
  { max: 300, employee: 1.80, employer: 34.75 },
  { max: 400, employee: 2.50, employer: 49.50 },
  { max: 500, employee: 3.25, employer: 65.50 },
  { max: 600, employee: 4.00, employer: 80.50 },
  { max: 700, employee: 4.75, employer: 95.50 },
  { max: 800, employee: 5.50, employer: 110.50 },
  { max: 900, employee: 6.25, employer: 125.50 },
  { max: 1000, employee: 7.00, employer: 140.50 },
  { max: 1100, employee: 8.25, employer: 155.50 },
  { max: 1200, employee: 9.75, employer: 170.50 },
  { max: 1300, employee: 11.25, employer: 185.50 },
  { max: 1400, employee: 12.75, employer: 200.50 },
  { max: 1500, employee: 14.25, employer: 215.50 },
  { max: 1600, employee: 15.75, employer: 230.50 },
  { max: 1700, employee: 17.25, employer: 245.50 },
  { max: 1800, employee: 18.75, employer: 260.50 },
  { max: 1900, employee: 20.25, employer: 275.50 },
  { max: 2000, employee: 21.75, employer: 290.50 },
  { max: 2100, employee: 23.25, employer: 305.50 },
  { max: 2200, employee: 24.75, employer: 320.50 },
  { max: 2300, employee: 26.25, employer: 335.50 },
  { max: 2400, employee: 27.75, employer: 350.50 },
  { max: 2500, employee: 29.25, employer: 365.50 },
  { max: 2600, employee: 30.75, employer: 380.50 },
  { max: 2700, employee: 32.25, employer: 395.50 },
  { max: 2800, employee: 33.75, employer: 410.50 },
  { max: 2900, employee: 35.25, employer: 425.50 },
  { max: 3000, employee: 36.75, employer: 440.50 },
  { max: 3100, employee: 38.25, employer: 455.50 },
  { max: 3200, employee: 39.75, employer: 470.50 },
  { max: 3300, employee: 41.25, employer: 485.50 },
  { max: 3400, employee: 42.75, employer: 500.50 },
  { max: 3500, employee: 44.25, employer: 515.50 },
  { max: 3600, employee: 45.75, employer: 530.50 },
  { max: 3700, employee: 47.25, employer: 545.50 },
  { max: 3800, employee: 48.75, employer: 560.50 },
  { max: 3900, employee: 50.25, employer: 575.50 },
  { max: 4000, employee: 51.75, employer: 590.50 },
  { max: 4100, employee: 53.25, employer: 605.50 },
  { max: 4200, employee: 54.75, employer: 620.50 },
  { max: 4300, employee: 56.25, employer: 635.50 },
  { max: 4400, employee: 57.75, employer: 650.50 },
  { max: 4500, employee: 59.25, employer: 665.50 },
  { max: 4600, employee: 60.75, employer: 680.50 },
  { max: 4700, employee: 62.25, employer: 695.50 },
  { max: 4800, employee: 63.75, employer: 710.50 },
  { max: 4900, employee: 65.25, employer: 725.50 },
  { max: 5000, employee: 66.75, employer: 740.50 },
]

// Monthly progressive PCB tax brackets (simplified, based on monthly gross)
const PCB_BRACKETS = [
  { max: 4166, rate: 0 },
  { max: 16666, rate: 0.01 },
  { max: 29166, rate: 0.03 },
  { max: 41666, rate: 0.06 },
  { max: 58333, rate: 0.11 },
  { max: 83333, rate: 0.19 },
  { max: Infinity, rate: 0.25 },
]

function calculateSOCSO(grossSalary: number): number {
  const bracket = SOCSO_BRACKETS.find(b => grossSalary <= b.max)
  if (bracket) {
    return bracket.employee
  }
  // Above RM5,000 — employee capped at RM66.75
  return 66.75
}

function calculateProgressivePCB(grossSalary: number): number {
  let tax = 0
  let previousMax = 0
  for (const bracket of PCB_BRACKETS) {
    if (grossSalary <= 0) break
    const taxableInBracket = Math.min(Math.max(grossSalary - previousMax, 0), bracket.max - previousMax)
    tax += taxableInBracket * bracket.rate
    previousMax = bracket.max
    if (grossSalary <= bracket.max) break
  }
  return tax
}

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
        const existingRecord = await pb.collection('teacher_salary_records').getList(1, 1, {
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
        const salaryStructure = await pb.collection('teacher_salary_structures').getList(1, 1, {
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
        const allowances = structure.allowances || 0
        
        const grossSalary = baseSalary + overtimePay + allowances

        // 计算扣除项
        const epfDeduction = grossSalary * (structure.epf_rate || 0.11)
        const epfEmployer = grossSalary * (structure.epf_employer_rate || 0.13)
        const socsoDeduction = calculateSOCSO(grossSalary)
        const eisDeduction = Math.min(grossSalary * (structure.eis_rate || 0.002), 2.45)
        const taxDeduction = calculateProgressivePCB(grossSalary)
        
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
          epf_employer: epfEmployer,
          socso_deduction: socsoDeduction,
          eis_deduction: eisDeduction,
          tax_deduction: taxDeduction,
          other_deductions: 0,
          net_salary: netSalary,
          status: 'paid',
          created_by,
          notes: `自动生成 - 基于${schedules.items.length}个排班记录`
        }

        const record = await pb.collection('teacher_salary_records').create(salaryRecord)

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
