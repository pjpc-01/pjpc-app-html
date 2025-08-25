"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Input } from "../../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
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
} from "lucide-react"

// 模拟学生数据
const mockStudents = [
  {
    id: "1",
    student_id: "ST001",
    student_name: "张三",
    studentUrl: "https://center1.com/B1",
    center: "WX 01",
    status: "active",
    serviceType: "afterschool"
  },
  {
    id: "2",
    student_id: "ST002",
    student_name: "李四",
    studentUrl: "https://center1.com/B2",
    center: "WX 01",
    status: "active",
    serviceType: "tuition"
  },
  {
    id: "3",
    student_id: "ST003",
    student_name: "王五",
    studentUrl: "https://center2.com/C1",
    center: "WX 02",
    status: "active",
    serviceType: "afterschool"
  }
]

// 模拟考勤记录
const mockAttendanceRecords = [
  {
    id: "1",
    studentId: "ST001",
    studentName: "张三",
    studentUrl: "https://center1.com/B1",
    timestamp: "2024-01-15T08:30:00Z",
    deviceInfo: "iPhone 15 - 192.168.1.100",
    center: "WX 01",
    type: "checkin",
    status: "success",
  },
  {
    id: "2",
    studentId: "ST002",
    studentName: "李四",
    studentUrl: "https://center1.com/B2",
    timestamp: "2024-01-15T08:35:00Z",
    deviceInfo: "iPhone 15 - 192.168.1.100",
    center: "WX 01",
    type: "checkin",
    status: "success",
  },
]

export default function URLAttendanceSystemSimple() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [students] = useState(mockStudents)
  const [attendanceRecords] = useState(mockAttendanceRecords)
  
  // 搜索和过滤状态
  const [studentSearchTerm, setStudentSearchTerm] = useState("")
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("all")
  const [studentCenterFilter, setStudentCenterFilter] = useState<string>("all")
  const [recordSearchTerm, setRecordSearchTerm] = useState("")

  // 考勤测试状态
  const [testURL, setTestURL] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

  // 统计信息
  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    todayCheckins: attendanceRecords.filter(r => r.type === 'checkin').length,
    todayCheckouts: attendanceRecords.filter(r => r.type === 'checkout').length,
    totalRecords: attendanceRecords.length,
  }

  // URL考勤测试
  const testAttendance = async (url: string) => {
    setTestLoading(true)
    setTestResult(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

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
          message: `${student.student_name} 的状态为 ${student.status}，无法考勤`
        })
        return
      }

      setTestResult({
        success: true,
        student: student,
        message: `${student.student_name} 打卡成功！`,
      })

    } catch (error) {
      setTestResult({
        success: false,
        error: "系统错误",
        message: "打卡失败，请重试"
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
                         record.studentId.includes(recordSearchTerm) ||
                         record.studentUrl.includes(recordSearchTerm)
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">URL考勤系统 (简化版)</h1>
          <p className="text-gray-600 mt-2">
            基于学生专属URL的智能考勤管理系统 - 使用模拟数据
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportStudentUrls}>
            <Download className="h-4 w-4 mr-2" />
            导出URL列表
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
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
                          <p className="text-sm text-gray-600">{record.center}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {record.type === 'checkin' ? '签到' : '签退'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
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
                    <span className="text-lg font-bold text-orange-600">0</span>
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
                管理学生的专属URL信息（使用模拟数据）
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
                查看所有考勤记录和统计信息
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="搜索学生姓名、学号或URL..."
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
                    <TableHead>考勤URL</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>设备信息</TableHead>
                    <TableHead>中心</TableHead>
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
                      <TableCell>
                        <span className="text-blue-600 font-mono text-sm">
                          {record.studentUrl}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(record.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.type === 'checkin' ? 'default' : 'secondary'}>
                          {record.type === 'checkin' ? '签到' : '签退'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'success' ? 'default' : 'destructive'}>
                          {record.status === 'success' ? '成功' : '失败'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {record.deviceInfo}
                        </span>
                      </TableCell>
                      <TableCell>{record.center}</TableCell>
                    </TableRow>
                  ))}
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
              测试URL考勤功能，验证学生身份识别
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
                  <p>• 系统会自动从模拟数据中查找对应的学生信息</p>
                  <p>• 测试结果会显示在下方</p>
                  <p>• 目前使用模拟数据，实际使用时需要连接到PocketBase</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">系统信息</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>• 学生数据来源：模拟数据</p>
                  <p>• URL字段：studentUrl</p>
                  <p>• 考勤记录：模拟数据</p>
                  <p>• 下一步：集成真实的PocketBase API</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
