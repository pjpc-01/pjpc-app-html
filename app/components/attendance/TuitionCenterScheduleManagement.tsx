'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen,
  GraduationCap,
  School,
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Copy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  UserCheck,
  UserX,
  BookMarked,
  Users2,
  Clock3,
  MapPin,
  Brain,
  Shield,
  Star
} from 'lucide-react'
import AddScheduleModal from './AddScheduleModal'
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isSameDay, 
  parseISO,
  eachDayOfInterval,
  isToday,
  isWeekend,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useSchedule } from '@/hooks/useSchedule'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import DraggableScheduleItem from './DraggableScheduleItem'
import DroppableScheduleCell from './DroppableScheduleCell'
import MultiDayDragHandler from './MultiDayDragHandler'
import SmartSchedulePanel from './SmartSchedulePanel'

// 安亲补习中心员工类型定义
interface Employee {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  department: string
  position: string
  subjects: string[] // 教授科目（教学岗位）
  grades: string[] // 教授年级（教学岗位）
  experience: number // 工作经验年数
  maxHoursPerWeek: number
  preferredTimes: string[] // 偏好时间段
  unavailableDays: string[] // 不可用日期
  avatar?: string
  status: 'active' | 'inactive' | 'on_leave'
  center: string // 所属中心
  hourlyRate?: number // 时薪（兼职和仅教书老师）
  monthlySalary?: number // 月薪（全职员工）
  skills: string[] // 技能标签
  certifications: string[] // 认证资格
}

// 排班模板 - 与数据库结构匹配
interface ScheduleTemplate {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  work_days: number[] // 0-6, 0=Sunday (JSON array)
  start_time: string
  end_time: string
  max_hours_per_week: number
  color: string
  is_active: boolean
  created?: string
  updated?: string
}

// 课程安排
interface ClassSchedule {
  id: string
  name: string
  subject: string
  grade: string
  center: string
  room: string
  startTime: string
  endTime: string
  maxStudents: number
  currentStudents: number
  teacherId?: string
  teacherName?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  color: string
  notes?: string
}

// 排班记录 - 与数据库结构匹配
interface Schedule {
  id: string
  teacher_id: string
  teacher_name?: string
  class_id?: string
  class_name?: string
  date: string
  start_time: string
  end_time: string
  center: string
  room?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  is_overtime: boolean
  hourly_rate?: number
  total_hours: number
  schedule_type: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  template_id?: string
  notes?: string
  created_by?: string
  approved_by?: string
  created?: string
  updated?: string
}

// 时间槽位
interface TimeSlot {
  id: string
  name: string
  startTime: string
  endTime: string
  type: 'morning' | 'afternoon' | 'evening' | 'weekend'
  isActive: boolean
  maxClasses: number
  color: string
}

