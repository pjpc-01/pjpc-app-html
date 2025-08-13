"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StudentManagement from "../student/StudentManagement"
import StudentList from "../student/StudentList"
import StudentForm from "../student/StudentForm"
import StudentStats from "../student/StudentStats"
import StudentFilters from "../student/StudentFilters"
import StudentBulkActions from "../student/StudentBulkActions"
import StudentDetails from "../student/StudentDetails"
import { useStudents } from "@/hooks/useStudents"
import { Student } from "@/hooks/useStudents"

export default function StudentManagementPage() {
  // 不传递dataType参数，显示所有学生
  const { students, loading, error, refetch, updateStudent, deleteStudent, addStudent } = useStudents()
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedCenter, setSelectedCenter] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  
  // 筛选学生数据
  const filteredStudents = students.filter(student => {
    // 搜索筛选
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      if (!student.name?.toLowerCase().includes(lowerSearchTerm) &&
          !student.studentId?.toLowerCase().includes(lowerSearchTerm) &&
          !student.grade?.toLowerCase().includes(lowerSearchTerm) &&
          !student.parentName?.toLowerCase().includes(lowerSearchTerm) &&
          !student.parentEmail?.toLowerCase().includes(lowerSearchTerm) &&
          !student.status?.toLowerCase().includes(lowerSearchTerm)) {
        return false
      }
    }

    // 年级筛选
    if (selectedGrade && student.grade !== selectedGrade) {
      return false
    }

    // 状态筛选
    if (selectedCenter && student.status !== selectedCenter) {
      return false
    }

    return true
  })

  // 排序
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'name':
        aValue = a.name || ''
        bValue = b.name || ''
        break
      case 'studentId':
        aValue = a.studentId || ''
        bValue = b.studentId || ''
        break
      case 'grade':
        aValue = a.grade || ''
        bValue = b.grade || ''
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
        aValue = a.name || ''
        bValue = b.name || ''
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
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
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">学生管理系统</h2>
          <p className="text-gray-600">管理学生档案、班级分组、出勤记录和学习进度</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              错误: {error}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && <div className="text-sm text-gray-500">加载中...</div>}
          <button 
            onClick={() => refetch()} 
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            刷新数据
          </button>
        </div>
      </div>

      {/* 显示学生统计信息 */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">总学生数</h3>
            <p className="text-2xl font-bold text-blue-600">{students.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">筛选结果</h3>
            <p className="text-2xl font-bold text-green-600">{filteredStudents.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">已选择</h3>
            <p className="text-2xl font-bold text-yellow-600">{selectedStudents.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">状态</h3>
            <p className="text-sm font-medium text-purple-600">
              {loading ? '加载中...' : error ? '错误' : '正常'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">学生概览</TabsTrigger>
          <TabsTrigger value="list">学生列表</TabsTrigger>
          <TabsTrigger value="add">添加学生</TabsTrigger>
          <TabsTrigger value="bulk">批量操作</TabsTrigger>
          <TabsTrigger value="filters">筛选管理</TabsTrigger>
          <TabsTrigger value="stats">统计报表</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <StudentManagement />
        </TabsContent>

        <TabsContent value="list">
          <StudentList 
            students={sortedStudents}
            loading={loading}
            selectedStudents={selectedStudents}
            onSelectStudent={handleSelectStudent}
            onSelectAll={handleSelectAll}
            onEditStudent={setEditingStudent}
            onViewStudent={setViewingStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        </TabsContent>

        <TabsContent value="add">
          <div className="text-center py-8">
            <button 
              onClick={() => setIsAddDialogOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加新学生
            </button>
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <StudentBulkActions
            selectedCount={selectedStudents.length}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedStudents([])}
          />
        </TabsContent>

        <TabsContent value="filters">
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
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4">筛选结果</h3>
            <StudentList 
              students={sortedStudents}
              loading={loading}
              selectedStudents={selectedStudents}
              onSelectStudent={handleSelectStudent}
              onSelectAll={handleSelectAll}
              onEditStudent={setEditingStudent}
              onViewStudent={setViewingStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <StudentStats students={sortedStudents} totalStudents={students.length} />
        </TabsContent>
      </Tabs>

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
