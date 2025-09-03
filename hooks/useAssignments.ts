import { useState, useEffect } from 'react'

interface Assignment {
  id: string
  title: string
  description: string
  subject: string
  class_id?: string
  teacher_id: string
  due_date?: string
  max_score: number
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

// 整合后的作业记录接口（包含提交和成绩信息）
interface AssignmentRecord {
  id: string
  assignment_id: string
  student_id: string
  content: string
  attachments: string[]
  submitted_at?: string
  score?: number
  max_score: number
  feedback: string
  graded_by?: string
  graded_at?: string
  status: 'pending' | 'submitted' | 'graded' | 'late'
  created_at: string
  // 关联数据
  expand?: {
    assignment_id?: {
      id: string
      title: string
      subject: string
      teacher_id: string
    }
    student_id?: {
      id: string
      student_name: string
      student_id: string
    }
    graded_by?: {
      id: string
      name: string
      username: string
    }
  }
}

interface AssignmentStats {
  totalAssignments: number
  totalSubmissions: number
  totalGraded: number
  averageScore: number
  submissionRate: number
  subjectStats: Record<string, any>
  classStats: Record<string, any>
  recentActivity: any[]
}

export function useAssignments(teacherId?: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (teacherId) params.append('teacher_id', teacherId)
      
      const response = await fetch(`/api/assignments?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAssignments(data.data.items || [])
      } else {
        setError(data.error || '获取作业列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作业列表失败')
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchAssignments() // 刷新列表
        return data.data
      } else {
        throw new Error(data.error || '创建作业失败')
      }
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [teacherId])

  return {
    assignments,
    loading,
    error,
    refetch: fetchAssignments,
    createAssignment
  }
}

export function useAssignmentRecords(assignmentId?: string, teacherId?: string) {
  const [records, setRecords] = useState<AssignmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (assignmentId) params.append('assignment_id', assignmentId)
      if (teacherId) params.append('teacher_id', teacherId)
      
      const response = await fetch(`/api/assignment-records?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setRecords(data.data.items || [])
      } else {
        setError(data.error || '获取作业记录列表失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作业记录列表失败')
    } finally {
      setLoading(false)
    }
  }

  const createOrUpdateRecord = async (recordData: Partial<AssignmentRecord>) => {
    try {
      const response = await fetch('/api/assignment-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchRecords() // 刷新列表
        return data.data
      } else {
        throw new Error(data.error || '创建/更新作业记录失败')
      }
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [assignmentId, teacherId])

  return {
    records,
    loading,
    error,
    refetch: fetchRecords,
    createOrUpdateRecord
  }
}

// 从作业记录中提取成绩信息的辅助函数
export function getGradesFromRecords(records: AssignmentRecord[]) {
  return records
    .filter(record => record.score !== null && record.score !== undefined)
    .map(record => ({
      id: record.id,
      assignment_id: record.assignment_id,
      student_id: record.student_id,
      student_name: record.expand?.student_id?.student_name || '未知学生',
      score: record.score!,
      max_score: record.max_score,
      feedback: record.feedback,
      graded_by: record.graded_by || '',
      graded_at: record.graded_at || '',
      subject: record.expand?.assignment_id?.subject || '未知科目'
    }))
}

export function useAssignmentStats(teacherId?: string) {
  const [stats, setStats] = useState<AssignmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (teacherId) params.append('teacher_id', teacherId)
      
      const response = await fetch(`/api/assignment-stats?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || '获取作业统计数据失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作业统计数据失败')
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
    refetch: fetchStats
  }
}
