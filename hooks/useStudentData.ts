'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchSecureData, createRecord, updateRecord, deleteRecord } from '@/lib/secure-api-client'
import { Student } from '@/lib/pocketbase-schema'

export interface StudentData extends Student {
  // UI-friendly aliases for DB fields
  name?: string
  id_alias?: string
}

export const useStudentData = () => {
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchSecureData<Student[]>('students', {
        fullList: true,
        sort: 'student_name',
      })
      
      // Map DB fields to UI fields to ensure compatibility with existing components
      const mappedData = (data || []).map(student => ({
        ...student,
        name: student.student_name || 'Unknown Student',
        id_alias: student.student_id || student.id
      }))
      
      setStudents(mappedData)
    } catch (err: any) {
      console.error('获取学生数据失败:', err)
      setError(err.message || '获取学生数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const addStudent = useCallback(async (studentData: Partial<StudentData>) => {
    try {
      const dataToSave = {
        ...studentData,
        status: studentData.status || 'active',
      }
      
      const result = await createRecord('students', dataToSave)
      await fetchStudents()
      return result
    } catch (err: any) {
      console.error('添加学生失败:', err)
      throw new Error(`添加学生失败: ${err.message}`)
    }
  }, [fetchStudents])

  const updateStudent = useCallback(async (id: string, studentData: Partial<StudentData>) => {
    try {
      const updateData = {
        ...studentData,
        updated: new Date().toISOString(),
      }
      
      await updateRecord('students', id, updateData)
      await fetchStudents()
    } catch (err: any) {
      console.error('更新学生失败:', err)
      throw new Error(`更新学生失败: ${err.message}`)
    }
  }, [fetchStudents])

  const deleteStudent = useCallback(async (id: string) => {
    try {
      await deleteRecord('students', id)
      await fetchStudents()
    } catch (err: any) {
      console.error('删除学生失败:', err)
      throw new Error(`删除学生失败: ${err.message}`)
    }
  }, [fetchStudents])

  const searchStudents = useCallback(async (query: string) => {
    try {
      const data = await fetchSecureData<Student[]>('students', {
        filter: `student_name contains '${query}' || student_id contains '${query}'`,
        fullList: true,
      })
      
      return (data || []).map(student => ({
        ...student,
        name: student.student_name || 'Unknown Student',
        id_alias: student.student_id || student.id
      }))
    } catch (err: any) {
      console.error('搜索学生失败:', err)
      throw new Error(`搜索学生失败: ${err.message}`)
    }
  }, [])

  const getStudentsByCenter = useCallback(async (center: string) => {
    try {
      const data = await fetchSecureData<Student[]>('students', {
        filter: `center = '${center}'`,
        fullList: true,
      })
      
      return (data || []).map(student => ({
        ...student,
        name: student.student_name || 'Unknown Student',
        id_alias: student.student_id || student.id
      }))
    } catch (err: any) {
      console.error('获取中心学生失败:', err)
      throw new Error(`获取中心学生失败: ${err.message}`)
    }
  }, [])

  const refetch = useCallback(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    refetch,
    addStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    getStudentsByCenter
  }
}
