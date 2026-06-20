import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

// Helper to get the current date range for the selected period
function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString().split('T')[0]

  let startDate: string
  switch (period) {
    case 'week':
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = weekAgo.toISOString().split('T')[0]
      break
    case 'month':
    default:
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      startDate = monthAgo.toISOString().split('T')[0]
      break
    case 'quarter':
      const quarterAgo = new Date(now)
      quarterAgo.setMonth(quarterAgo.getMonth() - 3)
      startDate = quarterAgo.toISOString().split('T')[0]
      break
    case 'year':
      const yearAgo = new Date(now)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      startDate = yearAgo.toISOString().split('T')[0]
      break
  }

  return { startDate, endDate }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'month'
  const department = searchParams.get('department') || 'all'

  console.log('📊 API: 考勤分析请求', { period, department })

  try {
    // Connect to PocketBase at localhost
    const pb = new PocketBase('http://127.0.0.1:8090')

    // Admin authentication
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
    console.log('✅ API: PocketBase管理员认证成功')

    // Get date range
    const { startDate, endDate } = getDateRange(period)

    // ── Fetch teachers ──
    const teachersResult = await pb.collection('teachers').getList(1, 500, {
      sort: 'name',
    })
    const teachers = teachersResult.items
    console.log('✅ API: 获取教师数据', { total: teachers.length })

    // ── Fetch teacher attendance records within the date range ──
    let attendanceFilter = `date >= "${startDate}" && date <= "${endDate}"`
    if (department !== 'all') {
      attendanceFilter += ` && (branch_code = "${department}" || branch_name = "${department}")`
    }

    const attendanceResult = await pb.collection('teacher_attendance').getList(1, 2000, {
      filter: attendanceFilter,
      sort: '-date',
    })
    const attendanceRecords = attendanceResult.items
    console.log('✅ API: 获取考勤记录', { total: attendanceRecords.length })

    // ── Compute analytics ──

    // Total employees (teachers count)
    const totalEmployees = teachers.length

    // Calculate attendance rate per teacher
    const teacherAttendanceMap = new Map<string, { present: number; total: number; name: string; department: string }>()
    for (const record of attendanceRecords) {
      const tid = record.teacher_id || record.id
      if (!teacherAttendanceMap.has(tid)) {
        const teacher = teachers.find((t: any) => t.user_id === tid || t.id === tid)
        teacherAttendanceMap.set(tid, {
          present: 0,
          total: 0,
          name: record.teacher_name || teacher?.name || 'Unknown',
          department: teacher?.department || record.branch_name || 'Unknown',
        })
      }
      const entry = teacherAttendanceMap.get(tid)!
      entry.total++
      if (record.status === 'present' || record.status === 'completed') {
        entry.present++
      }
    }

    // Average attendance rate
    let totalAttendanceRate = 0
    let teacherCountWithRecords = 0
    teacherAttendanceMap.forEach((entry) => {
      if (entry.total > 0) {
        totalAttendanceRate += (entry.present / entry.total) * 100
        teacherCountWithRecords++
      }
    })
    const averageAttendanceRate = teacherCountWithRecords > 0
      ? Math.round((totalAttendanceRate / teacherCountWithRecords) * 10) / 10
      : 0

    // Late arrivals & early departures
    let lateArrivals = 0
    let earlyDepartures = 0
    const expectedStartHour = 8 // 8:00 AM
    const expectedEndHour = 17  // 5:00 PM

    for (const record of attendanceRecords) {
      if (record.check_in) {
        const checkInHour = new Date(record.check_in).getHours()
        if (checkInHour >= expectedStartHour + 1) {
          lateArrivals++
        }
      }
      if (record.check_out) {
        const checkOutHour = new Date(record.check_out).getHours()
        if (checkOutHour < expectedEndHour) {
          earlyDepartures++
        }
      }
    }

    // Overtime hours: check_out after 18:00
    let overtimeHours = 0
    for (const record of attendanceRecords) {
      if (record.check_in && record.check_out) {
        const checkIn = new Date(record.check_in).getTime()
        const checkOut = new Date(record.check_out).getTime()
        const hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60)
        if (hoursWorked > 8) {
          overtimeHours += Math.round((hoursWorked - 8) * 10) / 10
        }
      }
    }

    // Absent days: count records with status 'absent'
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length

    // Department stats
    const deptMap = new Map<string, { attendanceRate: number; totalEmployees: number; totalRecords: number; presentRecords: number }>()
    for (const teacher of teachers) {
      const dept = (teacher as any).department || 'Unassigned'
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { attendanceRate: 0, totalEmployees: 0, totalRecords: 0, presentRecords: 0 })
      }
      deptMap.get(dept)!.totalEmployees++
    }
    for (const record of attendanceRecords) {
      const teacher = teachers.find((t: any) => t.user_id === record.teacher_id || t.id === record.teacher_id)
      const dept = teacher?.department || record.branch_name || 'Unassigned'
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { attendanceRate: 0, totalEmployees: 0, totalRecords: 0, presentRecords: 0 })
      }
      const entry = deptMap.get(dept)!
      entry.totalRecords++
      if (record.status === 'present' || record.status === 'completed') {
        entry.presentRecords++
      }
    }
    const departmentStats = Array.from(deptMap.entries()).map(([dept, data]) => ({
      department: dept,
      attendanceRate: data.totalRecords > 0 ? Math.round((data.presentRecords / data.totalRecords) * 100) : 0,
      totalEmployees: data.totalEmployees,
    }))

    // Monthly trend (last 6 months)
    const monthlyMap = new Map<string, { attendanceRate: number; totalHours: number; totalRecords: number; presentRecords: number }>()
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, { attendanceRate: 0, totalHours: 0, totalRecords: 0, presentRecords: 0 })
    }

    // Fetch all attendance records for the past 6 months for trend
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const trendStartDate = sixMonthsAgo.toISOString().split('T')[0]
    const trendEndDate = now.toISOString().split('T')[0]

    const trendAttendanceResult = await pb.collection('teacher_attendance').getList(1, 5000, {
      filter: `date >= "${trendStartDate}" && date <= "${trendEndDate}"`,
      sort: 'date',
    })

    for (const record of trendAttendanceResult.items) {
      const recordDate = record.date || record.check_in
      if (!recordDate) continue
      const d = new Date(recordDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!
        entry.totalRecords++
        if (record.status === 'present' || record.status === 'completed') {
          entry.presentRecords++
        }
        if (record.check_in && record.check_out) {
          const checkIn = new Date(record.check_in).getTime()
          const checkOut = new Date(record.check_out).getTime()
          const hours = (checkOut - checkIn) / (1000 * 60 * 60)
          entry.totalHours += Math.round(hours * 10) / 10
        }
      }
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyTrend = Array.from(monthlyMap.entries()).map(([key, data]) => {
      const [year, monthNum] = key.split('-')
      const monthIndex = parseInt(monthNum) - 1
      return {
        month: `${monthNames[monthIndex]} ${year}`,
        attendanceRate: data.totalRecords > 0 ? Math.round((data.presentRecords / data.totalRecords) * 100) : 0,
        totalHours: Math.round(data.totalHours),
      }
    })

    // Time distribution (check-in / check-out by time slot)
    const timeSlots = [
      { slot: '06:00-07:00', checkIns: 0, checkOuts: 0 },
      { slot: '07:00-08:00', checkIns: 0, checkOuts: 0 },
      { slot: '08:00-09:00', checkIns: 0, checkOuts: 0 },
      { slot: '09:00-10:00', checkIns: 0, checkOuts: 0 },
      { slot: '10:00-11:00', checkIns: 0, checkOuts: 0 },
      { slot: '11:00-12:00', checkIns: 0, checkOuts: 0 },
      { slot: '12:00-13:00', checkIns: 0, checkOuts: 0 },
      { slot: '13:00-14:00', checkIns: 0, checkOuts: 0 },
      { slot: '14:00-15:00', checkIns: 0, checkOuts: 0 },
      { slot: '15:00-16:00', checkIns: 0, checkOuts: 0 },
      { slot: '16:00-17:00', checkIns: 0, checkOuts: 0 },
      { slot: '17:00-18:00', checkIns: 0, checkOuts: 0 },
      { slot: '18:00-19:00', checkIns: 0, checkOuts: 0 },
      { slot: '19:00-20:00', checkIns: 0, checkOuts: 0 },
    ]

    for (const record of attendanceRecords) {
      if (record.check_in) {
        const d = new Date(record.check_in)
        const hour = d.getHours()
        const slotIndex = Math.min(Math.max(Math.floor(hour - 6), 0), timeSlots.length - 1)
        if (timeSlots[slotIndex]) {
          timeSlots[slotIndex].checkIns++
        }
      }
      if (record.check_out) {
        const d = new Date(record.check_out)
        const hour = d.getHours()
        const slotIndex = Math.min(Math.max(Math.floor(hour - 6), 0), timeSlots.length - 1)
        if (timeSlots[slotIndex]) {
          timeSlots[slotIndex].checkOuts++
        }
      }
    }

    const timeDistribution = timeSlots.map(ts => ({
      timeSlot: ts.slot,
      checkIns: ts.checkIns,
      checkOuts: ts.checkOuts,
    }))

    // Top performers (teachers with highest attendance rate)
    const teacherPerformance = Array.from(teacherAttendanceMap.entries()).map(([tid, entry]) => ({
      name: entry.name,
      attendanceRate: entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0,
      department: entry.department,
    }))
    const topPerformers = teacherPerformance
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5)

    // ── Generate insights ──
    const insights: Array<{
      type: 'positive' | 'negative' | 'neutral'
      title: string
      description: string
      impact: 'high' | 'medium' | 'low'
    }> = []

    if (averageAttendanceRate >= 90) {
      insights.push({
        type: 'positive',
        title: '整体出勤率优秀',
        description: `当前平均出勤率为 ${averageAttendanceRate}%，超过90%的目标值，继续保持！`,
        impact: 'high',
      })
    } else if (averageAttendanceRate >= 80) {
      insights.push({
        type: 'neutral',
        title: '整体出勤率良好',
        description: `当前平均出勤率为 ${averageAttendanceRate}%，仍有提升空间，建议关注缺勤原因。`,
        impact: 'medium',
      })
    } else {
      insights.push({
        type: 'negative',
        title: '整体出勤率偏低',
        description: `当前平均出勤率为 ${averageAttendanceRate}%，低于80%，需要重点关注出勤管理。`,
        impact: 'high',
      })
    }

    if (lateArrivals > 10) {
      insights.push({
        type: 'negative',
        title: '迟到情况较多',
        description: `本周期内有 ${lateArrivals} 次迟到记录，建议加强考勤管理。`,
        impact: 'medium',
      })
    } else if (lateArrivals > 0) {
      insights.push({
        type: 'neutral',
        title: '迟到情况可控',
        description: `本周期内有 ${lateArrivals} 次迟到记录，整体情况良好。`,
        impact: 'low',
      })
    }

    if (overtimeHours > 50) {
      insights.push({
        type: 'neutral',
        title: '加班时间较多',
        description: `本周期加班总时长为 ${Math.round(overtimeHours)}h，请关注员工工作负荷。`,
        impact: 'medium',
      })
    }

    if (departmentStats.length > 0) {
      const bestDept = departmentStats.reduce((best, curr) => curr.attendanceRate > best.attendanceRate ? curr : best)
      const worstDept = departmentStats.reduce((worst, curr) => curr.attendanceRate < worst.attendanceRate ? curr : worst)
      if (bestDept.department !== worstDept.department) {
        insights.push({
          type: bestDept.attendanceRate >= 90 ? 'positive' : 'neutral',
          title: `最佳部门: ${bestDept.department}`,
          description: `${bestDept.department} 出勤率达 ${bestDept.attendanceRate}%，表现最佳。`,
          impact: 'medium',
        })
        insights.push({
          type: worstDept.attendanceRate < 80 ? 'negative' : 'neutral',
          title: `待提升部门: ${worstDept.department}`,
          description: `${worstDept.department} 出勤率为 ${worstDept.attendanceRate}%，建议重点关注。`,
          impact: 'medium',
        })
      }
    }

    // Build response
    const analytics = {
      totalEmployees,
      averageAttendanceRate,
      lateArrivals,
      earlyDepartures,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      absentDays,
      topPerformers,
      departmentStats,
      monthlyTrend,
      timeDistribution,
    }

    console.log('✅ API: 考勤分析数据生成成功', {
      totalEmployees,
      averageAttendanceRate,
      lateArrivals,
      earlyDepartures,
      departmentStatsCount: departmentStats.length,
    })

    return NextResponse.json({
      success: true,
      analytics,
      insights,
    })
  } catch (error) {
    console.error('❌ API: 考勤分析失败:', error)

    // Return empty analytics on error (component handles fallback gracefully)
    return NextResponse.json({
      success: false,
      analytics: {
        totalEmployees: 0,
        averageAttendanceRate: 0,
        lateArrivals: 0,
        earlyDepartures: 0,
        overtimeHours: 0,
        absentDays: 0,
        topPerformers: [],
        departmentStats: [],
        monthlyTrend: [],
        timeDistribution: [],
      },
      insights: [],
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
