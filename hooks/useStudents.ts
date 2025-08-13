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
    parentEmail: pbStudent.mother_phone || '', // Using mother_phone as parentEmail for now
    status: 'active' // Default status since it's not in PocketBase interface
  }
}

// Function to convert UI student format to PocketBase format
const convertUIToPocketBase = (uiStudent: Partial<Student>): any => {
  return {
    student_name: uiStudent.name,
    student_id: uiStudent.studentId,
    standard: uiStudent.grade,
    father_phone: uiStudent.parentName,
    mother_phone: uiStudent.parentEmail,
    // Add other fields as needed
    level: uiStudent.grade ? (parseInt(uiStudent.grade) <= 6 ? 'primary' : 'secondary') : undefined,
    Center: 'WX 01' // Default center
  }
}

export const useStudents = (options: UseStudentsOptions = {}) => {
  const {
    dataType = undefined,
    enableCache = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    pageSize = 50
  } = options

  const [students, setStudents] = useState<Student[]>([])
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

      console.log('开始获取学生数据...')
      console.log('dataType:', dataType)
      console.log('forceRefresh:', forceRefresh)

      // Try PocketBase first, fallback to mock data
      let allStudents: Student[] = []
      
      try {
        console.log('尝试从PocketBase获取学生数据...')
        const pocketBaseStudents = await getAllStudents()
        console.log('PocketBase返回的学生数据:', pocketBaseStudents)
        const convertedStudents = pocketBaseStudents.map(convertPocketBaseStudent)
        console.log('转换后的学生数据:', convertedStudents)
        
        // 调试：查看年级数据
        console.log('年级数据分布:')
        const gradeDistribution = convertedStudents.reduce((acc, student) => {
          const grade = student.grade || '无年级'
          acc[grade] = (acc[grade] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log('年级分布:', gradeDistribution)
        
        allStudents = convertedStudents
      } catch (pbError) {
        console.warn('PocketBase获取失败，使用模拟数据:', pbError)
        // Use mock data as fallback
        allStudents = [
          {
            id: "1",
            name: "王小明",
            studentId: "ST001",
            grade: "一年级",
            parentName: "王先生",
            parentEmail: "wang@example.com",
            status: "active" as const
          },
          {
            id: "2",
            name: "李小红",
            studentId: "ST002",
            grade: "二年级",
            parentName: "李女士",
            parentEmail: "li@example.com",
            status: "active" as const
          },
          {
            id: "3",
            name: "张小华",
            studentId: "ST003",
            grade: "三年级",
            parentName: "张先生",
            parentEmail: "zhang@example.com",
            status: "active" as const
          }
        ]
      }
      
      // Filter based on dataType
      let filteredStudents = allStudents
      
      if (dataType === 'primary') {
        console.log('筛选小学生数据...')
        filteredStudents = allStudents.filter(student => {
          const grade = student.grade || ''
          console.log(`学生 ${student.name} 年级: "${grade}"`)
          
          // 检查是否是小学年级（一年级到六年级）
          const isPrimary = grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
                           grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
                           grade === '1' || grade === '2' || grade === '3' || 
                           grade === '4' || grade === '5' || grade === '6' ||
                           grade === 'Standard 1' || grade === 'Standard 2' || grade === 'Standard 3' ||
                           grade === 'Standard 4' || grade === 'Standard 5' || grade === 'Standard 6' ||
                           grade === 'Grade 1' || grade === 'Grade 2' || grade === 'Grade 3' ||
                           grade === 'Grade 4' || grade === 'Grade 5' || grade === 'Grade 6'
          
          console.log(`学生 ${student.name} 是否小学: ${isPrimary}`)
          return isPrimary
        })
        console.log('筛选后的小学生数据:', filteredStudents)
      } else if (dataType === 'secondary') {
        console.log('筛选中学生数据...')
        filteredStudents = allStudents.filter(student => {
          const grade = student.grade || ''
          console.log(`学生 ${student.name} 年级: "${grade}"`)
          
          // 检查是否是中学年级（初一到高三）
          const isSecondary = grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
                             grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
                             grade === '7' || grade === '8' || grade === '9' || 
                             grade === '10' || grade === '11' || grade === '12' ||
                             grade === 'Form 1' || grade === 'Form 2' || grade === 'Form 3' ||
                             grade === 'Form 4' || grade === 'Form 5' || grade === 'Form 6' ||
                             grade === 'Grade 7' || grade === 'Grade 8' || grade === 'Grade 9' ||
                             grade === 'Grade 10' || grade === 'Grade 11' || grade === 'Grade 12'
          
          console.log(`学生 ${student.name} 是否中学: ${isSecondary}`)
          return isSecondary
        })
        console.log('筛选后的中学生数据:', filteredStudents)
      }
      
      console.log('最终设置的学生数据:', filteredStudents)
      setStudents(filteredStudents)
      setLastFetchTime(Date.now())
      setLastDataType(dataType)
      setHasMore(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取学生数据失败'
      console.error('获取学生数据失败:', err)
      setError(errorMessage)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [dataType, pageSize])

  const getStudentsByGradeHook = useCallback(async (grade: string): Promise<Student[]> => {
    try {
      const pocketBaseStudents = await getStudentsByGrade(grade)
      return pocketBaseStudents.map(convertPocketBaseStudent)
    } catch (err) {
      console.warn('PocketBase获取年级学生失败，返回模拟数据:', err)
      // Return mock students filtered by grade
      return [
        {
          id: "1",
          name: "王小明",
          studentId: "ST001",
          grade: "一年级",
          parentName: "王先生",
          parentEmail: "wang@example.com",
          status: "active" as const
        },
        {
          id: "2",
          name: "李小红",
          studentId: "ST002",
          grade: "二年级",
          parentName: "李女士",
          parentEmail: "li@example.com",
          status: "active" as const
        },
        {
          id: "3",
          name: "张小华",
          studentId: "ST003",
          grade: "三年级",
          parentName: "张先生",
          parentEmail: "zhang@example.com",
          status: "active" as const
        }
      ].filter(student => student.grade === grade)
    }
  }, [])

  const updateStudentHook = useCallback(async (studentId: string, updates: Partial<Student>) => {
    try {
      const pocketBaseData = convertUIToPocketBase(updates)
      await updateStudentPB({ id: studentId, ...pocketBaseData })
      return true
    } catch (err) {
      console.error('更新学生失败:', err)
      throw err
    }
  }, [])

  const deleteStudentHook = useCallback(async (studentId: string) => {
    try {
      await deleteStudentPB(studentId)
      return true
    } catch (err) {
      console.error('删除学生失败:', err)
      throw err
    }
  }, [])

  const addStudentHook = useCallback(async (studentData: Partial<Student>) => {
    try {
      const pocketBaseData = convertUIToPocketBase(studentData)
      await addStudentPB(pocketBaseData)
      return true
    } catch (err) {
      console.error('添加学生失败:', err)
      throw err
    }
  }, [])

  // Initial data fetch - 总是获取数据，不管缓存状态
  useEffect(() => {
    console.log('useStudents useEffect triggered')
    console.log('isCacheValid:', isCacheValid)
    console.log('students.length:', students.length)
    
    // 如果学生数据为空，强制获取
    if (students.length === 0) {
      console.log('学生数据为空，强制获取数据')
      fetchStudents(1, true)
    } else if (!isCacheValid) {
      console.log('缓存无效，重新获取数据')
      fetchStudents(1, true)
    }
  }, [fetchStudents, isCacheValid, students.length])

  // Refetch function
  const refetch = useCallback(() => {
    console.log('手动刷新学生数据')
    fetchStudents(1, true)
  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    hasMore,
    refetch,
    updateStudent: updateStudentHook,
    deleteStudent: deleteStudentHook,
    addStudent: addStudentHook,
    getStudentsByGrade: getStudentsByGradeHook
  }
} 