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

// 排班模板
interface ScheduleTemplate {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  workDays: number[] // 0-6, 0=Sunday
  startTime: string
  endTime: string
  breakDuration: number // 分钟
  maxHoursPerWeek: number
  color: string
  description: string
  requirements: string[] // 任职要求
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

// 排班记录
interface Schedule {
  id: string
  employeeId: string
  employeeName: string
  employeeType: 'fulltime' | 'parttime' | 'teaching_only' | 'admin' | 'support' | 'service'
  date: string
  startTime: string
  endTime: string
  classId?: string
  className?: string
  subject?: string
  grade?: string
  center: string
  room?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  isOvertime: boolean
  hourlyRate?: number
  totalHours: number
  notes?: string
  createdAt: string
  updatedAt: string
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
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('17:00')
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [scheduleNotes, setScheduleNotes] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [conflictWarning, setConflictWarning] = useState<string>('')
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([])
  const [availableRooms, setAvailableRooms] = useState<string[]>([])

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

  // 默认排班模板
  const defaultTemplates: ScheduleTemplate[] = [
    {
      id: 'fulltime-manager',
      name: '管理层标准班',
      type: 'fulltime',
      workDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00',
      breakDuration: 60,
      maxHoursPerWeek: 40,
      color: '#3b82f6',
      description: '管理层全职工作时间',
      requirements: ['管理经验', '教育背景']
    },
    {
      id: 'fulltime-teacher',
      name: '全职教师班',
      type: 'fulltime',
      workDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 60,
      maxHoursPerWeek: 40,
      color: '#10b981',
      description: '全职教师标准工作时间',
      requirements: ['教学经验', '相关学历']
    },
    {
      id: 'parttime-afternoon',
      name: '兼职下午班',
      type: 'parttime',
      workDays: [1, 2, 3, 4, 5],
      startTime: '14:00',
      endTime: '18:00',
      breakDuration: 0,
      maxHoursPerWeek: 20,
      color: '#f59e0b',
      description: '兼职教师下午时段',
      requirements: ['教学能力', '时间灵活']
    },
    {
      id: 'teaching-only',
      name: '仅教书时段',
      type: 'teaching_only',
      workDays: [1, 2, 3, 4, 5, 6, 0],
      startTime: '16:00',
      endTime: '19:00',
      breakDuration: 0,
      maxHoursPerWeek: 15,
      color: '#8b5cf6',
      description: '外聘老师教学时段',
      requirements: ['专业能力', '科目专长']
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

  // 智能建议功能
  const getSuggestedTimes = (employeeId: string, date: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    if (!employee) return []

    // 基于员工偏好时间生成建议
    const suggestions: string[] = []
    if (employee.preferredTimes) {
      employee.preferredTimes.forEach(timeRange => {
        const [start, end] = timeRange.split('-')
        suggestions.push(`${start}-${end}`)
      })
    }

    // 根据岗位类型提供不同的标准时间建议
    let standardTimes: string[] = []
    switch (employee.type) {
      case 'admin':
        standardTimes = ['08:00-12:00', '14:00-18:00', '07:30-18:30']
        break
      case 'support':
        if (employee.position?.includes('清洁')) {
          standardTimes = ['06:00-10:00', '16:00-20:00']
        } else if (employee.position?.includes('保安')) {
          standardTimes = ['20:00-08:00', '08:00-20:00']
        } else {
          standardTimes = ['08:00-12:00', '14:00-18:00']
        }
        break
      case 'service':
        if (employee.position?.includes('接送')) {
          standardTimes = ['07:00-09:00', '15:00-17:00']
        } else if (employee.position?.includes('食堂')) {
          standardTimes = ['10:00-14:00', '16:00-19:00']
        } else {
          standardTimes = ['08:00-12:00', '14:00-18:00']
        }
        break
      default: // 教学岗位
        standardTimes = ['09:00-12:00', '14:00-17:00', '18:00-21:00']
    }

    standardTimes.forEach(time => {
      if (!suggestions.includes(time)) {
        suggestions.push(time)
      }
    })

    return suggestions
  }

  // 检查时间冲突
  const checkTimeConflict = (employeeId: string, date: string, startTime: string, endTime: string) => {
    const daySchedules = getSchedulesForDate(new Date(date))
      .filter(s => (s as any).teacher_id === employeeId)

    for (const schedule of daySchedules) {
      const existingStart = (schedule as any).start_time
      const existingEnd = (schedule as any).end_time
      
      if ((startTime < existingEnd && endTime > existingStart)) {
        return `与现有排班冲突: ${existingStart}-${existingEnd}`
      }
    }
    return ''
  }

  // 获取可用教室
  const getAvailableRooms = (date: string, startTime: string, endTime: string) => {
    const rooms = ['A101', 'A102', 'A103', 'B101', 'B102', 'C101', 'C102']
    const occupiedRooms = new Set()

    // 检查该时间段被占用的教室
    const daySchedules = getSchedulesForDate(new Date(date))
    daySchedules.forEach(schedule => {
      const existingStart = (schedule as any).start_time
      const existingEnd = (schedule as any).end_time
      const room = (schedule as any).room
      
      if (startTime < existingEnd && endTime > existingStart && room) {
        occupiedRooms.add(room)
      }
    })

    return rooms.filter(room => !occupiedRooms.has(room))
  }

  // 当选择教师时更新建议
  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    const suggestions = getSuggestedTimes(employeeId, format(selectedDate, 'yyyy-MM-dd'))
    setSuggestedTimes(suggestions)
    
    // 设置默认时间
    if (suggestions.length > 0) {
      const [start, end] = suggestions[0].split('-')
      setStartTime(start)
      setEndTime(end)
    }
  }

  // 计算工作时长
  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    const diffMs = end.getTime() - start.getTime()
    return Math.round(diffMs / (1000 * 60 * 60) * 10) / 10 // 保留一位小数
  }

