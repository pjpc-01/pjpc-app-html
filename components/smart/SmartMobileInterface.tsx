"use client"

import { useState, useEffect, useRef } from "react"
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
  Wind as WindIcon
} from "lucide-react"

interface SmartWidget {
  id: string
  type: 'weather' | 'attendance' | 'tasks' | 'ai_chat' | 'quick_actions' | 'stats' | 'calendar' | 'notifications'
  title: string
  data: any
  priority: 'high' | 'medium' | 'low'
  position: { x: number; y: number }
  size: 'small' | 'medium' | 'large'
}

interface AIAssistant {
  isActive: boolean
  isListening: boolean
  currentMessage: string
  suggestions: string[]
  history: Array<{ role: 'user' | 'assistant'; message: string; timestamp: Date }>
}

interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
}

interface SmartMobileInterfaceProps {
  user?: any
  students?: any[]
  onAction?: (action: string, data?: any) => void
}

export default function SmartMobileInterface({ 
  user, 
  students = [], 
  onAction 
}: SmartMobileInterfaceProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [aiAssistant, setAiAssistant] = useState<AIAssistant>({
    isActive: false,
    isListening: false,
    currentMessage: '',
    suggestions: [],
    history: []
  })
  const [widgets, setWidgets] = useState<SmartWidget[]>([])
  const [activeWidget, setActiveWidget] = useState<string | null>(null)
  const [gestureMode, setGestureMode] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [smartMode, setSmartMode] = useState(true)
  const [notifications, setNotifications] = useState([
    { id: 1, title: '张三已打卡', message: 'WX 01中心', time: '2分钟前', type: 'success', unread: true },
    { id: 2, title: '数学作业待批改', message: '3份作业等待处理', time: '5分钟前', type: 'warning', unread: true },
    { id: 3, title: '家长会议提醒', message: '明天下午2点', time: '1小时前', type: 'info', unread: false },
  ])

  const recognitionRef = useRef<any>(null)
  const gestureRef = useRef<HTMLDivElement>(null)

  // 初始化智能组件
  useEffect(() => {
    initializeWidgets()
    initializeWeather()
    initializeAI()
    startTimeUpdate()
  }, [])

  const initializeWidgets = () => {
    const defaultWidgets: SmartWidget[] = [
      {
        id: 'weather',
        type: 'weather',
        title: '天气信息',
        data: weather,
        priority: 'low',
        position: { x: 0, y: 0 },
        size: 'small'
      },
      {
        id: 'attendance',
        type: 'attendance',
        title: '今日考勤',
        data: { total: students.length, present: Math.floor(students.length * 0.85), rate: 85 },
        priority: 'high',
        position: { x: 1, y: 0 },
        size: 'medium'
      },
      {
        id: 'ai_chat',
        type: 'ai_chat',
        title: 'AI助手',
        data: aiAssistant,
        priority: 'high',
        position: { x: 0, y: 1 },
        size: 'large'
      },
      {
        id: 'quick_actions',
        type: 'quick_actions',
        title: '快速操作',
        data: {
          actions: [
            { id: 'checkin', label: '考勤打卡', icon: Clock, color: 'bg-green-500' },
            { id: 'students', label: '学生管理', icon: Users, color: 'bg-blue-500' },
            { id: 'assignments', label: '作业批改', icon: BookOpen, color: 'bg-purple-500' },
            { id: 'announcements', label: '通知公告', icon: Bell, color: 'bg-orange-500' }
          ]
        },
        priority: 'high',
        position: { x: 1, y: 1 },
        size: 'medium'
      }
    ]
    setWidgets(defaultWidgets)
  }

  const initializeWeather = async () => {
    // 模拟天气数据
    setWeather({
      temperature: 25,
      condition: 'sunny',
      humidity: 65,
      windSpeed: 12,
      location: 'WX 01中心'
    })
  }

  const initializeAI = () => {
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
      }
    }
  }

  const startTimeUpdate = () => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }

  const handleVoiceInput = (text: string) => {
    setAiAssistant(prev => ({
      ...prev,
      currentMessage: text,
      isListening: false
    }))
    
    // 处理AI命令
    processAICommand(text)
  }

  const processAICommand = (command: string) => {
    const cmd = command.toLowerCase()
    let response = ''
    let action = ''

    if (cmd.includes('考勤') || cmd.includes('打卡')) {
      response = '正在为您打开考勤系统...'
      action = 'open_attendance'
    } else if (cmd.includes('学生') || cmd.includes('管理')) {
      response = '正在为您打开学生管理系统...'
      action = 'open_students'
    } else if (cmd.includes('作业') || cmd.includes('批改')) {
      response = '正在为您打开作业批改系统...'
      action = 'open_assignments'
    } else if (cmd.includes('天气')) {
      response = `当前天气：${weather?.temperature}°C，${weather?.condition}`
      action = 'show_weather'
    } else if (cmd.includes('时间')) {
      response = `当前时间：${currentTime.toLocaleTimeString('zh-CN')}`
      action = 'show_time'
    } else {
      response = '我理解您的需求，正在为您处理...'
      action = 'general_help'
    }

    // 更新AI助手状态
    setAiAssistant(prev => ({
      ...prev,
      history: [
        ...prev.history,
        { role: 'user', message: command, timestamp: new Date() },
        { role: 'assistant', message: response, timestamp: new Date() }
      ],
      currentMessage: ''
    }))

    // 执行动作
    if (action) {
      onAction?.(action)
    }
  }

  const toggleAI = () => {
    setAiAssistant(prev => ({
      ...prev,
      isActive: !prev.isActive
    }))
  }

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音识别功能')
      return
    }

    if (aiAssistant.isListening) {
      recognitionRef.current.stop()
      setAiAssistant(prev => ({ ...prev, isListening: false }))
    } else {
      recognitionRef.current.start()
      setAiAssistant(prev => ({ ...prev, isListening: true }))
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <SunIcon className="h-6 w-6 text-yellow-500" />
      case 'cloudy': return <CloudIcon className="h-6 w-6 text-gray-500" />
      case 'rainy': return <CloudRainIcon className="h-6 w-6 text-blue-500" />
      default: return <SunIcon className="h-6 w-6 text-yellow-500" />
    }
  }

  const renderWidget = (widget: SmartWidget) => {
    switch (widget.type) {
      case 'weather':
        return (
          <Card className="smart-widget weather-widget">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    {getWeatherIcon(weather?.condition || 'sunny')}
                    <span className="text-lg font-bold">{weather?.temperature}°C</span>
                  </div>
                  <p className="text-xs text-gray-600">{weather?.location}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>湿度 {weather?.humidity}%</p>
                  <p>风速 {weather?.windSpeed}km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'attendance':
        return (
          <Card className="smart-widget attendance-widget">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">今日考勤</h3>
                <Badge className="bg-green-100 text-green-800">
                  {widget.data.rate}%
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>已打卡</span>
                  <span className="font-semibold">{widget.data.present}/{widget.data.total}</span>
                </div>
                <Progress value={widget.data.rate} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>出勤率</span>
                  <span>{widget.data.rate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'ai_chat':
        return (
          <Card className="smart-widget ai-widget">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">AI助手</h3>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant={aiAssistant.isListening ? "default" : "outline"}
                    onClick={toggleVoice}
                    className="h-8 w-8 p-0"
                  >
                    {aiAssistant.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {aiAssistant.history.slice(-3).map((msg, index) => (
                  <div key={index} className={`text-xs p-2 rounded ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 text-blue-800 ml-4' 
                      : 'bg-gray-100 text-gray-800 mr-4'
                  }`}>
                    {msg.message}
                  </div>
                ))}
                {aiAssistant.currentMessage && (
                  <div className="text-xs p-2 rounded bg-yellow-100 text-yellow-800">
                    正在识别: "{aiAssistant.currentMessage}"
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'quick_actions':
        return (
          <Card className="smart-widget actions-widget">
            <CardContent className="p-3">
              <h3 className="font-semibold text-gray-900 mb-3">快速操作</h3>
              <div className="grid grid-cols-2 gap-2">
                {widget.data.actions.map((action: any) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onAction?.(action.id)}
                    className="h-12 flex flex-col items-center justify-center space-y-1 hover:shadow-md transition-all"
                  >
                    <div className={`p-1.5 rounded-full ${action.color} text-white`}>
                      <action.icon className="h-3 w-3" />
                    </div>
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 智能状态栏 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {user?.name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">智能工作台</h1>
                <p className="text-xs text-gray-600">AI助手在线</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-sm font-mono font-bold text-gray-900">
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
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAI}
                className={`h-8 w-8 p-0 ${aiAssistant.isActive ? 'bg-purple-100 text-purple-600' : ''}`}
              >
                <Bot className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 智能通知栏 */}
      {notifications.filter(n => n.unread).length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">
                {notifications.filter(n => n.unread).length} 条新通知
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-6 px-2"
            >
              查看全部
            </Button>
          </div>
        </div>
      )}

      {/* 智能小组件网格 */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`${
                widget.size === 'large' ? 'col-span-2' : 'col-span-1'
              } ${activeWidget === widget.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setActiveWidget(activeWidget === widget.id ? null : widget.id)}
            >
              {renderWidget(widget)}
            </div>
          ))}
        </div>

        {/* 智能建议面板 */}
        <Card className="smart-suggestion-panel">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              智能建议
            </CardTitle>
            <CardDescription>基于您的使用习惯，AI为您推荐的操作</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { 
                  title: '今日考勤率较低', 
                  description: '建议检查未打卡学生', 
                  priority: 'high',
                  action: 'check_attendance',
                  icon: AlertCircle,
                  color: 'text-red-500'
                },
                { 
                  title: '数学作业待批改', 
                  description: '3份作业等待处理', 
                  priority: 'medium',
                  action: 'grade_assignments',
                  icon: BookOpen,
                  color: 'text-yellow-500'
                },
                { 
                  title: '家长会议提醒', 
                  description: '明天下午2点家长会', 
                  priority: 'low',
                  action: 'view_schedule',
                  icon: Calendar,
                  color: 'text-blue-500'
                }
              ].map((suggestion, index) => (
                <div
                  key={index}
                  className={`smart-suggestion smart-interaction ${
                    suggestion.priority === 'high' 
                      ? 'high-priority' 
                      : suggestion.priority === 'medium'
                      ? 'medium-priority'
                      : 'low-priority'
                  }`}
                  onClick={() => onAction?.(suggestion.action)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <suggestion.icon className={`h-5 w-5 mt-0.5 ${suggestion.color}`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
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
              <Activity className="h-5 w-5 text-green-500" />
              最近活动
            </CardTitle>
            <CardDescription>实时更新的系统动态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-full ${
                    notification.type === 'success' ? 'bg-green-100' :
                    notification.type === 'warning' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    {notification.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : notification.type === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{notification.time}</p>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-auto"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 浮动AI助手按钮 */}
      {aiAssistant.isActive && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex flex-col items-end space-y-2">
            {aiAssistant.isListening && (
              <div className="bg-red-500 text-white px-3 py-2 rounded-full text-sm animate-pulse">
                正在聆听...
              </div>
            )}
            <Button
              onClick={toggleVoice}
              className={`fab fab-primary ${aiAssistant.isListening ? 'animate-pulse' : ''}`}
            >
              {aiAssistant.isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
