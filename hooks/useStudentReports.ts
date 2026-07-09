import { useState, useCallback } from 'react'
import { fetchSecureData, fetchRecord } from '@/lib/secure-api-client'

export interface ReportSubject {
  name: string
  midterm: number | null
  final: number | null
  evaluation: string
}

export interface StudentReport {
  id: string
  studentId: string
  term: string
  year: number
  report_date: string
  growth_message: string
  subjects: ReportSubject[]
  midterm_avg: number | null
  final_avg: number | null
  overall_avg: number | null
  class_rank: string
  improvement: string
  activities: string[]
  self_evaluation: string
  teacher_comment: string
  problems: string[]
  improvements: string[]
  future_goals_academic: string
  future_goals_ability: string
  future_goals_character: string
  summary: string
  parent_feedback: string
  parent_signature: string
  parent_date: string
  status: 'draft' | 'published'
  created?: string
  updated?: string
  expand?: {
    studentId?: {
      id: string
      name: string
      dob: string
      grade: string
      center: string
      avatar: string
      gender: string
      school: string
      student_id: string
      nric: string
    }
  }
}

export const useStudentReports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get all reports for a student
  const getStudentReports = useCallback(async (studentId: string): Promise<StudentReport[]> => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<StudentReport[]>('student_reports', {
        fullList: true,
        sort: '-year,-term',
        filter: `studentId = "${studentId}"`,
        expand: 'studentId',
      })
      return (data || []) as StudentReport[]
    } catch (err) {
      setError('获取学生报告失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Get a single report
  const getReport = useCallback(async (reportId: string): Promise<StudentReport | null> => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchRecord('student_reports', reportId)
      return data as unknown as StudentReport
    } catch (err) {
      setError('获取报告失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Create or update report
  const saveReport = useCallback(async (data: Partial<StudentReport> & { id?: string }): Promise<StudentReport> => {
    const isUpdate = !!data.id
    const url = isUpdate
      ? `/api/pocketbase-proxy/api/collections/student_reports/records/${data.id}`
      : `/api/pocketbase-proxy/api/collections/student_reports/records`
    
    const method = isUpdate ? 'PATCH' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '保存失败' }))
      throw new Error(err.message || '保存失败')
    }
    
    return await res.json()
  }, [])

  // Delete report
  const deleteReport = useCallback(async (reportId: string): Promise<void> => {
    const res = await fetch(`/api/pocketbase-proxy/api/collections/student_reports/records/${reportId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('删除失败')
  }, [])

  return {
    loading,
    error,
    getStudentReports,
    getReport,
    saveReport,
    deleteReport,
  }
}
