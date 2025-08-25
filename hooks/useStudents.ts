import { useState, useEffect, useCallback } from 'react'
import { getAllStudents, Student as PocketBaseStudent, addStudent as addStudentToPb, updateStudent as updateStudentInPb, deleteStudent as deleteStudentFromPb } from '@/lib/pocketbase-students'

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

  // 添加学生
  const addStudent = useCallback(async (studentData: Partial<Student>) => {
    try {
      console.log('useStudents: 添加学生', studentData)
      const newStudent = await addStudentToPb(studentData as any)
      console.log('学生添加成功:', newStudent)
      await fetchStudents() // 刷新数据
      return newStudent
    } catch (err: any) {
      console.error('添加学生失败:', err)
      throw new Error(err.message || '添加学生失败')
    }
  }, [fetchStudents])

  // 更新学生
  const updateStudent = useCallback(async (studentId: string, studentData: Partial<Student>) => {
    try {
      console.log('useStudents: 更新学生', studentId, studentData)
      const updatedStudent = await updateStudentInPb({ id: studentId, ...studentData } as any)
      console.log('学生更新成功:', updatedStudent)
      await fetchStudents() // 刷新数据
      return updatedStudent
    } catch (err: any) {
      console.error('更新学生失败:', err)
      throw new Error(err.message || '更新学生失败')
    }
  }, [fetchStudents])

  // 删除学生
  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      console.log('useStudents: 删除学生', studentId)
      await deleteStudentFromPb(studentId)
      console.log('学生删除成功')
      await fetchStudents() // 刷新数据
    } catch (err: any) {
      console.error('删除学生失败:', err)
      throw new Error(err.message || '删除学生失败')
    }
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
    refetch,
    addStudent,
    updateStudent,
    deleteStudent
  }
}
