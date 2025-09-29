import { isSameCenter, getDobDate, normalizeCenter } from '../utils'
import { sortByPointsThenId, sortByStudentId } from './sorting'
import { tvLog } from './logger'
import { STUDENTS_PER_PAGE, SLIDE_TYPES } from '../constants'

  // 学生积分数据处理
  export function buildStudentPoints(students: any[], points: any[], center: string) {
    tvLog('处理学生数据:', {
      totalStudents: students.length,
      center: center
    })

    // 如果学生数据为空或很少，尝试从积分数据中补充学生信息
    if (students.length === 0 && points.length > 0) {
      tvLog('没有学生数据，从积分数据中提取学生信息')
      const studentsFromPoints = points.map((p: any) => {
        const studentObj = p?.expand?.student_id
        const student = Array.isArray(studentObj) ? studentObj[0] : studentObj
        if (student) {
          const studentCenter = student?.center ?? student?.Center ?? student?.centre ?? student?.branch
          // 确保只提取属于当前分行的学生
          if (isSameCenter(studentCenter, center)) {
            return {
              ...student,
              center: studentCenter
            }
          }
        }
        return null
      }).filter(Boolean)

      tvLog('从积分数据提取的学生（已过滤分行）:', {
        count: studentsFromPoints.length,
        targetCenter: center,
        sample: studentsFromPoints.slice(0, 2).map(s => ({
          student_id: s.student_id,
          student_name: s.student_name,
          center: s.center
        }))
      })

      // 使用从积分数据提取的学生信息
      students = studentsFromPoints
    } else if (students.length > 0 && points.length > 0) {
      // 如果有学生数据，但可能不完整，从积分数据中补充缺失的学生
      tvLog('检查是否需要从积分数据补充学生信息')
      const existingStudentIds = new Set(students.map(s => s.id))
      const studentsFromPoints = points.map((p: any) => {
        const studentObj = p?.expand?.student_id
        const student = Array.isArray(studentObj) ? studentObj[0] : studentObj
        if (student && !existingStudentIds.has(student.id)) {
          const studentCenter = student?.center ?? student?.Center ?? student?.centre ?? student?.branch
          if (isSameCenter(studentCenter, center)) {
            return {
              ...student,
              center: studentCenter
            }
          }
        }
        return null
      }).filter(Boolean)

      if (studentsFromPoints.length > 0) {
        tvLog('从积分数据补充学生信息:', {
          count: studentsFromPoints.length,
          existingCount: students.length,
          totalCount: students.length + studentsFromPoints.length
        })
        students = [...students, ...studentsFromPoints]
      }
    }

    // 创建学生映射
    const studentByRecordId: Record<string, any> = {}
    const studentByStudentId: Record<string, any> = {}

    for (const s of students as any[]) {
      const normCenter = (s?.center ?? s?.Center ?? s?.centre ?? s?.branch) as string | undefined
      const merged: any = { ...(s as any), center: normCenter }
      if (merged.id) studentByRecordId[merged.id] = merged
      if (merged.student_id) studentByStudentId[merged.student_id] = merged
    }
  
  // 处理积分数据
  tvLog('原始积分数据:', {
    pointsLength: (points || []).length,
    pointsSample: (points || []).slice(0, 2)
  })
  
  const pts = (points || []).map((p: any) => {
    // 积分数据中的student_id是学生的记录ID
    const studentRecordId = p?.student_id
    // 学生信息在expand.student_id中
    const expanded = p?.expand?.student_id
    const studentObj: any = Array.isArray(expanded) ? expanded[0] : expanded
    
    // 优先使用expand中的学生信息，如果没有则从学生列表中查找
    const studentRaw: any = studentObj || studentByRecordId[studentRecordId] || null
    const student: any = studentRaw ? { 
      ...(studentRaw as any), 
      center: (studentRaw?.center ?? studentRaw?.Center ?? studentRaw?.centre ?? studentRaw?.branch) as any 
    } : null
    
    // 调试积分数据处理
    if (studentRecordId && p?.current_points !== undefined) {
      tvLog('积分数据处理:', {
        studentRecordId: studentRecordId,
        current_points: p.current_points,
        hasStudent: !!student,
        studentName: student?.student_name || 'Unknown',
        studentId: student?.student_id || 'Unknown',
        center: student?.center || 'Unknown'
      })
    }
    
    return { ...p, student_id: studentRecordId, student }
  })
  
  // API已经按中心过滤了学生数据，不需要再次过滤
  const studentsFiltered = students
  tvLog('学生数据（API已过滤）:', {
    totalStudents: students.length,
    center: center
  })
  
  // 积分数据已经包含学生信息，直接使用
  let ptsFiltered = pts

  // 确保所有学生都显示，包括没有积分记录的学生
  const pointsByStudentId = new Map()
  ptsFiltered.forEach(p => {
    if (p.student?.id) {
      pointsByStudentId.set(p.student.id, p)
    } else {
      tvLog('积分记录缺少学生ID:', {
        studentRecordId: p.student_id,
        hasStudent: !!p.student,
        studentKeys: p.student ? Object.keys(p.student) : [],
        studentId: p.student?.id || p.student?.student_id
      })
    }
  })

  // 为所有学生创建显示记录
  const allStudentPoints = studentsFiltered.map(s => {
    const existingPoints = pointsByStudentId.get(s.id)
    if (existingPoints) {
      return existingPoints
    } else {
      // 为没有积分记录的学生创建0分占位
      return {
        id: `synthetic-${s.id}`,
        student_id: s.id,
        current_points: 0,
        total_earned: 0,
        total_spent: 0,
        season_id: 'default-season',
        student: s,
      }
    }
  })

  tvLog('所有学生积分记录创建完成:', {
    totalStudents: allStudentPoints.length,
    studentsWithPoints: allStudentPoints.filter(p => p.current_points > 0).length,
    studentsWithoutPoints: allStudentPoints.filter(p => p.current_points === 0).length,
    sampleStudents: allStudentPoints.slice(0, 3).map(p => ({
      id: p.student?.id,
      student_id: p.student?.student_id,
      student_name: p.student?.student_name,
      current_points: p.current_points
    }))
  })

  ptsFiltered = allStudentPoints
  
  tvLog('最终学生积分数据:', {
    totalDisplayStudents: ptsFiltered.length,
    studentsWithPoints: ptsFiltered.filter(p => p.current_points > 0).length,
    studentsWithoutPoints: ptsFiltered.filter(p => p.current_points === 0).length,
    sampleData: ptsFiltered.slice(0, 3).map(p => ({
      id: p.id,
      student_id: p.student_id,
      student_name: p.student?.student_name,
      current_points: p.current_points
    }))
  })
  
  // 特殊排序：前三个位置显示最高分学生，其余按学号顺序
  const sortedByPoints = ptsFiltered.sort(sortByPointsThenId)
  
  // 显示排行前5名（排序后）
  const top5 = sortedByPoints.slice(0, 5)
  tvLog('积分排行榜前5名:', top5.map((p, index) => ({
    rank: index + 1,
    student_id: p.student?.student_id,
    student_name: p.student?.student_name,
    points: p.current_points
  })))
  
  // 获取前三个最高分学生
  const topThree = sortedByPoints.slice(0, 3)
  
  // 其余学生按学号顺序排序
  const remaining = sortedByPoints.slice(3).sort(sortByStudentId)
  
  // 合并：前三个最高分 + 其余按学号排序
  const finalResult = [...topThree, ...remaining]
  
  tvLog('buildStudentPoints 最终结果:', {
    totalStudents: finalResult.length,
    topThreeCount: topThree.length,
    remainingCount: remaining.length,
    sampleResult: finalResult.slice(0, 3).map(p => ({
      id: p.id,
      student_id: p.student_id,
      student_name: p.student?.student_name,
      current_points: p.current_points
    }))
  })
  
  return finalResult
}

