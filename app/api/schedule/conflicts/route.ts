import { NextRequest, NextResponse } from 'next/server'
import { pb } from '@/lib/pocketbase'

// 检测排班冲突
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      employeeId, 
      date, 
      startTime, 
      endTime, 
      excludeScheduleId 
    } = data

    // 验证必需字段
    if (!employeeId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: '缺少必需字段' },
        { status: 400 }
      )
    }

    // 构建查询条件
    let filter = `employee_id = "${employeeId}" && date = "${date}"`
    
    // 排除当前编辑的排班
    if (excludeScheduleId) {
      filter += ` && id != "${excludeScheduleId}"`
    }

    // 获取同一天的排班记录
    const existingSchedules = await pb.collection('schedules').getList(1, 100, {
      filter,
      sort: 'start_time'
    })

    const conflicts = []

    // 检查时间重叠
    for (const schedule of existingSchedules.items) {
      const existingStart = schedule.start_time
      const existingEnd = schedule.end_time
      
      // 时间重叠检测
      if (
        (startTime < existingEnd && endTime > existingStart) ||
        (startTime === existingStart) ||
        (endTime === existingEnd)
      ) {
        conflicts.push({
          type: 'time_overlap',
          message: `与现有排班时间重叠: ${existingStart} - ${existingEnd}`,
          scheduleId: schedule.id,
          scheduleName: schedule.class_name || '未命名排班',
          conflictTime: `${existingStart} - ${existingEnd}`,
          severity: 'high'
        })
      }
    }

    // 检查员工可用性
    const employee = await pb.collection('teachers').getOne(employeeId)
    
    if (employee.unavailable_days && employee.unavailable_days.includes(new Date(date).getDay())) {
      conflicts.push({
        type: 'unavailable_day',
        message: '员工在此日期不可用',
        severity: 'high'
      })
    }

    // 检查员工类型限制
    if (employee.type === 'teaching_only') {
      // 仅教书老师不能安排非教学时间
      const isTeachingTime = startTime >= '16:00' && endTime <= '19:00'
      if (!isTeachingTime) {
        conflicts.push({
          type: 'employee_type_limit',
          message: '仅教书老师只能在16:00-19:00时段工作',
          severity: 'medium'
        })
      }
    }

    // 检查周工时限制
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // 周一
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // 周日

    const weekSchedules = await pb.collection('schedules').getList(1, 100, {
      filter: `employee_id = "${employeeId}" && date >= "${format(weekStart, 'yyyy-MM-dd')}" && date <= "${format(weekEnd, 'yyyy-MM-dd')}"`,
      sort: 'date'
    })

    const totalHours = weekSchedules.items.reduce((total, schedule) => {
      const start = new Date(`2000-01-01T${schedule.start_time}`)
      const end = new Date(`2000-01-01T${schedule.end_time}`)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)

    const newScheduleHours = (new Date(`2000-01-01T${endTime}`).getTime() - new Date(`2000-01-01T${startTime}`).getTime()) / (1000 * 60 * 60)
    const maxHours = employee.max_hours_per_week || 40

    if (totalHours + newScheduleHours > maxHours) {
      conflicts.push({
        type: 'weekly_hours_limit',
        message: `超出周工时限制: ${totalHours + newScheduleHours.toFixed(1)}h / ${maxHours}h`,
        severity: 'high',
        currentHours: totalHours,
        newHours: newScheduleHours,
        maxHours: maxHours
      })
    }

    return NextResponse.json({
      success: true,
      conflicts,
      hasConflicts: conflicts.length > 0,
      summary: {
        totalConflicts: conflicts.length,
        highSeverity: conflicts.filter(c => c.severity === 'high').length,
        mediumSeverity: conflicts.filter(c => c.severity === 'medium').length,
        lowSeverity: conflicts.filter(c => c.severity === 'low').length
      }
    })

  } catch (error) {
    console.error('检测排班冲突失败:', error)
    return NextResponse.json(
      { success: false, error: '检测排班冲突失败' },
      { status: 500 }
    )
  }
}

// 获取排班建议
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const subject = searchParams.get('subject')
    const grade = searchParams.get('grade')
    const center = searchParams.get('center')

    if (!date) {
      return NextResponse.json(
        { success: false, error: '缺少日期参数' },
        { status: 400 }
      )
    }

    // 获取可用员工
    let employeeFilter = 'status = "active"'
    if (subject) {
      employeeFilter += ` && subjects ~ "${subject}"`
    }
    if (grade) {
      employeeFilter += ` && grades ~ "${grade}"`
    }
    if (center && center !== 'all') {
      employeeFilter += ` && center = "${center}"`
    }

    const employees = await pb.collection('teachers').getList(1, 100, {
      filter: employeeFilter,
      sort: 'name'
    })

    // 获取该日期的现有排班
    const existingSchedules = await pb.collection('schedules').getList(1, 100, {
      filter: `date = "${date}"`,
      sort: 'start_time'
    })

    const suggestions = []

    for (const employee of employees.items) {
      // 检查员工是否已有排班
      const hasSchedule = existingSchedules.items.some(s => s.employee_id === employee.id)
      
      if (!hasSchedule) {
        // 计算匹配分数
        let score = 0
        
        // 经验分数
        score += (employee.experience || 0) * 2
        
        // 科目匹配
        if (subject && employee.subjects && employee.subjects.includes(subject)) {
          score += 15
        }
        
        // 年级匹配
        if (grade && employee.grades && employee.grades.includes(grade)) {
          score += 10
        }
        
        // 中心匹配
        if (center && center !== 'all' && employee.center === center) {
          score += 5
        }
        
        // 可用性检查
        const dayOfWeek = new Date(date).getDay()
        if (employee.unavailable_days && employee.unavailable_days.includes(dayOfWeek)) {
          score -= 50
        }

        suggestions.push({
          employeeId: employee.id,
          employeeName: employee.name || employee.teacher_name,
          employeeType: employee.type,
          subjects: employee.subjects || [],
          grades: employee.grades || [],
          experience: employee.experience || 0,
          score,
          isAvailable: score > 0
        })
      }
    }

    // 按分数排序
    suggestions.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 10), // 返回前10个建议
      totalAvailable: suggestions.filter(s => s.isAvailable).length
    })

  } catch (error) {
    console.error('获取排班建议失败:', error)
    return NextResponse.json(
      { success: false, error: '获取排班建议失败' },
      { status: 500 }
    )
  }
}

function format(date: Date, formatStr: string): string {
  return date.toISOString().split('T')[0]
}
