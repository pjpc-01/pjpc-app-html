"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import TeacherAuthModal from "@/components/smart/TeacherAuthModal"
import { 
  Smartphone, 
  Search, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Mic,
  MicOff,
  Camera,
  QrCode,
  Zap,
  Target,
  TrendingUp,
  Activity,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Bell,
  Shield,
  User as UserIcon,
} from "lucide-react"

interface Student {
  id: string
  name: string
  studentId: string
  grade: string
  center: string
  parentPhone: string
  status: 'present' | 'absent' | 'late' | 'pending'
  lastAttendance?: string
  photo?: string
}

interface Teacher {
  id: string
  teacher_name: string
  name: string
  email: string
  teacherUrl?: string
  nfc_card_number?: string
  center?: string
}

interface SmartCheckinProps {
  centerId?: string
}

export default function SmartCheckinPage({ centerId = 'wx01' }: SmartCheckinProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    pending: 0
  })

  // ---------- 教师认证状态 ----------
  const [authenticatedTeacher, setAuthenticatedTeacher] = useState<Teacher | null>(null)
  const [showTeacherAuth, setShowTeacherAuth] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'student-select'
    data?: any
  } | null>(null)

  const recognitionRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ---------- 教师认证处理 ----------
  const requireTeacherAuth = (actionType: 'student-select', data?: any) => {
    if (!authenticatedTeacher) {
      setPendingAction({ type: actionType, data })
      setShowTeacherAuth(true)
      return false
    }
    return true
  }

  const handleTeacherAuthenticated = (teacher: Teacher) => {
    setAuthenticatedTeacher(teacher)
    setShowTeacherAuth(false)
    
    // 执行待处理的操作
    if (pendingAction && pendingAction.type === 'student-select' && pendingAction.data) {
      handleStudentSelect(pendingAction.data)
    }
    setPendingAction(null)
  }

  const handleTeacherAuthClose = () => {
    setShowTeacherAuth(false)
    setPendingAction(null)
  }

  // 语音识别设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'zh-CN'

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          setVoiceText(finalTranscript)
          handleVoiceSearch(finalTranscript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('语音识别错误:', event.error)
          setIsListening(false)
        }
      }
    }
  }, [])

  // 加载学生数据
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/students')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const studentsData = data.students.map((student: any) => ({
              id: student.id,
              name: student.student_name,
              studentId: student.student_id,
              grade: student.standard || '未知',
              center: student.center || 'WX 01',
              parentPhone: student.parentPhone || student.father_phone || student.mother_phone || '',
              status: 'pending' as const,
              lastAttendance: student.lastAttendance || null
            }))
            setStudents(studentsData)
            setFilteredStudents(studentsData)
            updateStats(studentsData)
          }
        }
      } catch (error) {
        console.error('加载学生数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // 搜索过滤
  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentPhone.includes(searchTerm)
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchTerm, students])

  const updateStats = (studentsData: Student[]) => {
    const stats = {
      total: studentsData.length,
      present: studentsData.filter(s => s.status === 'present').length,
      absent: studentsData.filter(s => s.status === 'absent').length,
      late: studentsData.filter(s => s.status === 'late').length,
      pending: studentsData.filter(s => s.status === 'pending').length
    }
    setStats(stats)
  }

  const handleVoiceSearch = (text: string) => {
    setSearchTerm(text)
    if (searchInputRef.current) {
      searchInputRef.current.value = text
    }
  }

  const toggleVoiceControl = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音识别功能')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleStudentSelect = (student: Student) => {
    // 检查教师认证
    if (!requireTeacherAuth('student-select', student)) {
      return
    }
    setSelectedStudent(student)
  }

  const handleAttendanceSubmit = async () => {
    if (!selectedStudent) return

    try {
      const response = await fetch('/api/student-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          status: attendanceStatus,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toISOString(),
          center: centerId,
          teacher_id: authenticatedTeacher?.id,
          teacher_name: authenticatedTeacher?.teacher_name || authenticatedTeacher?.name,
        })
      })

      if (response.ok) {
        // 更新学生状态
        const updatedStudents = students.map(s => 
          s.id === selectedStudent.id 
            ? { ...s, status: attendanceStatus, lastAttendance: new Date().toISOString() }
            : s
        )
        setStudents(updatedStudents)
        setFilteredStudents(updatedStudents)
        updateStats(updatedStudents)
        setSelectedStudent(null)
        setSearchTerm("")
        if (searchInputRef.current) {
          searchInputRef.current.value = ""
        }
      }
    } catch (error) {
      console.error('提交考勤失败:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />
      case 'absent': return <XCircle className="h-4 w-4" />
      case 'late': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return '已出勤'
      case 'absent': return '缺席'
      case 'late': return '迟到'
      default: return '待考勤'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载学生数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 智能头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">智能考勤系统</h1>
                <p className="text-sm text-blue-100">语音搜索 + 一键打卡</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              返回
            </Button>
          </div>

          {/* 语音搜索 */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="搜索学生姓名、学号或家长电话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/90 border-white/30"
              />
            </div>
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={toggleVoiceControl}
              className={`mobile-touch ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 border-white/30 text-white hover:bg-white/30'}`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>

          {voiceText && (
            <div className="mt-2 text-sm bg-white/20 rounded px-3 py-2">
              <span className="text-blue-100">语音识别: </span>
              "{voiceText}"
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 教师认证状态 */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Shield className="h-5 w-5" />
              教师身份验证
            </CardTitle>
            <CardDescription className="text-orange-700">
              选择学生打卡需要先验证教师身份
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authenticatedTeacher ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">
                      {authenticatedTeacher.teacher_name || authenticatedTeacher.name}
                    </p>
                    <p className="text-sm text-green-600">
                      ID: {authenticatedTeacher.id}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已认证
                </Badge>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">未认证教师</p>
                    <p className="text-sm text-red-600">请先验证教师身份</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowTeacherAuth(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  验证身份
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 实时统计 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="mobile-stats-card">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">总学生</span>
              </div>
              <div className="mobile-stats-value text-blue-600">{stats.total}</div>
              <div className="mobile-stats-label">在校学生</div>
            </CardContent>
          </Card>

          <Card className="mobile-stats-card">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">已考勤</span>
              </div>
              <div className="mobile-stats-value text-green-600">{stats.present + stats.late}</div>
              <div className="mobile-stats-label">
                {stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0}% 完成率
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 进度条 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">考勤进度</span>
              <span className="text-sm text-gray-500">
                {stats.present + stats.late} / {stats.total}
              </span>
            </div>
            <Progress 
              value={stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0} 
              className="h-2"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>待考勤: {stats.pending}</span>
              <span>迟到: {stats.late}</span>
              <span>缺席: {stats.absent}</span>
            </div>
          </CardContent>
        </Card>

        {/* 学生列表 */}
        <div className="space-y-2">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedStudent?.id === student.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleStudentSelect(student)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                      <p className="text-sm text-gray-500">学号: {student.studentId}</p>
                      <p className="text-xs text-gray-400">{student.grade} | {student.center}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-xs ${getStatusColor(student.status)}`}>
                      {getStatusIcon(student.status)}
                      <span className="ml-1">{getStatusText(student.status)}</span>
                    </Badge>
                    {student.lastAttendance && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(student.lastAttendance).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 考勤操作面板 */}
        {selectedStudent && (
          <Card className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-white shadow-lg border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">学号: {selectedStudent.studentId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { status: 'present', label: '出勤', color: 'bg-green-500', icon: CheckCircle },
                  { status: 'late', label: '迟到', color: 'bg-yellow-500', icon: AlertCircle },
                  { status: 'absent', label: '缺席', color: 'bg-red-500', icon: XCircle }
                ].map(({ status, label, color, icon: Icon }) => (
                  <Button
                    key={status}
                    variant={attendanceStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAttendanceStatus(status as any)}
                    className={`mobile-btn ${
                      attendanceStatus === status 
                        ? `${color} text-white` 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleAttendanceSubmit}
                className="w-full mobile-btn bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                确认考勤
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 教师认证模态框 */}
      <TeacherAuthModal
        isOpen={showTeacherAuth}
        onClose={handleTeacherAuthClose}
        onTeacherAuthenticated={handleTeacherAuthenticated}
        centerId={centerId}
      />
    </div>
  )
}