// 生日数据处理
export function buildBirthdayList(students: any[], center: string, points: any[] = []) {
  const now = new Date()
  const month = now.getMonth()
  const monthStr = String(month + 1).padStart(2, '0')
  
  tvLog('生日数据处理:', {
    allStudentsCount: students.length,
    currentMonth: month,
    monthStr: monthStr,
    today: now.toLocaleDateString('zh-CN')
  })
  
  // 如果没有学生数据，但有积分数据，从积分数据中提取学生信息
  let studentsToProcess = students
  if (students.length === 0 && points.length > 0) {
    tvLog('生日处理：从积分数据中提取学生信息')
    const studentsFromPoints = points.map((p: any) => {
      const studentObj = p?.expand?.student_id
      const student = Array.isArray(studentObj) ? studentObj[0] : studentObj
      if (student) {
        const studentCenter = student?.center ?? student?.Center ?? student?.centre ?? student?.branch
        // 确保只提取属于当前分行的学生
        if (isSameCenter(studentCenter, center)) {
          return {
            ...student,
            center: studentCenter
          }
        }
      }
      return null
    }).filter(Boolean)
    
    tvLog('生日处理：从积分数据提取的学生（已过滤分行）:', {
      count: studentsFromPoints.length,
      targetCenter: center
    })
    
    studentsToProcess = studentsFromPoints
  }
  
  // API已经按中心过滤了学生数据，不需要再次过滤
  const monthBirthdays = studentsToProcess
    .map(s => ({ s, d: getDobDate(s.dob) }))
    .filter(x => {
      const hasDate = !!x.d
      const hasStringMatch = x.s.dob && String(x.s.dob).includes(`-${monthStr}-`)
      const isMatch = hasDate || hasStringMatch
      if ((x.s.student_id === 'T1' || x.s.student_id === 'B15') && center === 'WX 02') {
        tvLog(x.s.student_id, 'birthday filter:', { 
          student_id: x.s.student_id, 
          center: x.s.center, 
          dob: x.s.dob, 
          parsedDate: x.d?.toISOString().slice(0,10),
          hasDate, 
          hasStringMatch, 
          isMatch,
          monthStr
        })
      }
      return isMatch
    })
    .filter(x => x.d ? x.d.getMonth() === month : true)
    .sort((a, b) => {
      const da = a.d ? a.d.getDate() : 99
      const db = b.d ? b.d.getDate() : 99
      return da - db
    })
    .map(x => x.s)
    
  tvLog('monthBirthdays count:', monthBirthdays.length, 'for center:', center)
  
  return monthBirthdays
}

