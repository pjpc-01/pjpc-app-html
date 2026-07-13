"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, UserPlus, Search, Edit, Users, Trash2, Mail, Phone, Calendar, BookOpen, BarChart3, List, Brain, Zap, Target, Award, Lightbulb, Sparkles, Rocket, Star, CheckCircle, Crown, Clock, MessageSquare, BarChart3 as BarChart3Icon, PieChart, TrendingUp, Activity, Shield, Globe, Settings, Eye, Filter, Download, Upload, Plus, Minus, ArrowUpRight, ArrowDownRight, Circle, Square, Triangle, Hexagon, Octagon, Star as StarIcon, Trophy, Medal, Gem, Diamond, Zap as ZapIcon, Flash, Lightning, Sun, Moon, Cloud, CloudRain, CloudLightning, Wind, Thermometer, Droplets, Umbrella, Snowflake, CloudSnow, EyeOff, EyeOn, Maximize2, Minimize2, RotateCcw, RotateCw, ZoomIn, ZoomOut, Move, Grid, List as ListIcon, Columns, Rows, Layout, Sidebar, SidebarClose, SidebarOpen, PanelLeft, PanelRight, PanelTop, PanelBottom, PanelTopClose, PanelBottomClose, PanelLeftClose, PanelRightClose, PanelTopOpen, PanelBottomOpen, PanelLeftOpen, PanelRightOpen, Sliders, SlidersHorizontal, ToggleLeft, ToggleRight, Volume, Volume1, Volume2, VolumeX, Mute, Mic, MicOff, Headphones, Speaker, Monitor, MonitorOff, Smartphone, Tablet, Laptop, Desktop, Printer, Scanner, Keyboard, Mouse, HardDrive, Server, Database, Network, Wifi, WifiOff, Bluetooth, Signal, SignalHigh, SignalMedium, SignalLow, Battery, BatteryCharging, BatteryFull, BatteryMedium, BatteryLow, BatteryEmpty, Power, PowerOff, Plug, PlugZap, Zap as ZapIcon2, Flash as FlashIcon, Lightning as LightningIcon, Sun as SunIcon, Moon as MoonIcon, Cloud as CloudIcon, CloudRain as CloudRainIcon, CloudLightning as CloudLightningIcon, Wind as WindIcon, Thermometer as ThermometerIcon, Droplets as DropletsIcon, Umbrella as UmbrellaIcon, Snowflake as SnowflakeIcon, CloudSnow as CloudSnowIcon, EyeOff as EyeOffIcon, EyeOn as EyeOnIcon, Maximize2 as Maximize2Icon, Minimize2 as Minimize2Icon, RotateCcw as RotateCcwIcon, RotateCw as RotateCwIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, Move as MoveIcon, Grid as GridIcon, List as ListIcon2, Columns as ColumnsIcon, Rows as RowsIcon, Layout as LayoutIcon, Sidebar as SidebarIcon, SidebarClose as SidebarCloseIcon, SidebarOpen as SidebarOpenIcon, PanelLeft as PanelLeftIcon, PanelRight as PanelRightIcon, PanelTop as PanelTopIcon, PanelBottom as PanelBottomIcon, PanelTopClose as PanelTopCloseIcon, PanelBottomClose as PanelBottomCloseIcon, PanelLeftClose as PanelLeftCloseIcon, PanelRightClose as PanelRightCloseIcon, PanelTopOpen as PanelTopOpenIcon, PanelBottomOpen as PanelBottomOpenIcon, PanelLeftOpen as PanelLeftOpenIcon, PanelRightOpen as PanelRightOpenIcon, Sliders as SlidersIcon, SlidersHorizontal as SlidersHorizontalIcon, ToggleLeft as ToggleLeftIcon, ToggleRight as ToggleRightIcon, Volume as VolumeIcon, Volume1 as Volume1Icon, Volume2 as Volume2Icon, VolumeX as VolumeXIcon, Mute as MuteIcon, Mic as MicIcon, MicOff as MicOffIcon, Headphones as HeadphonesIcon, Speaker as SpeakerIcon, Monitor as MonitorIcon, MonitorOff as MonitorOffIcon, Smartphone as SmartphoneIcon, Tablet as TabletIcon, Laptop as LaptopIcon, Desktop as DesktopIcon, Printer as PrinterIcon, Scanner as ScannerIcon, Keyboard as KeyboardIcon, Mouse as MouseIcon, HardDrive as HardDriveIcon, Server as ServerIcon, Database as DatabaseIcon, Network as NetworkIcon, Wifi as WifiIcon, WifiOff as WifiOffIcon, Bluetooth as BluetoothIcon, Signal as SignalIcon, SignalHigh as SignalHighIcon, SignalMedium as SignalMediumIcon, SignalLow as SignalLowIcon, Battery as BatteryIcon, BatteryCharging as BatteryChargingIcon, BatteryFull as BatteryFullIcon, BatteryMedium as BatteryMediumIcon, BatteryLow as BatteryLowIcon, BatteryEmpty as BatteryEmptyIcon, Power as PowerIcon, PowerOff as PowerOffIcon, Plug as PlugIcon, PlugZap as PlugZapIcon } from "lucide-react"

