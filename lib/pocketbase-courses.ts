// 📚 课程/班级管理 - PocketBase 数据层
// 遵循 lib/pocketbase-students.ts 模式

// ============================================================
// 类型定义（与 PB courses 集合字段匹配）
// ============================================================

export interface Course {
  id: string

  // 基本信息
  title: string           // 课程名称 (text, required)
  description?: string    // 课程描述 (text)
  subject: string         // 科目 (text, required)

  // 分级/排课
  grade_level?: string    // 年级 (text)
  teacher_id?: string     // 负责教师 (text)
  duration?: number       // 每节课时长(分钟) (number)
  max_students?: number   // 最大学生数 (number)

  // 时间
  start_date?: string     // 开始日期 (text)
  end_date?: string       // 结束日期 (text)

  // 状态
  status?: string         // active / inactive / archived (text)

  // 🔄 中心关联
  centerId?: string       // 所属中心 (relation → centers)

  // 扩展字段（PB 可能已有）
  syllabus?: string       // 课程大纲 (text)
  materials?: string[]    // 教材附件 (file[])

  // 系统字段
  created: string
  updated: string

  expand?: {
    teacher_id?: { id: string; name: string; email?: string }
    centerId?: { id: string; name: string; code: string }
  }
}

export interface CourseCreateData {
  title: string
  description?: string
  subject: string
  grade_level?: string
  teacher_id?: string
  duration?: number
  max_students?: number
  start_date?: string
  end_date?: string
  status?: string
  centerId?: string
  syllabus?: string
  materials?: string[]
}

export interface CourseUpdateData extends Partial<CourseCreateData> {
  // id 通过参数传递
}

// ============================================================
// 科目选项（供下拉使用）
// ============================================================

export const SUBJECT_OPTIONS = [
  '华文',
  '国文',
  '英文',
  '数学',
  '科学',
  '历史',
  '地理',
  '道德',
  '美术',
  '音乐',
  '体育',
  '其他',
] as const

// ============================================================
// API 调用
// ============================================================

// 获取课程列表
export const getAllCourses = async (params?: {
  teacher_id?: string
  status?: string
  page?: number
  perPage?: number
}): Promise<{ items: Course[]; totalItems: number }> => {
  const searchParams = new URLSearchParams()
  if (params?.teacher_id) searchParams.set('teacher_id', params.teacher_id)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.perPage) searchParams.set('per_page', String(params.perPage))

  const qs = searchParams.toString()
  const response = await fetch(`/api/courses${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

  const result = await response.json()
  if (!result.success) throw new Error(result.error || '获取课程列表失败')

  return {
    items: result.data?.items || [],
    totalItems: result.data?.totalItems || 0,
  }
}

// 创建课程
export const createCourse = async (data: CourseCreateData): Promise<Course> => {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

  const result = await response.json()
  if (!result.success) throw new Error(result.error || '创建课程失败')

  return result.data
}

// 更新课程
export const updateCourse = async (id: string, data: CourseUpdateData): Promise<Course> => {
  const response = await fetch('/api/courses', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

  const result = await response.json()
  if (!result.success) throw new Error(result.error || '更新课程失败')

  return result.data
}

// 删除课程
export const deleteCourse = async (id: string): Promise<void> => {
  const response = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

  const result = await response.json()
  if (!result.success) throw new Error(result.error || '删除课程失败')
}

// ============================================================
// 班级管理（course + grade_level 分组）
// ============================================================

export interface ClassGroup {
  id: string              // `${course.id}-${grade_level}`
  courseId: string
  courseName: string
  subject: string
  grade_level: string
  teacherName?: string
  teacherId?: string
  studentCount: number
  status: string
}

// 从课程列表生成班级分组
export const buildClassGroups = (courses: Course[], teacherMap?: Record<string, string>): ClassGroup[] => {
  const groups = new Map<string, ClassGroup>()

  for (const course of courses) {
    if (!course.grade_level) continue
    const groupKey = `${course.id}-${course.grade_level}`
    groups.set(groupKey, {
      id: groupKey,
      courseId: course.id,
      courseName: course.title,
      subject: course.subject,
      grade_level: course.grade_level,
      teacherName: course.expand?.teacher_id?.name || (teacherMap && course.teacher_id ? teacherMap[course.teacher_id] : undefined),
      teacherId: course.teacher_id,
      studentCount: 0, // 需要从 enrollments 查询
      status: course.status || 'active',
    })
  }

  return Array.from(groups.values())
}

// 获取教师姓名映射
export const fetchTeachers = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch('/api/teachers/list')
    if (!response.ok) return {}
    const result = await response.json()
    if (!result.success) return {}

    const map: Record<string, string> = {}
    for (const t of result.data || []) {
      map[t.id] = t.name
    }
    return map
  } catch {
    return {}
  }
}
