import { useState, useEffect, useCallback, useMemo } from 'react'
import { FirestoreImport, FirestoreStudent } from '@/lib/firestore-import'
import { Timestamp } from 'firebase/firestore'

export interface Student {
  id: string
  name: string
  studentId?: string
  grade: string
  gender?: string
  birthDate?: string
  phone?: string
  email?: string
  address?: string
  parentName: string
  parentPhone?: string
  parentEmail: string
  enrollmentDate?: string
  enrollmentYear?: number
  status?: string
  createdAt?: Date
  updatedAt?: Date
  // Additional fields that might exist in Firebase
  class?: string
  fatherName?: string
  motherName?: string
  attendance?: number
  progress?: number
  age?: number
  dateOfBirth?: string
  emergencyContact?: string
  emergencyPhone?: string
  medicalInfo?: string
  notes?: string
  image?: string
  calculatedGrade?: string
}

interface UseStudentsOptions {
  dataType?: 'primary' | 'secondary'
  enableCache?: boolean
  cacheTimeout?: number
  pageSize?: number
}

export const useStudents = (options: UseStudentsOptions = {}) => {
  const {
    dataType = 'primary',
    enableCache = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    pageSize = 50
  } = options

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
  const [lastDataType, setLastDataType] = useState(dataType)

  // 缓存机制
  const cacheKey = useMemo(() => `students_${dataType}_${currentPage}`, [dataType, currentPage])
  const isCacheValid = useMemo(() => {
    if (!enableCache || !lastFetchTime) return false
    // 当dataType改变时，缓存无效
    if (dataType !== lastDataType) return false
    return Date.now() - lastFetchTime < cacheTimeout
  }, [enableCache, lastFetchTime, cacheTimeout, dataType, lastDataType]) // 添加lastDataType依赖

  // 转换Firestore学生数据到Student接口
  const convertFirestoreStudent = useCallback((student: any): Student => {
    return {
      id: student.id,
      name: student.name,
      studentId: student.studentId,
      grade: student.grade,
      gender: student.gender,
      birthDate: student.birthDate,
      phone: student.phone,
      email: student.email,
      address: student.address,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      enrollmentDate: student.enrollmentDate,
      enrollmentYear: student.enrollmentYear,
      status: student.status,
      createdAt: student.createdAt?.toDate(),
      updatedAt: student.updatedAt?.toDate(),
      // Preserve all additional Firebase fields
      class: student.class,
      fatherName: student.fatherName,
      motherName: student.motherName,
      attendance: student.attendance,
      progress: student.progress,
      age: student.age,
      dateOfBirth: student.dateOfBirth,
      emergencyContact: student.emergencyContact,
      emergencyPhone: student.emergencyPhone,
      medicalInfo: student.medicalInfo,
      notes: student.notes,
      image: student.image,
      calculatedGrade: student.calculatedGrade,
    }
  }, [])

  // 过滤学生数据
  const filterStudents = useCallback((students: Student[]): Student[] => {
    return students.filter(student => 
      !student.name?.startsWith("Student") && 
      student.name?.trim() !== "" &&
      student.name !== undefined
    )
  }, [])

  const fetchStudents = useCallback(async (page: number = 1, forceRefresh: boolean = false) => {
    try {
      // 如果缓存有效且不是强制刷新，直接返回
      // 但是当dataType改变时，强制刷新
      if (isCacheValid && !forceRefresh) {
        console.log(`Using cached data for ${dataType}`)
        return
      }
      
      console.log(`Fetching fresh data for ${dataType}, forceRefresh: ${forceRefresh}`)

      setLoading(true)
      setError(null)
      
      console.log(`Fetching students for dataType: ${dataType}, page: ${page}`)
      
      // 添加超时保护
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firebase连接超时')), 15000) // 15秒超时
      })
      
      const firestoreImport = new FirestoreImport(dataType)
      const firestorePromise = firestoreImport.getAllStudents()
      
      const firestoreStudents = await Promise.race([firestorePromise, timeoutPromise]) as any[]
      
      console.log('Raw Firebase students:', firestoreStudents)
      
      // 转换数据
      const convertedStudents: Student[] = firestoreStudents.map(student => {
        console.log('Processing student:', { 
          firebaseId: student.id, 
          name: student.name,
          hasId: !!student.id,
          idType: typeof student.id,
          allFields: Object.keys(student)
        })
        return convertFirestoreStudent(student)
      })
      
      // 过滤数据
      const filteredStudents = filterStudents(convertedStudents)
      
      console.log('Filtered students:', filteredStudents.map(s => ({ id: s.id, name: s.name })))
      
      setStudents(filteredStudents)
      setLastFetchTime(Date.now())
      setLastDataType(dataType) // 更新最后使用的dataType
      setHasMore(filteredStudents.length >= pageSize)
      
    } catch (err) {
      console.error('Error fetching students:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        type: typeof err
      })
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students'
      setError(errorMessage)
      
      // 如果Firestore失败，使用备用数据
      if (students.length === 0) {
        setStudents([
          { id: "G16", name: "王小明", grade: "三年级", parentName: "王大明", parentEmail: "wang@example.com" },
          { id: "G17", name: "李小红", grade: "四年级", parentName: "李大红", parentEmail: "li@example.com" },
          { id: "G18", name: "张小华", grade: "五年级", parentName: "张大华", parentEmail: "zhang@example.com" },
          { id: "G19", name: "陈小军", grade: "三年级", parentName: "陈大军", parentEmail: "chen@example.com" },
        ])
      }
    } finally {
      setLoading(false)
    }
  }, [dataType, isCacheValid, convertFirestoreStudent, filterStudents, pageSize, students.length])

  const getStudentsByGrade = useCallback(async (grade: string): Promise<Student[]> => {
    try {
      const firestoreImport = new FirestoreImport(dataType)
      const firestoreStudents = await firestoreImport.getStudentsByGrade(grade)
      
      return firestoreStudents.map(student => convertFirestoreStudent(student))
    } catch (err) {
      console.error('Error fetching students by grade:', err)
      throw err
    }
  }, [dataType, convertFirestoreStudent])

  const updateStudent = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      setError(null)
      const firestoreImport = new FirestoreImport(dataType)
      // Convert Student updates to FirestoreStudent updates
      const firestoreUpdates = {
        ...updates,
        updatedAt: Timestamp.now()
      } as Partial<FirestoreStudent>
      await firestoreImport.updateStudent(studentId, firestoreUpdates)
      
      // 更新本地状态
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === studentId ? { ...student, ...updates } : student
        )
      )
    } catch (err) {
      console.error('Error updating student:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update student'
      setError(errorMessage)
      throw err
    }
  }, [dataType])

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      setError(null)
      const firestoreImport = new FirestoreImport(dataType)
      await firestoreImport.deleteStudent(studentId)
      
      // 更新本地状态
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId))
    } catch (err) {
      console.error('Error deleting student:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete student'
      setError(errorMessage)
      throw err
    }
  }, [dataType])

  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const firestoreImport = new FirestoreImport(dataType)
      const newStudent = await firestoreImport.addStudent(studentData)
      
      // 添加到本地状态
      setStudents(prevStudents => [...prevStudents, convertFirestoreStudent(newStudent)])
    } catch (err) {
      console.error('Error adding student:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add student'
      setError(errorMessage)
      throw err
    }
  }, [dataType, convertFirestoreStudent])

  const getImportStats = useCallback(async () => {
    try {
      const firestoreImport = new FirestoreImport(dataType)
      return await firestoreImport.getImportStats()
    } catch (err) {
      console.error('Error getting import stats:', err)
      throw err
    }
  }, [dataType])

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

  // 计算统计信息
  const stats = useMemo(() => {
    const total = students.length
    const byGrade = students.reduce((acc, student) => {
      const grade = student.grade || 'Unknown'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return { total, byGrade }
  }, [students])

  useEffect(() => {
    fetchStudents(currentPage)
  }, [currentPage, fetchStudents, dataType])

  return { 
    students, 
    loading, 
    error, 
    hasMore,
    stats,
    refetch: refresh,
    loadMore,
    getStudentsByGrade,
    updateStudent,
    deleteStudent,
    addStudent,
    getImportStats,
    clearError
  }
} 