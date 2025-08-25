"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Teacher } from '@/lib/pocketbase-teachers'

interface TeacherDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: Teacher | null
}

export default function TeacherDetails({ open, onOpenChange, teacher }: TeacherDetailsProps) {
  if (!teacher) return null

  const formatDate = (dateString: string) => {
    if (!dateString) return '未设置'
    try {
      return new Date(dateString).toLocaleDateString('zh-CN')
    } catch {
      return dateString
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">在职</Badge>
      case 'inactive':
        return <Badge variant="destructive">离职</Badge>
      case 'on_leave':
        return <Badge variant="secondary">请假</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>教师详情</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">教师姓名</label>
                <p className="text-base">{teacher.teacher_name || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">教师工号</label>
                <p className="text-base">{teacher.teacher_id || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">NRIC 身份证号码</label>
                <p className="text-base">{teacher.nric || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">邮箱</label>
                <p className="text-base">{teacher.email || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">电话</label>
                <p className="text-base">{teacher.phone || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">部门</label>
                <p className="text-base">{teacher.department || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">职位</label>
                <p className="text-base">{teacher.position || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">教龄</label>
                <p className="text-base">{teacher.experience || 0} 年</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">状态</label>
                <div className="mt-1">
                  {getStatusBadge(teacher.status || 'unknown')}
                </div>
              </div>
            </div>
          </div>

          {/* 工作信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">工作信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">入职日期</label>
                <p className="text-base">{formatDate(teacher.joinDate || '')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">最后活跃</label>
                <p className="text-base">{formatDate(teacher.lastActive || '')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">课程数量</label>
                <p className="text-base">{teacher.courses || 0} 门</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">学生数量</label>
                <p className="text-base">{teacher.students || 0} 名</p>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">联系信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">地址</label>
                <p className="text-base">{teacher.address || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">紧急联系人</label>
                <p className="text-base">{teacher.emergencyContact || '未设置'}</p>
              </div>
            </div>
          </div>

          {/* 备注 */}
          {teacher.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">备注</h3>
              <p className="text-base whitespace-pre-wrap">{teacher.notes}</p>
            </div>
          )}

          {/* 系统信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">系统信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <label className="font-medium">创建时间</label>
                <p>{formatDate(teacher.created)}</p>
              </div>
              <div>
                <label className="font-medium">更新时间</label>
                <p>{formatDate(teacher.updated)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
