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
  MapPin
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

// 安亲/补习中心排班类型定义
interface Teacher {
  id: string
  name: string
  type: 'fulltime' | 'parttime' | 'contract'
  subjects: string[] // 教授科目
  grades: string[] // 教授年级
  experience: number // 教学经验年数
  maxHoursPerWeek: number
  preferredTimes: string[] // 偏好时间段
  unavailableDays: string[]
  avatar?: string
  status: 'active' | 'inactive' | 'on_leave'
  center: string // 所属中心
}

interface Subject {
  id: string
  name: string
  code: string
  category: 'academic' | 'enrichment' | 'exam_prep' | 'homework_help'
  color: string
  isActive: boolean
}

interface Grade {
  id: string
  name: string
  level: number
  ageRange: string
  color: string
  isActive: boolean
}

interface Class {
  id: string
  name: string
  grade: string
  subject: string
  center: string
  maxStudents: number
  currentStudents: number
  color: string
  isActive: boolean
}

interface TimeSlot {
  id: string
  name: string
  startTime: string
  endTime: string
  type: 'morning' | 'afternoon' | 'evening' | 'weekend'
  breakDuration: number
  color: string
  isActive: boolean
}

interface Schedule {
  id: string
  teacherId: string
  classId: string
  timeSlotId: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'substitute'
  notes?: string
  substituteTeacherId?: string
  room?: string
  createdAt: string
  updatedAt: string
}

interface ScheduleConflict {
  type: 'teacher_double_book' | 'class_double_book' | 'room_conflict' | 'subject_mismatch' | 'grade_mismatch' | 'teacher_unavailable'
  message: string
  severity: 'low' | 'medium' | 'high'
  scheduleId: string
}

interface ScheduleStats {
  totalSchedules: number
  confirmedSchedules: number
  pendingSchedules: number
  cancelledSchedules: number
  totalHours: number
  totalClasses: number
  totalTeachers: number
  coverageRate: number
  conflictCount: number
}

