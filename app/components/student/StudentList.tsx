"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Eye, Trash2, User } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese, formatBirthDate, calculateAge } from "./utils"

interface StudentListProps {
  students: Student[]
  loading: boolean
  selectedStudents: string[]
  onSelectStudent: (studentId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onEditStudent: (student: Student) => void
  onViewStudent: (student: Student) => void
  onDeleteStudent: (studentId: string) => void
}

export default function StudentList({
  students,
  loading,
  selectedStudents,
  onSelectStudent,
  onSelectAll,
  onEditStudent,
  onViewStudent,
  onDeleteStudent
}: StudentListProps) {
  const [sortField, setSortField] = useState<keyof Student>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedStudents = [...students].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''
    
    if (sortDirection === 'asc') {
      return aValue.toString().localeCompare(bValue.toString())
    } else {
      return bValue.toString().localeCompare(aValue.toString())
    }
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">加载学生数据中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学生数据</h3>
            <p className="text-gray-600">请添加学生信息开始管理</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>学生列表 ({students.length})</CardTitle>
        <CardDescription>管理所有学生信息和档案</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.length === students.length && students.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  姓名 {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('studentId')}
                >
                  学号 {sortField === 'studentId' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('grade')}
                >
                  年级 {sortField === 'grade' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>年龄</TableHead>
                <TableHead>性别</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => onSelectStudent(student.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {convertGradeToChinese(student.grade)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.birthDate ? calculateAge(student.birthDate) : '-'}
                  </TableCell>
                  <TableCell>{student.gender || '-'}</TableCell>
                  <TableCell>{student.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                      {student.status === 'active' ? '在读' : '离校'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewStudent(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStudent(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteStudent(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 