export default function TuitionCenterScheduleManagement() {
  // 使用排班Hook
  const {
    schedules,
    templates,
    loading,
    error,
    fetchSchedules,
    fetchTemplates,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    autoSchedule
  } = useSchedule()

  // 视图状态
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCenter, setSelectedCenter] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedEmployeeType, setSelectedEmployeeType] = useState('all')
  
  // 数据状态
  const [employees, setEmployees] = useState<Employee[]>([])
  const [classes, setClasses] = useState<ClassSchedule[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  
  // UI状态
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [isAddingClass, setIsAddingClass] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // 拖拽状态
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedSchedule, setDraggedSchedule] = useState<Schedule | null>(null)
  
  // 批量操作状态
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkTemplate, setBulkTemplate] = useState<string>('')
  const [bulkStartTime, setBulkStartTime] = useState<string>('09:00')
  const [bulkEndTime, setBulkEndTime] = useState<string>('17:00')

  // 默认员工数据
  const defaultEmployees: Employee[] = [
    {
      id: 'ho3yrz7fz7gizmb', // 使用真实的PocketBase教师ID
      name: 'Cheng Mun Poo',
      type: 'fulltime',
      department: '管理层',
      position: '中心负责人/校长',
      subjects: ['数学', '科学'],
      grades: ['四年级', '五年级', '六年级'],
      experience: 10,
      maxHoursPerWeek: 40,
      preferredTimes: ['09:00-12:00', '14:00-17:00'],
      unavailableDays: [],
      status: 'active',
      center: '总校',
      monthlySalary: 5000,
      skills: ['教学管理', '课程规划', '团队领导'],
      certifications: ['教育学硕士', '校长资格证']
    },
    {
      id: 'ls7fa1sogyc4g3m', // 使用真实的PocketBase教师ID
      name: 'WONG CHOW MEI',
      type: 'fulltime',
      department: '学术部门',
      position: '班主任',
      subjects: ['华文', '数学'],
      grades: ['三年级', '四年级'],
      experience: 5,
      maxHoursPerWeek: 40,
      preferredTimes: ['08:00-12:00', '14:00-18:00'],
      unavailableDays: [],
      status: 'active',
      center: '总校',
      monthlySalary: 3500,
      skills: ['班级管理', '学生辅导', '家长沟通'],
      certifications: ['教育学学士', '班主任资格证']
    },
    {
      id: 'mock-teacher-3', // 模拟ID，因为PocketBase中只有2个教师
      name: '李老师',
      type: 'parttime',
      department: '学术部门',
      position: '科任老师/辅导老师',
      subjects: ['英文'],
      grades: ['一年级', '二年级', '三年级'],
      experience: 3,
      maxHoursPerWeek: 20,
      preferredTimes: ['14:00-18:00'],
      unavailableDays: ['saturday', 'sunday'],
      status: 'active',
      center: '总校',
      hourlyRate: 25,
      skills: ['英语教学', '儿童心理学'],
      certifications: ['英语专业学士', 'TESOL证书']
    },
    {
      id: 'mock-teacher-4', // 模拟ID，因为PocketBase中只有2个教师
      name: '王老师',
      type: 'teaching_only',
      department: '学术部门',
      position: '外聘老师',
      subjects: ['科学'],
      grades: ['五年级', '六年级'],
      experience: 8,
      maxHoursPerWeek: 15,
      preferredTimes: ['16:00-19:00'],
      unavailableDays: ['monday', 'tuesday'],
      status: 'active',
      center: '总校',
      hourlyRate: 35,
      skills: ['科学实验', 'STEM教育'],
      certifications: ['科学教育硕士', 'STEM认证']
    },
    // 行政岗位
    {
      id: 'mock-admin-1',
      name: '李秘书',
      type: 'admin',
      department: '行政部',
      position: '前台接待',
      subjects: [],
      grades: [],
      experience: 3,
      maxHoursPerWeek: 40,
      preferredTimes: ['08:00-12:00', '14:00-18:00'],
      unavailableDays: [],
      status: 'active',
      center: '总校',
      monthlySalary: 2800,
      skills: ['客户服务', '办公软件', '电话接听'],
      certifications: ['文秘证书', '普通话等级证书']
    },
    {
      id: 'mock-admin-2',
      name: '张会计',
      type: 'admin',
      department: '财务部',
      position: '财务人员',
      subjects: [],
      grades: [],
      experience: 5,
      maxHoursPerWeek: 40,
      preferredTimes: ['09:00-17:00'],
      unavailableDays: ['saturday', 'sunday'],
      status: 'active',
      center: '总校',
      monthlySalary: 3500,
      skills: ['财务管理', 'Excel', '会计软件'],
      certifications: ['会计从业资格证', '初级会计师']
    },
    // 后勤岗位
    {
      id: 'mock-support-1',
      name: '王阿姨',
      type: 'support',
      department: '后勤部',
      position: '清洁工',
      subjects: [],
      grades: [],
      experience: 2,
      maxHoursPerWeek: 30,
      preferredTimes: ['06:00-10:00', '16:00-20:00'],
      unavailableDays: [],
      status: 'active',
      center: '总校',
      hourlyRate: 15,
      skills: ['清洁卫生', '设备维护'],
      certifications: ['健康证']
    },
    {
      id: 'mock-support-2',
      name: '老李',
      type: 'support',
      department: '后勤部',
      position: '保安',
      subjects: [],
      grades: [],
      experience: 4,
      maxHoursPerWeek: 48,
      preferredTimes: ['20:00-08:00'],
      unavailableDays: [],
      status: 'active',
      center: '总校',
      hourlyRate: 18,
      skills: ['安全保卫', '监控操作', '应急处理'],
      certifications: ['保安证', '消防证']
    },
    // 服务岗位
    {
      id: 'mock-service-1',
      name: '陈师傅',
      type: 'service',
      department: '服务部',
      position: '学生接送员',
      subjects: [],
      grades: [],
      experience: 3,
      maxHoursPerWeek: 25,
      preferredTimes: ['07:00-09:00', '15:00-17:00'],
      unavailableDays: ['saturday', 'sunday'],
      status: 'active',
      center: '总校',
      hourlyRate: 20,
      skills: ['驾驶', '学生管理', '路线规划'],
      certifications: ['驾驶证', '学生接送证']
    },
    {
      id: 'mock-service-2',
      name: '刘阿姨',
      type: 'service',
      department: '服务部',
      position: '食堂工作人员',
      subjects: [],
      grades: [],
      experience: 2,
      maxHoursPerWeek: 35,
      preferredTimes: ['10:00-14:00', '16:00-19:00'],
      unavailableDays: [],
      status: 'active',
      center: '总校',
      hourlyRate: 16,
      skills: ['烹饪', '营养搭配', '食品安全'],
      certifications: ['健康证', '食品安全证']
    }
  ]

  // 默认排班模板 - 与数据库结构匹配
  const defaultTemplates: ScheduleTemplate[] = [
    {
      id: 'fulltime-manager',
      name: '管理层标准班',
      type: 'fulltime',
      work_days: [1, 2, 3, 4, 5],
      start_time: '08:00',
      end_time: '18:00',
      max_hours_per_week: 40,
      color: '#3b82f6',
      is_active: true
    },
    {
      id: 'fulltime-teacher',
      name: '全职教师班',
      type: 'fulltime',
      work_days: [1, 2, 3, 4, 5],
      start_time: '09:00',
      end_time: '17:00',
      max_hours_per_week: 40,
      color: '#10b981',
      is_active: true
    },
    {
      id: 'parttime-afternoon',
      name: '兼职下午班',
      type: 'parttime',
      work_days: [1, 2, 3, 4, 5],
      start_time: '14:00',
      end_time: '18:00',
      max_hours_per_week: 20,
      color: '#f59e0b',
      is_active: true
    },
    {
      id: 'teaching-only',
      name: '仅教书时段',
      type: 'teaching_only',
      work_days: [1, 2, 3, 4, 5, 6, 0],
      start_time: '16:00',
      end_time: '19:00',
      max_hours_per_week: 15,
      color: '#8b5cf6',
      is_active: true
    },
    // 行政岗位模板
    {
      id: 'admin-standard',
      name: '行政人员标准班',
      type: 'admin',
      workDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '17:00',
      breakDuration: 60,
      maxHoursPerWeek: 40,
      color: '#ec4899',
      description: '行政人员标准工作时间',
      requirements: ['办公软件技能', '沟通能力']
    },
    {
      id: 'admin-frontdesk',
      name: '前台接待班',
      type: 'admin',
      workDays: [1, 2, 3, 4, 5],
      startTime: '07:30',
      endTime: '18:30',
      breakDuration: 60,
      maxHoursPerWeek: 40,
      color: '#f97316',
      description: '前台接待工作时间',
      requirements: ['客户服务技能', '普通话流利']
    },
    // 后勤岗位模板
    {
      id: 'support-cleaner-morning',
      name: '清洁工早班',
      type: 'support',
      workDays: [1, 2, 3, 4, 5, 6],
      startTime: '06:00',
      endTime: '10:00',
      breakDuration: 0,
      maxHoursPerWeek: 24,
      color: '#6b7280',
      description: '清洁工早班时间',
      requirements: ['健康证', '清洁技能']
    },
    {
      id: 'support-cleaner-evening',
      name: '清洁工晚班',
      type: 'support',
      workDays: [1, 2, 3, 4, 5],
      startTime: '16:00',
      endTime: '20:00',
      breakDuration: 0,
      maxHoursPerWeek: 20,
      color: '#6b7280',
      description: '清洁工晚班时间',
      requirements: ['健康证', '清洁技能']
    },
    {
      id: 'support-security-night',
      name: '保安夜班',
      type: 'support',
      workDays: [1, 2, 3, 4, 5, 6, 0],
      startTime: '20:00',
      endTime: '08:00',
      breakDuration: 0,
      maxHoursPerWeek: 48,
      color: '#dc2626',
      description: '保安夜班时间',
      requirements: ['保安证', '消防证']
    },
    // 服务岗位模板
    {
      id: 'service-transport',
      name: '学生接送员',
      type: 'service',
      workDays: [1, 2, 3, 4, 5],
      startTime: '07:00',
      endTime: '09:00',
      breakDuration: 0,
      maxHoursPerWeek: 10,
      color: '#059669',
      description: '学生接送时间',
      requirements: ['驾驶证', '学生接送证']
    },
    {
      id: 'service-canteen',
      name: '食堂工作人员',
      type: 'service',
      workDays: [1, 2, 3, 4, 5],
      startTime: '10:00',
      endTime: '14:00',
      breakDuration: 30,
      maxHoursPerWeek: 20,
      color: '#d97706',
      description: '食堂工作时间',
      requirements: ['健康证', '食品安全证']
    }
  ]

  // 默认时间槽位
  const defaultTimeSlots: TimeSlot[] = [
    {
      id: 'morning-1',
      name: '早班',
      startTime: '08:00',
      endTime: '12:00',
      type: 'morning',
      isActive: true,
      maxClasses: 4,
      color: '#fbbf24'
    },
    {
      id: 'afternoon-1',
      name: '下午班',
      startTime: '14:00',
      endTime: '18:00',
      type: 'afternoon',
      isActive: true,
      maxClasses: 4,
      color: '#f59e0b'
    },
    {
      id: 'evening-1',
      name: '晚班',
      startTime: '18:00',
      endTime: '21:00',
      type: 'evening',
      isActive: true,
      maxClasses: 3,
      color: '#8b5cf6'
    },
    {
      id: 'weekend-1',
      name: '周末班',
      startTime: '09:00',
      endTime: '17:00',
      type: 'weekend',
      isActive: true,
      maxClasses: 6,
      color: '#10b981'
    }
  ]

  // 获取视图日期
  const getViewDates = () => {
    switch (viewMode) {
      case 'day':
        return [currentDate]
      case 'week':
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        return eachDayOfInterval({ start, end: addDays(start, 6) })
      case 'month':
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        return eachDayOfInterval({ start: monthStart, end: monthEnd })
      default:
        return []
    }
  }

  // 获取某日的排班
  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules.filter(s => s.date === dateStr)
  }

  // 获取某日的课程
  const getClassesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return classes.filter(c => c.startTime.startsWith(dateStr.split('T')[0]))
  }

  // 计算员工评分（用于智能排班）
  const calculateEmployeeScore = (employee: Employee, date: Date, classInfo?: ClassSchedule) => {
    let score = 0
    
    // 基础分数
    score += employee.experience * 2
    
    // 状态分数
    if (employee.status === 'active') score += 10
    if (employee.status === 'on_leave') score -= 20
    
    // 可用性检查
    const dayOfWeek = date.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    if (employee.unavailableDays.includes(dayName)) {
      score -= 50
    }
    
    // 科目匹配
    if (classInfo && employee.subjects.includes(classInfo.subject)) {
      score += 15
    }
    
    // 年级匹配
    if (classInfo && employee.grades.includes(classInfo.grade)) {
      score += 10
    }
    
    // 中心匹配
    if (classInfo && employee.center === classInfo.center) {
      score += 5
    }
    
    // 经验匹配
    if (classInfo) {
      const gradeLevel = parseInt(classInfo.grade.replace(/[^\d]/g, ''))
      if (gradeLevel <= 3 && employee.experience >= 2) score += 5
      if (gradeLevel >= 4 && employee.experience >= 5) score += 10
    }
    
    return score
  }

  // 智能排班建议
  const getSmartSuggestions = (date: Date, classId?: string) => {
    const classInfo = classId ? classes.find(c => c.id === classId) : undefined
    const availableEmployees = employees.filter(emp => emp.status === 'active')
    
    return availableEmployees
      .map(emp => ({
        ...emp,
        score: calculateEmployeeScore(emp, date, classInfo)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  // 自动排班
  const handleAutoSchedule = async () => {
    try {
      const dates = getViewDates()
      const startDate = format(dates[0], 'yyyy-MM-dd')
      const endDate = format(dates[dates.length - 1], 'yyyy-MM-dd')

      await autoSchedule({
        startDate,
        endDate,
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        preferences: {
          prioritizeExperience: true,
          avoidOvertime: true,
          balanceWorkload: true
        }
      })

      // 重新获取排班数据
      await fetchSchedules({
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
      })
    } catch (error) {
      console.error('自动排班失败:', error)
    }
  }

  // 保存排班
  const saveSchedule = async (schedule: Schedule) => {
    try {
      await updateSchedule(schedule.id, schedule)
    } catch (error) {
      console.error('保存排班失败:', error)
    }
  }

  // 删除排班
  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId)
    } catch (error) {
      console.error('删除排班失败:', error)
    }
  }

  // 处理添加排班
  const handleAddSchedule = async (scheduleData: any) => {
    try {
      await createSchedule(scheduleData)
      
      // 重新获取排班数据
      await fetchSchedules({
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
      })

      alert('排班添加成功！')
    } catch (error) {
      console.error('添加排班失败:', error)
      throw error // 让浮窗组件处理错误显示
    }
  }

  // 拖拽开始处理
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    if (active.data.current?.type === 'schedule') {
      setDraggedSchedule(active.data.current.schedule)
    }
  }

  // 拖拽结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedSchedule(null)

    if (!over || !active.data.current?.schedule) return

    const schedule = active.data.current.schedule
    const overData = over.data.current

    // 如果拖拽到排班单元格
    if (overData?.type === 'schedule-cell') {
      const newDate = overData.date
      const newEmployeeId = overData.employeeId
      
      // 检查是否移动到不同的日期或员工
      if (schedule.date !== format(newDate, 'yyyy-MM-dd') || 
          schedule.teacher_id !== newEmployeeId) {
        
        try {
          // 更新排班
          await updateSchedule(schedule.id, {
            date: format(newDate, 'yyyy-MM-dd'),
            teacher_id: newEmployeeId
          })

          // 重新获取排班数据
          await fetchSchedules({
            center: selectedCenter !== 'all' ? selectedCenter : undefined,
            type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
          })

          console.log('排班移动成功')
        } catch (error) {
          console.error('移动排班失败:', error)
          alert('移动排班失败，请重试')
        }
      }
    }
  }

  // 拖拽悬停处理
  const handleDragOver = (event: DragOverEvent) => {
    // 可以在这里添加悬停时的视觉反馈
  }

  // 处理排班编辑
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    // 这里可以打开编辑对话框
  }


  // 处理添加排班（从单元格点击）
  const handleAddScheduleFromCell = (date: Date, employeeId: string) => {
    // 简单模式：直接打开添加排班浮窗
    setSelectedDate(date)
    setIsAddingSchedule(true)
  }

  // 切换批量模式
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode)
    if (!isBulkMode) {
      setSelectedCells(new Set())
    }
  }

  // 批量创建排班
  const handleBulkCreateSchedules = async () => {
    if (selectedCells.size === 0) {
      alert('请先选择要创建排班的单元格')
      return
    }

    try {
      const promises: Promise<any>[] = []
      
      for (const cellId of selectedCells) {
        const [employeeId, dateStr] = cellId.split('-')
        const employee = employees.find(emp => emp.id === employeeId)
        
        if (employee) {
          const scheduleData = {
            teacher_id: employeeId,
            teacher_name: employee.name,
            schedule_type: employee.type,
            date: dateStr,
            start_time: bulkStartTime,
            end_time: bulkEndTime,
            center: employee.center || '总校',
            room: 'A101',
            status: 'scheduled' as const,
            is_overtime: false,
            hourly_rate: employee.hourlyRate,
            total_hours: calculateHours(bulkStartTime, bulkEndTime),
            notes: '批量创建'
          }
          
          promises.push(createSchedule(scheduleData))
        }
      }

      await Promise.all(promises)

      // 重新获取排班数据
      await fetchSchedules({
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
      })

      alert(`成功创建 ${selectedCells.size} 个排班！`)
      setSelectedCells(new Set())
      setIsBulkMode(false)
    } catch (error) {
      console.error('批量创建排班失败:', error)
      alert('批量创建排班失败，请重试')
    }
  }

  // 计算工作时长
  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10
  }

  // 智能排班处理
  const handleSmartSchedule = async (scheduleData: any) => {
    try {
      await createSchedule(scheduleData)
      
      // 重新获取排班数据
      await fetchSchedules({
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
      })
    } catch (error) {
      console.error('智能排班失败:', error)
      throw error
    }
  }

  // 处理复制到多天
  const handleCopyToMultipleDays = async (schedule: Schedule, targetDates: Date[]) => {
    try {
      for (const date of targetDates) {
        const newScheduleData = {
          ...schedule,
          id: undefined, // 让后端生成新ID
          date: format(date, 'yyyy-MM-dd'),
          status: 'scheduled' as const
        }
        await createSchedule(newScheduleData)
      }

      // 重新获取排班数据
      await fetchSchedules({
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
      })

      alert(`成功复制到 ${targetDates.length} 天！`)
    } catch (error) {
      console.error('复制排班失败:', error)
      alert('复制排班失败，请重试')
    }
  }

  // 处理删除多个排班
  const handleDeleteMultiple = async (scheduleIds: string[]) => {
    try {
      for (const scheduleId of scheduleIds) {
        await deleteSchedule(scheduleId)
      }
      
      // 重新获取排班数据
      await fetchSchedules({
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
      })

      alert(`成功删除 ${scheduleIds.length} 个排班！`)
    } catch (error) {
      console.error('删除多个排班失败:', error)
      alert('删除排班失败，请重试')
    }
  }

  // 初始化数据
  useEffect(() => {
    setEmployees(defaultEmployees)
    setTimeSlots(defaultTimeSlots)
    
    // 获取排班模板
    fetchTemplates()
    
    // 初始化一些示例课程
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    
    setClasses([
      {
        id: 'class-1',
        name: '四年级数学',
        subject: '数学',
        grade: '四年级',
        center: '总校',
        room: 'A101',
        startTime: `${todayStr}T09:00:00`,
        endTime: `${todayStr}T10:00:00`,
        maxStudents: 15,
        currentStudents: 12,
        status: 'scheduled',
        color: '#3b82f6'
      },
      {
        id: 'class-2',
        name: '三年级英文',
        subject: '英文',
        grade: '三年级',
        center: '总校',
        room: 'A102',
        startTime: `${todayStr}T14:00:00`,
        endTime: `${todayStr}T15:00:00`,
        maxStudents: 12,
        currentStudents: 10,
        status: 'scheduled',
        color: '#10b981'
      }
    ])
  }, [fetchTemplates])

  // 单独处理排班数据获取
  useEffect(() => {
    let isMounted = true
    
    const loadSchedules = async () => {
      if (!isMounted) return
      
      try {
        await fetchSchedules({
          center: selectedCenter !== 'all' ? selectedCenter : undefined,
          type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
        })
      } catch (error) {
        // 错误已经在 fetchSchedules 中处理
        if (isMounted) {
          console.error('加载排班数据失败:', error)
        }
      }
    }
    
    loadSchedules()
    
    return () => {
      isMounted = false
    }
  }, [selectedCenter, selectedEmployeeType])

  const viewDates = getViewDates()

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6" />
            安亲补习中心排班管理
          </h2>
          <p className="text-gray-600">智能排班 · 多类型员工管理 · 课程安排</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
          <Button variant="outline" onClick={handleAutoSchedule} disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            {loading ? '排班中...' : '智能排班'}
          </Button>
          <Button onClick={() => setIsAddingSchedule(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加排班
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>筛选条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>中心</Label>
                <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择中心" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部中心</SelectItem>
                    <SelectItem value="总校">总校</SelectItem>
                    <SelectItem value="分校">分校</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>年级</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    <SelectItem value="一年级">一年级</SelectItem>
                    <SelectItem value="二年级">二年级</SelectItem>
                    <SelectItem value="三年级">三年级</SelectItem>
                    <SelectItem value="四年级">四年级</SelectItem>
                    <SelectItem value="五年级">五年级</SelectItem>
                    <SelectItem value="六年级">六年级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>科目</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部科目</SelectItem>
                    <SelectItem value="数学">数学</SelectItem>
                    <SelectItem value="英文">英文</SelectItem>
                    <SelectItem value="华文">华文</SelectItem>
                    <SelectItem value="科学">科学</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>员工类型</Label>
                <Select value={selectedEmployeeType} onValueChange={setSelectedEmployeeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="fulltime">全职员工</SelectItem>
                    <SelectItem value="parttime">兼职员工</SelectItem>
                    <SelectItem value="teaching_only">仅教书老师</SelectItem>
                    <SelectItem value="admin">行政人员</SelectItem>
                    <SelectItem value="support">后勤人员</SelectItem>
                    <SelectItem value="service">服务人员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 视图切换 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                日视图
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                周视图
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                月视图
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(prev => 
                  viewMode === 'day' ? addDays(prev, -1) :
                  viewMode === 'week' ? subWeeks(prev, 1) :
                  subMonths(prev, 1)
                )}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                今天
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(prev => 
                  viewMode === 'day' ? addDays(prev, 1) :
                  viewMode === 'week' ? addWeeks(prev, 1) :
                  addMonths(prev, 1)
                )}
              >
                →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 智能排班面板 */}
      <SmartSchedulePanel
        employees={employees}
        templates={templates}
        onQuickSchedule={handleSmartSchedule}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* 排班表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {viewMode === 'day' ? '日排班' : viewMode === 'week' ? '周排班' : '月排班'}
              </CardTitle>
              <CardDescription>
                {viewMode === 'day' && format(currentDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                {viewMode === 'week' && `${format(viewDates[0], 'MM月dd日')} - ${format(viewDates[viewDates.length - 1], 'MM月dd日')}`}
                {viewMode === 'month' && format(currentDate, 'yyyy年MM月', { locale: zhCN })}
              </CardDescription>
            </div>
            
            {/* 简单操作工具栏 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingSchedule(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加排班
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDate(addDays(selectedDate, -7))
                }}
              >
                ← 上周
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDate(new Date())
                }}
              >
                今天
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDate(addDays(selectedDate, 7))
                }}
              >
                下周 →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">员工</th>
                  {viewDates.map(date => (
                    <th key={date.toISOString()} className="text-center p-3 font-medium min-w-32">
                      <div className="text-sm">
                        {format(date, 'EEE', { locale: zhCN })}
                      </div>
                      <div className="text-lg font-bold">
                        {format(date, 'd')}
                      </div>
                      {isToday(date) && (
                        <div className="text-xs text-blue-600">今天</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees
                  .filter(emp => selectedEmployeeType === 'all' || emp.type === selectedEmployeeType)
                  .map(employee => (
                    <tr key={employee.id}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.position}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge 
                                variant={employee.type === 'fulltime' ? 'default' : 
                                        employee.type === 'parttime' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {employee.type === 'fulltime' ? '全职' : 
                                 employee.type === 'parttime' ? '兼职' : '仅教书'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {employee.subjects.join(', ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      {viewDates.map(date => {
                        const daySchedules = getSchedulesForDate(date)
                            .filter(s => s.teacher_id === employee.id)
                        
                        return (
                            <td key={date.toISOString()} className="p-0">
                              <DroppableScheduleCell
                                date={date}
                                employeeId={employee.id}
                                schedules={daySchedules}
                                onAddSchedule={handleAddScheduleFromCell}
                                onEditSchedule={handleEditSchedule}
                                onDeleteSchedule={handleDeleteSchedule}
                                templates={templates}
                                isToday={isToday(date)}
                                isWeekend={isWeekend(date)}
                                className="h-24"
                              />
                            </td>
                        )
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          </DndContext>
        </CardContent>
      </Card>

      {/* 多天拖拽处理 */}
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            批量操作
            </CardTitle>
          <CardDescription>
            选择多个排班进行批量复制、移动或删除操作
          </CardDescription>
          </CardHeader>
          <CardContent>
          <MultiDayDragHandler
            schedules={schedules}
            onCopyToMultipleDays={handleCopyToMultipleDays}
            onDeleteMultiple={handleDeleteMultiple}
          />
          </CardContent>
        </Card>

      {/* 添加排班浮窗 */}
      <AddScheduleModal
        isOpen={isAddingSchedule}
        onClose={() => setIsAddingSchedule(false)}
        onSave={handleAddSchedule}
        employees={employees}
        templates={templates}
        classes={classes}
        selectedDate={selectedDate}
      />

      {/* 员工统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => emp.type === 'fulltime').length}
                </div>
                <div className="text-sm text-gray-500">全职员工</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => emp.type === 'parttime').length}
                </div>
                <div className="text-sm text-gray-500">兼职员工</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {employees.filter(emp => emp.type === 'teaching_only').length}
                </div>
                <div className="text-sm text-gray-500">仅教书老师</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {schedules.filter(s => s.status === 'scheduled').length}
                </div>
                <div className="text-sm text-gray-500">已安排班次</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
