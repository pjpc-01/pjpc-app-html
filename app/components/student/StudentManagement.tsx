"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Search, Edit, Users, Trash2, Download, Upload } from "lucide-react"
import { useStudents, Student } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import StudentList from "./StudentList"
import StudentForm from "./StudentForm"
import StudentDetails from "./StudentDetails"
import StudentBulkActions from "./StudentBulkActions"
import StudentFilters from "./StudentFilters"
import StudentStats from "./StudentStats"

export default function StudentManagement() {
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents({})
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)

  // Filter students based on search and grade
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.grade?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = !selectedGrade || student.grade === selectedGrade
    return matchesSearch && matchesGrade
  })

  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
      // Ensure required fields are present
      const studentToAdd = {
        name: studentData.name || '',
        grade: studentData.grade || '',
        parentName: studentData.parentName || '',
        parentEmail: studentData.parentEmail || '',
        ...studentData
      }
      await addStudent(studentToAdd)
      setIsAddDialogOpen(false)
      refetch()
    } catch (error) {
      console.error("Error adding student:", error)
    }
  }

  const handleUpdateStudent = async (studentData: Partial<Student>) => {
    if (!editingStudent) return
    try {
      await updateStudent(editingStudent.id, studentData)
      setEditingStudent(null)
      refetch()
    } catch (error) {
      console.error("Error updating student:", error)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId)
      refetch()
    } catch (error) {
      console.error("Error deleting student:", error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const studentId of selectedStudents) {
        await deleteStudent(studentId)
      }
      setSelectedStudents([])
      refetch()
    } catch (error) {
      console.error("Error bulk deleting students:", error)
    }
  }

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId])
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(student => student.id))
    } else {
      setSelectedStudents([])
    }
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading students: {error}</p>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Type Selector */}
      <div>
        <StudentFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          students={students}
        />
      </div>

      {/* Statistics */}
      <div>
        <StudentStats students={filteredStudents} />
      </div>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <div>
          <StudentBulkActions
            selectedCount={selectedStudents.length}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedStudents([])}
          />
        </div>
      )}

      {/* Student List */}
      <div>
        <StudentList
          students={filteredStudents}
          loading={loading}
          selectedStudents={selectedStudents}
          onSelectStudent={handleSelectStudent}
          onSelectAll={handleSelectAll}
          onEditStudent={setEditingStudent}
          onViewStudent={setViewingStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      </div>

      {/* Add/Edit Student Dialog */}
      <StudentForm
        open={isAddDialogOpen || !!editingStudent}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingStudent(null)
          }
        }}
        student={editingStudent}
        onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
      />

      {/* Student Details Dialog */}
      <StudentDetails
        student={viewingStudent}
        onOpenChange={(open: boolean) => {
          if (!open) setViewingStudent(null)
        }}
        onEdit={(student: Student) => {
          setViewingStudent(null)
          setEditingStudent(student)
        }}
        onDelete={handleDeleteStudent}
      />
    </div>
  )
} 