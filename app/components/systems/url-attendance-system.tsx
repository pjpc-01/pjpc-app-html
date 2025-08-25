"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Globe,
  UserCheck,
  Calendar,
  BarChart3,
  QrCode,
  AlertTriangle,
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useAttendance } from "@/hooks/useAttendance"

// 考勤记录接口 - 与useAttendance保持一致
interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  centerId: string
  centerName: string
  timestamp: string
  type: 'check-in' | 'check-out'
  status: 'success' | 'error'
  deviceId?: string
  deviceName?: string
  created: string
  updated: string
}

interface AttendanceStats {
  totalStudents: number
  activeStudents: number
  todayCheckins: number
  todayCheckouts: number
  totalRecords: number
}

export default function URLAttendanceSystem() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [error, setError] = useState<string | null>(null)
  
  // 使用现有的学生数据
  const { students, loading: studentsLoading, error: studentsError, refetch } = useStudents()
  
  // 使用现有的考勤数据
  const { 
    attendanceRecords, 
    loading: attendanceLoading, 
    error: attendanceError, 
    fetchAttendanceRecords,
    recordAttendance,
    getTodayStats 
  } = useAttendance()
  
  // 统计信息
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    activeStudents: 0,
    todayCheckins: 0,
    todayCheckouts: 0,
    totalRecords: 0,
  })

  // 搜索和过滤状态
  const [studentSearchTerm, setStudentSearchTerm] = useState("")
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("all")
  const [studentCenterFilter, setStudentCenterFilter] = useState<string>("all")
  const [recordSearchTerm, setRecordSearchTerm] = useState("")

  // 考勤测试状态
  const [testURL, setTestURL] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  // 当学生数据或考勤记录更新时，更新统计信息
  useEffect(() => {
    if (students.length > 0 || attendanceRecords.length > 0) {
      updateStats()
    }
  }, [students, attendanceRecords])

  const updateStats = useCallback(() => {
    // 过滤有URL的学生
    const studentsWithUrl = students.filter(student => student.studentUrl)
    const activeStudentsWithUrl = studentsWithUrl.filter(student => student.status === 'active')

    // 获取今日统计
    const todayStats = getTodayStats()

    setStats({
      totalStudents: studentsWithUrl.length,
      activeStudents: activeStudentsWithUrl.length,
      todayCheckins: todayStats.checkIn,
      todayCheckouts: todayStats.checkOut,
      totalRecords: attendanceRecords.length,
    })
  }, [students, attendanceRecords, getTodayStats])

  // URL考勤测试 - 现在使用真实的API
  const testAttendance = async (url: string) => {
    setTestLoading(true)
    setTestResult(null)

    try {
      // 通过URL查找对应的学生信息
      const student = students.find(s => s.studentUrl === url)
      
      if (!student) {
        setTestResult({
          success: false,
          error: "未找到对应的学生信息",
          message: "该URL未注册或学生不存在"
        })
        return
      }

      if (student.status !== 'active') {
        setTestResult({
          success: false,
          error: "学生状态异常",
          message: `${student.student_name || '未知学生'} 的状态为 ${student.status}，无法考勤`
        })
        return
      }

      // 使用真实的考勤记录API
      const newRecord = await recordAttendance(
        student.student_id || student.id,
        student.center || 'WX 01', // 默认中心
        'check-in',
        new Date().toISOString(),
        'test-device',
        '测试设备'
      )

      setTestResult({
        success: true,
        student: student,
        message: `${student.student_name || '未知学生'} 打卡成功！`,
        record: newRecord
      })

    } catch (error: any) {
      setTestResult({
        success: false,
        error: "系统错误",
        message: error.message || "打卡失败，请重试"
      })
    } finally {
      setTestLoading(false)
    }
  }

  // 过滤学生数据
  const filteredStudents = students.filter(student => {
    if (!student.studentUrl) return false
    
    const matchesSearch = (student.student_name || '').includes(studentSearchTerm) || 
                         (student.student_id || '').includes(studentSearchTerm) ||
                         (student.studentUrl || '').includes(studentSearchTerm)
    const matchesStatus = studentStatusFilter === "all" || student.status === studentStatusFilter
    const matchesCenter = studentCenterFilter === "all" || student.center === studentCenterFilter
    
    return matchesSearch && matchesStatus && matchesCenter
  })

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.studentName.includes(recordSearchTerm) || 
                         record.studentId.includes(recordSearchTerm)
    return matchesSearch
  })

  // 导出学生URL数据
  const exportStudentUrls = () => {
    const studentsWithUrl = students.filter(student => student.studentUrl)
    const csvContent = [
      "学号,姓名,专属URL,中心,状态,服务类型",
      ...studentsWithUrl.map(s => 
        `${s.student_id || ''},${s.student_name || ''},${s.studentUrl || ''},${s.center || ''},${s.status || ''},${s.serviceType || ''}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `学生URL列表_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 刷新考勤数据
  const refreshAttendanceData = useCallback(() => {
    fetchAttendanceRecords()
  }, [fetchAttendanceRecords])

  if (studentsLoading || attendanceLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg text-gray-600">正在加载数据...</p>
          </div>
        </div>
      </div>
    )
  }

  if (studentsError || attendanceError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            加载数据失败: {studentsError || attendanceError}
            <div className="mt-2 space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
              >
                重试学生数据
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refreshAttendanceData()}
              >
                重试考勤数据
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">URL考勤系统</h1>
          <p className="text-gray-600 mt-2">
            基于学生专属URL的智能考勤管理系统 - 已集成PocketBase真实数据
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportStudentUrls}>
            <Download className="h-4 w-4 mr-2" />
            导出URL列表
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新学生数据
          </Button>
          <Button variant="outline" onClick={refreshAttendanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新考勤数据
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">系统概览</TabsTrigger>
          <TabsTrigger value="students">学生URL管理</TabsTrigger>
          <TabsTrigger value="attendance">考勤记录</TabsTrigger>
          <TabsTrigger value="test">考勤测试</TabsTrigger>
        </TabsList>

        {/* 系统概览 */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总学生数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  活跃学生: {stats.activeStudents}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今日考勤</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayCheckins + stats.todayCheckouts}</div>
                <p className="text-xs text-muted-foreground">
                  签到: {stats.todayCheckins} | 签退: {stats.todayCheckouts}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">系统健康度</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95%</div>
                <p className="text-xs text-muted-foreground">
                  运行正常
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  最近考勤记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceRecords.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">{record.studentName}</p>
                          <p className="text-sm text-gray-600">{record.centerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {record.type === 'check-in' ? '签到' : '签退'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      暂无考勤记录
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  URL统计信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">有URL的学生</span>
                    <span className="text-lg font-bold">{stats.totalStudents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">活跃学生</span>
                    <span className="text-lg font-bold text-green-600">{stats.activeStudents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">无URL学生</span>
                    <span className="text-lg font-bold text-orange-600">
                      {students.length - stats.totalStudents}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 学生URL管理 */}
        <TabsContent value="students" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">学生URL管理</h3>
              <p className="text-sm text-gray-600">
                管理学生的专属URL信息（已集成PocketBase真实数据）
              </p>
            </div>
            <div className="text-sm text-gray-500">
              共 {students.length} 名学生，其中 {stats.totalStudents} 名有专属URL
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="搜索学生姓名、学号或URL..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select 
              value={studentStatusFilter} 
              onChange={(e) => setStudentStatusFilter(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
            </select>
            <select 
              value={studentCenterFilter} 
              onChange={(e) => setStudentCenterFilter(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">全部中心</option>
              <option value="WX 01">WX 01</option>
              <option value="WX 02">WX 02</option>
              <option value="WX 03">WX 03</option>
              <option value="WX 04">WX 04</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>专属URL</TableHead>
                    <TableHead>所属中心</TableHead>
                    <TableHead>服务类型</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.student_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-600 font-mono text-sm">
                            {student.studentUrl}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{student.center}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.serviceType === 'afterschool' ? '课后班' : '补习'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status === 'active' ? '活跃' : '停用'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        暂无学生数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 考勤记录 */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">考勤记录</h3>
              <p className="text-sm text-gray-600">
                查看所有考勤记录和统计信息（已集成PocketBase真实数据）
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="搜索学生姓名或学号..."
                value={recordSearchTerm}
                onChange={(e) => setRecordSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生信息</TableHead>
                    <TableHead>中心</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>设备信息</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.studentName}</p>
                          <p className="text-sm text-gray-600">{record.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{record.centerName}</TableCell>
                      <TableCell>
                        {new Date(record.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.type === 'check-in' ? 'default' : 'secondary'}>
                          {record.type === 'check-in' ? '签到' : '签退'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'success' ? 'default' : 'destructive'}>
                          {record.status === 'success' ? '成功' : '失败'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {record.deviceName || '未知设备'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        暂无考勤记录
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 考勤测试 */}
        <TabsContent value="test" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">考勤测试</h3>
            <p className="text-sm text-gray-600">
              测试URL考勤功能，验证学生身份识别（已集成PocketBase真实数据）
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                URL考勤测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="输入学生专属URL进行测试..."
                  value={testURL}
                  onChange={(e) => setTestURL(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => testAttendance(testURL)}
                  disabled={!testURL || testLoading}
                >
                  {testLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  {testLoading ? '测试中...' : '测试考勤'}
                </Button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h4 className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? '考勤成功' : '考勤失败'}
                    </h4>
                  </div>
                  <p className={`mt-2 ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>
                  {testResult.success && testResult.student && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h5 className="font-medium text-green-800 mb-2">学生信息</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">学号：</span>
                          <span className="font-medium">{testResult.student.student_id}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">姓名：</span>
                          <span className="font-medium">{testResult.student.student_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">中心：</span>
                          <span className="font-medium">{testResult.student.center}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">状态：</span>
                          <Badge variant="default">活跃</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-medium mb-3">测试说明</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 输入学生的专属URL进行考勤测试</p>
                  <p>• 系统会自动从PocketBase中查找对应的学生信息</p>
                  <p>• 测试结果会显示在下方</p>
                  <p>• 考勤记录会保存到PocketBase数据库</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">系统信息</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>• 学生数据来源：PocketBase students集合</p>
                  <p>• 考勤记录：PocketBase attendance集合</p>
                  <p>• URL字段：studentUrl</p>
                  <p>• 下一步：实现移动端NFC读取功能</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
