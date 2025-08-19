"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2, User, Phone, Mail, MapPin, Calendar, GraduationCap } from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "./utils"

interface StudentDetailsProps {
  student: Student
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export default function StudentDetails({
  student,
  onOpenChange,
  onEdit,
  onDelete
}: StudentDetailsProps) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            学生详细信息
          </DialogTitle>
          <DialogDescription>
            查看学生的完整信息和学习记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 核心信息 - 最高优先级 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                核心信息
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">姓名</label>
                <p className="text-lg font-semibold text-blue-600">{student.student_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">学号</label>
                <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">{student.student_id || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">年级</label>
                <Badge variant="outline" className="text-lg">
                  {convertGradeToChinese(student.standard || '')}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">中心</label>
                <Badge variant="secondary">{student.Center || '-'}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">服务类型</label>
                <Badge variant="outline">
                  {student.serviceType === 'afterschool' ? '安亲' : student.serviceType === 'tuition' ? '补习' : '-'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">性别</label>
                <Badge variant="outline">
                  {student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 个人信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                个人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">出生日期</label>
                <p className="text-lg">{student.dob ? new Date(student.dob).toLocaleDateString('zh-CN') : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">邮箱</label>
                <p className="text-lg">{student.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                  {student.status === 'active' ? '在读' : '离校'}
                </Badge>
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
                <label className="text-sm font-medium text-gray-500">家长姓名</label>
                <p className="text-lg">{student.parentName || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">家长电话</label>
                <p className="text-lg">{student.parentPhone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">父亲电话</label>
                <p className="text-lg">{student.father_phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">母亲电话</label>
                <p className="text-lg">{student.mother_phone || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">家庭地址</label>
                <p className="text-lg">{student.home_address || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 打卡信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                打卡信息
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">卡片号码</label>
                <p className="text-lg">{student.cardNumber || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">卡片类型</label>
                <Badge variant="outline">
                  {student.cardType || '未分配'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">余额</label>
                <p className="text-lg">{student.balance ? `$${student.balance}` : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">使用次数</label>
                <p className="text-lg">{student.usageCount || '0'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">发卡日期</label>
                <p className="text-lg">{student.issuedDate || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">到期日期</label>
                <p className="text-lg">{student.expiryDate || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
            <Button onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 