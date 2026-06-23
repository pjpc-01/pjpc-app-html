import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData } from '@/lib/secure-api-client'

export interface GradeRecord {
  id: string
  studentId: string
  subject: string
  term: string
  year: number
  score: number | null
  grade_letter: string
  teacher_comment: string
  teacherId: string
  expand?: {
    studentId?: { id: string; name: string; grade: string }
    teacherId?: { id: string; name: string }
  }
}

export interface GradeStats {
  subject: string
  count: number
  average: number
  highest: number
  lowest: number
  passRate: number
  distribution: { A: number; B: number; C: number; D: number; F: number }
}

export const useGrades = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取学生所有成绩
  const getStudentGrades = useCallback(async (studentId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSecureData<GradeRecord[]>('grades', {
        fullList: true,
        sort: '-year,term',
        filter: `studentId = "${studentId}"`,
        expand: 'studentId,teacherId',
      })
      return data || []
    } catch (err) {
      setError('获取学生成绩失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取班级成绩（按学期/科目）
  const getClassGrades = useCallback(async (term: string, year: number, subject?: string) => {
    try {
      setLoading(true)
      setError(null)
      let filter = `term = "${term}" && year = ${year}`
      if (subject) filter += ` && subject = "${subject}"`
      const data = await fetchSecureData<GradeRecord[]>('grades', {
        fullList: true,
        sort: '-score',
        filter,
        expand: 'studentId',
      })
      return data || []
    } catch (err) {
      setError('获取班级成绩失败')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 录入/更新成绩
  const saveGrade = useCallback(async (data: {
    studentId: string
    subject: string
    term: string
    year: number
    score?: number | null
    grade_letter?: string
    teacher_comment?: string
    teacherId?: string
  }) => {
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '保存失败')
      return json.data
    } catch (err) {
      setError('保存成绩失败')
      throw err
    }
  }, [])

  // 成绩统计分析
  const getStats = useCallback((grades: GradeRecord[], targetSubject?: string): GradeStats | null => {
    const filtered = targetSubject
      ? grades.filter(g => g.subject === targetSubject)
      : grades
    if (filtered.length === 0) return null

    const scores = filtered.map(g => g.score).filter((s): s is number => s !== null && s !== undefined)
    if (scores.length === 0) return null

    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    scores.forEach(s => {
      if (s >= 80) distribution.A++
      else if (s >= 70) distribution.B++
      else if (s >= 60) distribution.C++
      else if (s >= 50) distribution.D++
      else distribution.F++
    })

    return {
      subject: targetSubject || '全部科目',
      count: filtered.length,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      passRate: Math.round((distribution.A + distribution.B + distribution.C) / scores.length * 100),
      distribution,
    }
  }, [])

  // 批量录入
  const bulkSaveGrades = useCallback(async (gradesList: Array<{
    studentId: string
    subject: string
    term: string
    year: number
    score: number
  }>) => {
    const results = []
    for (const g of gradesList) {
      try {
        const result = await saveGrade(g)
        results.push({ success: true, studentId: g.studentId, data: result })
      } catch (err) {
        results.push({ success: false, studentId: g.studentId, error: err })
      }
    }
    return results
  }, [saveGrade])

  return {
    loading,
    error,
    getStudentGrades,
    getClassGrades,
    saveGrade,
    getStats,
    bulkSaveGrades,
  }
}
