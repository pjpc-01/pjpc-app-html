"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Download,
  Filter,
  RefreshCw,
  Search
} from "lucide-react"
import { useAttendance, AttendanceRecord } from "@/hooks/useAttendance"

interface AttendanceManagementProps {
  centerId?: string
}

export default function AttendanceManagement({ centerId }: AttendanceManagementProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const { 
    attendanceRecords, 
    loading, 
    error, 
    fetchAttendanceRecords,
    getTodayStats 
  } = useAttendance(centerId)

  // 获取今日统计
  const todayStats = getTodayStats()

  // 过滤记录
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesDate = record.timestamp.startsWith(selectedDate)
    const matchesType = selectedType === 'all' || record.type === selectedType
    const matchesSearch = searchTerm === '' || 
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesDate && matchesType && matchesSearch
  })

  // 刷新数据
  const refreshData = useCallback(() => {
    fetchAttendanceRecords({ 
      centerId, 
      date: selectedDate 
    })
  }, [centerId, selectedDate, fetchAttendanceRecords])

  // 导出数据
  const exportData = () => {
    const csvContent = [
      ['学生ID', '学生姓名', '中心ID', '中心名称', '时间', '类型', '状态'].join(','),
      ...filteredRecords.map(record => [
        record.studentId,
        record.studentName,
        record.centerId,
        record.centerName,
        new Date(record.timestamp).toLocaleString('zh-CN'),
        record.type === 'check-in' ? '签到' : '签退',
        record.status === 'success' ? '成功' : '失败'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `考勤记录_${selectedDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    refreshData()
  }, [selectedDate, centerId, refreshData])

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日总打卡</p>
                <p className="text-2xl font-bold">{todayStats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">签到人数</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.checkIn}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">签退人数</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.checkOut}</p>
              </div>
              <Building className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">参与学生</p>
                <p className="text-2xl font-bold text-purple-600">{todayStats.uniqueStudents}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和操作 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选和操作
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="type">考勤类型</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="check-in">签到</SelectItem>
                  <SelectItem value="check-out">签退</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">搜索学生</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="姓名或ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={refreshData} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button onClick={exportData} variant="outline">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 考勤记录表格 */}
      <Card>
        <CardHeader>
          <CardTitle>考勤记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-500" />
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                                     <TableRow>
                     <TableHead>学生ID</TableHead>
                     <TableHead>学生姓名</TableHead>
                     <TableHead>中心</TableHead>
                     <TableHead>设备</TableHead>
                     <TableHead>时间</TableHead>
                     <TableHead>类型</TableHead>
                     <TableHead>状态</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                                     {filteredRecords.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                         暂无考勤记录
                       </TableCell>
                     </TableRow>
                   ) : (
                    filteredRecords.map((record) => (
                                             <TableRow key={record.id}>
                         <TableCell className="font-mono">{record.studentId}</TableCell>
                         <TableCell>{record.studentName}</TableCell>
                         <TableCell>{record.centerName}</TableCell>
                         <TableCell>{record.deviceName || '未知设备'}</TableCell>
                         <TableCell>
                           {new Date(record.timestamp).toLocaleString('zh-CN')}
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
                       </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
