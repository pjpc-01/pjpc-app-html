import { useState, useEffect } from 'react'

export interface Class {
  id: string
  name: string
  course_id: string
  teacher_id: string
  center: string
  room: string
  schedule: Record<string, any>
  max_capacity: number
  current_students: number
  status: string
  created: string
  updated: string
  expand?: {
    course_id?: {
      id: string
      title: string
      subject: string
    }
    teacher_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export interface ClassEnrollment {
  id: string
  class_id: string
  student_id: string
  enrollment_date: string
  status: string
  created: string
  updated: string
  expand?: {
    class_id?: Class
    student_id?: {
      id: string
      student_name: string
      student_id: string
    }
  }
}

export function useClasses(teacherId?: string, center?: string) {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (teacherId) params.append('teacher_id', teacherId)
      if (center) params.append('center', center)
      
      const response = await fetch(`/api/classes?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setClasses(result.data.items || [])
      } else {
        setError(result.error || '获取班级列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级列表失败')
    } finally {
      setLoading(false)
    }
  }

  const createClass = async (classData: Partial<Class>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchClasses() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '创建班级失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建班级失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [teacherId, center])

  const updateClass = async (classId: string, classData: Partial<Class>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchClasses() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '更新班级失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新班级失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteClass = async (classId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchClasses() // 重新获取列表
        return true
      } else {
        setError(result.error || '删除班级失败')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除班级失败')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    classes,
    loading,
    error,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass
  }
}

export function useClassEnrollments(classId?: string, studentId?: string) {
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (classId) params.append('class_id', classId)
      if (studentId) params.append('student_id', studentId)
      
      const response = await fetch(`/api/class-enrollments?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setEnrollments(result.data.items || [])
      } else {
        setError(result.error || '获取班级注册列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取班级注册列表失败')
    } finally {
      setLoading(false)
    }
  }

  const enrollStudent = async (enrollmentData: { class_id: string; student_id: string }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/class-enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchEnrollments() // 重新获取列表
        return result.data
      } else {
        setError(result.error || '注册学生失败')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册学生失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrollments()
  }, [classId, studentId])

  return {
    enrollments,
    loading,
    error,
    fetchEnrollments,
    enrollStudent
  }
}