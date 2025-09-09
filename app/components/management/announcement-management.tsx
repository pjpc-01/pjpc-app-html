'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Bell, Megaphone, AlertTriangle, Calendar, Edit, Trash2, Eye } from 'lucide-react'
import { useAnnouncements, useNotifications, Announcement, Notification } from '@/hooks/useAnnouncements'
import { useCurrentTeacher } from '@/hooks/useCurrentTeacher'

export default function AnnouncementManagement() {
  const { teacher, loading: teacherLoading } = useCurrentTeacher()
  const { announcements, loading: announcementsLoading, createAnnouncement } = useAnnouncements(teacher?.id)
  const { notifications, loading: notificationsLoading, createNotification, markAsRead } = useNotifications(teacher?.id)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    status: 'draft',
    target_audience: { type: 'all' }
  })
  const [newNotification, setNewNotification] = useState<Partial<Notification>>({
    title: '',
    message: '',
    type: 'system'
  })

  const handleCreateAnnouncement = async () => {
    if (!teacher?.id) return

    // 验证必填字段
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('请填写公告标题和内容')
      return
    }

    const announcementData = {
      ...newAnnouncement,
      author_id: teacher.id
    }

    const result = await createAnnouncement(announcementData)
    if (result) {
      setShowCreateDialog(false)
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'general',
        priority: 'medium',
        status: 'draft',
        target_audience: { type: 'all' }
      })
      alert('公告发布成功！')
    }
  }

  const handleCreateNotification = async () => {
    if (!teacher?.id) return

    // 验证必填字段
    if (!newNotification.title || !newNotification.message) {
      alert('请填写通知标题和内容')
      return
    }

    const notificationData = {
      ...newNotification,
      sender_id: teacher.id,
      recipient_id: teacher.id // 这里应该根据实际需求选择接收者
    }

    const result = await createNotification(notificationData)
    if (result) {
      setShowNotificationDialog(false)
      setNewNotification({
        title: '',
        message: '',
        type: 'system'
      })
      alert('通知发送成功！')
    }
  }

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setShowViewDialog(true)
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      status: announcement.status,
      target_audience: announcement.target_audience
    })
    setShowEditDialog(true)
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('确定要删除这个公告吗？此操作不可撤销。')) {
      return
    }

    try {
      console.log('开始删除公告:', announcementId)
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('删除响应状态:', response.status)
      const responseData = await response.json()
      console.log('删除响应数据:', responseData)
      
      if (response.ok) {
        alert('公告删除成功！')
        // 这里应该刷新公告列表
        window.location.reload()
      } else {
        alert(`删除失败: ${responseData.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('删除公告失败:', error)
      alert(`删除失败: ${error instanceof Error ? error.message : '网络错误'}`)
    }
  }

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement?.id) return

    // 验证必填字段
    if (!newAnnouncement.title || !newAnnouncement.content) {
      alert('请填写公告标题和内容')
      return
    }

    try {
      console.log('开始更新公告:', selectedAnnouncement.id, newAnnouncement)
      const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      })
      
      console.log('更新响应状态:', response.status)
      const responseData = await response.json()
      console.log('更新响应数据:', responseData)
      
      if (response.ok) {
        alert('公告更新成功！')
        setShowEditDialog(false)
        setSelectedAnnouncement(null)
        setNewAnnouncement({
          title: '',
          content: '',
          type: 'general',
          priority: 'medium',
          status: 'draft',
          target_audience: { type: 'all' }
        })
        // 这里应该刷新公告列表
        window.location.reload()
      } else {
        alert(`更新失败: ${responseData.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('更新公告失败:', error)
      alert(`更新失败: ${error instanceof Error ? error.message : '网络错误'}`)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />
      case 'event': return <Calendar className="h-4 w-4" />
      default: return <Megaphone className="h-4 w-4" />
    }
  }

  if (teacherLoading) {
    return <div className="p-6">加载教师信息中...</div>
  }

  if (!teacher) {
    return <div className="p-6">未找到教师信息</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">通知与公告中心</h2>
        <div className="flex space-x-2">
          <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                发送通知
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>发送通知</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notification-title">通知标题 <span className="text-red-500">*</span></Label>
                  <Input
                    id="notification-title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="输入通知标题"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notification-message">通知内容 <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="notification-message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="输入通知内容"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notification-type">通知类型</Label>
                  <Select value={newNotification.type} onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">系统通知</SelectItem>
                      <SelectItem value="assignment">作业通知</SelectItem>
                      <SelectItem value="attendance">考勤通知</SelectItem>
                      <SelectItem value="announcement">公告通知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateNotification}>
                    发送通知
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                发布公告
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>发布公告</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="announcement-title">公告标题 <span className="text-red-500">*</span></Label>
                  <Input
                    id="announcement-title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="输入公告标题"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="announcement-type">公告类型</Label>
                    <Select value={newAnnouncement.type} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">一般公告</SelectItem>
                        <SelectItem value="urgent">紧急公告</SelectItem>
                        <SelectItem value="event">活动公告</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="announcement-priority">优先级</Label>
                    <Select value={newAnnouncement.priority} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="announcement-content">公告内容 <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="announcement-content"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    placeholder="输入公告内容"
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateAnnouncement}>
                    发布公告
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="announcements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="announcements">公告管理</TabsTrigger>
          <TabsTrigger value="notifications">通知中心</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>我的公告</CardTitle>
            </CardHeader>
            <CardContent>
              {announcementsLoading ? (
                <div className="text-center py-8">加载中...</div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无公告，点击上方按钮发布第一个公告
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>优先级</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>发布日期</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((announcement) => (
                      <TableRow key={announcement.id}>
                        <TableCell className="font-medium">{announcement.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(announcement.type)}
                            <span>{announcement.type === 'general' ? '一般' : announcement.type === 'urgent' ? '紧急' : '活动'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(announcement.priority)}>
                            {announcement.priority === 'high' ? '高' : announcement.priority === 'medium' ? '中' : '低'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={announcement.status === 'published' ? 'default' : 'secondary'}>
                            {announcement.status === 'published' ? '已发布' : '草稿'}
                          </Badge>
                        </TableCell>
                        <TableCell>{announcement.publish_date}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewAnnouncement(announcement)}
                              title="查看公告"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditAnnouncement(announcement)}
                              title="编辑公告"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              title="删除公告"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知中心</CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="text-center py-8">加载中...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无通知
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>发送者</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow key={notification.id} className={!notification.is_read ? 'bg-blue-50' : ''}>
                        <TableCell className="font-medium">{notification.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {notification.type === 'system' ? '系统' : 
                             notification.type === 'assignment' ? '作业' :
                             notification.type === 'attendance' ? '考勤' : '公告'}
                          </Badge>
                        </TableCell>
                        <TableCell>{notification.expand?.sender_id?.name || '系统'}</TableCell>
                        <TableCell>
                          <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                            {notification.is_read ? '已读' : '未读'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(notification.created).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!notification.is_read && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                标记已读
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 查看公告对话框 */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>公告详情</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedAnnouncement.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    {getTypeIcon(selectedAnnouncement.type)}
                    <span>{selectedAnnouncement.type === 'general' ? '一般' : selectedAnnouncement.type === 'urgent' ? '紧急' : '活动'}</span>
                  </div>
                  <Badge variant={getPriorityColor(selectedAnnouncement.priority)}>
                    {selectedAnnouncement.priority === 'high' ? '高' : selectedAnnouncement.priority === 'medium' ? '中' : '低'}
                  </Badge>
                  <Badge variant={selectedAnnouncement.status === 'published' ? 'default' : 'secondary'}>
                    {selectedAnnouncement.status === 'published' ? '已发布' : '草稿'}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">公告内容</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>发布日期: {selectedAnnouncement.publish_date}</p>
                <p>创建时间: {new Date(selectedAnnouncement.created).toLocaleString()}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑公告对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑公告</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-announcement-title">公告标题 <span className="text-red-500">*</span></Label>
              <Input
                id="edit-announcement-title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                placeholder="输入公告标题"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-announcement-type">公告类型</Label>
                <Select value={newAnnouncement.type} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">一般公告</SelectItem>
                    <SelectItem value="urgent">紧急公告</SelectItem>
                    <SelectItem value="event">活动公告</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-announcement-priority">优先级</Label>
                <Select value={newAnnouncement.priority} onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-announcement-content">公告内容 <span className="text-red-500">*</span></Label>
              <Textarea
                id="edit-announcement-content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                placeholder="输入公告内容"
                rows={6}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateAnnouncement}>
                更新公告
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
