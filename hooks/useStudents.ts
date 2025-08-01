import { useState, useEffect } from 'react'
import { FirestoreImport, FirestoreStudent } from '@/lib/firestore-import'

export interface Student {
  id: string
  name: string
  grade: string
  parentName: string
  parentEmail: string
  phone?: string
  address?: string
  enrollmentDate?: string
  status?: string
  createdAt?: Date
  updatedAt?: Date
}

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const firestoreImport = new FirestoreImport()
      const firestoreStudents = await firestoreImport.getAllStudents()
      
      // Convert FirestoreStudent to Student interface
      const convertedStudents: Student[] = firestoreStudents.map(student => ({
        id: student.id,
        name: student.name,
        grade: student.grade,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        phone: student.phone,
        address: student.address,
        enrollmentDate: student.enrollmentDate,
        status: student.status,
        createdAt: student.createdAt?.toDate(),
        updatedAt: student.updatedAt?.toDate(),
      }))
      
      setStudents(convertedStudents)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
      
      // Fallback to static data if Firestore fails
      setStudents([
        { id: "1", name: "王小明", grade: "三年级", parentName: "王大明", parentEmail: "wang@example.com" },
        { id: "2", name: "李小红", grade: "四年级", parentName: "李大红", parentEmail: "li@example.com" },
        { id: "3", name: "张小华", grade: "五年级", parentName: "张大华", parentEmail: "zhang@example.com" },
        { id: "4", name: "陈小军", grade: "三年级", parentName: "陈大军", parentEmail: "chen@example.com" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStudentsByGrade = async (grade: string): Promise<Student[]> => {
    try {
      const firestoreImport = new FirestoreImport()
      const firestoreStudents = await firestoreImport.getStudentsByGrade(grade)
      
      return firestoreStudents.map(student => ({
        id: student.id,
        name: student.name,
        grade: student.grade,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        phone: student.phone,
        address: student.address,
        enrollmentDate: student.enrollmentDate,
        status: student.status,
        createdAt: student.createdAt?.toDate(),
        updatedAt: student.updatedAt?.toDate(),
      }))
    } catch (err) {
      console.error('Error fetching students by grade:', err)
      throw err
    }
  }

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
      const firestoreImport = new FirestoreImport()
      await firestoreImport.updateStudent(studentId, updates)
      
      // Refresh the students list
      await fetchStudents()
    } catch (err) {
      console.error('Error updating student:', err)
      throw err
    }
  }

  const deleteStudent = async (studentId: string) => {
    try {
      const firestoreImport = new FirestoreImport()
      await firestoreImport.deleteStudent(studentId)
      
      // Refresh the students list
      await fetchStudents()
    } catch (err) {
      console.error('Error deleting student:', err)
      throw err
    }
  }

  const getImportStats = async () => {
    try {
      const firestoreImport = new FirestoreImport()
      return await firestoreImport.getImportStats()
    } catch (err) {
      console.error('Error getting import stats:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return { 
    students, 
    loading, 
    error, 
    refetch: fetchStudents,
    getStudentsByGrade,
    updateStudent,
    deleteStudent,
    getImportStats
  }
} 