"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Bot, 
  Mic, 
  MicOff, 
  Search, 
  Zap, 
  Brain, 
  Sparkles,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  Clock,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Star,
  Heart,
  ThumbsUp,
  MessageCircle,
  Camera,
  QrCode,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Lightbulb,
  Rocket,
  Magic,
  Wand2,
  Sparkle,
  Star as StarIcon,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Diamond,
  Flame,
  Snowflake,
  Leaf,
  TreePine,
  Flower2,
  Sun as SunIcon,
  Moon as MoonIcon,
  Cloud as CloudIcon,
  CloudRain as CloudRainIcon,
  Thermometer as ThermometerIcon,
  Droplets as DropletsIcon,
  Wind as WindIcon,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Download,
  Upload,
  Share,
  Copy,
  Edit,
  Trash2,
  Plus,
  Minus,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Heart as HeartIcon,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Hash as HashIcon,
  AtSign as AtSignIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Equal,
  NotEqual,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  Infinity,
  Pi,
  Sigma,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Rho,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega
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
  faceId?: string
  voiceId?: string
  preferences?: {
    preferredTime: string
    preferredMethod: 'face' | 'voice' | 'qr' | 'manual'
    notifications: boolean
  }
}

interface SmartAttendanceProps {
  centerId?: string
}