  // 当时间改变时检查冲突和更新教室
  const handleTimeChange = (newStartTime: string, newEndTime: string) => {
    setStartTime(newStartTime)
    setEndTime(newEndTime)
    
    if (selectedEmployee) {
      const conflict = checkTimeConflict(selectedEmployee, format(selectedDate, 'yyyy-MM-dd'), newStartTime, newEndTime)
      setConflictWarning(conflict)
      
      const rooms = getAvailableRooms(format(selectedDate, 'yyyy-MM-dd'), newStartTime, newEndTime)
      setAvailableRooms(rooms)
      
      if (rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(rooms[0])
      }
    }
  }

  // 添加排班
  const handleAddSchedule = async () => {
    try {
      if (!selectedEmployee) {
        alert('请选择教师')
        return
      }

      const selectedEmp = employees.find(emp => emp.id === selectedEmployee)
      if (!selectedEmp) {
        alert('选择的教师不存在')
        return
      }

      // 检查冲突
      if (conflictWarning) {
        alert(`时间冲突: ${conflictWarning}`)
        return
      }

      const scheduleData = {
        employeeId: selectedEmployee,
        employeeName: selectedEmp.name,
        employeeType: selectedEmp.type,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: startTime,
        endTime: endTime,
        center: selectedEmp.center || '总校',
        room: selectedRoom || 'A101',
        status: 'scheduled' as const,
        isOvertime: false,
        hourlyRate: selectedEmp.hourlyRate,
        totalHours: calculateHours(startTime, endTime),
        notes: scheduleNotes || '智能排班添加'
      }

      await createSchedule(scheduleData)
      setIsAddingSchedule(false)
      setSelectedEmployee('')
      
      // 重新获取排班数据
      await fetchSchedules({
        center: selectedCenter !== 'all' ? selectedCenter : undefined,
        type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
      })

      alert('排班添加成功！')
    } catch (error) {
      console.error('添加排班失败:', error)
      alert('添加排班失败，请重试')
    }
  }

  // 初始化数据
  useEffect(() => {
    setEmployees(defaultEmployees)
    setTimeSlots(defaultTimeSlots)
    
    // 获取排班模板
    fetchTemplates()
    
    // 获取排班数据
    const dates = getViewDates()
    const startDate = format(dates[0], 'yyyy-MM-dd')
    const endDate = format(dates[dates.length - 1], 'yyyy-MM-dd')
    
    fetchSchedules({
      center: selectedCenter !== 'all' ? selectedCenter : undefined,
      type: selectedEmployeeType !== 'all' ? selectedEmployeeType : undefined
    })
    
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
  }, [fetchTemplates, fetchSchedules, selectedCenter, selectedEmployeeType])

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

