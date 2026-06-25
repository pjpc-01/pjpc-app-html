"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Eye, Trash2, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-2 text-amber-700">加载中...</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-amber-700">暂无学生数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[#d8ccb4] bg-white/90">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#f5f0e5]">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-[#ede4d0] text-[#5c4a30] font-semibold"
              onClick={() => handleSort('name')}
            >
              姓名
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-[#ede4d0] text-[#5c4a30] font-semibold"
              onClick={() => handleSort('studentId')}
            >
              学号
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-[#ede4d0] text-[#5c4a30] font-semibold"
              onClick={() => handleSort('grade')}
            >
              年级
            </TableHead>
            <TableHead className="text-[#5c4a30] font-semibold">父亲</TableHead>
            <TableHead className="text-[#5c4a30] font-semibold">母亲</TableHead>
            <TableHead className="text-[#5c4a30] font-semibold">联系电话</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-[#ede4d0] text-[#5c4a30] font-semibold"
              onClick={() => handleSort('status')}
            >
              状态
            </TableHead>
            <TableHead className="w-24 text-[#5c4a30] font-semibold">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStudents.map((student, index) => (
            <TableRow 
              key={student.id} 
              className={`hover:bg-yellow-50/60 cursor-pointer transition-colors group ${
                index % 2 === 0 ? "bg-white" : "bg-[#fefcf6]"
              }`}
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
              <TableCell className="font-medium text-[#5c4a30]">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[#e6be1e] to-[#d4a817] text-white text-xs font-semibold">
                      {student.student_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{student.student_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-[#9a8868] font-mono text-xs">{student.student_id}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-amber-50/60 text-amber-700 border-amber-200 font-normal">
                  {convertGradeToChinese(student.standard || '')}
                </Badge>
              </TableCell>
              <TableCell className="text-[#7a6a48]">{student.father_name || '-'}</TableCell>
              <TableCell className="text-[#7a6a48]">{student.mother_name || '-'}</TableCell>
              <TableCell className="text-[#9a8868]">
                {student.father_phone || student.mother_phone ? (
                  <span className="text-xs">
                    {student.father_phone && <span>父: {student.father_phone}</span>}
                    {student.father_phone && student.mother_phone && <span className="mx-1">|</span>}
                    {student.mother_phone && <span>母: {student.mother_phone}</span>}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={
                  student.status === 'active' 
                    ? "bg-green-100 text-green-700 border-green-200 text-[10px] uppercase tracking-wider" 
                    : "bg-gray-100 text-gray-500 border-gray-200 text-[10px] uppercase tracking-wider"
                }>
                  {student.status === 'active' ? '在读' : '离校'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PermissionGate permission="students.edit" role={userRole} showDisabled>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#9a8868] hover:text-yellow-600 hover:bg-yellow-50"
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
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
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