"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RowActions } from "@/components/ui/row-actions"
import { Edit, Eye, Trash2, FileText, UserX, UserCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "./utils"
import { studentAvatarUrl } from "@/lib/utils"
import { can } from "@/lib/permissions"
import type { UserRole } from "@/lib/permissions"
import { useLanguage } from "@/contexts/language-context"

interface StudentListProps {
  students: Student[]
  loading: boolean
  selectedStudents: string[]
  onSelectStudent: (studentId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onEditStudent: (student: Student) => void
  onViewStudent: (student: Student) => void
  onDeleteStudent: (studentId: string) => void
  onViewReport?: (student: Student) => void
  onToggleStatus?: (student: Student) => void
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
  onViewReport,
  onToggleStatus,
  userRole = 'admin'
}: StudentListProps) {
  const { t } = useLanguage()
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
          <p className="mt-2 text-amber-700">{t('teacher.loading')}</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-amber-700">{t('student.no_student_data')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead 
              className="hover:bg-accent text-accent-foreground font-semibold cursor-pointer"
              onClick={() => handleSort('name')}
            >
              {t("姓名")}
            </TableHead>
            <TableHead 
              className="hover:bg-accent text-accent-foreground font-semibold cursor-pointer"
              onClick={() => handleSort('studentId')}
            >
              {t("学号")}
            </TableHead>
            <TableHead 
              className="hover:bg-accent text-accent-foreground font-semibold cursor-pointer"
              onClick={() => handleSort('grade')}
            >
              {t("年级")}
            </TableHead>
            <TableHead className="text-accent-foreground font-semibold">{t('student.father')}</TableHead>
            <TableHead className="text-accent-foreground font-semibold">{t('student.mother')}</TableHead>
            <TableHead className="text-accent-foreground font-semibold">{t('student.contact_phone')}</TableHead>
            <TableHead className="text-accent-foreground font-semibold">{t("积分")}</TableHead>
            <TableHead 
              className="hover:bg-accent text-accent-foreground font-semibold cursor-pointer"
              onClick={() => handleSort('status')}
            >
              {t("状态")}
            </TableHead>
            <TableHead className="w-24 text-accent-foreground font-semibold">{t('teacher.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStudents.map((student, index) => (
            <TableRow 
              key={student.id} 
              className={`hover:bg-accent/60 cursor-pointer transition-colors group ${
                index % 2 === 0 ? "bg-white" : "bg-muted/30"
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
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={studentAvatarUrl(student)} />
                    <AvatarFallback className="bg-gradient-to-br from-[#e6be1e] to-[#d4a817] text-white text-xs font-semibold">
                      {student.student_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{student.student_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">{student.student_id}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-amber-50/60 text-amber-700 border-amber-200 font-normal">
                  {convertGradeToChinese(student.standard || '')}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{student.father_name || '-'}</TableCell>
              <TableCell className="text-muted-foreground">{student.mother_name || '-'}</TableCell>
              <TableCell className="text-muted-foreground">
                {student.father_phone || student.mother_phone ? (
                  <span className="text-xs">
                    {student.father_phone && <span>{t("父:")} {student.father_phone}</span>}
                    {student.father_phone && student.mother_phone && <span className="mx-1">|</span>}
                    {student.mother_phone && <span>{t("母:")} {student.mother_phone}</span>}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell className="text-center text-xs">
                {student.points_enabled !== false ? '启用' : '关闭'}
              </TableCell>
              <TableCell>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={
                  student.status === 'active' 
                    ? "bg-green-100 text-green-700 border-green-200 text-xs whitespace-nowrap" 
                    : student.status === 'withdrawn'
                    ? "bg-orange-100 text-orange-700 border-orange-200 text-xs whitespace-nowrap"
                    : "bg-gray-100 text-gray-500 border-gray-200 text-xs whitespace-nowrap"
                }>
                  {student.status === 'active' ? '在读' : 
                   student.status === 'graduated' ? '毕业' : 
                   student.status === 'withdrawn' ? '已停学' : '离校'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <RowActions
                  actions={[
                    { label: t("查看"), icon: Eye, onClick: () => onViewStudent(student) },
                    can(userRole, "students.edit") && { label: t("编辑"), icon: Edit, onClick: () => onEditStudent(student) },
                    onViewReport && { label: t("学生报告"), icon: FileText, onClick: () => onViewReport(student) },
                    onToggleStatus && {
                      label: student.status === "active" ? t("停学") : t("复学"),
                      icon: student.status === "active" ? UserX : UserCheck,
                      onClick: () => onToggleStatus(student),
                    },
                    can(userRole, "students.delete") && { label: t("删除"), icon: Trash2, onClick: () => onDeleteStudent(student.id), destructive: true },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 