      {/* 排班表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {viewMode === 'day' ? '日排班' : viewMode === 'week' ? '周排班' : '月排班'}
          </CardTitle>
          <CardDescription>
            {viewMode === 'day' && format(currentDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            {viewMode === 'week' && `${format(viewDates[0], 'MM月dd日')} - ${format(viewDates[viewDates.length - 1], 'MM月dd日')}`}
            {viewMode === 'month' && format(currentDate, 'yyyy年MM月', { locale: zhCN })}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                          .filter(s => (s as any).teacher_id === employee.id)
                        const dayClasses = getClassesForDate(date)
                          .filter(c => c.teacherId === employee.id)
                        
                        return (
                          <td key={date.toISOString()} className="p-2 text-center">
                            <div className="space-y-1">
                              {daySchedules.map(schedule => (
                                <div
                                  key={schedule.id}
                                  className="p-2 rounded text-xs border-l-2"
                                  style={{ 
                                    borderLeftColor: templates.find(t => t.type === (schedule as any).schedule_type)?.color || '#6b7280',
                                    backgroundColor: `${templates.find(t => t.type === (schedule as any).schedule_type)?.color || '#6b7280'}10`
                                  }}
                                >
                                  <div className="font-medium">{(schedule as any).start_time} - {(schedule as any).end_time}</div>
                                  {(schedule as any).class_name && (
                                    <div className="text-gray-600">{(schedule as any).class_name}</div>
                                  )}
                                  <div className="flex justify-between items-center mt-1">
                                    <Badge 
                                      variant={schedule.status === 'scheduled' ? 'default' : 
                                              schedule.status === 'confirmed' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {schedule.status === 'scheduled' ? '已安排' :
                                       schedule.status === 'confirmed' ? '已确认' :
                                       schedule.status === 'in_progress' ? '进行中' :
                                       schedule.status === 'completed' ? '已完成' : '已取消'}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => setEditingSchedule({
                                          ...schedule,
                                          employeeId: (schedule as any).teacher_id || schedule.id,
                                          employeeName: (schedule as any).teacher_name || 'Unknown',
                                          employeeType: (schedule as any).schedule_type || 'fulltime',
                                          startTime: (schedule as any).start_time || '09:00',
                                          endTime: (schedule as any).end_time || '17:00',
                                          isOvertime: (schedule as any).is_overtime || false,
                                          totalHours: (schedule as any).total_hours || 8,
                                          createdAt: (schedule as any).created || new Date().toISOString(),
                                          updatedAt: (schedule as any).updated || new Date().toISOString()
                                        })}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-500"
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {daySchedules.length === 0 && !isWeekend(date) && (
                                <div className="text-gray-400 text-xs py-2">
                                  无安排
                                </div>
                              )}
                              {isWeekend(date) && (
                                <div className="text-gray-400 text-xs py-2">
                                  周末
                                </div>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 添加排班对话框 */}
      {isAddingSchedule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>添加排班</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAddingSchedule(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 智能建议区域 */}
              {suggestedTimes.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 智能建议</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTimes.map((time, index) => {
                      const [start, end] = time.split('-')
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTimeChange(start, end)}
                          className="text-xs"
                        >
                          {time}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 冲突警告 */}
              {conflictWarning && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{conflictWarning}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>选择教师 *</Label>
                  <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择教师" />
                    </SelectTrigger>
                    <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <div className="flex flex-col">
                              <span>{employee.name}</span>
                              <span className="text-xs text-gray-500">
                                {employee.type === 'fulltime' ? '全职' : 
                                 employee.type === 'parttime' ? '兼职' : 
                                 employee.type === 'teaching_only' ? '仅教书' :
                                 employee.type === 'admin' ? '行政' :
                                 employee.type === 'support' ? '后勤' : '服务'} · 
                                {employee.position || employee.subjects?.join(', ')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>选择课程</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择课程（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(classItem => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name} - {classItem.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>日期 *</Label>
                  <Input 
                    type="date" 
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value))
                      // 重新计算建议
                      if (selectedEmployee) {
                        const suggestions = getSuggestedTimes(selectedEmployee, e.target.value)
                        setSuggestedTimes(suggestions)
                      }
                    }}
                  />
                </div>

                <div>
                  <Label>排班模板</Label>
                  <Select value={selectedTemplate} onValueChange={(value) => {
                    setSelectedTemplate(value)
                    const template = templates.find(t => t.id === value)
                    if (template) {
                      setStartTime(template.start_time)
                      setEndTime(template.end_time)
                      handleTimeChange(template.start_time, template.end_time)
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择模板（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.start_time}-{template.end_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>开始时间 *</Label>
                  <Input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => handleTimeChange(e.target.value, endTime)}
                  />
                </div>
                
                <div>
                  <Label>结束时间 *</Label>
                  <Input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => handleTimeChange(startTime, e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>教室 *</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择教室" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.length > 0 ? (
                        availableRooms.map(room => (
                          <SelectItem key={room} value={room}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {room} (可用)
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">该时间段无可用教室</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>工作时长</Label>
                  <Input 
                    value={`${calculateHours(startTime, endTime)} 小时`}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label>备注</Label>
                  <Input 
                    placeholder="排班备注信息"
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                {selectedEmployee && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>已选择教师，智能建议已激活</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingSchedule(false)
                    // 重置表单
                    setSelectedEmployee('')
                    setSelectedClass('')
                    setSelectedTemplate('')
                    setStartTime('09:00')
                    setEndTime('17:00')
                    setSelectedRoom('')
                    setScheduleNotes('')
                    setConflictWarning('')
                    setSuggestedTimes([])
                    setAvailableRooms([])
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleAddSchedule}
                  disabled={!selectedEmployee || !!conflictWarning || availableRooms.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存排班
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
