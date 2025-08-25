"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Star,
  Archive,
  Trash2
} from "lucide-react"

interface Notification {
  id: string
  title: string
  content: string
  type: 'system' | 'meeting' | 'assignment' | 'reminder' | 'announcement'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'unread' | 'read' | 'archived'
  createdAt: string
  dueDate?: string
  sender: string
  isRead: boolean
}

interface NotificationCenterProps {
  teacherId?: string
}

export default function NotificationCenter({ teacherId }: NotificationCenterProps) {
  // 模拟通知数据
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: '家长会安排通知',
      content: '本周五下午2点将召开三年级家长会，请各位老师准时参加并准备相关材料。',
      type: 'meeting',
      priority: 'high',
      status: 'unread',
      createdAt: '2024-01-15 09:00',
      dueDate: '2024-01-19 14:00',
      sender: '教务处',
      isRead: false
    },
    {
      id: '2',
      title: '教学资源库更新',
      content: '新的教学资源已上传到资源库，包括数学、英语等科目的课件和教案。',
      type: 'announcement',
      priority: 'medium',
      status: 'unread',
      createdAt: '2024-01-15 08:30',
      sender: '资源中心',
      isRead: false
    },
    {
      id: '3',
      title: '作业批改提醒',
      content: '您有5份数学作业待批改，请及时完成批改工作。',
      type: 'reminder',
      priority: 'medium',
      status: 'read',
      createdAt: '2024-01-14 16:00',
      sender: '系统',
      isRead: true
    },
    {
      id: '4',
      title: '课程调整通知',
      content: '因教师请假，明天上午的英语课调整为数学课，请相关老师做好准备。',
      type: 'system',
      priority: 'urgent',
      status: 'unread',
      createdAt: '2024-01-14 15:30',
      sender: '教务处',
      isRead: false
    },
    {
      id: '5',
      title: '教学研讨会',
      content: '下周三下午将举办"提高课堂教学效果"研讨会，欢迎各位老师参加。',
      type: 'meeting',
      priority: 'low',
      status: 'read',
      createdAt: '2024-01-14 14:00',
      dueDate: '2024-01-24 14:00',
      sender: '教研组',
      isRead: true
    }
  ])

  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null)

  // 筛选通知
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (searchTerm) {
      filtered = filtered.filter(notification => 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.sender.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(notification => notification.type === selectedType)
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(notification => notification.priority === selectedPriority)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(notification => notification.status === selectedStatus)
    }

    return filtered
  }, [notifications, searchTerm, selectedType, selectedPriority, selectedStatus])

  // 统计信息
  const stats = useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter(n => !n.isRead).length
    const urgent = notifications.filter(n => n.priority === 'urgent').length
    const today = notifications.filter(n => {
      const today = new Date().toDateString()
      const created = new Date(n.createdAt).toDateString()
      return today === created
    }).length

    return { total, unread, urgent, today }
  }, [notifications])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <Info className="h-4 w-4" />
      case 'meeting': return <Users className="h-4 w-4" />
      case 'assignment': return <FileText className="h-4 w-4" />
      case 'reminder': return <Clock className="h-4 w-4" />
      case 'announcement': return <MessageSquare className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'system': return <Badge variant="outline" className="bg-blue-100 text-blue-700">系统</Badge>
      case 'meeting': return <Badge variant="outline" className="bg-green-100 text-green-700">会议</Badge>
      case 'assignment': return <Badge variant="outline" className="bg-purple-100 text-purple-700">作业</Badge>
      case 'reminder': return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">提醒</Badge>
      case 'announcement': return <Badge variant="outline" className="bg-orange-100 text-orange-700">公告</Badge>
      default: return <Badge variant="outline">未知</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">紧急</Badge>
      case 'high': return <Badge variant="default" className="bg-red-100 text-red-700">高</Badge>
      case 'medium': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">中</Badge>
      case 'low': return <Badge variant="outline" className="bg-gray-100 text-gray-700">低</Badge>
      default: return <Badge variant="outline">未知</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和描述 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">通知中心</h2>
        <p className="text-gray-600 mt-1">查看系统通知、工作安排、会议提醒等重要信息</p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总通知</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">未读通知</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">紧急通知</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日通知</p>
                <p className="text-2xl font-bold text-green-600">{stats.today}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            搜索和筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索通知内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有类型</option>
              <option value="system">系统通知</option>
              <option value="meeting">会议通知</option>
              <option value="assignment">作业相关</option>
              <option value="reminder">提醒通知</option>
              <option value="announcement">公告通知</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有优先级</option>
              <option value="urgent">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="unread">未读</option>
              <option value="read">已读</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 通知列表 */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            通知列表
          </CardTitle>
          <CardDescription>共 {filteredNotifications.length} 条通知</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-medium ${!notification.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {getTypeBadge(notification.type)}
                      {getPriorityBadge(notification.priority)}
                      {!notification.isRead && (
                        <Badge variant="default" className="bg-blue-600">新</Badge>
                      )}
                    </div>
                    
                    <p className={`text-sm mb-3 ${!notification.isRead ? 'text-blue-800' : 'text-gray-600'}`}>
                      {notification.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {notification.sender}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {notification.createdAt}
                      </span>
                      {notification.dueDate && (
                        <span className={`flex items-center gap-1 ${getPriorityColor(notification.priority)}`}>
                          <Clock className="h-3 w-3" />
                          截止: {notification.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingNotification(notification)}
                      className="hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-gray-100"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-gray-100"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 通知详情对话框 */}
      {viewingNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">通知详情</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingNotification(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">标题</h4>
                <p className="text-gray-900">{viewingNotification.title}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">内容</h4>
                <p className="text-gray-600">{viewingNotification.content}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">类型</h4>
                  {getTypeBadge(viewingNotification.type)}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">优先级</h4>
                  {getPriorityBadge(viewingNotification.priority)}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">发送者</h4>
                  <p className="text-gray-600">{viewingNotification.sender}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">发送时间</h4>
                  <p className="text-gray-600">{viewingNotification.createdAt}</p>
                </div>
                
                {viewingNotification.dueDate && (
                  <div className="col-span-2">
                    <h4 className="font-medium text-gray-900 mb-2">截止时间</h4>
                    <p className={`${getPriorityColor(viewingNotification.priority)}`}>
                      {viewingNotification.dueDate}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setViewingNotification(null)}>
                关闭
              </Button>
              <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                标记为已读
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

