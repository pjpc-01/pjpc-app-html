import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'

// SOCSO contribution rates (Act 4 First Schedule) — from PERKESO calculator
// Salaries above RM 5000: employee capped at 24.75, employer at 86.65
// Format: { max, employee, employer }
const SOCSO_BRACKETS = [
  { max: 100,   employee: 0.00, employer: 0.00 },
  { max: 500,   employee: 2.50, employer: 13.45 },
  { max: 1000,  employee: 5.00, employer: 26.95 },
  { max: 1500,  employee: 7.25, employer: 25.35 },
  { max: 2000,  employee: 9.75, employer: 34.15 },
  { max: 2500,  employee: 12.25, employer: 42.85 },
  { max: 3000,  employee: 14.75, employer: 51.65 },
  { max: 3500,  employee: 17.25, employer: 60.35 },
  { max: 4000,  employee: 19.75, employer: 69.15 },
  { max: 4500,  employee: 22.25, employer: 77.85 },
  { max: 5000,  employee: 24.75, employer: 86.65 },
  { max: Infinity, employee: 24.75, employer: 86.65 },
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

function calculateEmployerSOCSO(grossSalary: number): number {
  const bracket = SOCSO_BRACKETS.find(b => grossSalary <= b.max)
  if (bracket) {
    return bracket.employer
  }
  // Above RM5,000 — employer capped at RM86.65
  return 86.65
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
        const socsoDeduction = calculateSOCSO(grossSalary)
        const eisDeduction = grossSalary * (structure.eis_rate || 0.002)  // EIS: 0.2%, no cap
        const taxDeduction = calculateProgressivePCB(grossSalary)

        // 雇主缴纳
        const epfEmployer = grossSalary * (structure.epf_employer_rate || 0.13)
        const socsoEmployer = calculateEmployerSOCSO(grossSalary)
        const eisEmployer = grossSalary * 0.002  // EIS employer: 0.2%, no cap
        
        const totalDeductions = epfDeduction + socsoDeduction + eisDeduction + taxDeduction
        const netSalary = grossSalary - totalDeductions

        // 生成序列号
        const existingCount = await pb.collection('teacher_salary_records').getList(1, 1, {
          filter: `year = ${year} && month = ${month}`
        })
        const seq = String((existingCount.totalItems || 0) + 1).padStart(3, '0')
        const payslipNo = `PS-${year}${String(month).padStart(2, '0')}-${seq}`

        // 创建薪资记录
        const salaryRecord = {
          teacher_id: teacher.id,
          salary_period: `${year}年${month}月`,
          year,
          month,
          payslip_no: payslipNo,
          base_salary: baseSalary,
          hours_worked: totalHours,
          overtime_hours: overtimeHours,
          overtime_pay: overtimePay,
          allowances,
          gross_salary: grossSalary,
          epf_deduction: epfDeduction,
          epf_employer: epfEmployer,
          socso_deduction: socsoDeduction,
          socso_employer: socsoEmployer,
          eis_deduction: eisDeduction,
          eis_employer: eisEmployer,
          tax_deduction: taxDeduction,
          other_deductions: 0,
          net_salary: netSalary,
          bank_reference: payslipNo,
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
