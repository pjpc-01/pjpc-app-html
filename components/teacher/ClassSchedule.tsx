"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Play,
  Pause,
  RefreshCw
} from "lucide-react"

interface ClassScheduleProps {
  teacherId?: string
}

interface ScheduleItem {
  id: string
  time: string
  duration: string
  subject: string
  className: string
  room: string
  students: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  description?: string
  materials?: string[]
}

export default function ClassSchedule({ teacherId }: ClassScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadScheduleData()
  }, [teacherId, selectedDate])

  const loadScheduleData = async () => {
    try {
      setLoading(true)
      
      // 模拟数据加载
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟课程表数据
      const mockSchedule: ScheduleItem[] = [
        {
          id: "1",
          time: "08:00",
          duration: "45分钟",
          subject: "数学",
          className: "三年级A班",
          room: "教室101",
          students: 25,
          status: "completed",
          description: "分数运算",
          materials: ["课本", "练习册", "计算器"]
        },
        {
          id: "2",
          time: "09:00",
          duration: "45分钟",
          subject: "英语",
          className: "三年级B班",
          room: "教室102",
          students: 23,
          status: "completed",
          description: "语法练习",
          materials: ["课本", "练习册"]
        },
        {
          id: "3",
          time: "10:00",
          duration: "45分钟",
          subject: "数学",
          className: "三年级A班",
          room: "教室101",
          students: 25,
          status: "active",
          description: "几何图形",
          materials: ["课本", "几何工具"]
        },
        {
          id: "4",
          time: "11:00",
          duration: "45分钟",
          subject: "科学",
          className: "三年级C班",
          room: "教室103",
          students: 20,
          status: "upcoming",
          description: "植物生长",
          materials: ["课本", "实验器材"]
        },
        {
          id: "5",
          time: "14:00",
          duration: "45分钟",
          subject: "语文",
          className: "三年级A班",
          room: "教室101",
          students: 25,
          status: "upcoming",
          description: "阅读理解",
          materials: ["课本", "阅读材料"]
        }
      ]

      setSchedule(mockSchedule)

    } catch (error) {
      console.error('加载课程表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 过滤课程表
  const filteredSchedule = schedule.filter(item => {
    const matchesSearch = item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.room.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesSubject = subjectFilter === "all" || item.subject === subjectFilter
    
    return matchesSearch && matchesStatus && matchesSubject
  })

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="h-3 w-3 mr-1" />
      case 'active': return <Activity className="h-3 w-3 mr-1" />
      case 'completed': return <CheckCircle className="h-3 w-3 mr-1" />
      case 'cancelled': return <XCircle className="h-3 w-3 mr-1" />
      default: return <Clock className="h-3 w-3 mr-1" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '即将开始'
      case 'active': return '进行中'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  // 获取科目列表
  const subjects = Array.from(new Set(schedule.map(item => item.subject)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载课程表中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">课程表管理</h2>
        <p className="text-gray-600">查看和管理您的课程安排</p>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            课程表 - {new Date(selectedDate).toLocaleDateString('zh-CN')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">日期</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索科目、班级或教室..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">状态</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="upcoming">即将开始</SelectItem>
                  <SelectItem value="active">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">科目</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部科目</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 课程表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              今日课程 ({filteredSchedule.length})
            </CardTitle>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加课程
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSchedule.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border ${
                  item.status === 'active' 
                    ? 'border-green-500 bg-green-50' 
                    : item.status === 'completed'
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{item.time}</p>
                      <p className="text-sm text-gray-600">{item.duration}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{item.subject}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                          {getStatusText(item.status)}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{item.className}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {item.room}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        {item.students} 名学生
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'upcoming' && (
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          开始
                        </Button>
                      )}
                      {item.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          暂停
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {item.materials && item.materials.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">所需材料:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.materials.map((material, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredSchedule.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>没有找到匹配的课程</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 课程统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总课程数</p>
                <p className="text-2xl font-bold text-blue-600">{schedule.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已完成</p>
                <p className="text-2xl font-bold text-green-600">
                  {schedule.filter(item => item.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">进行中</p>
                <p className="text-2xl font-bold text-orange-600">
                  {schedule.filter(item => item.status === 'active').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">即将开始</p>
                <p className="text-2xl font-bold text-purple-600">
                  {schedule.filter(item => item.status === 'upcoming').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
