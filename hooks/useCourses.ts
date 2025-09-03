import { useState, useEffect } from 'react'

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

export function useCourses(teacherId?: string) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = async () => {
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
        setError(result.error || '获取课程列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取课程列表失败')
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async (courseData: Partial<Course>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchCourses() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '创建课程失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建课程失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [teacherId])

  const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchCourses() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '更新课程失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新课程失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (courseId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchCourses() // 重新获取列表
        return true
      } else {
        setError(result.error || '删除课程失败')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除课程失败')
      return false
    } finally {
      setLoading(false)
    }
  }

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

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (teacherId) params.append('teacher_id', teacherId)
      
      const response = await fetch(`/api/courses?${params}`)
      const result = await response.json()
      
      if (result.success) {
        const courses = result.data.items || []
        const totalCourses = courses.length
        const activeCourses = courses.filter((c: Course) => c.status === 'active').length
        
        // 计算统计数据
        const subjectDistribution: Record<string, number> = {}
        courses.forEach((course: Course) => {
          subjectDistribution[course.subject] = (subjectDistribution[course.subject] || 0) + 1
        })
        
        setStats({
          totalCourses,
          activeCourses,
          totalStudents: 0, // 需要从班级数据计算
          averageClassSize: 0, // 需要从班级数据计算
          subjectDistribution
        })
      } else {
        setError(result.error || '获取课程统计失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取课程统计失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [teacherId])

  return {
    stats,
    loading,
    error,
    fetchStats
  }
}