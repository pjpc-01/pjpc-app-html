"use client"

import { useState, useEffect } from "react"
import { useStudents } from "@/hooks/useStudents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Heart,
  Car,
  Shield,
  Globe,
  Calendar,
  User,
  GraduationCap,
  Award,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"

interface StudentProfileViewProps {
  teacherId?: string
}

export default function StudentProfileView({ teacherId }: StudentProfileViewProps) {
  const { students, loading, error } = useStudents()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCenter, setSelectedCenter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])

  // 过滤学生数据
  useEffect(() => {
    let filtered = students

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter((student: any) => 
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.school?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 按中心过滤
    if (selectedCenter !== "all") {
      filtered = filtered.filter((student: any) => student.center === selectedCenter)
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, selectedCenter])

  // 获取中心列表
  const centers = Array.from(new Set(students.map((s: any) => s.center).filter(Boolean)))

  // 获取学生姓名首字母
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "未设置"
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'lost': return 'bg-red-100 text-red-800'
      case 'graduated': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取服务类型颜色
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'afterschool': return 'bg-purple-100 text-purple-800'
      case 'tuition': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载学生档案中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">加载学生档案失败: {error}</p>
        <Button onClick={() => window.location.reload()}>重新加载</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">学生档案查看</h2>
        <p className="text-gray-600">查看学生详细信息、紧急联络、健康状况等档案资料</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：学生列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                学生列表 ({filteredStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 搜索和过滤 */}
              <div className="space-y-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索学生姓名、学号或学校..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">所有中心</option>
                    {centers.map((center: any) => (
                      <option key={center} value={center}>{center}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 学生列表 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedStudent?.id === student.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar || undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(student.student_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {student.student_name || '未设置姓名'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {student.student_id || '无学号'} • {student.center || '未分配中心'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(student.status || 'inactive')}`}
                          >
                            {student.status === 'active' ? '活跃' : 
                             student.status === 'inactive' ? '非活跃' :
                             student.status === 'lost' ? '丢失' : '已毕业'}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getServiceTypeColor(student.serviceType || 'afterschool')}`}
                          >
                            {student.serviceType === 'afterschool' ? '课后班' : '补习班'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>没有找到匹配的学生</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：学生档案详情 */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudent.avatar || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                        {getInitials(selectedStudent.student_name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedStudent.student_name || '未设置姓名'}
                      </h3>
                      <p className="text-gray-600">
                        {selectedStudent.student_id || '无学号'} • {selectedStudent.center || '未分配中心'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={getStatusColor(selectedStudent.status || 'inactive')}
                        >
                          {selectedStudent.status === 'active' ? '活跃' : 
                           selectedStudent.status === 'inactive' ? '非活跃' :
                           selectedStudent.status === 'lost' ? '丢失' : '已毕业'}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={getServiceTypeColor(selectedStudent.serviceType || 'afterschool')}
                        >
                          {selectedStudent.serviceType === 'afterschool' ? '课后班' : '补习班'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 基本信息 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      基本信息
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">出生日期</p>
                          <p className="font-medium">{formatDate(selectedStudent.date_of_birth)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">学校</p>
                          <p className="font-medium">{selectedStudent.school || '未设置'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">地址</p>
                          <p className="font-medium">{selectedStudent.address || '未设置'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 紧急联络 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      紧急联络
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">监护人</p>
                          <p className="font-medium">{selectedStudent.guardian_name || '未设置'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">联系电话</p>
                          <p className="font-medium">{selectedStudent.guardian_phone || '未设置'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">邮箱</p>
                          <p className="font-medium">{selectedStudent.guardian_email || '未设置'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 健康状况 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      健康状况
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">过敏史</p>
                          <p className="font-medium">{selectedStudent.allergies || '无'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">特殊需求</p>
                          <p className="font-medium">{selectedStudent.special_needs || '无'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Car className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">接送方式</p>
                          <p className="font-medium">{selectedStudent.transportation || '未设置'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 学习记录 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      学习记录
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Star className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">平均成绩</p>
                          <p className="font-medium">{selectedStudent.average_grade || '暂无'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">入学日期</p>
                          <p className="font-medium">{formatDate(selectedStudent.enrollment_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Info className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">备注</p>
                          <p className="font-medium">{selectedStudent.notes || '无'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>请选择一个学生查看详细信息</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
