import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import { StudentData } from './google-sheets'

export interface FirestoreStudent extends StudentData {
  createdAt: Timestamp
  updatedAt: Timestamp
  importedFrom: string
}

export class FirestoreImport {
  private readonly COLLECTION_NAME = 'students'

  // Import students to Firestore
  async importStudents(students: StudentData[], source: string = 'google-sheets'): Promise<{ success: number; errors: string[] }> {
    const batch = writeBatch(db)
    const errors: string[] = []
    let successCount = 0

    try {
      // First, clear existing imported data
      await this.clearImportedData(source)

      // Add students to batch
      students.forEach((student, index) => {
        try {
          const docRef = doc(collection(db, this.COLLECTION_NAME))
          const firestoreStudent: FirestoreStudent = {
            ...student,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            importedFrom: source,
          }
          
          batch.set(docRef, firestoreStudent)
          successCount++
        } catch (error) {
          errors.push(`Error processing student ${student.name}: ${error}`)
        }
      })

      // Commit the batch
      await batch.commit()
      
      console.log(`Successfully imported ${successCount} students to Firestore`)
      return { success: successCount, errors }
    } catch (error) {
      console.error('Error importing students to Firestore:', error)
      throw error
    }
  }

  // Clear existing imported data
  async clearImportedData(source: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('importedFrom', '==', source)
      )
      
      const querySnapshot = await getDocs(q)
      const batch = writeBatch(db)
      
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, this.COLLECTION_NAME, document.id))
      })
      
      await batch.commit()
      console.log(`Cleared ${querySnapshot.size} existing records from ${source}`)
    } catch (error) {
      console.error('Error clearing existing data:', error)
      throw error
    }
  }

  // Get all students from Firestore
  async getAllStudents(): Promise<FirestoreStudent[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTION_NAME))
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as FirestoreStudent[]
    } catch (error) {
      console.error('Error fetching students from Firestore:', error)
      throw error
    }
  }

  // Get students by grade
  async getStudentsByGrade(grade: string): Promise<FirestoreStudent[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('grade', '==', grade)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as FirestoreStudent[]
    } catch (error) {
      console.error('Error fetching students by grade:', error)
      throw error
    }
  }

  // Update a single student
  async updateStudent(studentId: string, updates: Partial<FirestoreStudent>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, studentId)
      await setDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      }, { merge: true })
    } catch (error) {
      console.error('Error updating student:', error)
      throw error
    }
  }

  // Delete a student
  async deleteStudent(studentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, studentId))
    } catch (error) {
      console.error('Error deleting student:', error)
      throw error
    }
  }

  // Get import statistics
  async getImportStats(): Promise<{ total: number; byGrade: Record<string, number> }> {
    try {
      const students = await this.getAllStudents()
      const byGrade: Record<string, number> = {}
      
      students.forEach(student => {
        if (student.grade) {
          byGrade[student.grade] = (byGrade[student.grade] || 0) + 1
        }
      })
      
      return {
        total: students.length,
        byGrade
      }
    } catch (error) {
      console.error('Error getting import stats:', error)
      return {
        total: 0,
        byGrade: {}
      }
    }
  }
} 