import { useAuth } from "@/contexts/pocketbase-auth-context"
import { getStatusBadge, getStatusText, formatDate } from "@/lib/utils"
import { useTeachers } from "@/hooks/useTeachers"
import AdvancedTeacherFilters, { TeacherFilterState } from "@/components/teacher/AdvancedTeacherFilters"
import TeacherAnalytics from "@/components/teacher/TeacherAnalytics"
import TeacherBulkOperations from "@/components/teacher/TeacherBulkOperations"

// Types - use PB teacher fields
interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  department?: string
  position?: string
  status: string
  cardNumber?: string
  avatar?: string
  hireDate?: string
  nric?: string
}

interface TeacherFormData {
  name: string
  email: string
  phone: string
  subject: string
  department: string
  experience: string
  nfc_card_number: string
  permissions: 'normal_teacher' | 'senior_teacher' | 'admin'
  nfc_card_issued_date: string
  nfc_card_expiry_date: string
  hireDate: string
  resignationDate: string
}

export default function TeacherManagement() {
  const { userProfile } = useAuth()
  const { teachers: pbTeachers, loading: teachersLoading } = useTeachers()
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [newTeacher, setNewTeacher] = useState<TeacherFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    department: "",
    experience: "",
    nfc_card_number: "",
    permissions: "normal_teacher",
    nfc_card_issued_date: "",
    nfc_card_expiry_date: "",
    hireDate: "",
    resignationDate: ""
  })
  
  // Enterprise-level state
  const [viewMode, setViewMode] = useState<'list' | 'analytics' | 'ai'>('list')
  const [filters, setFilters] = useState<TeacherFilterState>({
    searchTerm: "",
    selectedSubject: "",
    selectedDepartment: "",
    selectedStatus: "",
    selectedExperience: "",
    experienceRange: [0, 30],
    hasPhone: false,
    hasEmail: false,
    emailVerified: false,
    sortBy: "name",
    sortOrder: 'asc',
    dateRange: { from: undefined, to: undefined },
    quickFilters: []
  })
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: TeacherFilterState }[]>([])

  // AI功能状态
  const [aiFeatures] = useState({
    smartScheduling: { status: 'developing', progress: 65 },
    performanceAnalysis: { status: 'developing', progress: 45 },
    autoGrading: { status: 'developing', progress: 80 },
    studentFeedback: { status: 'developing', progress: 30 },
    curriculumOptimization: { status: 'developing', progress: 55 },
    attendancePrediction: { status: 'developing', progress: 70 }
  })

  // 教师表单提交
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isEditing = !!editingTeacher
    try {
      const res = await fetch('/api/teachers' + (isEditing ? `?id=${editingTeacher!.id}` : ''), {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher)
      })
      if (!res.ok) throw new Error((await res.json()).error || '操作失败')
      alert(isEditing ? '教师信息已更新' : '教师已添加')
      setDialogOpen(false)
      setEditingTeacher(null)
      window.location.reload()
    } catch (err: any) {
      alert(err.message || '操作失败')
    }
  }

  // 从 PB 获取真实教师数据
  useEffect(() => {
    if (pbTeachers && pbTeachers.length > 0) {
      const mapped: Teacher[] = pbTeachers.map((t: any) => ({
        id: t.id || '',
        name: t.name || 'Unknown',
        email: t.email || '',
        phone: t.phone || '',
        department: t.department || '',
        position: t.position || '',
        status: t.status || 'active',
        cardNumber: t.cardNumber || '',
        avatar: t.avatar || '',
        hireDate: t.hireDate || '',
        nric: t.nric || '',
      }))
      setTeachers(mapped)
      setLoading(false)
    } else if (!teachersLoading) {
      setLoading(false)
    }
  }, [pbTeachers, teachersLoading])

  // 渲染AI功能展示
  const renderAIFeatures = () => (
    <div className="space-y-6">
      {/* AI功能标题 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
              AI智能教学助手
            </h3>
            <p className="text-gray-600 flex items-center gap-2">
              <Brain className="h-4 w-4 text-orange-600" />
              正在开发中的AI功能，将大幅减轻教师工作负担
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              企业级AI
            </Badge>
            <Badge variant="outline" className="border-orange-200 text-orange-700">
              <Zap className="h-3 w-3 mr-1" />
              智能增强
            </Badge>
          </div>
        </div>
      </div>

      {/* AI功能网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 智能排课 */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center text-green-700">
              <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                <Calendar className="h-6 w-6" />
              </div>
              智能排课系统
            </CardTitle>
            <CardDescription className="text-green-600">
              AI自动优化课程安排，考虑教师偏好和学生需求
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-green-700">
                <Brain className="h-4 w-4 mr-2" />
                智能时间分配
              </div>
              <div className="flex items-center text-sm text-green-700">
                <Target className="h-4 w-4 mr-2" />
                冲突检测
              </div>
              <div className="flex items-center text-sm text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                自动优化
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                开发中 {aiFeatures.smartScheduling.progress}%
              </Badge>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${aiFeatures.smartScheduling.progress}%` }}
                ></div>
              </div>
          </div>
        </CardContent>
      </Card>

        {/* 绩效分析 */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center text-amber-800">
              <div className="p-2 bg-amber-100 rounded-lg mr-3 group-hover:bg-amber-200 transition-colors">
                <BarChart3 className="h-6 w-6" />
              </div>
              绩效分析
            </CardTitle>
            <CardDescription className="text-amber-700">
              AI分析教师教学效果，提供改进建议
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-amber-800">
                <TrendingUp className="h-4 w-4 mr-2" />
                教学效果评估
              </div>
              <div className="flex items-center text-sm text-amber-800">
                <Target className="h-4 w-4 mr-2" />
                改进建议
              </div>
              <div className="flex items-center text-sm text-amber-800">
                <Award className="h-4 w-4 mr-2" />
                成就追踪
              </div>
            </div>
      <div className="flex items-center justify-between">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                开发中 {aiFeatures.performanceAnalysis.progress}%
              </Badge>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${aiFeatures.performanceAnalysis.progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 自动批改 */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center text-orange-700">
              <div className="p-2 bg-orange-100 rounded-lg mr-3 group-hover:bg-orange-200 transition-colors">
                <CheckCircle className="h-6 w-6" />
              </div>
              自动批改
            </CardTitle>
            <CardDescription className="text-orange-600">
              AI自动批改作业，节省教师时间
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-orange-700">
                <Brain className="h-4 w-4 mr-2" />
                智能识别答案
              </div>
              <div className="flex items-center text-sm text-orange-700">
                <Target className="h-4 w-4 mr-2" />
                自动评分
              </div>
              <div className="flex items-center text-sm text-orange-700">
                <MessageSquare className="h-4 w-4 mr-2" />
                个性化反馈
              </div>
        </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                开发中 {aiFeatures.autoGrading.progress}%
              </Badge>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${aiFeatures.autoGrading.progress}%` }}
                ></div>
        </div>
      </div>
          </CardContent>
        </Card>

        {/* 学生反馈分析 */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center text-orange-700">
              <div className="p-2 bg-orange-100 rounded-lg mr-3 group-hover:bg-orange-200 transition-colors">
                <MessageSquare className="h-6 w-6" />
              </div>
              学生反馈分析
            </CardTitle>
            <CardDescription className="text-orange-600">
              AI分析学生反馈，提供教学改进建议
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-orange-700">
                <Brain className="h-4 w-4 mr-2" />
                情感分析
              </div>
              <div className="flex items-center text-sm text-orange-700">
                <Target className="h-4 w-4 mr-2" />
                关键词提取
              </div>
              <div className="flex items-center text-sm text-orange-700">
                <Lightbulb className="h-4 w-4 mr-2" />
                改进建议
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                开发中 {aiFeatures.studentFeedback.progress}%
              </Badge>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${aiFeatures.studentFeedback.progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 课程优化 */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center text-amber-800">
              <div className="p-2 bg-amber-100 rounded-lg mr-3 group-hover:bg-amber-200 transition-colors">
                <BookOpen className="h-6 w-6" />
              </div>
              课程优化
            </CardTitle>
            <CardDescription className="text-amber-700">
              AI优化课程内容，提升教学效果
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-amber-800">
                <Brain className="h-4 w-4 mr-2" />
                内容推荐
              </div>
              <div className="flex items-center text-sm text-amber-800">
                <Target className="h-4 w-4 mr-2" />
                难度调整
              </div>
              <div className="flex items-center text-sm text-amber-800">
                <Award className="h-4 w-4 mr-2" />
                效果预测
                </div>
                      </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                开发中 {aiFeatures.curriculumOptimization.progress}%
              </Badge>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${aiFeatures.curriculumOptimization.progress}%` }}
                ></div>
                      </div>
                    </div>
          </CardContent>
        </Card>

        {/* 出勤预测 */}
        <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-full -translate-y-16 translate-x-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center text-teal-700">
              <div className="p-2 bg-teal-100 rounded-lg mr-3 group-hover:bg-teal-200 transition-colors">
                <Activity className="h-6 w-6" />
              </div>
              出勤预测
            </CardTitle>
            <CardDescription className="text-teal-600">
              AI预测学生出勤情况，提前干预
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-teal-700">
                <Brain className="h-4 w-4 mr-2" />
                模式识别
              </div>
              <div className="flex items-center text-sm text-teal-700">
                <Target className="h-4 w-4 mr-2" />
                风险预警
              </div>
              <div className="flex items-center text-sm text-teal-700">
                <Shield className="h-4 w-4 mr-2" />
                干预建议
              </div>
                      </div>
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                开发中 {aiFeatures.attendancePrediction.progress}%
              </Badge>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${aiFeatures.attendancePrediction.progress}%` }}
                ></div>
                      </div>
            </div>
          </CardContent>
        </Card>
                    </div>
                    
      {/* AI功能说明 */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-700">
            <Brain className="h-6 w-6 mr-2" />
            AI功能说明
          </CardTitle>
          <CardDescription className="text-orange-600">
            这些AI功能正在积极开发中，将逐步上线以提升教学效率
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
              <h4 className="font-medium text-orange-700 mb-3">开发计划</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Circle className="h-2 w-2 text-green-500 mr-2" />
                  第一阶段：智能排课系统（预计2周内上线）
                </li>
                <li className="flex items-center">
                  <Circle className="h-2 w-2 text-amber-500 mr-2" />
                  第二阶段：自动批改功能（预计1个月内上线）
                </li>
                <li className="flex items-center">
                  <Circle className="h-2 w-2 text-orange-500 mr-2" />
                  第三阶段：绩效分析系统（预计2个月内上线）
                </li>
                <li className="flex items-center">
                  <Circle className="h-2 w-2 text-orange-500 mr-2" />
                  第四阶段：完整AI教学助手（预计3个月内上线）
                </li>
              </ul>
                      </div>
                      <div>
              <h4 className="font-medium text-orange-700 mb-3">预期效果</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                  减少教师工作时间30%
                </li>
                <li className="flex items-center">
                  <Target className="h-4 w-4 text-amber-500 mr-2" />
                  提升教学效果25%
                </li>
                <li className="flex items-center">
                  <Award className="h-4 w-4 text-orange-500 mr-2" />
                  提高学生满意度40%
                </li>
                <li className="flex items-center">
                  <Rocket className="h-4 w-4 text-orange-500 mr-2" />
                  自动化管理流程80%
                </li>
              </ul>
                      </div>
                    </div>
        </CardContent>
      </Card>
                  </div>
  )

  // 渲染教师列表
  const renderTeacherList = () => (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="搜索教师..."
            className="w-64"
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          />
          <Button variant="outline" size="sm" onClick={() => {
            // 聚焦搜索框让用户输入筛选条件
            document.querySelector<HTMLInputElement>('input[placeholder="搜索教师..."]')?.focus()
          }}>
            <Filter className="h-4 w-4 mr-2" />
            筛选
                    </Button>
                  </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            // 导出教师列表为 CSV
            const csv = ['教师,部门,职位,电话,NFC卡号,状态,入职日期']
            teachers.forEach(t => {
              csv.push(`${t.name || ''},${t.department || ''},${t.position || ''},${t.phone || ''},${t.cardNumber || ''},${t.status || ''},${t.hireDate || ''}`)
            })
            const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = '教师列表.csv'
            a.click()
          }}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            添加教师
          </Button>
            </div>
          </div>

      {/* 教师表格 */}
      <Card>
        <CardHeader>
          <CardTitle>教师列表</CardTitle>
          <CardDescription>管理所有教师信息和状态</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>教师</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>职位</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>NFC卡号</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>入职日期</TableHead>
                <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                      <Avatar>
                          <AvatarImage src={teacher.avatar} />
                        <AvatarFallback>{teacher.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
                        </div>
                      </div>
                    </TableCell>
                  <TableCell>{teacher.department || '-'}</TableCell>
                  <TableCell>{teacher.position || '-'}</TableCell>
                  <TableCell>{teacher.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {teacher.cardNumber || '未设置'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      teacher.status === 'active' ? 'default' :
                      teacher.status === 'on_leave' ? 'secondary' : 'destructive'
                    }>
                      {teacher.status === 'active' ? '在职' :
                       teacher.status === 'on_leave' ? '请假' : '离职'}
                    </Badge>
                  </TableCell>
                  <TableCell>{teacher.hireDate || '-'}</TableCell>
                    <TableCell>
                    <div className="flex items-center gap-1">
                      <a href="/finance/payroll" title="薪资管理">
                        <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50">
                          <DollarSign className="h-4 w-4 mr-1" />薪资
                        </Button>
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => alert(`教师详情\n姓名: ${teacher.name || '-'}\n部门: ${teacher.department || '-'}\n职位: ${teacher.position || '-'}\n电话: ${teacher.phone || '-'}\n邮箱: ${teacher.email || '-'}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingTeacher(teacher)
                        setNewTeacher({
                          name: teacher.name || '',
                          email: teacher.email || '',
                          phone: teacher.phone || '',
                          subject: '',
                          department: teacher.department || '',
                          experience: '',
                          nfc_card_number: teacher.cardNumber || '',
                          permissions: 'normal_teacher',
                          nfc_card_issued_date: '',
                          nfc_card_expiry_date: '',
                          hireDate: teacher.hireDate || '',
                          resignationDate: ''
                        })
                        setDialogOpen(true)
                      }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 视图切换 */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              教师列表
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              数据分析
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI功能
            </TabsTrigger>
          </TabsList>
        </Tabs>
          </div>

      {/* 内容区域 */}
      {viewMode === 'list' && renderTeacherList()}
      {viewMode === 'analytics' && <TeacherAnalytics />}
      {viewMode === 'ai' && renderAIFeatures()}

      {/* 添加/编辑教师对话框 */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTeacher(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? '编辑教师' : '添加教师'}</DialogTitle>
            <DialogDescription>{editingTeacher ? '修改教师信息' : '添加新教师到系统'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="t-name">姓名 *</Label>
                <Input id="t-name" required value={newTeacher.name} onChange={e => setNewTeacher(p => ({...p, name: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="t-email">邮箱（可选）</Label>
                <Input id="t-email" type="email" value={newTeacher.email} onChange={e => setNewTeacher(p => ({...p, email: e.target.value}))} placeholder="teacher@school.edu.my" />
              </div>
              <div>
                <Label htmlFor="t-phone">电话</Label>
                <Input id="t-phone" value={newTeacher.phone} onChange={e => setNewTeacher(p => ({...p, phone: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="t-dept">部门</Label>
                <Select value={newTeacher.department} onValueChange={v => setNewTeacher(p => ({...p, department: v}))}>
                  <SelectTrigger><SelectValue placeholder="选择部门" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="学术部">学术部</SelectItem>
                    <SelectItem value="行政部">行政部</SelectItem>
                    <SelectItem value="财务部">财务部</SelectItem>
                    <SelectItem value="卫生管理员">卫生管理员</SelectItem>
                    <SelectItem value="后勤部">后勤部</SelectItem>
                    <SelectItem value="安亲班">安亲班</SelectItem>
                    <SelectItem value="补习部">补习部</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-subject">科目</Label>
                <Input id="t-subject" value={newTeacher.subject} onChange={e => setNewTeacher(p => ({...p, subject: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="t-perm">权限</Label>
                <Select value={newTeacher.permissions} onValueChange={v => setNewTeacher(p => ({...p, permissions: v as any}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal_teacher">普通教师</SelectItem>
                    <SelectItem value="senior_teacher">高级教师</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-nfc">NFC 卡号</Label>
                <Input id="t-nfc" value={newTeacher.nfc_card_number} onChange={e => setNewTeacher(p => ({...p, nfc_card_number: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="t-hire">入职日期</Label>
                <Input id="t-hire" type="date" value={newTeacher.hireDate} onChange={e => setNewTeacher(p => ({...p, hireDate: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="t-resign">离职日期</Label>
                <Input id="t-resign" type="date" value={newTeacher.resignationDate} onChange={e => setNewTeacher(p => ({...p, resignationDate: e.target.value}))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingTeacher(null) }}>取消</Button>
              <Button type="submit">{editingTeacher ? '保存修改' : '添加教师'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
