import { useState, useEffect, useCallback } from 'react'

export interface Course {
  id: string
  title: string
  description: string
  subject: string
  grade_level: string
  teacher_id: string
  duration: number
  max_students: number
  status: string
  start_date?: string
  end_date?: string
  created: string
  updated: string
  expand?: {
    teacher_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export interface CourseStats {
  totalCourses: number
  activeCourses: number
  totalStudents: number
  averageClassSize: number
  subjectDistribution: Record<string, number>
}

const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: '初级数学基础',
    description: '涵盖基础算术、几何入门和逻辑思维训练',
    subject: '数学',
    grade_level: '一年级',
    teacher_id: 'teacher-1',
    duration: 60,
    max_students: 20,
    status: 'active',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: '进阶英文语法',
    description: '专注于复杂句型、写作技巧和高级词汇',
    subject: '英语',
    grade_level: '三年级',
    teacher_id: 'teacher-1',
    duration: 90,
    max_students: 15,
    status: 'active',
    created: '2024-01-05T00:00:00Z',
    updated: '2024-01-05T00:00:00Z'
  },
  {
    id: '3',
    title: '趣味科学实验',
    description: '通过动手实验探索物理和化学基本原理',
    subject: '科学',
    grade_level: '二年级',
    teacher_id: 'teacher-1',
    duration: 120,
    max_students: 12,
    status: 'active',
    created: '2024-01-10T00:00:00Z',
    updated: '2024-01-10T00:00:00Z'
  },
  {
    id: '4',
    title: '高级中文写作',
    description: '文学分析与创意写作深度指导',
    subject: '中文',
    grade_level: '五年级',
    teacher_id: 'teacher-1',
    duration: 60,
    max_students: 10,
    status: 'inactive',
    created: '2023-12-01T00:00:00Z',
    updated: '2023-12-01T00:00:00Z'
  },
  {
    id: '5',
    title: '数学奥数入门',
    description: '针对高潜力学生的数学挑战与竞赛培训',
    subject: '数学',
    grade_level: '三年级',
    teacher_id: 'teacher-1',
    duration: 90,
    max_students: 8,
    status: 'active',
    created: '2024-01-15T00:00:00Z',
    updated: '2024-01-15T00:00:00Z'
  }
]

export function useCourses(teacherId?: string) {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (teacherId) params.append('teacher_id', teacherId)
      
      const response = await fetch(`/api/courses?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setCourses(result.data.items || [])
      } else {
        // Fallback to mock data if API fails
        setCourses(MOCK_COURSES)
        setError(result.error || '获取课程列表失败，已加载演示数据')
      }
    } catch (err) {
      setCourses(MOCK_COURSES)
      setError(err instanceof Error ? err.message : '获取课程列表失败，已加载演示数据')
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  const createCourse = async (courseData: Partial<Course>) => {
    // Mock create
    const newCourse: Course = {
      ...courseData,
      id: (courses.length + 1).toString(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    } as Course
    setCourses(prev => [...prev, newCourse])
    return newCourse
  }

  const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
    // Mock update
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...courseData } : c))
    return { success: true }
  }

  const deleteCourse = async (courseId: string) => {
    // Mock delete
    setCourses(prev => prev.filter(c => c.id !== courseId))
    return true
  }

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse
  }
}

export function useCourseStats(teacherId?: string) {
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock stats based on MOCK_COURSES
      const totalCourses = MOCK_COURSES.length
      const activeCourses = MOCK_COURSES.filter(c => c.status === 'active').length
      
      const subjectDistribution: Record<string, number> = {}
      MOCK_COURSES.forEach(c => {
        subjectDistribution[c.subject] = (subjectDistribution[c.subject] || 0) + 1
      })

      setStats({
        totalCourses,
        activeCourses,
        totalStudents: 85, // Mock total
        averageClassSize: 12, // Mock average
        subjectDistribution
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取课程统计失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    fetchStats
  }
}
