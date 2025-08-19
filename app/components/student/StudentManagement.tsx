"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Search, Edit, Users, Trash2, Download, Upload } from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { Student } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"
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
  const { students, loading, error, refetch, addStudent, updateStudent, deleteStudent } = useStudents()
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [selectedCenter, setSelectedCenter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)

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

  // 智能筛选学生
  const filteredStudents = useMemo(() => {
    let filtered = students

    // 搜索筛选
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(student => 
        student.student_name?.toLowerCase().includes(lowerSearchTerm) ||
        student.student_id?.toLowerCase().includes(lowerSearchTerm) ||
        student.standard?.toLowerCase().includes(lowerSearchTerm) ||
        student.parentName?.toLowerCase().includes(lowerSearchTerm) ||
        student.email?.toLowerCase().includes(lowerSearchTerm) ||
        student.status?.toLowerCase().includes(lowerSearchTerm)
      )
    }

    // 年级筛选
    if (selectedGrade && selectedGrade !== "all") {
      filtered = filtered.filter(student => student.standard === selectedGrade)
    }

    // 状态筛选
    if (selectedCenter && selectedCenter !== "all") {
      filtered = filtered.filter(student => student.status === selectedCenter)
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.student_name || ''
          bValue = b.student_name || ''
          break
        case 'studentId':
          aValue = a.student_id || ''
          bValue = b.student_id || ''
          break
        case 'grade':
          aValue = a.standard || ''
          bValue = b.standard || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'parentName':
          aValue = a.parentName || ''
          bValue = b.parentName || ''
          break
        default:
          aValue = a.student_name || ''
          bValue = b.student_name || ''
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [students, searchTerm, selectedGrade, selectedCenter, sortBy, sortOrder])

  // 分页逻辑
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, currentPage, pageSize])

  const totalPages = Math.ceil(filteredStudents.length / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // 分页处理函数
  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedGrade, selectedCenter, sortBy, sortOrder])

  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
      console.log('StudentManagement 接收到的数据:', studentData)
      // 直接传递UI格式的数据给addStudent hook
      await addStudent(studentData)
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
          onFiltersChange={(filters) => {
            setSearchTerm(filters.searchTerm)
            setSelectedGrade(filters.selectedGrade)
            setSelectedCenter(filters.selectedCenter)
            setSortBy(filters.sortBy)
            setSortOrder(filters.sortOrder)
          }}
        />
      </div>

      {/* Statistics */}
      <div>
        <StudentStats students={filteredStudents} totalStudents={students.length} />
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

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)} 条，
            共 {filteredStudents.length} 条记录
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
            >
              上一页
            </Button>
            
            {/* 页码显示 */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNextPage}
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
      {viewingStudent && (
        <StudentDetails
          student={viewingStudent}
          onOpenChange={(open: boolean) => {
            if (!open) setViewingStudent(null)
          }}
          onEdit={() => {
            setViewingStudent(null)
            setEditingStudent(viewingStudent)
          }}
          onDelete={() => {
            if (viewingStudent) {
              handleDeleteStudent(viewingStudent.id)
              setViewingStudent(null)
            }
          }}
        />
      )}
    </div>
  )
} 