export default function TuitionScheduleManagement() {
  // 视图状态
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCenter, setSelectedCenter] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  
  // 数据状态
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  
  // UI状态
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [isEditingSchedule, setIsEditingSchedule] = useState<string | null>(null)
  const [showConflicts, setShowConflicts] = useState(true)
  const [showInactiveTeachers, setShowInactiveTeachers] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({})

  // 默认数据
  const defaultSubjects: Subject[] = [
    { id: 'math', name: '数学', code: 'MATH', category: 'academic', color: '#3b82f6', isActive: true },
    { id: 'english', name: '英文', code: 'ENG', category: 'academic', color: '#10b981', isActive: true },
    { id: 'chinese', name: '华文', code: 'CHI', category: 'academic', color: '#f59e0b', isActive: true },
    { id: 'science', name: '科学', code: 'SCI', category: 'academic', color: '#8b5cf6', isActive: true },
    { id: 'homework', name: '功课辅导', code: 'HW', category: 'homework_help', color: '#ef4444', isActive: true },
    { id: 'exam_prep', name: '考试准备', code: 'EXAM', category: 'exam_prep', color: '#06b6d4', isActive: true }
  ]

  const defaultGrades: Grade[] = [
    { id: 'year1', name: '一年级', level: 1, ageRange: '6-7岁', color: '#fbbf24', isActive: true },
    { id: 'year2', name: '二年级', level: 2, ageRange: '7-8岁', color: '#f59e0b', isActive: true },
    { id: 'year3', name: '三年级', level: 3, ageRange: '8-9岁', color: '#d97706', isActive: true },
    { id: 'year4', name: '四年级', level: 4, ageRange: '9-10岁', color: '#b45309', isActive: true },
    { id: 'year5', name: '五年级', level: 5, ageRange: '10-11岁', color: '#92400e', isActive: true },
    { id: 'year6', name: '六年级', level: 6, ageRange: '11-12岁', color: '#78350f', isActive: true },
    { id: 'form1', name: '中一', level: 7, ageRange: '12-13岁', color: '#7c3aed', isActive: true },
    { id: 'form2', name: '中二', level: 8, ageRange: '13-14岁', color: '#6d28d9', isActive: true },
    { id: 'form3', name: '中三', level: 9, ageRange: '14-15岁', color: '#5b21b6', isActive: true }
  ]

  const defaultTimeSlots: TimeSlot[] = [
    { id: 'morning1', name: '早班1', startTime: '08:00', endTime: '10:00', type: 'morning', breakDuration: 0, color: '#3b82f6', isActive: true },
    { id: 'morning2', name: '早班2', startTime: '10:00', endTime: '12:00', type: 'morning', breakDuration: 0, color: '#3b82f6', isActive: true },
    { id: 'afternoon1', name: '下午班1', startTime: '14:00', endTime: '16:00', type: 'afternoon', breakDuration: 0, color: '#10b981', isActive: true },
    { id: 'afternoon2', name: '下午班2', startTime: '16:00', endTime: '18:00', type: 'afternoon', breakDuration: 0, color: '#10b981', isActive: true },
    { id: 'evening1', name: '晚班1', startTime: '18:00', endTime: '20:00', type: 'evening', breakDuration: 0, color: '#f59e0b', isActive: true },
    { id: 'evening2', name: '晚班2', startTime: '20:00', endTime: '22:00', type: 'evening', breakDuration: 0, color: '#f59e0b', isActive: true },
    { id: 'weekend_morning', name: '周末上午', startTime: '09:00', endTime: '12:00', type: 'weekend', breakDuration: 15, color: '#8b5cf6', isActive: true },
    { id: 'weekend_afternoon', name: '周末下午', startTime: '14:00', endTime: '17:00', type: 'weekend', breakDuration: 15, color: '#8b5cf6', isActive: true }
  ]

  // 计算当前视图的日期范围
  const getViewDates = () => {
    switch (viewMode) {
      case 'day':
        return [currentDate]
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      case 'month':
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
      default:
        return []
    }
  }

  // 获取某天的排班
  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules.filter(schedule => schedule.date === dateStr)
  }

  // 获取教师信息
  const getTeacher = (teacherId: string) => {
    return teachers.find(teacher => teacher.id === teacherId)
  }

  // 获取班级信息
  const getClass = (classId: string) => {
    return classes.find(cls => cls.id === classId)
  }

  // 获取时间段信息
  const getTimeSlot = (timeSlotId: string) => {
    return timeSlots.find(slot => slot.id === timeSlotId)
  }

  // 获取科目信息
  const getSubject = (subjectId: string) => {
    return subjects.find(subject => subject.id === subjectId)
  }

  // 获取年级信息
  const getGrade = (gradeId: string) => {
    return grades.find(grade => grade.id === gradeId)
  }

  // 计算工作时长
  const calculateWorkHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, diffHours - breakDuration / 60)
  }

  // 检测排班冲突
  const detectConflicts = (schedules: Schedule[]) => {
    const conflicts: ScheduleConflict[] = []
    
    schedules.forEach(schedule => {
      const teacher = getTeacher(schedule.teacherId)
      const classInfo = getClass(schedule.classId)
      const timeSlot = getTimeSlot(schedule.timeSlotId)
      
      if (!teacher || !classInfo || !timeSlot) return

      // 检查教师是否在不可用日期
      if (teacher.unavailableDays.includes(schedule.date)) {
        conflicts.push({
          type: 'teacher_unavailable',
          message: `${teacher.name} 在 ${schedule.date} 不可用`,
          severity: 'high',
          scheduleId: schedule.id
        })
      }

      // 检查教师科目匹配
      if (!teacher.subjects.includes(classInfo.subject)) {
        conflicts.push({
          type: 'subject_mismatch',
          message: `${teacher.name} 不教授 ${getSubject(classInfo.subject)?.name} 科目`,
          severity: 'high',
          scheduleId: schedule.id
        })
      }

      // 检查教师年级匹配
      if (!teacher.grades.includes(classInfo.grade)) {
        conflicts.push({
          type: 'grade_mismatch',
          message: `${teacher.name} 不教授 ${getGrade(classInfo.grade)?.name} 年级`,
          severity: 'high',
          scheduleId: schedule.id
        })
      }

      // 检查教师状态
      if (teacher.status !== 'active') {
        conflicts.push({
          type: 'teacher_unavailable',
          message: `${teacher.name} 当前状态为 ${teacher.status}`,
          severity: 'high',
          scheduleId: schedule.id
        })
      }

      // 检查教师时间冲突
      const teacherSchedules = schedules.filter(s => 
        s.teacherId === schedule.teacherId && 
        s.date === schedule.date &&
        s.id !== schedule.id
      )
      
      teacherSchedules.forEach(otherSchedule => {
        const otherTimeSlot = getTimeSlot(otherSchedule.timeSlotId)
        if (otherTimeSlot && 
            (schedule.startTime < otherTimeSlot.endTime && schedule.endTime > otherTimeSlot.startTime)) {
          conflicts.push({
            type: 'teacher_double_book',
            message: `${teacher.name} 在同一时间有多个排班`,
            severity: 'high',
            scheduleId: schedule.id
          })
        }
      })
    })

    return conflicts
  }

  // 智能排班建议
  const getSmartSuggestions = (date: Date, classId: string) => {
    const classInfo = getClass(classId)
    if (!classInfo) return []

    const availableTeachers = teachers.filter(teacher => 
      teacher.status === 'active' &&
      !teacher.unavailableDays.includes(format(date, 'yyyy-MM-dd')) &&
      teacher.subjects.includes(classInfo.subject) &&
      teacher.grades.includes(classInfo.grade) &&
      (selectedCenter === 'all' || teacher.center === selectedCenter)
    )

    // 按经验、偏好和排班频率排序
    return availableTeachers
      .map(teacher => ({
        ...teacher,
        score: calculateTeacherScore(teacher, classInfo, date)
      }))
      .sort((a, b) => b.score - a.score)
  }

  // 计算教师评分
  const calculateTeacherScore = (teacher: Teacher, classInfo: Class, date: Date) => {
    let score = 0
    
    // 教学经验 (30%)
    score += Math.min(teacher.experience * 3, 30)

    // 科目专长匹配 (25%)
    if (teacher.subjects.includes(classInfo.subject)) {
      score += 25
    }

    // 年级专长匹配 (25%)
    if (teacher.grades.includes(classInfo.grade)) {
      score += 25
    }

    // 时间偏好匹配 (10%)
    const timeSlot = getTimeSlot(classInfo.id) // 这里需要根据实际逻辑调整
    if (timeSlot && teacher.preferredTimes.includes(timeSlot.type)) {
      score += 10
    }

    // 排班频率平衡 (10%)
    const recentSchedules = schedules.filter(s => 
      s.teacherId === teacher.id &&
      Math.abs(new Date(s.date).getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000
    ).length
    score += Math.max(0, 10 - recentSchedules * 2)

    return score
  }

  // 自动排班
  const autoSchedule = () => {
    const dates = getViewDates()
    const newSchedules: Schedule[] = []

    dates.forEach(date => {
      if (viewMode === 'month' && date.getMonth() !== currentDate.getMonth()) return
      if (isWeekend(date) && !timeSlots.some(slot => slot.type === 'weekend' && slot.isActive)) return

      classes.forEach(classInfo => {
        if (!classInfo.isActive) return
        if (selectedCenter !== 'all' && classInfo.center !== selectedCenter) return
        if (selectedGrade !== 'all' && classInfo.grade !== selectedGrade) return
        if (selectedSubject !== 'all' && classInfo.subject !== selectedSubject) return

        const existingSchedules = getSchedulesForDate(date)
        const hasSchedule = existingSchedules.some(s => s.classId === classInfo.id)
        
        if (!hasSchedule) {
          const suggestions = getSmartSuggestions(date, classInfo.id)
          if (suggestions.length > 0) {
            const teacher = suggestions[0]
            const timeSlot = timeSlots.find(slot => slot.isActive && 
              (isWeekend(date) ? slot.type === 'weekend' : slot.type !== 'weekend'))
            
            if (timeSlot) {
              newSchedules.push({
                id: `schedule-${Date.now()}-${Math.random()}`,
                teacherId: teacher.id,
                classId: classInfo.id,
                timeSlotId: timeSlot.id,
                date: format(date, 'yyyy-MM-dd'),
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
            }
          }
        }
      })
    })

    setSchedules(prev => [...prev, ...newSchedules])
  }

  // 更新统计
  const updateStats = () => {
    const totalSchedules = schedules.length
    const confirmedSchedules = schedules.filter(s => s.status === 'confirmed').length
    const pendingSchedules = schedules.filter(s => s.status === 'scheduled').length
    const cancelledSchedules = schedules.filter(s => s.status === 'cancelled').length
    
    const totalHours = schedules.reduce((sum, s) => {
      const timeSlot = getTimeSlot(s.timeSlotId)
      return sum + calculateWorkHours(s.startTime, s.endTime, timeSlot?.breakDuration || 0)
    }, 0)

    const conflicts = detectConflicts(schedules)
    const coverageRate = totalSchedules > 0 ? Math.round((confirmedSchedules / totalSchedules) * 100) : 0

    setStats({
      totalSchedules,
      confirmedSchedules,
      pendingSchedules,
      cancelledSchedules,
      totalHours: Math.round(totalHours * 10) / 10,
      totalClasses: classes.filter(c => c.isActive).length,
      totalTeachers: teachers.filter(t => t.status === 'active').length,
      coverageRate,
      conflictCount: conflicts.length
    })

    setConflicts(conflicts)
  }

  // 初始化数据
  useEffect(() => {
    setSubjects(defaultSubjects)
    setGrades(defaultGrades)
    setTimeSlots(defaultTimeSlots)
    
    // 生成班级数据
    const generatedClasses: Class[] = []
    defaultGrades.forEach(grade => {
      defaultSubjects.forEach(subject => {
        if (subject.category === 'academic') {
          generatedClasses.push({
            id: `${grade.id}-${subject.id}`,
            name: `${grade.name}${subject.name}`,
            grade: grade.id,
            subject: subject.id,
            center: 'WX 01',
            maxStudents: 15,
            currentStudents: Math.floor(Math.random() * 15) + 5,
            color: subject.color,
            isActive: true
          })
        }
      })
    })
    setClasses(generatedClasses)

    setTeachers([
      {
        id: '1',
        name: 'Cheng Mun Poo',
        type: 'fulltime',
        subjects: ['math', 'science'],
        grades: ['year4', 'year5', 'year6'],
        experience: 5,
        maxHoursPerWeek: 40,
        preferredTimes: ['morning', 'afternoon'],
        unavailableDays: [],
        status: 'active',
        center: 'WX 01'
      },
      {
        id: '2',
        name: 'Teacher 2',
        type: 'parttime',
        subjects: ['english', 'chinese'],
        grades: ['year1', 'year2', 'year3'],
        experience: 3,
        maxHoursPerWeek: 20,
        preferredTimes: ['afternoon', 'evening'],
        unavailableDays: [],
        status: 'active',
        center: 'WX 01'
      }
    ])
  }, [])

  // 更新统计
  useEffect(() => {
    updateStats()
  }, [schedules, teachers, classes])

  const viewDates = getViewDates()
  const filteredTeachers = teachers.filter(teacher => 
    (selectedCenter === 'all' || teacher.center === selectedCenter) &&
    (showInactiveTeachers || teacher.status === 'active')
  )

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">安亲/补习中心排班系统</h2>
          <p className="text-gray-600">智能排班 - 支持课程表和班级管理</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              日
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              周
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              月
            </Button>
          </div>
          <Button onClick={autoSchedule} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            智能排班
          </Button>
          <Button onClick={() => setIsAddingSchedule(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加排班
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总排班</p>
                  <p className="text-2xl font-bold">{stats.totalSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已确认</p>
                  <p className="text-2xl font-bold">{stats.confirmedSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">待确认</p>
                  <p className="text-2xl font-bold">{stats.pendingSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已取消</p>
                  <p className="text-2xl font-bold">{stats.cancelledSchedules}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总工时</p>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">班级数</p>
                  <p className="text-2xl font-bold">{stats.totalClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">教师数</p>
                  <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">冲突</p>
                  <p className="text-2xl font-bold">{stats.conflictCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和设置 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label>中心筛选</Label>
              <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有中心</SelectItem>
                  <SelectItem value="WX 01">WX 01</SelectItem>
                  <SelectItem value="WX 02">WX 02</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>年级筛选</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有年级</SelectItem>
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>科目筛选</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有科目</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactiveTeachers}
                onCheckedChange={setShowInactiveTeachers}
              />
              <Label htmlFor="show-inactive">显示非活跃教师</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-conflicts"
                checked={showConflicts}
                onCheckedChange={setShowConflicts}
              />
              <Label htmlFor="show-conflicts">显示冲突</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 冲突提醒 */}
      {showConflicts && conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              排班冲突提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                  <AlertTriangle className={`h-4 w-4 ${
                    conflict.severity === 'high' ? 'text-red-500' :
                    conflict.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <span className="text-sm">{conflict.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 排班表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 w-48">
                    教师/班级
                  </th>
                  {viewDates.map(date => (
                    <th key={date.toISOString()} className="px-4 py-3 text-center text-sm font-medium text-gray-900 min-w-32">
                      <div>
                        <div className="font-semibold">
                          {format(date, 'EEE', { locale: zhCN })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(date, 'MM/dd')}
                        </div>
                        {isToday(date) && (
                          <div className="text-xs text-blue-600 font-bold">今天</div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-sm text-gray-500">{teacher.subjects.join(', ')}</div>
                          <div className="flex gap-1 mt-1">
                            <Badge variant={teacher.type === 'fulltime' ? 'default' : 'secondary'} className="text-xs">
                              {teacher.type === 'fulltime' ? '全职' : teacher.type === 'parttime' ? '兼职' : '合同'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {teacher.experience}年经验
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>
                    {viewDates.map(date => {
                      const daySchedules = getSchedulesForDate(date).filter(s => s.teacherId === teacher.id)
                      const isCurrentMonth = viewMode !== 'month' || date.getMonth() === currentDate.getMonth()
                      const isToday = isSameDay(date, new Date())
                      
                      return (
                        <td 
                          key={date.toISOString()} 
                          className={`px-4 py-3 ${!isCurrentMonth ? 'bg-gray-50' : ''} ${isToday ? 'bg-blue-50' : ''}`}
                        >
                          {daySchedules.map(schedule => {
                            const classInfo = getClass(schedule.classId)
                            const timeSlot = getTimeSlot(schedule.timeSlotId)
                            const conflict = conflicts.find(c => c.scheduleId === schedule.id)
                            
                            return (
                              <div 
                                key={schedule.id}
                                className={`border rounded-lg p-2 mb-1 ${
                                  conflict 
                                    ? 'bg-red-50 border-red-200' 
                                    : schedule.status === 'confirmed'
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-blue-50 border-blue-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="text-xs">
                                    <div className="font-medium">{schedule.startTime} - {schedule.endTime}</div>
                                    <div className="text-gray-500">
                                      {classInfo?.name} • {calculateWorkHours(schedule.startTime, schedule.endTime, timeSlot?.breakDuration || 0).toFixed(1)}h
                                    </div>
                                    {conflict && (
                                      <div className="text-red-600 text-xs mt-1">
                                        ⚠️ {conflict.message}
                                      </div>
                                    )}
                                  </div>
                                  {isCurrentMonth && (
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-red-500"
                                        onClick={() => setSchedules(prev => prev.filter(s => s.id !== schedule.id))}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          {daySchedules.length === 0 && isCurrentMonth && (
                            <div className="text-center text-gray-400 text-xs py-2">
                              无排班
                            </div>
                          )}
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

      {/* 科目和年级管理 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 科目管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              科目管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map(subject => (
                <div 
                  key={subject.id}
                  className="flex items-center gap-2 p-2 border rounded"
                  style={{ borderLeftColor: subject.color, borderLeftWidth: '4px' }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <span className="text-sm font-medium">{subject.name}</span>
                  <Badge variant={subject.isActive ? 'default' : 'secondary'} className="text-xs">
                    {subject.isActive ? '启用' : '禁用'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 年级管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              年级管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {grades.map(grade => (
                <div 
                  key={grade.id}
                  className="flex items-center gap-2 p-2 border rounded"
                  style={{ borderLeftColor: grade.color, borderLeftWidth: '4px' }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: grade.color }} />
                  <span className="text-sm font-medium">{grade.name}</span>
                  <span className="text-xs text-gray-500">{grade.ageRange}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
