import { useState, useEffect, useCallback } from 'react'
import { getAllTeachers, Teacher as PocketBaseTeacher, addTeacher as addTeacherToPb, updateTeacher as updateTeacherInPb, deleteTeacher as deleteTeacherFromPb } from '@/lib/pocketbase-teachers'

// 使用与 lib/pocketbase-teachers.ts 相同的 Teacher 接口
export interface Teacher extends PocketBaseTeacher {}

export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllTeachers()
      setTeachers(data)
    } catch (err: any) {
      console.error('获取教师数据失败:', err)
      setError(err.message || '获取教师数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const refetch = () => {
    fetchTeachers()
  }

  // 添加教师
  const addTeacher = useCallback(async (teacherData: Partial<Teacher>) => {
    try {
      console.log('useTeachers: 添加教师', teacherData)
      const newTeacher = await addTeacherToPb(teacherData as any)
      console.log('教师添加成功:', newTeacher)
      await fetchTeachers() // 刷新数据
      return newTeacher
    } catch (err: any) {
      console.error('添加教师失败:', err)
      throw new Error(err.message || '添加教师失败')
    }
  }, [fetchTeachers])

  // 更新教师
  const updateTeacher = useCallback(async (teacherId: string, teacherData: Partial<Teacher>) => {
    try {
      console.log('useTeachers: 更新教师', teacherId, teacherData)
      const updatedTeacher = await updateTeacherInPb({ id: teacherId, ...teacherData } as any)
      console.log('教师更新成功:', updatedTeacher)
      await fetchTeachers() // 刷新数据
      return updatedTeacher
    } catch (err: any) {
      console.error('更新教师失败:', err)
      throw new Error(err.message || '更新教师失败')
    }
  }, [fetchTeachers])

  // 删除教师
  const deleteTeacher = useCallback(async (teacherId: string) => {
    try {
      console.log('useTeachers: 删除教师', teacherId)
      await deleteTeacherFromPb(teacherId)
      console.log('教师删除成功')
      await fetchTeachers() // 刷新数据
    } catch (err: any) {
      console.error('删除教师失败:', err)
      throw new Error(err.message || '删除教师失败')
    }
  }, [fetchTeachers])

  return {
    teachers,
    loading,
    error,
    refetch: refetch,
    addTeacher,
    updateTeacher,
    deleteTeacher
  }
}
