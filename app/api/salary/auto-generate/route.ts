import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase, authenticateAdmin } from '@/lib/pocketbase'
import { getSocsoEmployee, getSocsoEmployer, getEisContribution, getPCB } from '@/lib/perkeso-rates'

// PCB — uses shared getPCB from perkeso-rates
function calculateProgressivePCB(grossSalary: number): number { return getPCB(grossSalary) }

// PCB 计算：勾选才扣。有固定金额用金额，否则用八仙率；都不填则用官方算法
function calculatePCB(structure: any, grossSalary: number): number {
  if (!structure.pcb_enabled) return 0
  if (structure.pcb_amount && structure.pcb_amount > 0) return structure.pcb_amount
  if (structure.pcb_rate && structure.pcb_rate > 0) return grossSalary * (structure.pcb_rate / 100)
  return getPCB(grossSalary)
}

function calculateSOCSO(grossSalary: number): number { return getSocsoEmployee(grossSalary) }
function calculateEmployerSOCSO(grossSalary: number): number { return getSocsoEmployer(grossSalary) }
function calculateEIS(grossSalary: number): number { return getEisContribution(grossSalary) }

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

        const schedules = await pb.collection('schedules').getList(1, 200, {
          filter: `teacher_id = "${teacher.id}" && date >= "${startDate}" && date <= "${endDate}"`
        })

        // 计算工作时长：排班为主，打卡兜底
        // 1) 有排班的用排班时间（start_time ~ end_time）
        // 2) 没排班的用实际打卡（check_in ~ check_out，当天多次打卡累加）
        // 3) 都没有则按默认月工时 160h 反推（月薪类型）
        let totalHours = 0
        let overtimeHours = 0

        // 收集排班日期，避免同一老师同一天重复计算
        const scheduledDates = new Set<string>()
        const scheduleHoursByDate: Record<string, number> = {}

        schedules.items.forEach(schedule => {
          if (schedule.start_time && schedule.end_time) {
            const start = new Date(`2000-01-01T${schedule.start_time}`)
            const end = new Date(`2000-01-01T${schedule.end_time}`)
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            if (hours < 0 || hours > 24) return

            const dateStr = (schedule.date || '').split(' ')[0]
            scheduledDates.add(dateStr)
            scheduleHoursByDate[dateStr] = (scheduleHoursByDate[dateStr] || 0) + hours
          }
        })

        // 打卡兜底：只补没有排班的日期
        if (schedules.items.length > 0 && scheduledDates.size > 0) {
          const attendanceList = await pb.collection('teacher_attendance').getList(1, 500, {
            filter: `teacher_id = "${teacher.id}" && check_in >= "${startDate}" && check_in <= "${endDate}T23:59:59.999Z"`
          })

          attendanceList.items.forEach(att => {
            const attDate = (att.check_in || '').split('T')[0]
            if (scheduledDates.has(attDate)) return // 这天有排班，跳过

            const checkIn = att.check_in ? new Date(att.check_in) : null
            const checkOut = att.check_out ? new Date(att.check_out) : null
            if (!checkIn || !checkOut) return

            const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
            if (hours < 0 || hours > 24) return
            totalHours += hours
          })

          // 加上排班工时
          for (const dateStr of Object.keys(scheduleHoursByDate)) {
            totalHours += scheduleHoursByDate[dateStr]
          }
        } else {
          // 无排班：直接用打卡
          const attendanceList = await pb.collection('teacher_attendance').getList(1, 500, {
            filter: `teacher_id = "${teacher.id}" && check_in >= "${startDate}" && check_in <= "${endDate}T23:59:59.999Z"`
          })

          attendanceList.items.forEach(att => {
            const checkIn = att.check_in ? new Date(att.check_in) : null
            const checkOut = att.check_out ? new Date(att.check_out) : null
            if (!checkIn || !checkOut) return

            const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
            if (hours < 0 || hours > 24) return
            totalHours += hours
          })
        }

        // 都没有任何工时数据：月薪用默认 160h；时薪无法估算则记 0（避免乱发钱）
        const hasHoursData = totalHours > 0
        if (!hasHoursData) {
          if (structure.salary_type === 'monthly') {
            totalHours = 160 // 默认月工时
          }
        }

        // 加班计算（超过 8 小时/天的部分）
        overtimeHours = 0
        for (const dateStr of Object.keys(scheduleHoursByDate)) {
          const h = scheduleHoursByDate[dateStr]
          if (h > 8) overtimeHours += h - 8
        }
        // 打卡日期也检查加班
        const attendanceList2 = await pb.collection('teacher_attendance').getList(1, 500, {
          filter: `teacher_id = "${teacher.id}" && check_in >= "${startDate}" && check_in <= "${endDate}T23:59:59.999Z"`
        })
        const seenAttDates = new Set<string>()
        attendanceList2.items.forEach(att => {
          const attDate = (att.check_in || '').split('T')[0]
          if (seenAttDates.has(attDate)) return
          seenAttDates.add(attDate)
          if (scheduledDates.has(attDate)) return // 排班日期已算过加班
          const checkIn = att.check_in ? new Date(att.check_in) : null
          const checkOut = att.check_out ? new Date(att.check_out) : null
          if (!checkIn || !checkOut) return
          const h = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
          if (h > 8) overtimeHours += h - 8
        })

        // 计算薪资
        const baseSalary = structure.base_salary || 0
        const hourlyRate = structure.hourly_rate || (baseSalary / 160) // 假设月工作160小时
        const overtimeRate = structure.overtime_rate || (hourlyRate * 1.5)
        
        const overtimePay = overtimeHours * overtimeRate
        
        // 津贴分项 - taxable 勾选的加入 gross，未勾选的直接加 net
        const allowanceItems: { name: string; amount: number; taxable: boolean }[] = structure.allowance_items || []
        const taxableAllowances = allowanceItems.filter(a => a.taxable !== false).reduce((sum, a) => sum + (a.amount || 0), 0)
        const nonTaxableAllowances = allowanceItems.filter(a => a.taxable === false).reduce((sum, a) => sum + (a.amount || 0), 0)
        const totalAllowances = taxableAllowances + nonTaxableAllowances
        
        // 奖金 - 总额加入 net
        const bonusItems: { name: string; amount: number; taxable: boolean }[] = structure.bonus_items || []
        const totalBonuses = bonusItems.reduce((sum, b) => sum + (b.amount || 0), 0)
        
        // gross 按薪资类型：
        // - monthly: 底薪 + 加班 + 应税津贴
        // - hourly:  时薪 × 工时 + 加班 + 应税津贴
        // - commission: 底薪 + 加班 + 应税津贴（佣金另行处理）
        let grossSalary: number
        if (structure.salary_type === 'hourly') {
          grossSalary = hourlyRate * totalHours + overtimePay + taxableAllowances
        } else {
          grossSalary = baseSalary + overtimePay + taxableAllowances
        }

        // 计算扣除项（基于 grossSalary）
        // 只有月薪类型才有 EPF/SOCSO/EIS/PCB 扣款；时薪/佣金不扣
        const isMonthly = structure.salary_type !== 'hourly' && structure.salary_type !== 'commission'
        const epfDeduction = isMonthly ? grossSalary * (structure.epf_rate || 0.11) : 0
        const socsoDeduction = isMonthly ? calculateSOCSO(grossSalary) : 0
        const eisDeduction = isMonthly ? calculateEIS(grossSalary) : 0
        const taxDeduction = isMonthly ? calculatePCB(structure, grossSalary) : 0

        // 雇主缴纳（基于 grossSalary，仅月薪）
        const epfEmployer = isMonthly ? grossSalary * (structure.epf_employer_rate || (grossSalary > 5000 ? 0.12 : 0.13)) : 0
        const socsoEmployer = isMonthly ? calculateEmployerSOCSO(grossSalary) : 0
        const eisEmployer = isMonthly ? calculateEIS(grossSalary) : 0
        
        const totalDeductions = epfDeduction + socsoDeduction + eisDeduction + taxDeduction
        const netSalary = grossSalary - totalDeductions
        const extraAdditions = nonTaxableAllowances + totalBonuses
        const takeHome = netSalary + extraAdditions

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
          allowances: totalAllowances,
          allowance_items: allowanceItems,
          bonus_items: bonusItems,
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
          extra_additions: extraAdditions,
          take_home: takeHome,
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
