"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Smartphone, 
  Clock, 
  Users, 
  BookOpen, 
  Bell, 
  Mic, 
  MicOff,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Settings,
  RefreshCw
} from "lucide-react"

interface SmartDashboardProps {
  students?: any[]
  onQuickAction?: (action: string) => void
}

export default function SmartMobileDashboard({ students = [], onQuickAction }: SmartDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'attendance', message: '张三已打卡', time: '2分钟前', status: 'success' },
    { id: 2, type: 'assignment', message: '数学作业已提交', time: '5分钟前', status: 'info' },
    { id: 3, type: 'absence', message: '李四请假', time: '10分钟前', status: 'warning' },
  ])
  const [smartSuggestions, setSmartSuggestions] = useState([
    { id: 1, title: '今日考勤率较低', description: '建议检查未打卡学生', action: 'check_attendance', priority: 'high' },
    { id: 2, title: '数学作业待批改', description: '3份作业等待批改', action: 'grade_assignments', priority: 'medium' },
    { id: 3, title: '家长会议提醒', description: '明天下午2点家长会', action: 'view_schedule', priority: 'low' },
  ])

  const recognitionRef = useRef<any>(null)

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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
          handleVoiceCommand(finalTranscript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('语音识别错误:', event.error)
          setIsListening(false)
        }
      }
    }
  }, [])

  const handleVoiceCommand = (command: string) => {
    const cmd = command.toLowerCase()
    if (cmd.includes('考勤') || cmd.includes('打卡')) {
      onQuickAction?.('attendance')
    } else if (cmd.includes('学生') || cmd.includes('管理')) {
      onQuickAction?.('students')
    } else if (cmd.includes('作业') || cmd.includes('课程')) {
      onQuickAction?.('assignments')
    } else if (cmd.includes('通知') || cmd.includes('公告')) {
      onQuickAction?.('announcements')
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

  const handleSuggestionAction = (action: string) => {
    onQuickAction?.(action)
  }

  const quickActions = [
    { id: 'attendance', label: '考勤打卡', icon: Clock, color: 'bg-green-500', count: 12 },
    { id: 'students', label: '学生管理', icon: Users, color: 'bg-blue-500', count: students.length },
    { id: 'assignments', label: '作业批改', icon: BookOpen, color: 'bg-purple-500', count: 3 },
    { id: 'announcements', label: '通知公告', icon: Bell, color: 'bg-orange-500', count: 2 },
  ]

  const stats = {
    totalStudents: students.length,
    todayAttendance: Math.floor(students.length * 0.85),
    attendanceRate: 85,
    pendingAssignments: 3,
    completedToday: 12,
  }

  return (
    <div className="space-y-4">
      {/* 智能状态栏 */}
      <Card className="smart-card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-full smart-interaction">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">智能工作台</h3>
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="status-indicator status-online"></span>
                  AI助手为您服务
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-bold text-gray-900">
                {currentTime.toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-xs text-gray-500">
                {currentTime.toLocaleDateString('zh-CN', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* 语音控制 */}
          <div className="flex items-center space-x-2">
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={toggleVoiceControl}
              className={`flex-1 mobile-btn touch-feedback ${
                isListening ? 'voice-listening' : ''
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  停止语音控制
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  语音控制
                </>
              )}
            </Button>
            {voiceText && (
              <div className="flex-1 text-sm text-gray-600 bg-white rounded px-2 py-1 search-highlight">
                "{voiceText}"
              </div>
            )}
          </div>
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
            <div className="mobile-stats-value text-blue-600">{stats.totalStudents}</div>
            <div className="mobile-stats-label">在校学生</div>
          </CardContent>
        </Card>

        <Card className="mobile-stats-card">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">今日考勤</span>
            </div>
            <div className="mobile-stats-value text-green-600">{stats.todayAttendance}</div>
            <div className="mobile-stats-label">{stats.attendanceRate}% 出勤率</div>
          </CardContent>
        </Card>

        <Card className="mobile-stats-card">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">待批改</span>
            </div>
            <div className="mobile-stats-value text-purple-600">{stats.pendingAssignments}</div>
            <div className="mobile-stats-label">作业待处理</div>
          </CardContent>
        </Card>

        <Card className="mobile-stats-card">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">今日完成</span>
            </div>
            <div className="mobile-stats-value text-orange-600">{stats.completedToday}</div>
            <div className="mobile-stats-label">任务完成</div>
          </CardContent>
        </Card>
      </div>

      {/* 智能快捷操作 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            智能快捷操作
          </CardTitle>
          <CardDescription>一键访问常用功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  onClick={() => onQuickAction?.(action.id)}
                  className="h-20 flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-all"
                >
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{action.label}</div>
                    {action.count > 0 && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 智能建议 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            智能建议
          </CardTitle>
          <CardDescription>AI为您推荐的操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {smartSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`smart-suggestion smart-interaction ${
                  suggestion.priority === 'high' 
                    ? 'high-priority' 
                    : suggestion.priority === 'medium'
                    ? 'medium-priority'
                    : 'low-priority'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSuggestionAction(suggestion.action)}
                    className="ml-2 mobile-btn-sm touch-feedback"
                  >
                    处理
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 最近活动 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-green-600" />
            最近活动
          </CardTitle>
          <CardDescription>实时更新动态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`p-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-100' :
                  activity.status === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {activity.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : activity.status === 'warning' ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
