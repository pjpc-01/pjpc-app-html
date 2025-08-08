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

export default function PrimaryStudentManagement() {
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents({ dataType: 'primary' })
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const studentsPerPage = 10

  // Filter students based on search and grade, and exclude students without names
  const filteredStudents = students.filter(student => {
    // 排除没有姓名的学生
    if (!student.name || student.name.trim() === '') {
      return false
    }
    
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.grade?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = !selectedGrade || student.grade === selectedGrade
    return matchesSearch && matchesGrade
  })

  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
      // Convert form data to PocketBase format
      const studentToAdd = {
        student_name: studentData.name || '',
        student_id: `STU${Date.now()}`, // Generate a unique student ID
        standard: studentData.grade || '',
        gender: studentData.gender || '',
        dob: studentData.birthDate || '',
        father_phone: studentData.parentPhone || '',
        mother_phone: studentData.parentPhone || '',
        home_address: studentData.address || '',
        register_form_url: '',
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

  // 分页逻辑
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)
  const startIndex = (currentPage - 1) * studentsPerPage
  const endIndex = startIndex + studentsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // 当搜索条件改变时，重置到第一页
  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm)
    setCurrentPage(1)
  }

  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade)
    setCurrentPage(1)
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-600">小学生管理</h3>
          <p className="text-sm text-gray-600">管理小学学生信息和学习进度</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          添加小学生
        </Button>
      </div>

      {/* Filters */}
      <div>
        <StudentFilters
          searchTerm={searchTerm}
          setSearchTerm={handleSearchChange}
          selectedGrade={selectedGrade}
          setSelectedGrade={handleGradeChange}
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
          students={paginatedStudents}
          loading={loading}
          selectedStudents={selectedStudents}
          onSelectStudent={handleSelectStudent}
          onSelectAll={handleSelectAll}
          onEditStudent={setEditingStudent}
          onViewStudent={setViewingStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示第 {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)} 条，共 {filteredStudents.length} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="text-sm text-gray-600">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

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
