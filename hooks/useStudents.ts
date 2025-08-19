import { useState, useEffect, useCallback } from 'react'
import { getAllStudents, Student as PocketBaseStudent } from '@/lib/pocketbase-students'

// 使用与 lib/pocketbase-students.ts 相同的 Student 接口
export interface Student extends PocketBaseStudent {}

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('开始获取融合的学生数据...')
      const allStudents = await getAllStudents()
      console.log(`成功获取 ${allStudents.length} 个学生数据`)
      
      setStudents(allStudents)
    } catch (err: any) {
      console.error('获取学生数据失败:', err)
      setError(err.message || '获取学生数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(() => {
    console.log('手动刷新学生数据')
    fetchStudents()
  }, [fetchStudents])

  // 初始数据获取
  useEffect(() => {
    console.log('useStudents useEffect triggered')
    fetchStudents()
  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    refetch
  }
}