export default function SmartAttendancePage({ centerId = 'wx01' }: SmartAttendanceProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present')
  const [loading, setLoading] = useState(true)
  const [aiMode, setAiMode] = useState(true)
  const [gestureMode, setGestureMode] = useState(false)
  const [faceRecognitionMode, setFaceRecognitionMode] = useState(false)
  const [qrMode, setQrMode] = useState(false)
  const [currentMode, setCurrentMode] = useState<'voice' | 'face' | 'qr' | 'manual'>('voice')
  
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    pending: 0
  })

  const recognitionRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 初始化
  useEffect(() => {
    initializeSystem()
    loadStudents()
    setupVoiceRecognition()
  }, [])

  const initializeSystem = () => {
    // 检测设备能力
    const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    const hasVoice = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    
    setFaceRecognitionMode(hasCamera)
    setAiMode(hasVoice)
  }

  const loadStudents = async () => {
    setLoading(true)
    try {
      // 模拟加载学生数据
      const mockStudents: Student[] = [
        {
          id: '1',
          name: '张三',
          studentId: 'S001',
          grade: '三年级',
          center: 'WX 01',
          parentPhone: '13800138001',
          status: 'pending',
          faceId: 'face_001',
          voiceId: 'voice_001',
          preferences: {
            preferredTime: '08:00',
            preferredMethod: 'face',
            notifications: true
          }
        },
        {
          id: '2',
          name: '李四',
          studentId: 'S002',
          grade: '四年级',
          center: 'WX 01',
          parentPhone: '13800138002',
          status: 'present',
          lastAttendance: new Date().toISOString(),
          faceId: 'face_002',
          voiceId: 'voice_002',
          preferences: {
            preferredTime: '08:30',
            preferredMethod: 'voice',
            notifications: true
          }
        },
        {
          id: '3',
          name: '王五',
          studentId: 'S003',
          grade: '五年级',
          center: 'WX 01',
          parentPhone: '13800138003',
          status: 'late',
          lastAttendance: new Date().toISOString(),
          faceId: 'face_003',
          voiceId: 'voice_003',
          preferences: {
            preferredTime: '09:00',
            preferredMethod: 'qr',
            notifications: false
          }
        }
      ]
      
      setStudents(mockStudents)
      setFilteredStudents(mockStudents)
      updateStats(mockStudents)
    } catch (error) {
      console.error('加载学生数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupVoiceRecognition = () => {
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
          handleVoiceInput(finalTranscript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('语音识别错误:', event.error)
          setIsListening(false)
        }
      }
    }
  }

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

  const handleVoiceInput = (text: string) => {
    setVoiceText(text)
    processVoiceCommand(text)
  }

  const processVoiceCommand = (command: string) => {
    const cmd = command.toLowerCase()
    
    // 搜索学生
    if (cmd.includes('搜索') || cmd.includes('找')) {
      const name = cmd.replace(/搜索|找|学生/, '').trim()
      if (name) {
        setSearchTerm(name)
        filterStudents(name)
      }
    }
    
    // 考勤状态
    if (cmd.includes('出勤') || cmd.includes('到了')) {
      setAttendanceStatus('present')
    } else if (cmd.includes('迟到')) {
      setAttendanceStatus('late')
    } else if (cmd.includes('缺席') || cmd.includes('没来')) {
      setAttendanceStatus('absent')
    }
    
    // 模式切换
    if (cmd.includes('语音') || cmd.includes('说话')) {
      setCurrentMode('voice')
    } else if (cmd.includes('人脸') || cmd.includes('拍照')) {
      setCurrentMode('face')
    } else if (cmd.includes('二维码') || cmd.includes('扫码')) {
      setCurrentMode('qr')
    }
  }

  const filterStudents = (term: string) => {
    if (term) {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(term.toLowerCase()) ||
        student.studentId.toLowerCase().includes(term.toLowerCase()) ||
        student.parentPhone.includes(term)
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }

  const toggleVoice = () => {
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
    setSelectedStudent(student)
    // 根据学生偏好自动选择模式
    if (student.preferences?.preferredMethod) {
      setCurrentMode(student.preferences.preferredMethod)
    }
  }

  const handleAttendanceSubmit = async () => {
    if (!selectedStudent) return

    try {
      // 模拟提交考勤
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
      
      // 显示成功提示
      showNotification(`${selectedStudent.name} 考勤成功！`, 'success')
    } catch (error) {
      console.error('提交考勤失败:', error)
      showNotification('考勤提交失败，请重试', 'error')
    }
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // 这里可以添加通知显示逻辑
    console.log(`${type.toUpperCase()}: ${message}`)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="h-6 w-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">正在初始化智能考勤系统...</p>
          <p className="text-sm text-gray-500 mt-2">AI助手正在为您准备个性化体验</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 智能头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 bg-white/20 rounded-full">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">智能考勤系统</h1>
                <p className="text-sm text-blue-100">AI助手 + 多模态识别</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* 智能搜索栏 */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="搜索学生姓名、学号或家长电话..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  filterStudents(e.target.value)
                }}
                className="pl-10 bg-white/90 border-white/30"
              />
            </div>
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={toggleVoice}
              className={`mobile-touch ${
                isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>

          {voiceText && (
            <div className="mt-2 text-sm bg-white/20 rounded px-3 py-2">
              <span className="text-blue-100">AI识别: </span>
              "{voiceText}"
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 智能模式选择 */}
        <Card className="smart-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">智能识别模式</h3>
              <Badge className="bg-purple-100 text-purple-800">
                AI驱动
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { mode: 'voice', label: '语音识别', icon: Mic, color: 'bg-blue-500', enabled: aiMode },
                { mode: 'face', label: '人脸识别', icon: Camera, color: 'bg-green-500', enabled: faceRecognitionMode },
                { mode: 'qr', label: '二维码', icon: QrCode, color: 'bg-purple-500', enabled: true },
                { mode: 'manual', label: '手动输入', icon: Edit, color: 'bg-gray-500', enabled: true }
              ].map(({ mode, label, icon: Icon, color, enabled }) => (
                <Button
                  key={mode}
                  variant={currentMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentMode(mode as any)}
                  disabled={!enabled}
                  className={`h-12 flex flex-col items-center justify-center space-y-1 ${
                    currentMode === mode ? `${color} text-white` : 'hover:bg-gray-100'
                  } ${!enabled ? 'opacity-50' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 实时统计 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="smart-widget">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">总学生</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-500">在校学生</div>
            </CardContent>
          </Card>

          <Card className="smart-widget">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">已考勤</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.present + stats.late}</div>
              <div className="text-xs text-gray-500">
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
              className="h-3"
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
              className={`smart-card cursor-pointer transition-all hover:shadow-lg ${
                selectedStudent?.id === student.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleStudentSelect(student)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      {student.preferences?.preferredMethod && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center">
                          {student.preferences.preferredMethod === 'face' ? (
                            <Camera className="h-2 w-2 text-blue-600" />
                          ) : student.preferences.preferredMethod === 'voice' ? (
                            <Mic className="h-2 w-2 text-blue-600" />
                          ) : student.preferences.preferredMethod === 'qr' ? (
                            <QrCode className="h-2 w-2 text-blue-600" />
                          ) : (
                            <Edit className="h-2 w-2 text-blue-600" />
                          )}
                        </div>
                      )}
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

        {/* 智能考勤操作面板 */}
        {selectedStudent && (
          <Card className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-white shadow-xl border-2 border-blue-200 z-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">学号: {selectedStudent.studentId}</p>
                  <p className="text-xs text-blue-600">
                    推荐模式: {selectedStudent.preferences?.preferredMethod === 'face' ? '人脸识别' :
                              selectedStudent.preferences?.preferredMethod === 'voice' ? '语音识别' :
                              selectedStudent.preferences?.preferredMethod === 'qr' ? '二维码' : '手动输入'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
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
                className="w-full mobile-btn bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                确认考勤
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
