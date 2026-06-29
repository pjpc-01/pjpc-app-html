"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChart3,
  DollarSign,
  Settings,
  BookOpen,
  Shield,
  Users,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowUpRight,
  School,
  Building2,
  GraduationCap,
  UserCheck,
  Search,
  Edit,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useFinancialStats } from "@/hooks/useFinancialStats"
import { useCenters, Center } from "@/hooks/useCenters"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ModernAdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function ModernAdminDashboard({ activeTab, setActiveTab }: ModernAdminDashboardProps) {
  const { userProfile } = useAuth()
  const router = useRouter()
  const { stats, loading: statsLoading } = useDashboardStats()
  const { stats: financialStats, loading: financialLoading } = useFinancialStats()
  const { centers, loading: centersLoading } = useCenters()
  const searchParams = useSearchParams()

  // Selected center filter: read from URL '?center=' param (default: 'all')
  const selectedCenter = searchParams?.get("center") || "all"

  // No custom event needed — router.replace() will update searchParams automatically
  const [students, setStudents] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [teachers, setTeachers] = useState<any[]>([])
  const [totalTeachers, setTotalTeachers] = useState(0)

  // Fetch students & teachers for current center filter
  useEffect(() => {
    async function loadData() {
      setStudentsLoading(true)
      try {
        let studentFilter = ''
        if (selectedCenter !== 'all') {
          studentFilter = `&filter=centerId%3D%22${selectedCenter}%22`
        }
        const [sRes, tRes] = await Promise.all([
          fetch(`/api/pocketbase-proxy/api/collections/students/records?perPage=200&sort=-created&expand=centerId${studentFilter}`),
          fetch(`/api/pocketbase-proxy/api/collections/teachers/records?perPage=200&sort=-created&expand=centerId`),
        ])
        const sData = await sRes.json()
        const tData = await tRes.json()
        setStudents(sData?.items || [])
        setTotalTeachers(tData?.totalItems || 0)
        setTeachers(tData?.items || [])
      } catch (e) {
        console.error('loadData error:', e)
      } finally {
        setStudentsLoading(false)
      }
    }
    loadData()
  }, [selectedCenter])

  // Filter teachers by center
  const filteredTeachers = useMemo(() => {
    if (selectedCenter === 'all') return teachers
    return teachers.filter(t => t.centerId === selectedCenter || t.expand?.centerId?.id === selectedCenter)
  }, [teachers, selectedCenter])

  // Filter students
  const filteredStudents = useMemo(() => {
    if (selectedCenter === 'all') return students
    return students.filter(s => s.centerId === selectedCenter || s.expand?.centerId?.id === selectedCenter)
  }, [students, selectedCenter])

  // Stats by center
  const centerStats = useMemo(() => {
    const activeStudents = filteredStudents.filter(s => s.status === 'active')
    const primaryStudents = filteredStudents.filter(s => {
      const g = s.grade || s.standard || ''
      return ['1','2','3','4','5','6','Standard 1','Standard 2','Standard 3','Standard 4','Standard 5','Standard 6']
        .some(x => g === x || g.includes(x))
    })
    const secondaryStudents = filteredStudents.filter(s => {
      const g = s.grade || s.standard || ''
      return !['1','2','3','4','5','6','Standard 1','Standard 2','Standard 3','Standard 4','Standard 5','Standard 6']
        .some(x => g === x || g.includes(x))
    })
    return {
      total: filteredStudents.length,
      active: activeStudents.length,
      primaryCount: primaryStudents.length,
      secondaryCount: secondaryStudents.length,
      teachers: filteredTeachers.length,
    }
  }, [filteredStudents, filteredTeachers])

  const selectedCenterName = useMemo(() => {
    if (selectedCenter === 'all') return '所有分行'
    const c = centers.find(cc => cc.id === selectedCenter)
    return c ? `${c.code} ${c.name}` : '未知分行'
  }, [selectedCenter, centers])

  const quickActions = [
    { title: '学生管理', icon: Users, iconColor: 'text-amber-600', bgColor: 'bg-amber-100', path: '/student-management' },
    { title: '财务管理', icon: DollarSign, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-100', path: '/finance-management' },
    { title: '课程管理', icon: BookOpen, iconColor: 'text-amber-700', bgColor: 'bg-amber-50', path: '/course-management' },
    { title: '考勤系统', icon: Clock, iconColor: 'text-amber-600', bgColor: 'bg-amber-100', path: '/unified-attendance' },
    { title: '教师管理', icon: Shield, iconColor: 'text-amber-700', bgColor: 'bg-amber-50', path: '/teacher-management' },
    { title: '系统设置', icon: Settings, iconColor: 'text-amber-800', bgColor: 'bg-amber-100', path: '/settings' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-50 rounded-2xl p-6 sm:p-8 text-gray-800 relative overflow-hidden shadow-sm border border-yellow-200">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">欢迎回来，{userProfile?.name || '管理员'}</h2>
            <p className="text-amber-700 text-sm sm:text-base">当前查看：<span className="font-semibold text-amber-900">{selectedCenterName}</span></p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-amber-600 text-xs">系统时间</p>
            <p className="text-xl font-mono font-bold text-amber-800">{new Date().toLocaleTimeString('zh-CN')}</p>
            <p className="text-amber-500 text-xs">{new Date().toLocaleDateString('zh-CN')}</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/30 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200/30 rounded-full -ml-10 -mb-10 blur-2xl"></div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">总学生数</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{centerStats.total}</p>
                <div className="flex items-center mt-1 gap-2">
                  <span className="text-amber-600 text-xs font-medium">小学 {centerStats.primaryCount}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-yellow-700 text-xs font-medium">中学 {centerStats.secondaryCount}</span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-200 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">本月收入</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">RM {financialStats?.monthlyRevenue?.toLocaleString() || '0'}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 text-xs font-medium">+15% 较上月</span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-200 flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">今日出勤</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats?.todayAttendance || 0}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 text-xs font-medium">
                    {centerStats.total > 0 ? Math.round((stats?.todayAttendance || 0) / centerStats.total * 100) : 0}% 出勤率
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-200 flex-shrink-0">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">活跃教师</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{centerStats.teachers}</p>
                <div className="flex items-center mt-1">
                  <UserCheck className="h-3 w-3 text-amber-400 mr-1" />
                  <span className="text-amber-600 text-xs">{selectedCenter === 'all' ? totalTeachers : centerStats.teachers} 位在职教师</span>
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-200 flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Section — full width */}
      <Card className="border-amber-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-amber-600" />
                {selectedCenter === 'all' ? '全部学生' : `${selectedCenterName} — 学生列表`}
              </CardTitle>
              <CardDescription>共 {centerStats.total} 名学生 | 在读 {centerStats.active} 人</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-700 hover:text-amber-800"
              onClick={() => router.push('/student-management')}
            >
              查看全部 <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生信息</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>中心</TableHead>
                    <TableHead>父亲</TableHead>
                    <TableHead>母亲</TableHead>
                    <TableHead>父母电话</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        此分行暂无学生数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.slice(0, 8).map((student) => (
                      <TableRow key={student.id} className="hover:bg-amber-50/50 transition-colors duration-150">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={student.photo ? `/api/pocketbase-proxy/api/files/students/${student.id}/${student.photo}` : undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm font-semibold">
                                {student.name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{student.name}</div>
                              <div className="text-xs text-slate-500">学号: {student.student_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs">
                            {student.grade || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            {student.expand?.centerId?.code || student.center || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs truncate max-w-[100px]" title={student.fatherName || '-'}>{student.fatherName || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs truncate max-w-[100px]" title={student.motherName || '-'}>{student.motherName || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            {student.fatherPhone && <div><span className="text-amber-600">父</span> {student.fatherPhone}</div>}
                            {student.motherPhone && <div><span className="text-amber-500">母</span> {student.motherPhone}</div>}
                            {!student.fatherPhone && !student.motherPhone && <span className="text-slate-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={student.status === 'active' ? 'default' : 'secondary'}
                            className={`text-[10px] ${student.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}
                          >
                            {student.status === 'active' ? '在读' : '离校'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      {/* Teacher Section */}
      <Card className="border-amber-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-amber-600" />
              {selectedCenter === 'all' ? '全部教师' : `${selectedCenterName} — 教师列表`}
            </CardTitle>
            <CardDescription>共 {centerStats.teachers} 位教师</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:text-amber-800"
            onClick={() => router.push('/teacher-management')}
          >
            查看全部 <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>所属中心</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                      此分行暂无教师数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.slice(0, 5).map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-amber-50/50 transition-colors duration-150">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={teacher.avatar ? `/api/pocketbase-proxy/api/files/teachers/${teacher.id}/${teacher.avatar}` : undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-white text-xs font-semibold">
                              {(teacher.name || teacher.teacher_name || 'T').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{teacher.name || teacher.teacher_name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          {teacher.expand?.centerId?.code || teacher.center || '未分配'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">{teacher.subject || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={teacher.status === 'active' ? 'default' : 'secondary'}
                          className={`text-[10px] ${teacher.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}`}
                        >
                          {teacher.status === 'active' ? '在职' : '离职'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
