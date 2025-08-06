"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Edit, Trash2, User, Phone, Mail, MapPin, Calendar, GraduationCap } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese, formatBirthDate, calculateAge } from "./utils"

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

  const handleDelete = () => {
    onDelete(student.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            学生详细信息
          </DialogTitle>
          <DialogDescription>
            查看 {student.name} 的完整档案信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                基本信息
                <div className="flex items-center gap-2">
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                    {student.status === 'active' ? '在读' : '离校'}
                  </Badge>
                  <Badge variant="outline">
                    {convertGradeToChinese(student.grade)}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">姓名</label>
                <p className="text-lg font-semibold">{student.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">学号</label>
                <p className="text-lg font-semibold">{student.studentId}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">年级</label>
                <p className="text-lg">{convertGradeToChinese(student.grade)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">性别</label>
                <p className="text-lg">{student.gender || '未填写'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">出生日期</label>
                <p className="text-lg">{student.birthDate ? formatBirthDate(student.birthDate) : '未填写'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">年龄</label>
                <p className="text-lg">{student.birthDate ? `${calculateAge(student.birthDate)}岁` : '未知'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 联系信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                联系信息
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">联系电话</label>
                <p className="text-lg">{student.phone || '未填写'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">邮箱地址</label>
                <p className="text-lg">{student.email || '未填写'}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">地址</label>
                <p className="text-lg">{student.address || '未填写'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 家长信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                家长信息
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">家长姓名</label>
                <p className="text-lg">{student.parentName || '未填写'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">家长电话</label>
                <p className="text-lg">{student.parentPhone || '未填写'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 入学信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                入学信息
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">入学日期</label>
                <p className="text-lg">{student.enrollmentDate ? formatBirthDate(student.enrollmentDate) : '未填写'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <p className="text-lg">{student.status === 'active' ? '在读' : '离校'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 备注信息 */}
          {student.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  备注信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg whitespace-pre-wrap">{student.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onEdit(student)}
            >
              <Edit className="h-4 w-4 mr-2" />
              编辑信息
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除学生
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除学生</AlertDialogTitle>
                  <AlertDialogDescription>
                    您确定要删除学生 {student.name} 吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 