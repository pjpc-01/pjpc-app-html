"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Eye, Trash2, MoreHorizontal } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "./utils"
import PermissionGate from "@/components/shared/PermissionGate"
import type { UserRole } from "@/lib/permissions"

interface StudentListProps {
  students: Student[]
  loading: boolean
  selectedStudents: string[]
  onSelectStudent: (studentId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onEditStudent: (student: Student) => void
  onViewStudent: (student: Student) => void
  onDeleteStudent: (studentId: string) => void
  userRole?: UserRole
}

export default function StudentList({
  students,
  loading,
  selectedStudents,
  onSelectStudent,
  onSelectAll,
  onEditStudent,
  onViewStudent,
  onDeleteStudent,
  userRole = 'admin'
}: StudentListProps) {
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
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
          aValue = a.father_name || a.mother_name || a.parentName || ''
          bValue = b.father_name || b.mother_name || b.parentName || ''
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
  }, [students, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const allSelected = students.length > 0 && selectedStudents.length === students.length
  const someSelected = selectedStudents.length > 0 && selectedStudents.length < students.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">暂无学生数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('name')}
            >
              姓名
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('studentId')}
            >
              学号
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('grade')}
            >
              年级
            </TableHead>
            <TableHead>父亲</TableHead>
            <TableHead>母亲</TableHead>
            <TableHead>联系电话</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('status')}
            >
              状态
            </TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStudents.map((student) => (
            <TableRow 
              key={student.id} 
              className="hover:bg-slate-50 cursor-pointer transition-colors group"
              onClick={() => onViewStudent(student)}
            >
              <TableCell className="w-12">
                <Checkbox
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={(checked) => {
                    onSelectStudent(student.id, checked as boolean);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell className="font-medium text-slate-900">{student.student_name}</TableCell>
              <TableCell className="text-slate-500 font-mono text-xs">{student.student_id}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-slate-50 text-slate-600 font-normal">
                  {convertGradeToChinese(student.standard || '')}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-600">{student.father_name || '-'}</TableCell>
              <TableCell className="text-slate-600">{student.mother_name || '-'}</TableCell>
              <TableCell className="text-slate-500">
                {student.father_phone || student.mother_phone ? (
                  <span className="text-xs">
                    {student.father_phone && <span>父: {student.father_phone}</span>}
                    {student.father_phone && student.mother_phone && <span className="mx-1">|</span>}
                    {student.mother_phone && <span>母: {student.mother_phone}</span>}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase tracking-wider">
                  {student.status === 'active' ? '在读' : '离校'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PermissionGate permission="students.edit" role={userRole} showDisabled>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStudent(student);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="students.delete" role={userRole} showDisabled>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStudent(student.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </PermissionGate>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 