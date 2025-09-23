import { NextRequest, NextResponse } from 'next/server'
import { pb } from '@/lib/pocketbase'
import { format, addDays, startOfWeek, endOfWeek, isWeekend } from 'date-fns'

// 智能排班算法
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { startDate, endDate, center, preferences } = data

    // 获取员工数据
    const employees = await pb.collection('teachers').getList(1, 100, {
      filter: `status = "active"`,
      sort: 'name'
    })

    // 获取课程数据
    const classes = await pb.collection('classes').getList(1, 100, {
      filter: center !== 'all' ? `center = "${center}"` : '',
      sort: 'name'
    })

    // 获取排班模板
    const templates = await pb.collection('schedule_templates').getList(1, 100, {
      sort: 'name'
    })

    // 获取现有排班
    const existingSchedules = await pb.collection('schedules').getList(1, 1000, {
      filter: `date >= "${startDate}" && date <= "${endDate}"`,
      sort: 'date'
    })

    const newSchedules = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 遍历每一天
    for (let date = start; date <= end; date = addDays(date, 1)) {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayOfWeek = date.getDay()
      
      // 跳过周末（除非有周末课程）
      if (isWeekend(date) && !classes.items.some(c => c.weekend_enabled)) {
        continue
      }

      // 获取当天的现有排班
      const daySchedules = existingSchedules.items.filter(s => s.date === dateStr)
      
      // 为每个课程安排老师
      for (const classInfo of classes.items) {
        // 检查是否已有排班
        const hasSchedule = daySchedules.some(s => s.class_id === classInfo.id)
        if (hasSchedule) continue

        // 检查课程是否在当天进行
        if (classInfo.work_days && !classInfo.work_days.includes(dayOfWeek)) {
          continue
        }

        // 寻找合适的老师
        const suitableTeachers = employees.items
          .filter(emp => {
            // 基本条件检查
            if (emp.status !== 'active') return false
            if (emp.subjects && !emp.subjects.includes(classInfo.subject)) return false
            if (emp.grades && !emp.grades.includes(classInfo.grade)) return false
            if (emp.center !== classInfo.center && emp.center !== 'all') return false
            
            // 检查不可用日期
            if (emp.unavailable_days && emp.unavailable_days.includes(dayOfWeek)) return false
            
            // 检查是否已有排班
            const hasExistingSchedule = daySchedules.some(s => s.employee_id === emp.id)
            if (hasExistingSchedule) return false
            
            return true
          })
          .map(emp => {
            // 计算匹配分数
            let score = 0
            
            // 经验分数
            score += (emp.experience || 0) * 2
            
            // 科目匹配
            if (emp.subjects && emp.subjects.includes(classInfo.subject)) {
              score += 15
            }
            
            // 年级匹配
            if (emp.grades && emp.grades.includes(classInfo.grade)) {
              score += 10
            }
            
            // 中心匹配
            if (emp.center === classInfo.center) {
              score += 5
            }
            
            // 偏好时间匹配
            if (emp.preferred_times && emp.preferred_times.includes(classInfo.time_slot)) {
              score += 10
            }
            
            return { ...emp, score }
          })
          .sort((a, b) => b.score - a.score)

        if (suitableTeachers.length > 0) {
          const selectedTeacher = suitableTeachers[0]
          const template = templates.items.find(t => t.type === selectedTeacher.type)
          
          if (template) {
            const scheduleData = {
              employee_id: selectedTeacher.id,
              employee_name: selectedTeacher.name || selectedTeacher.teacher_name,
              employee_type: selectedTeacher.type || 'parttime',
              date: dateStr,
              start_time: classInfo.start_time || template.start_time,
              end_time: classInfo.end_time || template.end_time,
              class_id: classInfo.id,
              class_name: classInfo.name,
              subject: classInfo.subject,
              grade: classInfo.grade,
              center: classInfo.center,
              room: classInfo.room,
              status: 'scheduled',
              is_overtime: false,
              hourly_rate: selectedTeacher.hourly_rate,
              total_hours: 0,
              notes: `智能排班 - 匹配分数: ${selectedTeacher.score}`
            }

            try {
              const schedule = await pb.collection('schedules').create(scheduleData)
              newSchedules.push(schedule)
            } catch (error) {
              console.error(`创建排班失败 (${selectedTeacher.name} - ${classInfo.name}):`, error)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功创建 ${newSchedules.length} 个排班`,
      schedules: newSchedules
    })
  } catch (error) {
    console.error('智能排班失败:', error)
    return NextResponse.json(
      { success: false, error: '智能排班失败' },
      { status: 500 }
    )
  }
}
