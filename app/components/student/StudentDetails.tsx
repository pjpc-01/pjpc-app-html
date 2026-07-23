"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { useLanguage } from "@/contexts/language-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Edit, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  AlertTriangle, 
  Home, 
  School, 
  Heart, 
  Car,
  ExternalLink,
  MessageSquare,
  FileText
} from "lucide-react"
import { Student } from "@/hooks/useStudents"
import { convertGradeToChinese } from "./utils"

interface StudentDetailsProps {
  open: boolean
  student: Student
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export default function StudentDetails({
  open,
  student,
  onOpenChange,
  onEdit,
  onDelete
}: StudentDetailsProps) {
  const { t } = useLanguage()
  
  if (!student) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <User className="h-6 w-6" />
              学生详细信息
            </SheetTitle>
            <SheetDescription>
              无法获取学生信息，请检查数据库连接。
            </SheetDescription>
          </SheetHeader>
          <div className="p-8 text-center mt-10">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('student.data_load_failed')}</h3>
            <Button onClick={() => onOpenChange(false)} className="mt-4">{t('teacher.close')}</Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto p-0">
        <div className="flex flex-col h-full">
          {/* 顶部封面区域 */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
             <div className="absolute -bottom-10 left-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
                    {student.avatar && student.avatar !== 'null' ? (
                      <img 
                        src={student.avatar} 
                        alt={student.student_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <User className="h-10 w-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>

          <div className="pt-14 px-6 pb-6 space-y-6">
            <SheetHeader className="sr-only">
              <SheetTitle>{student.student_name} - 学生详细信息</SheetTitle>
              <SheetDescription>查看学生的个人、学校及接送详细资料</SheetDescription>
            </SheetHeader>

            {/* 姓名与状态 */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{student.student_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {student.status === 'active' ? '在读' : '离校'}
                  </Badge>
                  <span className="text-sm text-slate-500">{student.student_id}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onEdit} className="h-8 px-2">
                  <Edit className="h-3 w-3 mr-1" /> 编辑
                </Button>
              </div>
            </div>

            {/* 快速操作栏 */}
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-20 gap-1"
                onClick={() => window.open(`tel:${student.father_phone || student.mother_phone || student.parentPhone}`)}
              >
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-xs">父亲电话</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex flex-col h-20 gap-1"
                onClick={() => window.open(`https://wa.me/${(student.father_phone || student.mother_phone || student.parentPhone || '').replace(/\+/g, '')}`)}
              >
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex flex-col h-20 gap-1"
                onClick={onDelete}
              >
                <AlertTriangle className="h-4 w-4 text-white" />
                <span className="text-xs text-white">删除记录</span>
              </Button>
            </div>

            {/* 详细信息标签页 */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="basic">基础</TabsTrigger>
                <TabsTrigger value="school">学校</TabsTrigger>
                <TabsTrigger value="pickup">接送</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <DetailSection title="个人身份">
                  <DetailRow label={t('student.date_of_birth')} value={student.dob ? new Date(student.dob).toLocaleDateString('zh-CN') : '-'} icon={<Calendar className="h-3 w-3" />} />
                  <DetailRow label={t('student.gender')} value={student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'} icon={<User className="h-3 w-3" />} />
                  <DetailRow label="NRIC/护照" value={student.nric || '-'} icon={<FileText className="h-3 w-3" />} />
                </DetailSection>

                <DetailSection title={t('teacher.contact_info')}>
                  <DetailRow label="父亲姓名" value={student.father_name || student.fatherName || '-'} icon={<User className="h-3 w-3" />} />
                  <DetailRow label="母亲姓名" value={student.mother_name || student.motherName || '-'} icon={<User className="h-3 w-3" />} />
                  <DetailRow label="父亲电话" value={student.father_phone || student.fatherPhone || '-'} icon={<Phone className="h-3 w-3" />} />
                  <DetailRow label="母亲电话" value={student.mother_phone || student.motherPhone || '-'} icon={<Phone className="h-3 w-3" />} />
                </DetailSection>

                <DetailSection title="居住地址">
                  <div className="flex justify-between items-start py-2">
                    <span className="text-sm font-medium text-slate-500">{t('parent.home_address')}</span>
                    <div className="text-right">
                      <p className="text-sm text-slate-900 mb-1">{student.home_address || '未填写'}</p>
                      {student.home_address && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs text-blue-600"
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(student.home_address)}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 inline mr-1" /> 在地图中查看
                        </Button>
                      )}
                    </div>
                  </div>
                </DetailSection>
              </TabsContent>

              <TabsContent value="school" className="space-y-4">
                <DetailSection title="学习状态">
                  <DetailRow label={t('student.school')} value={student.school || '-'} icon={<School className="h-3 w-3" />} />
                  <DetailRow label={t('student.grade')} value={convertGradeToChinese(student.standard || student.grade || '') || '-'} icon={<GraduationCap className="h-3 w-3" />} />
                </DetailSection>

                <DetailSection title="中心服务">
                  <DetailRow label={t('teacher.center')} value={student.center || '-'} icon={<MapPin className="h-3 w-3" />} />
                  <DetailRow label="注册日期" value={student.registrationDate ? new Date(student.registrationDate).toLocaleDateString('zh-CN') : '-'} icon={<Calendar className="h-3 w-3" />} />
                </DetailSection>

                <DetailSection title="费用状态">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-slate-500">学费状态</span>
                    <Badge variant={student.tuitionStatus === 'paid' ? 'default' : student.tuitionStatus === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                      {student.tuitionStatus === 'pending' ? '待付款' : student.tuitionStatus === 'paid' ? '已付款' : student.tuitionStatus === 'partial' ? '部分付款' : student.tuitionStatus === 'overdue' ? '逾期' : '-'}
                    </Badge>
                  </div>
                </DetailSection>
              </TabsContent>

              <TabsContent value="pickup" className="space-y-4">
                <DetailSection title="健康与医疗">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-800 mb-1">
                      <Heart className="h-3 w-3" />
                      <span className="text-xs font-semibold">健康备注</span>
                    </div>
                    <p className="text-xs text-amber-700">{student.healthInfo || '无特殊健康记录'}</p>
                  </div>
                </DetailSection>

                <DetailSection title="接送安排">
                  <DetailRow label="接送方式" value={student.pickupMethod === 'parent' ? '父母接送' : student.pickupMethod === 'guardian' ? '监护人接送' : student.pickupMethod === 'authorized' ? '授权人接送' : student.pickupMethod === 'public' ? '公共交通' : student.pickupMethod === 'walking' ? '步行' : '-'} icon={<Car className="h-3 w-3" />} />
                  
                  <div className="space-y-2 mt-2">
                    {student.authorizedPickup1Name && (
                      <PickupPerson name={student.authorizedPickup1Name} relation={student.authorizedPickup1Relation} phone={student.authorizedPickup1Phone} index={1} />
                    )}
                    {student.authorizedPickup2Name && (
                      <PickupPerson name={student.authorizedPickup2Name} relation={student.authorizedPickup2Relation} phone={student.authorizedPickup2Phone} index={2} />
                    )}
                    {student.authorizedPickup3Name && (
                      <PickupPerson name={student.authorizedPickup3Name} relation={student.authorizedPickup3Name} phone={student.authorizedPickup3Name} index={3} />
                    )}
                  </div>
                </DetailSection>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <span className="text-sm text-slate-900">{value || '-'}</span>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        {children}
      </div>
    </div>
  )
}

function PickupPerson({ name, relation, phone, index }: { name: string; relation: string; phone: string; index: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="bg-slate-100 text-slate-600 w-4 h-4 rounded-full flex items-center justify-center font-bold"> {index} </span>
        <span className="font-medium text-slate-900">{name}</span>
        <span className="text-slate-400">({relation || '关系未填写'})</span>
      </div>
      <span className="text-slate-600">{phone || '电话未填写'}</span>
    </div>
  )
}
