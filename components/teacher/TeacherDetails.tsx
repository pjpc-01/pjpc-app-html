"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Teacher } from '@/hooks/useTeachers'
import { useLanguage } from "@/contexts/language-context"

interface TeacherDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: Teacher | null
}

export default function TeacherDetails({ open, onOpenChange, teacher }: TeacherDetailsProps) {
  const { t } = useLanguage()
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
        return <Badge variant="default">{t('teacher.active')}</Badge>
      case 'inactive':
        return <Badge variant="destructive">{t('teacher.resigned')}</Badge>
      case 'on_leave':
        return <Badge variant="secondary">{t('teacher.leave')}</Badge>
      default:
        return <Badge variant="outline">{t('teacher.unknown')}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>教师详情 — {teacher.teacher_name || teacher.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* ===== 基本信息 ===== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">{t('report.basic_info')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('teacher.teacher_name')}</label>
                <p className="text-base">{teacher.teacher_name || teacher.name || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">教师工号</label>
                <p className="text-base">{teacher.teacher_id || teacher.idNumber?.toString() || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">NRIC 身份证号码</label>
                <p className="text-base">{teacher.nric || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('report.email')}</label>
                <p className="text-base">{teacher.email || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('report.phone')}</label>
                <p className="text-base">{teacher.phone || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
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
                <label className="text-sm font-medium text-gray-500">{t('teacher.status')}</label>
                <div className="mt-1">{getStatusBadge(teacher.status || 'unknown')}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('teacher.center')}</label>
                <p className="text-base">{teacher.center || teacher.centerId || '未设置'}</p>
              </div>
            </div>
          </div>

          {/* ===== 个人信息 ===== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">个人信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">公民身份</label>
                <p className="text-base">{teacher.isCitizen === true ? '马来西亚公民' : teacher.isCitizen === false ? '非公民' : '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">婚姻状况</label>
                <p className="text-base">{teacher.marriedStatus === true ? '已婚' : teacher.marriedStatus === false ? '未婚' : '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">孩子数量</label>
                <p className="text-base">{teacher.totalChild ?? '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">NFC 卡号</label>
                <p className="text-base">{teacher.cardNumber || '未设置'}</p>
              </div>
            </div>
          </div>

          {/* ===== 工作信息 ===== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">工作信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">入职日期</label>
                <p className="text-base">{formatDate(teacher.joinDate || teacher.hireDate || '')}</p>
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

          {/* ===== 银行信息 ===== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">银行信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">{t('teacher.bank_name')}</label>
                <p className="text-base">{teacher.bankName || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">账户名称</label>
                <p className="text-base">{teacher.bankAccountName || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('finance.account_number')}</label>
                <p className="text-base">{teacher.bankAccountNo || teacher.accountNo || '未设置'}</p>
              </div>
            </div>
          </div>

          {/* ===== KWSP / Socso / 税务 ===== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">公积金 / Socso / 税务</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">EPF / KWSP 号码</label>
                <p className="text-base">{teacher.epfNo || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Socso / PERKESO 号码</label>
                <p className="text-base">{teacher.socsoNo || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">税务号码 (Tax No)</label>
                <p className="text-base">{teacher.taxNo || '未设置'}</p>
              </div>
            </div>
          </div>

          {/* ===== 联系信息 ===== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">联系信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('teacher.address')}</label>
                <p className="text-base">{teacher.address || '未设置'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('teacher.emergency_contact')}</label>
                <p className="text-base">{teacher.emergencyContact || '未设置'}</p>
              </div>
            </div>
          </div>

          {/* ===== 备注 ===== */}
          {teacher.notes && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">{t('teacher.notes')}</h3>
              <p className="text-base whitespace-pre-wrap">{teacher.notes}</p>
            </div>
          )}

          {/* ===== 系统信息 ===== */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">系统信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <label className="font-medium">{t('course.created_at')}</label>
                <p>{formatDate(teacher.created || '')}</p>
              </div>
              <div>
                <label className="font-medium">{t('teacher.updated_at')}</label>
                <p>{formatDate(teacher.updated || '')}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
