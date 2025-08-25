import { useState, useEffect, useCallback } from 'react'
import { 
  Student, 
  getAllStudents, 
  addStudent, 
  updateStudent, 
  deleteStudent, 
  searchStudents,
  getStudentStats
} from '@/lib/pocketbase-students'

export const useStudentCards = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalStudents: 0,
    primaryStudents: 0,
    secondaryStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    lostStudents: 0,
    graduatedStudents: 0,
    totalBalance: 0,
    totalUsageCount: 0
  })

  // 获取所有学生
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 使用服务器端 API 获取数据
      const response = await fetch('/api/student-cards/list')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '获取学生失败')
      }
      
      setStudents(result.cards)
      console.log(`成功获取 ${result.count} 个学生`)
    } catch (err) {
      console.error('获取学生失败:', err)
      setError(err instanceof Error ? err.message : '获取学生失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 根据级别获取学生
  const fetchStudentsByLevel = useCallback(async (level: 'primary' | 'secondary') => {
    try {
      setLoading(true)
      setError(null)
      const fetchedStudents = await getAllStudents()
      const filteredStudents = fetchedStudents.filter(student => student.level === level)
      setStudents(filteredStudents)
    } catch (err) {
      console.error('根据级别获取学生失败:', err)
      setError(err instanceof Error ? err.message : '获取学生失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 搜索学生
  const searchStudentsData = useCallback(async (query: string) => {
    try {
      setLoading(true)
      setError(null)
      const searchResults = await searchStudents(query)
      setStudents(searchResults)
    } catch (err) {
      console.error('搜索学生失败:', err)
      setError(err instanceof Error ? err.message : '搜索失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 获取统计信息
  const fetchStats = useCallback(async () => {
    try {
      const fetchedStats = await getStudentStats()
      setStats({
        totalStudents: fetchedStats.total,
        primaryStudents: 0, // Will be calculated from students data
        secondaryStudents: 0, // Will be calculated from students data
        activeStudents: 0, // Will be calculated from students data
        inactiveStudents: 0, // Will be calculated from students data
        lostStudents: 0, // Will be calculated from students data
        graduatedStudents: 0, // Will be calculated from students data
        totalBalance: 0, // Will be calculated from students data
        totalUsageCount: 0 // Will be calculated from students data
      })
    } catch (err) {
      console.error('获取统计信息失败:', err)
      setError(err instanceof Error ? err.message : '获取统计信息失败')
    }
  }, [])

  // 添加学生
  const addStudentData = useCallback(async (studentData: any) => {
    try {
      setLoading(true)
      setError(null)
      const newStudent = await addStudent(studentData)
      setStudents(prev => [newStudent, ...prev])
      await fetchStats()
      return newStudent
    } catch (err) {
      console.error('添加学生失败:', err)
      setError(err instanceof Error ? err.message : '添加失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 批量导入学生
  const batchImportStudents = useCallback(async (studentsData: any[]) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('开始批量导入学生...')
      
      // 使用简化的服务器端 API 进行批量创建
      const response = await fetch('/api/student-cards/batch-create-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cards: studentsData })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '批量创建失败')
      }
      
      if (result.failed > 0) {
        console.warn(`批量导入完成，但有 ${result.failed} 个记录失败:`, result.errors)
      }
      
      // 更新本地状态
      setStudents(prev => [...result.cards, ...prev])
      await fetchStats()
      
      console.log(`成功导入 ${result.created} 个学生`)
      return result.cards
    } catch (err) {
      console.error('批量导入学生失败:', err)
      setError(err instanceof Error ? err.message : '批量导入失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 更新学生
  const updateStudentData = useCallback(async (id: string, updates: Partial<Student>) => {
    try {
      setLoading(true)
      setError(null)
      const updatedStudent = await updateStudent({ id, ...updates })
      setStudents(prev => prev.map(student => 
        student.id === id ? updatedStudent : student
      ))
      await fetchStats()
      return updatedStudent
    } catch (err) {
      console.error('更新学生失败:', err)
      setError(err instanceof Error ? err.message : '更新失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 删除学生
  const removeStudent = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await deleteStudent(id)
      setStudents(prev => prev.filter(student => student.id !== id))
      await fetchStats()
    } catch (err) {
      console.error('删除学生失败:', err)
      setError(err instanceof Error ? err.message : '删除失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchStats])

  // 访问学生网址
  const accessStudentUrl = useCallback(async (studentId: string, level: 'primary' | 'secondary') => {
    try {
      const student = students.find(s => s.student_id === studentId && s.level === level)
      if (!student) {
        throw new Error('学生不存在')
      }

      return {
        success: true,
        url: student.studentUrl,
        studentName: student.student_name,
        studentId: student.student_id
      }
    } catch (err) {
      console.error('访问学生网址失败:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : '访问失败'
      }
    }
  }, [students])

  // 初始化数据
  useEffect(() => {
    fetchStudents()
    fetchStats()
  }, [fetchStudents, fetchStats])

  return {
    cards: students, // Keep for backward compatibility
    students, // New property
    loading,
    error,
    stats,
    fetchCards: fetchStudents, // Keep for backward compatibility
    fetchStudents, // New function
    fetchCardsByLevel: fetchStudentsByLevel, // Keep for backward compatibility
    fetchStudentsByLevel, // New function
    searchCards: searchStudentsData, // Keep for backward compatibility
    searchStudents: searchStudentsData, // New function
    addCard: addStudentData, // Keep for backward compatibility
    addStudent: addStudentData, // New function
    batchImportCards: batchImportStudents, // Keep for backward compatibility
    batchImportStudents, // New function
    updateCard: updateStudentData, // Keep for backward compatibility
    updateStudent: updateStudentData, // New function
    removeCard: removeStudent, // Keep for backward compatibility
    removeStudent, // New function
    accessStudentUrl,
    fetchStats
  }
}
