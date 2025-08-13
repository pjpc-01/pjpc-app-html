import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAllStudents, getStudentsByGrade, addStudent as addStudentPB, updateStudent as updateStudentPB, deleteStudent as deleteStudentPB, Student as PocketBaseStudent } from '@/lib/pocketbase-students'

// Student interface matching exact PocketBase field names
export interface Student {
  id: string
  name: string
  studentId: string
  grade: string
  parentName: string
  parentEmail: string
  status: 'active' | 'graduated' | 'transferred' | 'inactive'
}

interface UseStudentsOptions {
  dataType?: 'primary' | 'secondary' | undefined
  enableCache?: boolean
  cacheTimeout?: number
  pageSize?: number
}

// Function to convert PocketBase student to UI student format
const convertPocketBaseStudent = (pbStudent: PocketBaseStudent): Student => {
  return {
    id: pbStudent.id,
    name: pbStudent.student_name || '未知姓名',
    studentId: pbStudent.student_id || '',
    grade: pbStudent.standard || '',
    parentName: pbStudent.father_phone || '', // Using father_phone as parentName for now
    parentEmail: '', // No email field in PocketBase interface
    status: 'active' // Default status since it's not in PocketBase interface
  }
}

export const useStudents = (options: UseStudentsOptions = {}) => {
  const {
    dataType = undefined,
    enableCache = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    pageSize = 50
  } = options

  const [students, setStudents] = useState<Student[]>([
    {
      id: "1",
      name: "王小明",
      studentId: "ST001",
      grade: "一年级",
      parentName: "王先生",
      parentEmail: "wang@example.com",
      status: "active"
    },
    {
      id: "2",
      name: "李小红",
      studentId: "ST002",
      grade: "二年级",
      parentName: "李女士",
      parentEmail: "li@example.com",
      status: "active"
    },
    {
      id: "3",
      name: "张小华",
      studentId: "ST003",
      grade: "三年级",
      parentName: "张先生",
      parentEmail: "zhang@example.com",
      status: "active"
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
  const [lastDataType, setLastDataType] = useState(dataType)

  const cacheKey = useMemo(() => `students_${dataType}_${currentPage}`, [dataType, currentPage])
  const isCacheValid = useMemo(() => {
    if (!enableCache || !lastFetchTime) return false
    if (dataType !== lastDataType) return false
    return Date.now() - lastFetchTime < cacheTimeout
  }, [enableCache, lastFetchTime, cacheTimeout, dataType, lastDataType])

  // Data fetching with PocketBase fallback to mock data
  const fetchStudents = useCallback(async (page: number = 1, forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log('尝试获取学生数据...')
      
      // Try PocketBase first, fallback to mock data
      let allStudents = students
      
      try {
        console.log('尝试从PocketBase获取数据...')
        const pocketBaseStudents = await getAllStudents()
        const convertedStudents = pocketBaseStudents.map(convertPocketBaseStudent)
        allStudents = convertedStudents
        console.log('✅ 成功从PocketBase获取学生数据:', convertedStudents.length, '个学生')
      } catch (pbError) {
        console.warn('PocketBase连接失败，使用模拟数据:', pbError)
        console.log('使用内置模拟数据:', students.length, '个学生')
      }
      
      // Filter based on dataType
      let filteredStudents = allStudents
      
      if (dataType === 'primary') {
        filteredStudents = allStudents.filter(student => {
          const gradeNum = parseInt(student.grade)
          return !isNaN(gradeNum) && gradeNum <= 6
        })
        console.log('过滤后的primary学生:', filteredStudents.length, '个')
      } else if (dataType === 'secondary') {
        filteredStudents = allStudents.filter(student => {
          const gradeNum = parseInt(student.grade)
          return !isNaN(gradeNum) && gradeNum > 6
        })
        console.log('过滤后的secondary学生:', filteredStudents.length, '个')
      }
      
      setStudents(filteredStudents)
      setLastFetchTime(Date.now())
      setLastDataType(dataType)
      setHasMore(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取学生数据失败'
      setError(errorMessage)
      setHasMore(false)
      console.error('❌ 获取学生数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [dataType, pageSize, students])

  const getStudentsByGradeHook = useCallback(async (grade: string): Promise<Student[]> => {
    try {
      const pocketBaseStudents = await getStudentsByGrade(grade)
      return pocketBaseStudents.map(convertPocketBaseStudent)
    } catch (err) {
      console.warn('PocketBase获取年级学生失败，返回模拟数据:', err)
      // Return mock students filtered by grade
      return students.filter(student => student.grade === grade)
    }
  }, [students])

  const updateStudentHook = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      setError(null)
      
      // Try PocketBase first
      try {
        // Convert UI updates to PocketBase format
        const pbUpdates: any = {}
        if (updates.name) pbUpdates.student_name = updates.name
        if (updates.studentId) pbUpdates.student_id = updates.studentId
        if (updates.grade) pbUpdates.standard = updates.grade
        if (updates.parentName) pbUpdates.father_phone = updates.parentName
        
        await updateStudentPB({ id: studentId, ...pbUpdates })
        console.log('✅ PocketBase更新学生成功')
      } catch (pbError) {
        console.warn('PocketBase更新失败，仅更新本地状态:', pbError)
      }
      
      // Update local state regardless of PocketBase success
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId ? { ...student, ...updates } : student
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update student'
      setError(errorMessage)
      throw err
    }
  }, [])

  const deleteStudentHook = useCallback(async (studentId: string) => {
    try {
      setError(null)
      
      // Try PocketBase first
      try {
        await deleteStudentPB(studentId)
        console.log('✅ PocketBase删除学生成功')
      } catch (pbError) {
        console.warn('PocketBase删除失败，仅删除本地状态:', pbError)
      }
      
      // Remove from local state regardless of PocketBase success
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete student'
      setError(errorMessage)
      throw err
    }
  }, [])

  const addStudentHook = useCallback(async (studentData: Partial<Student>) => {
    try {
      setError(null)
      
      let newStudent: Student
      
      // Try PocketBase first
      try {
        // Convert UI student data to PocketBase format
        const pbStudentData = {
          student_id: studentData.studentId || `ST${Date.now()}`,
          student_name: studentData.name,
          standard: studentData.grade,
          father_phone: studentData.parentName
        }
        
        const newPocketBaseStudent = await addStudentPB(pbStudentData)
        newStudent = convertPocketBaseStudent(newPocketBaseStudent)
        console.log('✅ PocketBase添加学生成功')
      } catch (pbError) {
        console.warn('PocketBase添加失败，创建本地学生:', pbError)
        // Create local student if PocketBase fails
        newStudent = {
          id: `local_${Date.now()}`,
          name: studentData.name || '未知姓名',
          studentId: studentData.studentId || `ST${Date.now()}`,
          grade: studentData.grade || '',
          parentName: studentData.parentName || '',
          parentEmail: studentData.parentEmail || '',
          status: 'active'
        }
      }
      
      setStudents(prevStudents => [...prevStudents, newStudent])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add student'
      setError(errorMessage)
      throw err
    }
  }, [])

  const getImportStats = useCallback(async () => {
    try {
      return {
        total: students.length,
        byGrade: students.reduce((acc, student) => {
          acc[student.grade] = (acc[student.grade] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    } catch (err) {
      throw err
    }
  }, [students])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }, [loading, hasMore])

  const refresh = useCallback(() => {
    setCurrentPage(1)
    fetchStudents(1, true)
  }, [fetchStudents])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const stats = useMemo(() => {
    const total = students.length
    const byGrade = students.reduce((acc, student) => {
      const grade = student.grade || '无年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, byGrade }
  }, [students])

  useEffect(() => {
    fetchStudents(currentPage)
  }, [currentPage, dataType, fetchStudents])

  return {
    students,
    loading,
    error,
    hasMore,
    stats,
    refetch: refresh,
    loadMore,
    getStudentsByGrade: getStudentsByGradeHook,
    updateStudent: updateStudentHook,
    deleteStudent: deleteStudentHook,
    addStudent: addStudentHook,
    getImportStats,
    clearError
  }
} 