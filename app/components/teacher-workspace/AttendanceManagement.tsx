"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  UserCheck, 
  Search, 
  Calendar, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Filter,
  Eye,
  Edit,
  Plus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface Student {
  id: string
  student_name: string
  student_id: string
  standard: string
  avatar?: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  standard: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  time: string
  note?: string
}

interface AttendanceStats {
  totalStudents: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
}

interface AttendanceManagementProps {
  teacherId?: string
}

export default function AttendanceManagement({ teacherId }: AttendanceManagementProps) {
  const { t } = useLanguage()
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students')
        if (response.ok) {
          const data = await response.json()
          setStudents(data.students || [])
        }
      } catch (error) {
        console.error('获取学生数据失败:', error)
        setError('获取学生数据失败')
      }
    }
    fetchStudents()
  }, [])

  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/student-attendance')
        if (response.ok) {
          const data = await response.json()
          const formattedRecords: AttendanceRecord[] = (data.data || []).map((record: any) => ({
            id: record.id,
            studentId: record.student_id,
            studentName: record.student_name,
            standard: record.center || '未指定中心',
            date: record.date || new Date(record.timestamp).toISOString().split('T')[0],
            status: record.status === 'present' ? 'present' : 
                   record.status === 'late' ? 'late' : 
                   record.status === 'absent' ? 'absent' : 'present',
            time: record.time || new Date(record.timestamp).toTimeString().split(' ')[0],
            note: record.method || '系统记录'
          }))
          setAttendanceRecords(formattedRecords)
        } else {
          setError('获取考勤记录失败')
        }
      } catch (error) {
        setError('获取考勤记录失败')
      } finally {
        setLoading(false)
      }
    }
    fetchAttendanceRecords()
  }, [])

  const refreshData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [studentsResponse, attendanceResponse] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/student-attendance')
      ])
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData.students || [])
      }
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        const formattedRecords: AttendanceRecord[] = (attendanceData.data || []).map((record: any) => ({
          id: record.id,
          studentId: record.student_id,
          studentName: record.student_name,
          standard: record.center || '未指定中心',
          date: record.date || new Date(record.timestamp).toISOString().split('T')[0],
          status: record.status === 'present' ? 'present' : 
                 record.status === 'late' ? 'late' : 
                 record.status === 'absent' ? 'absent' : 'present',
          time: record.time || new Date(record.timestamp).toTimeString().split(' ')[0],
          note: record.method || '系统记录'
        }))
        setAttendanceRecords(formattedRecords)
      }
    } catch (error) {
      setError('刷新数据失败')
    } finally {
      setLoading(false)
    }
  }

  const [selectedDate, setSelectedDate] = useState('2024-01-15')
  const [selectedClass, setSelectedClass] = useState('三年级A班')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false)

  const attendanceStats = useMemo(() => {
    const todayRecords = attendanceRecords.filter(record => record.date === selectedDate)
    const totalStudents = students.length
    const present = todayRecords.filter(r => r.status === 'present').length
    const absent = todayRecords.filter(r => r.status === 'absent').length
    const late = todayRecords.filter(r => r.status === 'late').length
    const excused = todayRecords.filter(r => r.status === 'excused').length
    const attendanceRate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0
    return { totalStudents, present, absent, late, excused, attendanceRate }
  }, [attendanceRecords, selectedDate, students.length])

  const classOptions = useMemo(() => {
    return Array.from(new Set(students.map(s => s.standard))).sort()
  }, [students])

  const dateOptions = useMemo(() => {
    return Array.from(new Set(attendanceRecords.map(r => r.date))).sort().reverse()
  }, [attendanceRecords])

  const filteredRecords = useMemo(() => {
    let filtered = attendanceRecords.filter(record => 
      record.date === selectedDate && record.standard === selectedClass
    )
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return filtered
  }, [attendanceRecords, selectedDate, selectedClass, searchTerm])

  const updateAttendanceStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused', note?: string) => {
    const existingRecord = attendanceRecords.find(r => 
      r.studentId === studentId && r.date === selectedDate
    )
    if (existingRecord) {
      setAttendanceRecords(prev => prev.map(r => 
        r.id === existingRecord.id 
          ? { ...r, status, note: note || r.note, time: status === 'absent' ? '' : new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
          : r
      ))
    } else {
      const student = students.find(s => s.id === studentId)
      if (student) {
        const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          studentId,
          studentName: student.student_name,
          standard: student.standard,
          date: selectedDate,
          status,
          time: status === 'absent' ? '' : new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          note: note || ''
        }
        setAttendanceRecords(prev => [...prev, newRecord])
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge variant="default" className="bg-green-100 text-green-700">{t('attendance.present')}</Badge>
      case 'absent': return <Badge variant="destructive">{t('attendance.absent')}</Badge>
      case 'late': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">{t('teacher.late')}</Badge>
      case 'excused': return <Badge variant="outline" className="bg-gray-100 text-gray-700">{t('teacher.leave')}</Badge>
      default: return <Badge variant="outline">{t('teacher.unknown')}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600'
      case 'absent': return 'text-red-600'
      case 'late': return 'text-yellow-600'
      case 'excused': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('teacher.attendance_management')}</h2>
          <p className="text-gray-600 mt-1">记录学生出勤情况、查看考勤统计和趋势分析</p>
        </div>
        <div className="flex items-center gap-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>}
          <Button onClick={refreshData} disabled={loading} variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">{t('dashboard.total_students')}</p><p className="text-2xl font-bold text-gray-900">{attendanceStats.totalStudents}</p></div><div className="p-3 bg-blue-100 rounded-lg"><Users className="h-8 w-8 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">{t('attendance.present')}</p><p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p></div><div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-8 w-8 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">{t('teacher.late')}</p><p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p></div><div className="p-3 bg-yellow-100 rounded-lg"><Clock className="h-8 w-8 text-yellow-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">{t('attendance.absent')}</p><p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p></div><div className="p-3 bg-red-100 rounded-lg"><XCircle className="h-8 w-8 text-red-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">{t('teacher.attendance_rate')}</p><p className="text-2xl font-bold text-blue-600">{attendanceStats.attendanceRate}%</p></div><div className="p-3 bg-blue-100 rounded-lg"><Target className="h-8 w-8 text-blue-600" /></div></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-blue-600" />快速考勤</CardTitle>
          <CardDescription>选择日期和班级，快速记录学生出勤情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
              <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                {dateOptions.map(date => <option key={date} value={date}>{date}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择班级</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                {classOptions.map(className => <option key={className} value={className}>{className}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('teacher.search_students')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="搜索学生姓名..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={() => setIsQuickAttendanceOpen(true)} className="w-full"><Plus className="h-4 w-4 mr-2" />批量考勤</Button>
            </div>
          </div>
          <div className="space-y-3">
            {students
              .filter(student => student.standard === selectedClass)
              .filter(student => !searchTerm || student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || student.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(student => {
                const record = attendanceRecords.find(r => r.studentId === student.id && r.date === selectedDate)
                const status = record?.status || 'present'
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">{student.student_name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{student.student_name}</h3>
                        <p className="text-sm text-gray-600">{student.student_id} • {student.standard}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {record && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{t('teacher.check_in_time')}</p>
                          <p className={`text-sm font-medium ${getStatusColor(status)}`}>{record.time || '-'}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant={status === 'present' ? 'default' : 'outline'} size="sm" onClick={() => updateAttendanceStatus(student.id, 'present')} className="min-w-[60px]">{t('attendance.present')}</Button>
                        <Button variant={status === 'late' ? 'default' : 'outline'} size="sm" onClick={() => updateAttendanceStatus(student.id, 'late')} className="min-w-[60px]">{t('teacher.late')}</Button>
                        <Button variant={status === 'absent' ? 'default' : 'outline'} size="sm" onClick={() => updateAttendanceStatus(student.id, 'absent')} className="min-w-[60px]">{t('attendance.absent')}</Button>
                        <Button variant={status === 'excused' ? 'default' : 'outline'} size="sm" onClick={() => updateAttendanceStatus(student.id, 'excused')} className="min-w-[60px]">{t('teacher.leave')}</Button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
