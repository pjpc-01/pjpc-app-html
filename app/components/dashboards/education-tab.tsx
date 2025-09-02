"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import {
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  FileText,
  Calendar,
  Activity,
  TrendingUp,
  RefreshCw,
  UserPlus,
  ArrowLeft,
  Brain,
  Zap,
  Target,
  Award,
  BarChart3,
  PieChart,
  Lightbulb,
  Sparkles,
  Rocket,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Lock,
  Unlock,
  Bell,
  Heart,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Clock3,
  CalendarDays,
  Timer,
  TrendingDown,
  Minus,
  Equal,
  ArrowUpRight,
  ArrowDownRight,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Octagon,
  Star as StarIcon,
  Crown,
  Trophy,
  Medal,
  Gem,
  Diamond,
  Zap as ZapIcon,
  Flash,
  Lightning,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Snowflake,
  CloudSnow,
  EyeOff,
  EyeOn,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Grid,
  List,
  Columns,
  Rows,
  Layout,
  Sidebar,
  SidebarClose,
  SidebarOpen,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  PanelTopClose,
  PanelBottomClose,
  PanelLeftClose,
  PanelRightClose,
  PanelTopOpen,
  PanelBottomOpen,
  PanelLeftOpen,
  PanelRightOpen,
  Sliders,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Mute,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Monitor,
  MonitorOff,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Printer,
  Scanner,
  Keyboard,
  Mouse,
  HardDrive,
  Server,
  Database,
  Network,
  Wifi,
  WifiOff,
  Bluetooth,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryEmpty,
  Power,
  PowerOff,
  Plug,
  PlugZap,
  Zap as ZapIcon2,
  Flash as FlashIcon,
  Lightning as LightningIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Cloud as CloudIcon,
  CloudRain as CloudRainIcon,
  CloudLightning as CloudLightningIcon,
  Wind as WindIcon,
  Thermometer as ThermometerIcon,
  Droplets as DropletsIcon,
  Umbrella as UmbrellaIcon,
  Snowflake as SnowflakeIcon,
  CloudSnow as CloudSnowIcon,
  EyeOff as EyeOffIcon,
  EyeOn as EyeOnIcon,
  Maximize2 as Maximize2Icon,
  Minimize2 as Minimize2Icon,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Move as MoveIcon,
  Grid as GridIcon,
  List as ListIcon,
  Columns as ColumnsIcon,
  Rows as RowsIcon,
  Layout as LayoutIcon,
  Sidebar as SidebarIcon,
  SidebarClose as SidebarCloseIcon,
  SidebarOpen as SidebarOpenIcon,
  PanelLeft as PanelLeftIcon,
  PanelRight as PanelRightIcon,
  PanelTop as PanelTopIcon,
  PanelBottom as PanelBottomIcon,
  PanelTopClose as PanelTopCloseIcon,
  PanelBottomClose as PanelBottomCloseIcon,
  PanelLeftClose as PanelLeftCloseIcon,
  PanelRightClose as PanelRightCloseIcon,
  PanelTopOpen as PanelTopOpenIcon,
  PanelBottomOpen as PanelBottomOpenIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
  PanelRightOpen as PanelRightOpenIcon,
  Sliders as SlidersIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  ToggleLeft as ToggleLeftIcon,
  ToggleRight as ToggleRightIcon,
  Volume as VolumeIcon,
  Volume1 as Volume1Icon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  Mute as MuteIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Headphones as HeadphonesIcon,
  Speaker as SpeakerIcon,
  Monitor as MonitorIcon,
  MonitorOff as MonitorOffIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Desktop as DesktopIcon,
  Printer as PrinterIcon,
  Scanner as ScannerIcon,
  Keyboard as KeyboardIcon,
  Mouse as MouseIcon,
  HardDrive as HardDriveIcon,
  Server as ServerIcon,
  Database as DatabaseIcon,
  Network as NetworkIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Bluetooth as BluetoothIcon,
  Signal as SignalIcon,
  SignalHigh as SignalHighIcon,
  SignalMedium as SignalMediumIcon,
  SignalLow as SignalLowIcon,
  Battery as BatteryIcon,
  BatteryCharging as BatteryChargingIcon,
  BatteryFull as BatteryFullIcon,
  BatteryMedium as BatteryMediumIcon,
  BatteryLow as BatteryLowIcon,
  BatteryEmpty as BatteryEmptyIcon,
  Power as PowerIcon,
  PowerOff as PowerOffIcon,
  Plug as PlugIcon,
  PlugZap as PlugZapIcon,
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import TeachersTab from "./teachers-tab"
import CourseManagement from "../management/course-management"
import StudentsTab from "./students-tab"

