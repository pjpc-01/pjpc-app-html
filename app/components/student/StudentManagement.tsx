"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Search, Edit, Users, Trash2, Download, Upload } from "lucide-react"
import { useStudents, Student } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/enhanced-auth-context"
import StudentList from "./StudentList"
import StudentForm from "./StudentForm"
import StudentDetails from "./StudentDetails"
import StudentBulkActions from "./StudentBulkActions"
import StudentFilters from "./StudentFilters"
import StudentStats from "./StudentStats"

interface StudentManagementProps {
  dataType?: 'primary' | 'secondary'
  showHeader?: boolean
  title?: string
  description?: string
  buttonText?: string
  buttonColor?: 'blue' | 'green' | 'default'
}

export default function StudentManagement({
  dataType,
  showHeader = true,
  title,
  description,
  buttonText,
  buttonColor = 'default'
}: StudentManagementProps) {
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents({ dataType })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)

  // Default values based on dataType
  const defaultTitle = dataType === 'primary' ? '小学生管理' : 
                      dataType === 'secondary' ? '中学生管理' : '学生管理'
  const defaultDescription = dataType === 'primary' ? '管理小学学生信息和学习进度' :
                           dataType === 'secondary' ? '管理中学学生信息和学习进度' : '管理学生信息和学习进度'
  const defaultButtonText = dataType === 'primary' ? '添加小学生' :
                           dataType === 'secondary' ? '添加中学生' : '添加学生'
  const defaultButtonColor = dataType === 'primary' ? 'blue' :
                            dataType === 'secondary' ? 'green' : 'default'

  const finalTitle = title || defaultTitle
  const finalDescription = description || defaultDescription
  const finalButtonText = buttonText || defaultButtonText
  const finalButtonColor = buttonColor === 'default' ? defaultButtonColor : buttonColor

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

  const getButtonColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'green':
        return 'bg-green-600 hover:bg-green-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  const getTitleColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600'
      case 'green':
        return 'text-green-600'
      default:
        return 'text-gray-600'
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
      {/* Header with Add Button */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${getTitleColorClass(finalButtonColor)}`}>
              {finalTitle}
            </h3>
            <p className="text-sm text-gray-600">{finalDescription}</p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className={getButtonColorClass(finalButtonColor)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {finalButtonText}
          </Button>
        </div>
      )}

      {/* Filters */}
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