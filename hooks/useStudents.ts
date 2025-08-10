import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAllStudents, getStudentsByGrade, addStudent as addStudentPB, updateStudent as updateStudentPB, deleteStudent as deleteStudentPB, Student as PocketBaseStudent } from '@/lib/pocketbase-students'

// Converted student interface - for UI components
export interface Student {
  id: string
  name: string
  studentId: string
  grade: string
  gender: string
  birthDate: string
  phone: string
  email: string
  address: string
  parentName: string
  parentPhone: string
  parentEmail: string
  enrollmentDate: string
  enrollmentYear: string
  status: string
  createdAt: string
  updatedAt: string
  class: string
  fatherName: string
  motherName: string
  attendance: number
  progress: number
  age: number
  dateOfBirth: string
  emergencyContact: string
  emergencyPhone: string
  medicalInfo: string
  notes: string
  image: string
  calculatedGrade: string
  level: 'primary' | 'secondary'
  // Preserve original PocketBase fields (even if not used with mock data)
  standard: string
  student_name: string
  father_phone: string
  mother_phone: string
  home_address: string
  dob: string
}

interface UseStudentsOptions {
  dataType?: 'primary' | 'secondary' | undefined
  enableCache?: boolean
  cacheTimeout?: number
  pageSize?: number
}

