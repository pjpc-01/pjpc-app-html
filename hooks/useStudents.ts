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
}

export const useStudents = (dataType: 'primary' | 'secondary' = 'primary') => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Fetching students for dataType: ${dataType}`)
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firebase connection timeout')), 10000) // 10 second timeout
      })
      
             const firestoreImport = new FirestoreImport(dataType)
       const firestorePromise = firestoreImport.getAllStudents()
      
             const firestoreStudents = await Promise.race([firestorePromise, timeoutPromise]) as any[]
       
       console.log('Raw Firebase students:', firestoreStudents)
       
       // Convert FirestoreStudent to Student interface - preserve all Firebase fields
       const convertedStudents: Student[] = firestoreStudents.map(student => {
         console.log('Processing student:', { 
           firebaseId: student.id, 
           name: student.name,
           hasId: !!student.id,
           idType: typeof student.id,
           allFields: Object.keys(student)
         })
         return {
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
         }
       })
       
       // Filter out students with names starting with "Student" (empty placeholders)
       const filteredStudents = convertedStudents.filter(student => 
         !student.name?.startsWith("Student") && student.name?.trim() !== ""
       )
       
       console.log('Filtered students:', filteredStudents.map(s => ({ id: s.id, name: s.name })))
       setStudents(filteredStudents)
         } catch (err) {
       console.error('Error fetching students:', err)
       console.error('Error details:', {
         message: err instanceof Error ? err.message : 'Unknown error',
         stack: err instanceof Error ? err.stack : 'No stack trace',
         type: typeof err
       })
       setError(err instanceof Error ? err.message : 'Failed to fetch students')
       
       // Fallback to static data if Firestore fails
       setStudents([
         { id: "G16", name: "王小明", grade: "三年级", parentName: "王大明", parentEmail: "wang@example.com" },
         { id: "G17", name: "李小红", grade: "四年级", parentName: "李大红", parentEmail: "li@example.com" },
         { id: "G18", name: "张小华", grade: "五年级", parentName: "张大华", parentEmail: "zhang@example.com" },
         { id: "G19", name: "陈小军", grade: "三年级", parentName: "陈大军", parentEmail: "chen@example.com" },
       ])
    } finally {
      setLoading(false)
    }
  }

  const getStudentsByGrade = async (grade: string): Promise<Student[]> => {
    try {
           const firestoreImport = new FirestoreImport(dataType)
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
       }))
    } catch (err) {
      console.error('Error fetching students by grade:', err)
      throw err
    }
  }

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    try {
           const firestoreImport = new FirestoreImport(dataType)
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
           const firestoreImport = new FirestoreImport(dataType)
     await firestoreImport.deleteStudent(studentId)
      
      // Refresh the students list
      await fetchStudents()
    } catch (err) {
      console.error('Error deleting student:', err)
      throw err
    }
  }

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
           const firestoreImport = new FirestoreImport(dataType)
     await firestoreImport.addStudent(studentData)
      
      // Refresh the students list
      await fetchStudents()
    } catch (err) {
      console.error('Error adding student:', err)
      throw err
    }
  }

  const getImportStats = async () => {
    try {
           const firestoreImport = new FirestoreImport(dataType)
     return await firestoreImport.getImportStats()
    } catch (err) {
      console.error('Error getting import stats:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [dataType]) // 当dataType改变时重新获取数据

  return { 
    students, 
    loading, 
    error, 
    refetch: fetchStudents,
    getStudentsByGrade,
    updateStudent,
    deleteStudent,
    addStudent,
    getImportStats
  }
} 