// 构建幻灯片数据
export function buildSlides(sortedStudents: any[], monthBirthdays: any[], announcements: any[], transactions: any[] = [], studentsPerPage: number = STUDENTS_PER_PAGE) {
  const list: any[] = []

  tvLog('构建幻灯片数据:', {
    sortedStudentsLength: sortedStudents.length,
    monthBirthdaysLength: monthBirthdays.length,
    announcementsLength: announcements.length,
    transactionsLength: transactions.length,
    studentsPerPage
  })

  // 1. 学生积分分页 - 只有当有学生数据时才创建幻灯片
  if (sortedStudents.length > 0) {
    for (let i = 0; i < sortedStudents.length; i += studentsPerPage) {
      const slideData = sortedStudents.slice(i, i + studentsPerPage)
      list.push({ 
        type: SLIDE_TYPES.STUDENT_POINTS, 
        data: slideData 
      })
      tvLog('创建学生积分幻灯片:', {
        pageIndex: Math.floor(i / studentsPerPage),
        dataLength: slideData.length,
        sampleData: slideData.slice(0, 2)
      })
    }
  } else {
    tvLog('没有学生数据，跳过学生积分幻灯片创建')
  }

  // 2. 交易记录 - 在学生积分之后，生日之前
  if ((transactions || []).length > 0) {
    list.push({ type: SLIDE_TYPES.TRANSACTIONS, data: transactions })
  }

  // 3. 生日分页 - 只有当有生日数据时才创建幻灯片
  if (monthBirthdays.length > 0) {
    for (let i = 0; i < monthBirthdays.length; i += studentsPerPage) {
      list.push({ 
        type: SLIDE_TYPES.BIRTHDAYS, 
        data: monthBirthdays.slice(i, i + studentsPerPage) 
      })
    }
  }

  // 4. 公告
  if ((announcements || []).length > 0) {
    list.push({ type: SLIDE_TYPES.ANNOUNCEMENTS, data: announcements })
  }

  // 确保至少有一个幻灯片
  if (list.length === 0) {
    list.push({ type: SLIDE_TYPES.ANNOUNCEMENTS, data: [] })
  }

  tvLog('buildSlides 最终结果:', {
    totalSlides: list.length,
    slideTypes: list.map(s => s.type),
    studentPointsSlides: list.filter(s => s.type === SLIDE_TYPES.STUDENT_POINTS).length
  })

  return list
}
