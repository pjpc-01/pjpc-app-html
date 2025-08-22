"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2, User, Phone, Mail, MapPin, Calendar, GraduationCap, AlertTriangle, FileText, Home, School, Heart, Car } from "lucide-react"
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6" />
            学生详细信息
          </DialogTitle>
          <DialogDescription className="text-base">
            查看学生的完整信息和学习记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 学生基本信息 - 顶部突出显示 */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-blue-800">
                <User className="h-6 w-6" />
                学生基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左侧：学生姓名 - 突出显示 */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                  <div className="flex items-center gap-4">
                    {/* 学生头像 */}
                    <div className="relative">
                      {student.avatar ? (
                        <img 
                          src={student.avatar} 
                          alt={`${student.student_name}的头像`}
                          className="w-16 h-16 rounded-full border-3 border-white/30 object-cover shadow-lg"
                          onError={(e) => {
                            // 如果头像加载失败，显示默认图标
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-3 border-white/30 shadow-lg ${student.avatar ? 'hidden' : ''}`}>
                        <User className="h-8 w-8" />
                      </div>
                      {/* 上传头像按钮 - 悬停时显示 */}
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
                        <span className="text-xs font-medium text-white">更换头像</span>
                      </div>
                    </div>
                    
                    {/* 学生信息 */}
                    <div className="flex-1">
                      <p className="text-sm font-medium opacity-90">学生姓名</p>
                      <h2 className="text-2xl font-semibold mb-1">{student.student_name}</h2>
                      {/* 添加学号显示，更紧凑 */}
                      {student.student_id && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">学号: {student.student_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右侧：核心信息 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <GraduationCap className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-2">年级</p>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-base font-medium px-3 py-1">
                        {convertGradeToChinese(student.standard || '')}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-2">中心</p>
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="text-base font-medium px-3 py-1">{student.center || '-'}</Badge>
                    </div>
                  </div>

                  {/* 出生日期信息 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-md transition-shadow sm:col-span-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-2">出生日期</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {student.dob ? new Date(student.dob).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : '-'}
                    </p>
                    {student.dob && (
                      <p className="text-xs text-gray-500 mt-1">
                        年龄：{Math.floor((new Date().getTime() - new Date(student.dob).getTime()) / (1000 * 60 * 60 * 24 * 365))} 岁
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部：服务类型和状态 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">服务类型:</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                      {student.serviceType === 'afterschool' ? '安亲班' : student.serviceType === 'tuition' ? '补习班' : '-'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">状态:</span>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className={
                      student.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 font-medium' : 'font-medium'
                    }>
                      {student.status === 'active' ? '在读' : '离校'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">性别:</span>
                    <Badge variant="outline" className="bg-gray-50 font-medium">
                      {student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 两列布局：左侧个人信息，右侧学校信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：个人信息 */}
            <div className="space-y-4">
              {/* 个人详情 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    个人详情
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">出生日期</span>
                    <span className="text-sm">{student.dob ? new Date(student.dob).toLocaleDateString('zh-CN') : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">性别</span>
                    <Badge variant="outline" className="text-xs">
                      {student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">NRIC/护照</span>
                    <span className="text-sm font-mono">{student.nric || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">状态</span>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {student.status === 'active' ? '在读' : '离校'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 联系信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="h-4 w-4" />
                    联系信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">家长姓名</span>
                    <span className="text-sm">{student.parentName || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">家长电话</span>
                    <span className="text-sm">{student.parentPhone || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">父亲电话</span>
                    <span className="text-sm">{student.father_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">母亲电话</span>
                    <span className="text-sm">{student.mother_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">紧急联络人</span>
                    <span className="text-sm">{student.emergencyContact || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">紧急电话</span>
                    <span className="text-sm">{student.emergencyPhone || '-'}</span>
                  </div>
                  
                  {/* 授权接送人信息 */}
                  {(student.authorizedPickup1Name || student.authorizedPickup2Name || student.authorizedPickup3Name) && (
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">授权接送人</h4>
                      <div className="space-y-2">
                        {student.authorizedPickup1Name && (
                          <div className="bg-blue-50 rounded-lg p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-600">接送人 1</span>
                              <span className="text-xs text-gray-500">{student.authorizedPickup1Relation || '关系未填写'}</span>
                            </div>
                            <div className="text-sm font-medium text-gray-800">{student.authorizedPickup1Name}</div>
                            <div className="text-sm text-gray-600">{student.authorizedPickup1Phone || '电话未填写'}</div>
                          </div>
                        )}
                        {student.authorizedPickup2Name && (
                          <div className="bg-green-50 rounded-lg p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-600">接送人 2</span>
                              <span className="text-xs text-gray-500">{student.authorizedPickup2Relation || '关系未填写'}</span>
                            </div>
                            <div className="text-sm font-medium text-gray-800">{student.authorizedPickup2Name}</div>
                            <div className="text-sm text-gray-600">{student.authorizedPickup2Phone || '电话未填写'}</div>
                          </div>
                        )}
                        {student.authorizedPickup3Name && (
                          <div className="bg-purple-50 rounded-lg p-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-600">接送人 3</span>
                              <span className="text-xs text-gray-500">{student.authorizedPickup3Relation || '关系未填写'}</span>
                            </div>
                            <div className="text-sm font-medium text-gray-800">{student.authorizedPickup3Name}</div>
                            <div className="text-sm text-gray-600">{student.authorizedPickup3Phone || '电话未填写'}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

                             {/* 家庭地址 */}
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="flex items-center gap-2 text-base">
                     <Home className="h-4 w-4" />
                     家庭地址
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   {student.home_address ? (
                     <div className="space-y-2">
                       <p className="text-sm text-gray-700">{student.home_address}</p>
                       <Button
                         variant="outline"
                         size="sm"
                         className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                         onClick={() => {
                           const encodedAddress = encodeURIComponent(student.home_address || '')
                           const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
                           window.open(googleMapsUrl, '_blank')
                         }}
                       >
                         <MapPin className="h-3 w-3 mr-1" />
                         在Google地图中查看
                       </Button>
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500">未填写家庭地址</p>
                   )}
                 </CardContent>
               </Card>
            </div>

            {/* 右侧：学校信息 */}
            <div className="space-y-4">
              {/* 学校信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <School className="h-4 w-4" />
                    学校信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">就读学校</span>
                    <span className="text-sm">{student.school || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">年级</span>
                    <span className="text-sm">{student.standard || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">教育阶段</span>
                    <Badge variant="outline" className="text-xs">
                      {student.level === 'primary' ? '小学' : student.level === 'secondary' ? '中学' : '-'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 安亲班信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4" />
                    安亲班信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">服务类型</span>
                    <Badge variant="outline" className="text-xs">
                      {student.serviceType === 'afterschool' ? '安亲' : student.serviceType === 'tuition' ? '补习' : '-'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">所属中心</span>
                    <span className="text-sm">{student.center || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">注册日期</span>
                    <span className="text-sm">{student.registrationDate ? new Date(student.registrationDate).toLocaleDateString('zh-CN') : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">学费状态</span>
                    <Badge variant={
                      student.tuitionStatus === 'paid' ? 'default' : 
                      student.tuitionStatus === 'partial' ? 'secondary' : 
                      student.tuitionStatus === 'overdue' ? 'destructive' : 'outline'
                    } className="text-xs">
                      {student.tuitionStatus === 'pending' ? '待付款' : 
                       student.tuitionStatus === 'paid' ? '已付款' : 
                       student.tuitionStatus === 'partial' ? '部分付款' : 
                       student.tuitionStatus === 'overdue' ? '逾期' : '-'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 健康信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" />
                    健康信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{student.healthInfo || '无特殊健康记录'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 邮箱信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="h-4 w-4" />
                    邮箱信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{student.email || '未填写邮箱'}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 接送信息 - 全宽显示 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4" />
                接送安排
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 接送方式 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">接送方式</h4>
                  <Badge variant="outline" className="text-sm">
                    {student.pickupMethod === 'parent' ? '父母接送' : 
                     student.pickupMethod === 'guardian' ? '监护人接送' : 
                     student.pickupMethod === 'authorized' ? '授权人接送' : 
                     student.pickupMethod === 'public' ? '公共交通' : 
                     student.pickupMethod === 'walking' ? '步行' : '-'}
                  </Badge>
                </div>

                {/* 授权接送人 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">授权接送人</h4>
                  <div className="space-y-2">
                    {student.authorizedPickup1Name && (
                      <div className="bg-gray-50 rounded-lg p-2 text-xs">
                        <span className="font-medium">1.</span> {student.authorizedPickup1Name} ({student.authorizedPickup1Relation}) - {student.authorizedPickup1Phone}
                      </div>
                    )}
                    {student.authorizedPickup2Name && (
                      <div className="bg-gray-50 rounded-lg p-2 text-xs">
                        <span className="font-medium">2.</span> {student.authorizedPickup2Name} ({student.authorizedPickup2Relation}) - {student.authorizedPickup2Phone}
                      </div>
                    )}
                    {student.authorizedPickup3Name && (
                      <div className="bg-gray-50 rounded-lg p-2 text-xs">
                        <span className="font-medium">3.</span> {student.authorizedPickup3Name} ({student.authorizedPickup3Relation}) - {student.authorizedPickup3Phone}
                      </div>
                    )}
                    {!student.authorizedPickup1Name && !student.authorizedPickup2Name && !student.authorizedPickup3Name && (
                      <p className="text-xs text-gray-500">未设置授权接送人</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 打卡信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4" />
                打卡信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500">卡片号码</label>
                  <p className="text-sm font-mono mt-1">{student.cardNumber || '-'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500">卡片类型</label>
                  <Badge variant="outline" className="text-xs mt-1">
                    {student.cardType || '未分配'}
                  </Badge>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500">余额</label>
                  <p className="text-sm font-mono mt-1">{student.balance ? `$${student.balance}` : '-'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500">使用次数</label>
                  <p className="text-sm font-mono mt-1">{student.usageCount || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 报生纸副本 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                报生纸副本
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.birthCertificate ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">{student.birthCertificate}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">未上传报生纸副本</p>
              )}
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onDelete} className="px-6">
              <Trash2 className="h-4 w-4 mr-2" />
              删除学生
            </Button>
            <Button onClick={onEdit} className="px-6">
              <Edit className="h-4 w-4 mr-2" />
              编辑信息
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 