// Function to convert PocketBase student to UI student format
const convertPocketBaseStudent = (pbStudent: PocketBaseStudent): Student => {
  // Calculate age from dob if available
  const calculateAge = (dob: string): number => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Extract year from created date for enrollment year
  const getEnrollmentYear = (created: string): string => {
    if (!created) return new Date().getFullYear().toString()
    return new Date(created).getFullYear().toString()
  }

  // Convert grade format (e.g., "Standard 2" -> "2", "Form 3" -> "9")
  const convertGradeFormat = (standard: string): string => {
    if (!standard) return ''
    
    // Handle "Standard X" format (Primary school)
    if (standard.toLowerCase().includes('standard')) {
      const match = standard.match(/\d+/)
      return match ? match[0] : standard
    }
    
    // Handle "Form X" format (Secondary school)
    if (standard.toLowerCase().includes('form')) {
      const match = standard.match(/\d+/)
      if (match) {
        const formNumber = parseInt(match[0])
        // Convert Form 1-5 to grades 7-11
        return (formNumber + 6).toString()
      }
      return standard
    }
    
    return standard
  }

  // Convert gender format
  const convertGender = (gender: string): string => {
    if (!gender) return '未知'
    if (gender.toLowerCase() === 'male') return '男'
    if (gender.toLowerCase() === 'female') return '女'
    return gender
  }

  return {
    id: pbStudent.id,
    name: pbStudent.student_name || '未知姓名',
    studentId: pbStudent.student_id || '',
    grade: convertGradeFormat(pbStudent.standard || ''),
    gender: convertGender(pbStudent.gender || ''),
    birthDate: pbStudent.dob || '',
    phone: pbStudent.father_phone || pbStudent.mother_phone || '',
    email: '', // PocketBase doesn't have email field
    address: pbStudent.home_address || '',
    parentName: '家长', // PocketBase doesn't have parent name field
    parentPhone: pbStudent.father_phone || pbStudent.mother_phone || '',
    parentEmail: '', // PocketBase doesn't have parent email field
    enrollmentDate: pbStudent.created || new Date().toISOString().split('T')[0],
    enrollmentYear: getEnrollmentYear(pbStudent.created),
    status: 'active', // Default to active since PocketBase doesn't have status field
    createdAt: pbStudent.created || new Date().toISOString(),
    updatedAt: pbStudent.updated || new Date().toISOString(),
    class: convertGradeFormat(pbStudent.standard || ''),
    fatherName: '父亲', // PocketBase doesn't have father name field
    motherName: '母亲', // PocketBase doesn't have mother name field
    attendance: 0, // Default value since PocketBase doesn't have attendance field
    progress: 0, // Default value since PocketBase doesn't have progress field
    age: calculateAge(pbStudent.dob || ''),
    dateOfBirth: pbStudent.dob || '',
    emergencyContact: pbStudent.father_phone || pbStudent.mother_phone || '',
    emergencyPhone: pbStudent.father_phone || pbStudent.mother_phone || '',
    medicalInfo: '', // PocketBase doesn't have medical info field
    notes: '', // PocketBase doesn't have notes field
    image: '', // PocketBase doesn't have image field
    calculatedGrade: convertGradeFormat(pbStudent.standard || ''),
    level: (pbStudent as any).level || 'primary', // Use the level field from PocketBase
    // Preserve original PocketBase fields
    standard: pbStudent.standard || '',
    student_name: pbStudent.student_name || '',
    father_phone: pbStudent.father_phone || '',
    mother_phone: pbStudent.mother_phone || '',
    home_address: pbStudent.home_address || '',
    dob: pbStudent.dob || ''
  }
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

  const cacheKey = useMemo(() => `students_${dataType}_${currentPage}`, [dataType, currentPage])
  const isCacheValid = useMemo(() => {
    if (!enableCache || !lastFetchTime) return false
    if (dataType !== lastDataType) return false
    return Date.now() - lastFetchTime < cacheTimeout
  }, [enableCache, lastFetchTime, cacheTimeout, dataType, lastDataType])

  // Real PocketBase data fetching
  const fetchStudents = useCallback(async (page: number = 1, forceRefresh: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all students from PocketBase
      const allPocketBaseStudents = await getAllStudents()
      
      // Convert to UI format
      const convertedStudents = allPocketBaseStudents.map(convertPocketBaseStudent)
      
      // Filter based on dataType
      let filteredStudents = convertedStudents
      
      if (dataType === 'primary') {
        filteredStudents = convertedStudents.filter(student => student.level === 'primary')
      } else if (dataType === 'secondary') {
        filteredStudents = convertedStudents.filter(student => student.level === 'secondary')
      }
      setStudents(filteredStudents)
      setLastFetchTime(Date.now())
      setLastDataType(dataType)
      setHasMore(false) // PocketBase returns all data at once
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取学生数据失败'
      setError(errorMessage)
      setStudents([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [dataType, pageSize])

  const getStudentsByGradeHook = useCallback(async (standard: string): Promise<Student[]> => {
    try {
      const pocketBaseStudents = await getStudentsByGrade(standard)
      return pocketBaseStudents.map(convertPocketBaseStudent)
    } catch (err) {
      throw err
    }
  }, [])

  const updateStudentHook = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      setError(null)
      
      // Convert UI updates to PocketBase format
      const pbUpdates: any = {}
      if (updates.name) pbUpdates.student_name = updates.name
      if (updates.studentId) pbUpdates.student_id = updates.studentId
      if (updates.grade) pbUpdates.standard = updates.grade
      if (updates.gender) pbUpdates.gender = updates.gender
      if (updates.birthDate) pbUpdates.dob = updates.birthDate
      if (updates.phone) pbUpdates.father_phone = updates.phone
      if (updates.address) pbUpdates.home_address = updates.address
      
      await updateStudentPB({ id: studentId, ...pbUpdates })
      
      // Update local state
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
      await deleteStudentPB(studentId)
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete student'
      setError(errorMessage)
      throw err
    }
  }, [])

  const addStudentHook = useCallback(async (studentData: Omit<Student, 'id' | 'created' | 'updated'>) => {
    try {
      setError(null)
      
      // Convert UI student data to PocketBase format
      const pbStudentData = {
        student_id: studentData.studentId || `ST${Date.now()}`,
        student_name: studentData.name,
        dob: studentData.birthDate,
        father_phone: studentData.phone,
        mother_phone: studentData.parentPhone,
        home_address: studentData.address,
        gender: studentData.gender,
        standard: studentData.grade
      }
      
      const newPocketBaseStudent = await addStudentPB(pbStudentData)
      const newStudent = convertPocketBaseStudent(newPocketBaseStudent)
      
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
      const grade = (student as any).grade || (student as any).standard || '无年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, byGrade }
  }, [students])

  useEffect(() => {
    fetchStudents(currentPage)
  }, [currentPage, dataType])

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