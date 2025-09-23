"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Activity,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2
} from "lucide-react"

interface AttendanceRecord {
  id: string
  cardNumber: string
  studentId: string
  studentName: string
  deviceId: string
  deviceName: string
  timestamp: string
  type: "checkin" | "checkout"
  status: "success" | "failed" | "duplicate"
}

interface AttendanceRecordsProps {
  records: AttendanceRecord[]
  onUpdateRecords: (records: AttendanceRecord[]) => void
  onExportRecords: () => void
}

export default function AttendanceRecords({
  records,
  onUpdateRecords,
  onExportRecords
}: AttendanceRecordsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])

  // 过滤记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.cardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || record.type === typeFilter
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const recordDate = new Date(record.timestamp)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      matchesDate = recordDate >= startDate && recordDate <= endDate
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'duplicate': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3 w-3 mr-1" />
      case 'failed': return <XCircle className="h-3 w-3 mr-1" />
      case 'duplicate': return <AlertTriangle className="h-3 w-3 mr-1" />
      default: return <XCircle className="h-3 w-3 mr-1" />
    }
  }

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map(r => r.id))
    } else {
      setSelectedRecords([])
    }
  }

  // 处理单个选择
  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords(prev => [...prev, recordId])
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId))
    }
  }

  // 批量删除
  const bulkDeleteRecords = () => {
    const updatedRecords = records.filter(record => !selectedRecords.includes(record.id))
    onUpdateRecords(updatedRecords)
    setSelectedRecords([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            打卡记录
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={onExportRecords} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              导出
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索和过滤 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名、卡片号或设备名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="类型筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="checkin">签到</SelectItem>
              <SelectItem value="checkout">签退</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="success">成功</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
              <SelectItem value="duplicate">重复</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 日期范围筛选 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div>
            <Label htmlFor="startDate">开始日期</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="endDate">结束日期</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        {/* 批量操作 */}
        {selectedRecords.length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg mb-4">
            <span className="text-sm font-medium">已选择 {selectedRecords.length} 条记录</span>
            <Button onClick={bulkDeleteRecords} size="sm" variant="destructive">
              <Trash2 className="h-3 w-3 mr-1" />
              批量删除
            </Button>
          </div>
        )}

        {/* 记录表格 */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>时间</TableHead>
              <TableHead>学生</TableHead>
              <TableHead>卡片号</TableHead>
              <TableHead>设备</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {new Date(record.timestamp).toLocaleString('zh-CN')}
                </TableCell>
                <TableCell>{record.studentName}</TableCell>
                <TableCell className="font-mono">{record.cardNumber}</TableCell>
                <TableCell>{record.deviceName}</TableCell>
                <TableCell>
                  <Badge variant={record.type === "checkin" ? "default" : "secondary"}>
                    {record.type === "checkin" ? "签到" : "签退"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(record.status)}>
                    {getStatusIcon(record.status)}
                    {record.status === "success" ? "成功" : 
                     record.status === "failed" ? "失败" : "重复"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredRecords.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无记录</h3>
            <p className="text-gray-600">没有找到符合条件的打卡记录</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

