import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  getAllStudents, 
  getStudentsByGrade, 
  addStudent, 
  updateStudent, 
  deleteStudent, 
  searchStudents,
  getStudentStats,
  type Student,
  type StudentCreateData,
  type StudentUpdateData
} from '@/lib/pocketbase-students'

// 使用从pocketbase-students导入的Student类型，不再需要本地定义

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

  // 转换PocketBase学生数据到统一格式
  const convertPocketBaseStudent = useCallback((student: any): any => {
    // 标准化年级格式
    const normalizeGrade = (grade: string) => {
      if (!grade) return ''
      // 移除空格和特殊字符，只保留数字
      const cleanGrade = grade.toString().trim().replace(/[^\d]/g, '')
      return cleanGrade || ''
    }

    // 标准化性别格式
    const normalizeGender = (gender: string) => {
      if (!gender) return ''
      const genderLower = gender.toString().toLowerCase().trim()
      if (genderLower === 'male' || genderLower === 'm') return '男'
      if (genderLower === 'female' || genderLower === 'f') return '女'
      return gender // 如果已经是中文或其他格式，保持原样
    }

    const normalizedGrade = normalizeGrade(student.standard)
    const normalizedGender = normalizeGender(student.gender)
    
    return {
      id: student.id,
      name: student.student_name,
      studentId: student.student_id,
      grade: normalizedGrade,
      gender: normalizedGender,
      birthDate: student.dob,
      phone: student.father_phone || student.mother_phone,
      email: '', // PocketBase中没有email字段
      address: student.home_address,
      parentName: '', // PocketBase中没有parentName字段
      parentPhone: student.father_phone || student.mother_phone,
      parentEmail: '', // PocketBase中没有parentEmail字段
      enrollmentDate: student.created,
      enrollmentYear: new Date(student.created).getFullYear().toString(),
      status: 'active', // 默认状态
      createdAt: student.created,
      updatedAt: student.updated,
      // 其他字段保持为空或默认值
      class: normalizedGrade,
      fatherName: '', // PocketBase中没有fatherName字段
      motherName: '', // PocketBase中没有motherName字段
      attendance: 0,
      progress: 0,
      age: 0,
      dateOfBirth: student.dob,
      emergencyContact: student.father_phone || student.mother_phone,
      emergencyPhone: student.father_phone || student.mother_phone,
      medicalInfo: '',
      notes: '',
      image: '',
      calculatedGrade: normalizedGrade,
    }
  }, [])

  // 过滤学生数据
  const filterStudents = useCallback((students: any[]): any[] => {
    console.log('过滤前的学生数据:', students.map(s => ({ id: s.id, name: s.name, student_name: s.student_name })))
    // 暂时不过滤，直接返回所有数据
    console.log('过滤后的学生数据:', students.map(s => ({ id: s.id, name: s.name })))
    return students
  }, [])

  const fetchStudents = useCallback(async (page: number = 1, forceRefresh: boolean = false) => {
    try {
      console.log(`开始获取学生数据...`)
      console.log(`dataType: ${dataType}, forceRefresh: ${forceRefresh}`)

      setLoading(true)
      setError(null)
      
      // 使用PocketBase获取学生数据
      const allStudents = await getAllStudents()
      console.log('从PocketBase获取的学生数量:', allStudents.length)
      console.log('原始学生数据示例:', allStudents[0])
      
      // 转换PocketBase数据格式
      const convertedStudents = allStudents.map(convertPocketBaseStudent)
      console.log('转换后的学生数量:', convertedStudents.length)
      console.log('转换后学生数据示例:', convertedStudents[0])
      
      // 过滤数据
      const filteredStudents = filterStudents(convertedStudents)
      
      console.log('过滤后的学生数量:', filteredStudents.length)
      console.log('过滤后学生数据示例:', filteredStudents[0])
      setStudents(filteredStudents)
      setLastFetchTime(Date.now())
      setLastDataType(dataType)
      setHasMore(filteredStudents.length >= pageSize)
      
    } catch (err) {
      console.error('获取学生数据失败:', err)
      console.error('错误详情:', {
        message: err instanceof Error ? err.message : '未知错误',
        stack: err instanceof Error ? err.stack : '无堆栈跟踪',
        type: typeof err
      })
      
      const errorMessage = err instanceof Error ? err.message : '获取学生数据失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [dataType, pageSize, convertPocketBaseStudent, filterStudents])

  const getStudentsByGradeHook = useCallback(async (standard: string): Promise<any[]> => {
    try {
      const students = await getStudentsByGrade(standard)
      return students.map(convertPocketBaseStudent)
    } catch (err) {
      console.error('Error fetching students by grade:', err)
      throw err
    }
  }, [convertPocketBaseStudent])

  const updateStudentHook = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      setError(null)
      await updateStudent({ id: studentId, ...updates })
      
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
  }, [])

  const deleteStudentHook = useCallback(async (studentId: string) => {
    try {
      setError(null)
      await deleteStudent(studentId)
      
      // 更新本地状态
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId))
    } catch (err) {
      console.error('Error deleting student:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete student'
      setError(errorMessage)
      throw err
    }
  }, [])

  const addStudentHook = useCallback(async (studentData: Omit<Student, 'id' | 'created' | 'updated'>) => {
    try {
      setError(null)
      const newStudent = await addStudent(studentData as StudentCreateData)
      
      // 添加到本地状态
      setStudents(prevStudents => [...prevStudents, newStudent])
    } catch (err) {
      console.error('Error adding student:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add student'
      setError(errorMessage)
      throw err
    }
  }, [])

  const getImportStats = useCallback(async () => {
    try {
      return await getStudentStats()
    } catch (err) {
      console.error('Error getting import stats:', err)
      throw err
    }
  }, [])

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
      const grade = student.grade || '无年级'
      acc[grade] = (acc[grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return { total, byGrade }
  }, [students])

  useEffect(() => {
    console.log('useEffect触发，开始获取数据...')
    console.log('依赖项:', { currentPage, dataType })
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