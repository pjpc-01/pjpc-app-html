"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2, User } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese, calculateAge, formatBirthDate } from "./utils"

interface StudentDetailsProps {
  student: Student | null
  onOpenChange: (open: boolean) => void
  onEdit: (student: Student) => void
  onDelete: (studentId: string) => void
}

export default function StudentDetails({
  student,
  onOpenChange,
  onEdit,
  onDelete
}: StudentDetailsProps) {
  if (!student) return null

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            学生详细信息
          </DialogTitle>
          <DialogDescription>
            查看 {student.name} 的完整档案信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">姓名</label>
                <p className="text-lg font-semibold">{student.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">学号</label>
                <p className="text-lg">{student.studentId || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">年级</label>
                <Badge variant="outline">
                  {convertGradeToChinese(student.grade)}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">家长邮箱</label>
                <p className="text-lg">{student.parentEmail || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">学号</label>
                <p className="text-lg">{student.studentId || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                  {student.status === 'active' ? '在读' : '离校'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>联系信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">家长姓名</label>
                <p className="text-lg">{student.parentName || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">家长邮箱</label>
                <p className="text-lg">{student.parentEmail || '-'}</p>
              </div>
            </CardContent>
          </Card>



          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit(student)}
            >
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(student.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 