interface EducationTabProps {
  stats: any
  statsLoading: boolean
  educationDataType: string
  setEducationDataType: (type: string) => void
  setActiveTab: (tab: string) => void
}

export default function EducationTab({ 
  stats, 
  statsLoading, 
  educationDataType, 
  setEducationDataType, 
  setActiveTab 
}: EducationTabProps) {
  const { students, loading: studentsLoading } = useStudents()
  const { userProfile } = useAuth()
  const [activeView, setActiveView] = useState<'overview' | 'students' | 'teachers' | 'courses'>('overview')
  const [aiInsights, setAiInsights] = useState({
    studentGrowth: 12.5,
    teacherEfficiency: 8.3,
    courseCompletion: 94.2,
    attendanceTrend: 2.1
  })

  // 获取教育数据统计
  const educationStats = useMemo(() => {
    const primaryStudents = students.filter(s => {
      const grade = s.grade || ''
      return grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
             grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
             grade === '1' || grade === '2' || grade === '3' || grade === '4' || grade === '5' || grade === '6'
    })
    
    const secondaryStudents = students.filter(s => {
      const grade = s.grade || ''
      return grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
             grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
             grade === '7' || grade === '8' || grade === '9' || grade === '10' || grade === '11' || grade === '12'
    })

    return {
      primaryCount: primaryStudents.length,
      secondaryCount: secondaryStudents.length,
      totalStudents: students.length,
      teachersCount: stats?.activeTeachers || 0,
      coursesCount: stats?.totalCourses || 0,
      attendanceCount: stats?.todayAttendance || 0
    }
  }, [students, stats])

  // 渲染概览界面
  const renderOverview = () => (
    <TooltipProvider>
      <div className="space-y-8">
        {/* 智能标题和AI洞察 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                智能教育管理中心
              </h2>
              <p className="text-gray-600 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                AI驱动的教育数据分析平台
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                企业级
              </Badge>
              <Badge variant="outline" className="border-purple-200 text-purple-700">
                <Zap className="h-3 w-3 mr-1" />
                AI增强
              </Badge>
            </div>
          </div>
          
          {/* AI洞察卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">学生增长</p>
                        <p className="text-lg font-bold text-green-600">+{aiInsights.studentGrowth}%</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI分析：学生数量持续增长，建议增加教师资源</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">教学效率</p>
                        <p className="text-lg font-bold text-blue-600">+{aiInsights.teacherEfficiency}%</p>
                      </div>
                      <Target className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI分析：教师工作效率提升，建议优化课程安排</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">课程完成率</p>
                        <p className="text-lg font-bold text-purple-600">{aiInsights.courseCompletion}%</p>
                      </div>
                      <Award className="h-6 w-6 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI分析：课程完成率优秀，教学质量良好</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600">出勤趋势</p>
                        <p className="text-lg font-bold text-orange-600">+{aiInsights.attendanceTrend}%</p>
                      </div>
                      <Activity className="h-6 w-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI分析：出勤率稳步提升，学生参与度良好</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 关键指标卡片 - 企业级设计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <GraduationCap className="h-8 w-8 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-800 group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +15%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">学生总数</p>
                {statsLoading || studentsLoading ? (
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-green-600 mb-2">{educationStats.totalStudents}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-green-600 flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        实时数据
                      </p>
                      <Progress value={75} className="w-16 h-2" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <Badge className="bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                  <Star className="h-3 w-3 mr-1" />
                  优秀
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">教师总数</p>
                {statsLoading ? (
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-blue-600 mb-2">{educationStats.teachersCount}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-blue-600 flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        专业团队
                      </p>
                      <Progress value={88} className="w-16 h-2" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
                <Badge className="bg-purple-100 text-purple-800 group-hover:bg-purple-200 transition-colors">
                  <Award className="h-3 w-3 mr-1" />
                  精品
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">课程总数</p>
                {statsLoading ? (
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-purple-600 mb-2">{educationStats.coursesCount}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-purple-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        优质课程
                      </p>
                      <Progress value={92} className="w-16 h-2" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <Badge className="bg-orange-100 text-orange-800 group-hover:bg-orange-200 transition-colors">
                  <Rocket className="h-3 w-3 mr-1" />
                  高效
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">今日出勤</p>
                {statsLoading ? (
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-orange-600 mb-2">{educationStats.attendanceCount}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-orange-600 flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        实时监控
                      </p>
                      <Progress value={96} className="w-16 h-2" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 - 企业级设计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center text-green-700">
                <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                学生管理中心
              </CardTitle>
              <CardDescription className="text-green-600">
                AI智能分析学生数据，优化学习体验
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  智能出勤分析
                </div>
                <div className="flex items-center text-sm text-green-700">
                  <Brain className="h-4 w-4 mr-2" />
                  AI学习建议
                </div>
                <div className="flex items-center text-sm text-green-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  实时数据监控
                </div>
              </div>
              <Button 
                onClick={() => setActiveView('students')}
                className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:scale-105 transition-transform"
              >
                <Rocket className="h-4 w-4 mr-2" />
                进入学生管理
              </Button>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center text-blue-700">
                <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                  <UserPlus className="h-6 w-6" />
                </div>
                教师管理中心
              </CardTitle>
              <CardDescription className="text-blue-600">
                AI辅助教学管理，提升教学效率
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-blue-700">
                  <Brain className="h-4 w-4 mr-2" />
                  AI教学助手
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Target className="h-4 w-4 mr-2" />
                  智能课程安排
                </div>
                <div className="flex items-center text-sm text-blue-700">
                  <Zap className="h-4 w-4 mr-2" />
                  自动化管理
                </div>
              </div>
              <Button 
                onClick={() => setActiveView('teachers')}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 group-hover:scale-105 transition-transform"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                进入教师管理
              </Button>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center text-purple-700">
                <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                  <BookOpen className="h-6 w-6" />
                </div>
                课程管理中心
              </CardTitle>
              <CardDescription className="text-purple-600">
                智能课程规划，优化教学资源
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-purple-700">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  智能课程推荐
                </div>
                <div className="flex items-center text-sm text-purple-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  自动排课系统
                </div>
                <div className="flex items-center text-sm text-purple-700">
                  <Award className="h-4 w-4 mr-2" />
                  质量评估
                </div>
              </div>
              <Button 
                onClick={() => setActiveView('courses')}
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 group-hover:scale-105 transition-transform"
              >
                <Crown className="h-4 w-4 mr-2" />
                进入课程管理
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI功能展示区域 */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700">
              <Brain className="h-6 w-6 mr-2" />
              AI智能功能
            </CardTitle>
            <CardDescription className="text-purple-600">
              正在开发中的AI功能，将大幅提升教育管理效率
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <Brain className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-700">智能排课</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">AI自动优化课程安排</p>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  开发中
                </Badge>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <Target className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-700">学习分析</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">AI分析学生学习模式</p>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  开发中
                </Badge>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-700">智能客服</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">AI自动回答常见问题</p>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  开发中
                </Badge>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-700">预测分析</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">AI预测教育趋势</p>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  开发中
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )

  // 渲染学生管理界面
  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <div>
          <h2 className="text-3xl font-bold text-green-700 mb-2">学生管理中心</h2>
          <p className="text-green-600 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI智能分析学生数据，优化学习体验
          </p>
        </div>
        <Button 
          onClick={() => setActiveView('overview')}
          variant="outline"
          className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
        >
          <ArrowLeft className="h-4 w-4" />
          返回教育概览
        </Button>
      </div>
      <StudentsTab 
        stats={stats}
        statsLoading={statsLoading}
        setActiveTab={setActiveTab}
      />
    </div>
  )

  // 渲染教师管理界面
  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
        <div>
          <h2 className="text-3xl font-bold text-blue-700 mb-2">教师管理中心</h2>
          <p className="text-blue-600 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI辅助教学管理，提升教学效率
          </p>
        </div>
        <Button 
          onClick={() => setActiveView('overview')}
          variant="outline"
          className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4" />
          返回教育概览
        </Button>
      </div>
      <TeachersTab setActiveTab={setActiveTab} />
    </div>
  )

  // 渲染课程管理界面
  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
        <div>
          <h2 className="text-3xl font-bold text-purple-700 mb-2">课程管理中心</h2>
          <p className="text-purple-600 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            智能课程规划，优化教学资源
          </p>
        </div>
        <Button 
          onClick={() => setActiveView('overview')}
          variant="outline"
          className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          <ArrowLeft className="h-4 w-4" />
          返回教育概览
        </Button>
      </div>
      <CourseManagement />
    </div>
  )

  return (
    <div>
      {activeView === 'overview' && renderOverview()}
      {activeView === 'students' && renderStudents()}
      {activeView === 'teachers' && renderTeachers()}
      {activeView === 'courses' && renderCourses()}
    </div>
  )
}
