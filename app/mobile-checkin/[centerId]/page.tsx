"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Search,
  Users,
  Calendar,
  Activity
} from "lucide-react"

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  status: string
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  center: string
  date: string
  time: string
  status: 'present' | 'late' | 'absent'
  timestamp: string
}

export default function MobileCheckinPage() {
  const params = useParams()
  const router = useRouter()
  const centerId = params.centerId as string
  
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'late' | 'absent'>('present')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [centerInfo, setCenterInfo] = useState({
    name: centerId,
    totalStudents: 0,
    checkedInToday: 0,
    attendanceRate: 0
  })

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 获取学生数据
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/students')
        if (response.ok) {
          const data = await response.json()
          const centerStudents = data.students.filter((s: Student) => s.center === centerId)
          setStudents(centerStudents)
          setCenterInfo(prev => ({
            ...prev,
            totalStudents: centerStudents.length
          }))
        }
      } catch (error) {
        console.error('获取学生数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    if (centerId) {
      fetchStudents()
    }
  }, [centerId])

  // 获取今日考勤记录
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/student-attendance?date=${today}&center=${centerId}`)
        if (response.ok) {
          const data = await response.json()
          setAttendanceRecords(data.data || [])
          
          // 计算考勤率
          const checkedInToday = data.data?.filter((r: AttendanceRecord) => r.status === 'present').length || 0
          const totalStudents = students.length
          const attendanceRate = totalStudents > 0 ? Math.round((checkedInToday / totalStudents) * 100) : 0
          
          setCenterInfo(prev => ({
            ...prev,
            checkedInToday,
            attendanceRate
          }))
        }
      } catch (error) {
        console.error('获取考勤记录失败:', error)
      }
    }

    if (centerId && students.length > 0) {
      fetchAttendance()
    }
  }, [centerId, students])

  // 提交考勤
  const handleSubmitAttendance = async () => {
    if (!selectedStudent || !attendanceStatus) return

    setIsSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()
      
      const attendanceData = {
        student_id: selectedStudent.student_id,
        student_name: selectedStudent.student_name,
        center: centerId,
        date: today,
        time: now,
        status: attendanceStatus,
        timestamp: now
      }

      const response = await fetch('/api/student-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      })

      if (response.ok) {
        // 更新本地状态
        setAttendanceRecords(prev => [...prev, attendanceData])
        setSelectedStudent(null)
        setAttendanceStatus('present')
        
        // 刷新学生列表和考勤统计
        const updatedResponse = await fetch(`/api/student-attendance?date=${today}&center=${centerId}`)
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setAttendanceRecords(updatedData.data || [])
          
          const checkedInToday = updatedData.data?.filter((r: AttendanceRecord) => r.status === 'present').length || 0
          const totalStudents = students.length
          const attendanceRate = totalStudents > 0 ? Math.round((checkedInToday / totalStudents) * 100) : 0
          
          setCenterInfo(prev => ({
            ...prev,
            checkedInToday,
            attendanceRate
          }))
        }
      } else {
        console.error('提交考勤失败')
      }
    } catch (error) {
      console.error('提交考勤出错:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 过滤学生列表
  const filteredStudents = students.filter(student => 
    student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 检查学生是否已考勤
  const isStudentCheckedIn = (studentId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return attendanceRecords.some(record => 
      record.student_id === studentId && record.date === today
    )
  }

  // 获取学生考勤状态
  const getStudentAttendanceStatus = (studentId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const record = attendanceRecords.find(r => r.student_id === studentId && r.date === today)
    return record?.status || null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">移动端考勤</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 中心信息卡片 */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <MapPin className="h-5 w-5" />
              {centerInfo.name} 中心
            </CardTitle>
            <CardDescription className="text-blue-700">
              移动端考勤系统
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-800">{centerInfo.totalStudents}</div>
                <div className="text-xs text-blue-600">总学生</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{centerInfo.checkedInToday}</div>
                <div className="text-xs text-green-600">今日已打卡</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{centerInfo.attendanceRate}%</div>
                <div className="text-xs text-purple-600">出勤率</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 当前时间 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {currentTime.toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 考勤操作 */}
        {selectedStudent && (
          <Card className="mb-6 border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800">考勤打卡</CardTitle>
              <CardDescription className="text-green-700">
                为 {selectedStudent.student_name} 进行考勤
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {selectedStudent.student_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{selectedStudent.student_name}</p>
                  <p className="text-sm text-gray-500">学号: {selectedStudent.student_id}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">考勤状态</label>
                <Select value={attendanceStatus} onValueChange={(value: 'present' | 'late' | 'absent') => setAttendanceStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        出勤
                      </div>
                    </SelectItem>
                    <SelectItem value="late">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        迟到
                      </div>
                    </SelectItem>
                    <SelectItem value="absent">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        缺席
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      确认打卡
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 搜索学生 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">选择学生</CardTitle>
            <CardDescription>搜索并选择要考勤的学生</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStudents.map((student) => {
                const isCheckedIn = isStudentCheckedIn(student.student_id)
                const attendanceStatus = getStudentAttendanceStatus(student.student_id)
                
                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isCheckedIn
                        ? attendanceStatus === 'present'
                          ? 'border-green-200 bg-green-50'
                          : attendanceStatus === 'late'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => !isCheckedIn && setSelectedStudent(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${
                            isCheckedIn
                              ? attendanceStatus === 'present'
                                ? 'bg-green-100 text-green-600'
                                : attendanceStatus === 'late'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {student.student_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{student.student_name}</p>
                          <p className="text-sm text-gray-500">{student.student_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isCheckedIn ? (
                          <Badge variant={
                            attendanceStatus === 'present' ? 'default' :
                            attendanceStatus === 'late' ? 'secondary' :
                            'destructive'
                          }>
                            {attendanceStatus === 'present' ? '已打卡' :
                             attendanceStatus === 'late' ? '迟到' : '缺席'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            待打卡
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>没有找到匹配的学生</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 今日考勤记录 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">今日考勤记录</CardTitle>
            <CardDescription>查看今日的考勤情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`${
                          record.status === 'present' ? 'bg-green-100 text-green-600' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {record.student_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{record.student_name}</p>
                        <p className="text-xs text-gray-500">{record.time}</p>
                      </div>
                    </div>
                    <Badge variant={
                      record.status === 'present' ? 'default' :
                      record.status === 'late' ? 'secondary' :
                      'destructive'
                    }>
                      {record.status === 'present' ? '出勤' :
                       record.status === 'late' ? '迟到' : '缺席'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>暂无考勤记录</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
