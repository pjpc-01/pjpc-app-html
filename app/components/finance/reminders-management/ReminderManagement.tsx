"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  Calendar, 
  User, 
  FileText, 
  AlertCircle,
  Send,
  Clock,
  CheckCircle
} from "lucide-react"
import { useInvoiceData } from "@/hooks/useInvoiceData"
import { SimpleInvoice } from "@/hooks/useInvoiceData"
import { useReminders } from "@/hooks/useReminders"

export default function ReminderManagement() {
  const { invoices } = useInvoiceData()
  const {
    reminders,
    templates,
    scheduleReminder,
    sendReminder,
    markReminderFailed,
    getRemindersByInvoice,
    getScheduledReminders,
    getOverdueInvoicesForReminders,
    autoScheduleReminders,
    getReminderStatistics,
    addTemplate,
    updateTemplate,
    deleteTemplate
  } = useReminders(invoices)

  const [isAddTemplateDialogOpen, setIsAddTemplateDialogOpen] = useState(false)
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    subject: string;
    body: string;
    type: 'email' | 'sms';
    daysBeforeDue: number;
  }>({
    name: "",
    subject: "",
    body: "",
    type: "email",
    daysBeforeDue: 3
  })

  const getReminderStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary">已安排</Badge>
      case "sent":
        return <Badge variant="default">已发送</Badge>
      case "failed":
        return <Badge variant="destructive">发送失败</Badge>
      case "cancelled":
        return <Badge variant="outline">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      alert("请填写完整信息")
      return
    }

    addTemplate(newTemplate)
    setNewTemplate({
      name: "",
      subject: "",
      body: "",
      type: "email" as const,
      daysBeforeDue: 3
    })
    setIsAddTemplateDialogOpen(false)
  }

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template)
    setNewTemplate({
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type as 'email' | 'sms',
      daysBeforeDue: template.daysBeforeDue
    })
    setIsEditTemplateDialogOpen(true)
  }

  const handleUpdateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      alert("请填写完整信息")
      return
    }

    updateTemplate(selectedTemplate.id, newTemplate)
    setSelectedTemplate(null)
    setNewTemplate({
      name: "",
      subject: "",
      body: "",
      type: "email" as const,
      daysBeforeDue: 3
    })
    setIsEditTemplateDialogOpen(false)
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("确定要删除这个提醒模板吗？")) {
      deleteTemplate(templateId)
    }
  }

  const handleSendReminder = (reminderId: string) => {
    sendReminder(reminderId)
  }

  const handleScheduleReminder = (invoiceId: string, templateId: string) => {
    scheduleReminder(invoiceId, templateId, new Date().toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">
      {/* Reminder Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月提醒</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders.length}</div>
            <p className="text-xs text-muted-foreground">发送提醒数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功发送</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders.filter(r => r.status === 'sent').length}</div>
            <p className="text-xs text-muted-foreground">成功发送数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">发送失败</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reminders.filter(r => r.status === 'failed').length}</div>
            <p className="text-xs text-muted-foreground">发送失败数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">模板数量</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">提醒模板数量</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            逾期发票
          </CardTitle>
          <CardDescription>需要发送提醒的逾期发票</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">李小红 - 1月学费</div>
                  <div className="text-sm text-gray-500">应缴金额：RM 1,200</div>
                </div>
                <Badge variant="destructive">逾期3天</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  发送邮件提醒
                </Button>
                <Button size="sm" variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  电话联系
                </Button>
                <Button size="sm" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  短信提醒
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">陈小军 - 餐费充值</div>
                  <div className="text-sm text-gray-500">应缴金额：RM 300</div>
                </div>
                <Badge variant="secondary">即将到期</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  发送邮件提醒
                </Button>
                <Button size="sm" variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  电话联系
                </Button>
                <Button size="sm" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  短信提醒
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Templates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                提醒模板
              </CardTitle>
              <CardDescription>管理提醒消息模板</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddTemplateDialogOpen(true)}>
              <User className="h-4 w-4 mr-2" />
              添加模板
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模板名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>提前天数</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.type === "email" ? "邮件" : 
                       template.type === "sms" ? "短信" : "电话"}
                    </Badge>
                  </TableCell>
                  <TableCell>{template.daysBeforeDue}天</TableCell>
                  <TableCell>
                    <Badge variant="default">启用</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id as string)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scheduled Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            已安排提醒
          </CardTitle>
          <CardDescription>即将发送的提醒消息</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead>提醒类型</TableHead>
                <TableHead>计划发送时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getScheduledReminders().map((reminder) => {
                const invoice = invoices.find(inv => inv.id === reminder.invoiceId)
                return (
                <TableRow key={reminder.id}>
                  <TableCell className="font-medium">{invoice?.studentName || '未知学生'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {reminder.type === "email" ? "邮件" : 
                       reminder.type === "sms" ? "短信" : "电话"}
                    </Badge>
                  </TableCell>
                  <TableCell>{reminder.scheduledDate}</TableCell>
                  <TableCell>{getReminderStatusBadge(reminder.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendReminder(reminder.id)}
                        disabled={reminder.status === 'sent'}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Template Dialog */}
      <Dialog open={isAddTemplateDialogOpen} onOpenChange={setIsAddTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加提醒模板</DialogTitle>
            <DialogDescription>创建新的提醒消息模板</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>模板名称</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：学费到期提醒"
                />
              </div>
              <div>
                <Label>提醒类型</Label>
                <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, type: value as 'email' | 'sms' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">邮件</SelectItem>
                    <SelectItem value="sms">短信</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>提前天数</Label>
              <Input
                type="number"
                value={newTemplate.daysBeforeDue}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, daysBeforeDue: parseInt(e.target.value) || 0 }))}
                placeholder="3"
              />
            </div>

            <div>
              <Label>邮件主题</Label>
              <Input
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="缴费提醒 - {学生姓名}"
              />
            </div>

            <div>
              <Label>邮件内容</Label>
              <Textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                placeholder="尊敬的{家长姓名}，您好！{学生姓名}的{费用项目}即将到期，请及时缴费。"
                rows={6}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddTemplateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddTemplate}>
                添加模板
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑提醒模板</DialogTitle>
            <DialogDescription>修改提醒消息模板</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>模板名称</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：学费到期提醒"
                />
              </div>
              <div>
                <Label>提醒类型</Label>
                <Select value={newTemplate.type} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, type: value as 'email' | 'sms' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">邮件</SelectItem>
                    <SelectItem value="sms">短信</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>提前天数</Label>
              <Input
                type="number"
                value={newTemplate.daysBeforeDue}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, daysBeforeDue: parseInt(e.target.value) || 0 }))}
                placeholder="3"
              />
            </div>

            <div>
              <Label>邮件主题</Label>
              <Input
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="缴费提醒 - {学生姓名}"
              />
            </div>

            <div>
              <Label>邮件内容</Label>
              <Textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                placeholder="尊敬的{家长姓名}，您好！{学生姓名}的{费用项目}即将到期，请及时缴费。"
                rows={6}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditTemplateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateTemplate}>
                更新模板
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
