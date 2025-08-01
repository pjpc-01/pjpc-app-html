"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DollarSign, CreditCard, FileText, TrendingUp, AlertCircle, CheckCircle, Plus, Trash2, Edit, Download, Printer, Send, Clock, Users } from "lucide-react"
import React from "react"
import { StudentFeeMatrix } from "../../components/features/StudentFeeMatrix"
import { Checkbox } from "@/components/ui/checkbox"
import { useInvoices } from "@/hooks/useInvoices"
import { usePayments } from "@/hooks/usePayments"
import { useReminders } from "@/hooks/useReminders"
import { downloadInvoicePDF, printInvoicePDF, PDFOptions } from "@/lib/pdf-generator"

// Custom Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, className = "" }: { checked: boolean; onChange: () => void; className?: string }) => {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      style={{
        backgroundColor: checked ? '#374151' : '#e5e7eb',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        style={{
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      />
    </button>
  )
}

export default function FinanceManagement() {
  const [activeSection, setActiveSection] = useState("overview")
  
  // Custom hooks for better state management
  const {
    invoices,
    filters: invoiceFilters,
    setFilters: setInvoiceFilters,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    sendInvoiceReminder,
    getFilteredInvoices,
    generateInvoiceFromStudentFees,
    generateInvoicesForAllStudents,
    generateMonthlyInvoices,
    checkOverdueInvoices,
    getInvoiceStatistics,
    generateInvoiceNumber
  } = useInvoices()

  const {
    payments,
    filters: paymentFilters,
    setFilters: setPaymentFilters,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentByInvoice,
    getInvoiceOutstandingBalance,
    getInvoicePaymentHistory,
    addPaymentToInvoice,
    getFilteredPayments,
    getPaymentStatistics,
    reconcilePayments,
    processPartialPayment
  } = usePayments(invoices)

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

  // PDF options for school branding
  const pdfOptions: PDFOptions = {
    schoolName: "智慧教育学校",
    schoolAddress: "北京市朝阳区教育路123号",
    schoolPhone: "010-12345678",
    schoolEmail: "info@smarteducation.com",
    taxNumber: "91110105MA12345678"
  }

  // Invoice management states
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)
  const [isBulkInvoiceDialogOpen, setIsBulkInvoiceDialogOpen] = useState(false)
  const [isInvoiceDetailDialogOpen, setIsInvoiceDetailDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  // Sample students data for invoice creation
  const students = [
    { id: 1, name: "王小明", grade: "三年级", parentName: "王先生" },
    { id: 2, name: "李小红", grade: "四年级", parentName: "李女士" },
    { id: 3, name: "张小华", grade: "五年级", parentName: "张先生" },
  ]

  const [feeItems, setFeeItems] = useState([
    { 
      id: 1, 
      name: "学费", 
      amount: 1200, 
      type: "monthly", 
      description: "每月学费", 
      applicableGrades: ["三年级", "四年级", "五年级"], 
      status: "active",
      category: "教育费用",
      subItems: [
        { id: 1, name: "基础学费", amount: 800, description: "基础课程费用", active: true },
        { id: 2, name: "特色课程费", amount: 400, description: "特色课程额外费用", active: true }
      ]
    },
    { 
      id: 2, 
      name: "餐费", 
      amount: 300, 
      type: "monthly", 
      description: "每月餐费", 
      applicableGrades: ["三年级", "四年级", "五年级"], 
      status: "active",
      category: "生活费用",
      subItems: [
        { id: 1, name: "午餐费", amount: 200, description: "每日午餐费用", active: true },
        { id: 2, name: "点心费", amount: 100, description: "下午点心费用", active: true }
      ]
    },
    { 
      id: 3, 
      name: "教材费", 
      amount: 200, 
      type: "one-time", 
      description: "学期教材费用", 
      applicableGrades: ["三年级", "四年级", "五年级"], 
      status: "active",
      category: "教育费用",
      subItems: [
        { id: 1, name: "课本费", amount: 120, description: "各科课本费用", active: true },
        { id: 2, name: "练习册费", amount: 80, description: "练习册费用", active: true }
      ]
    },
    { 
      id: 4, 
      name: "活动费", 
      amount: 150, 
      type: "one-time", 
      description: "课外活动费用", 
      applicableGrades: ["三年级", "四年级"], 
      status: "active",
      category: "活动费用",
      subItems: [
        { id: 1, name: "户外活动费", amount: 100, description: "户外活动费用", active: true },
        { id: 2, name: "室内活动费", amount: 50, description: "室内活动费用", active: true }
      ]
    },
  ])

  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false)
  const [isEditFeeDialogOpen, setIsEditFeeDialogOpen] = useState(false)
  const [editingFeeItem, setEditingFeeItem] = useState<any>(null)
  const [isFeeEditMode, setIsFeeEditMode] = useState(false)
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [newFeeItem, setNewFeeItem] = useState({
    name: "",
    amount: "",
    type: "",
    description: "",
    applicableGrades: [] as string[],
    status: "active",
    category: "",
    subItems: [] as { id: number; name: string; amount: number; description: string; active: boolean }[]
  })

  const grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">已缴费</Badge>
      case "pending":
        return <Badge variant="secondary">待缴费</Badge>
      case "overdue":
        return <Badge variant="destructive">逾期</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">草稿</Badge>
      case "issued":
        return <Badge variant="default">已开具</Badge>
      case "sent":
        return <Badge variant="secondary">已发送</Badge>
      case "pending":
        return <Badge variant="secondary">待付款</Badge>
      case "overdue":
        return <Badge variant="destructive">逾期</Badge>
      case "paid":
        return <Badge variant="default">已付款</Badge>
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Enhanced invoice functions using custom hooks
  const handleDownloadInvoice = async (invoice: any) => {
    try {
      await downloadInvoicePDF(invoice, pdfOptions)
    } catch (error) {
      console.error('Failed to download invoice:', error)
    }
  }

  const handlePrintInvoice = async (invoice: any) => {
    try {
      await printInvoicePDF(invoice, pdfOptions)
    } catch (error) {
      console.error('Failed to print invoice:', error)
    }
  }

  const handleSendInvoice = (invoice: any) => {
    // In a real implementation, this would send the invoice via email
    updateInvoiceStatus(invoice.id, 'sent')
  }

  const handleProcessPayment = (invoiceId: number, amount: number, method: string) => {
    const { payment, isFullyPaid } = processPartialPayment(invoiceId, amount, method as any)
    if (isFullyPaid) {
      updateInvoiceStatus(invoiceId, 'paid')
    }
  }

  const handleAddFeeItem = () => {
    if (!newFeeItem.name || !newFeeItem.type) {
      alert("请填写完整信息")
      return
    }

    const totalAmount = calculateTotalAmount(newFeeItem.subItems)

    const feeItem = {
      id: Date.now(),
      name: newFeeItem.name,
      amount: totalAmount,
      type: newFeeItem.type,
      description: newFeeItem.description,
      applicableGrades: newFeeItem.applicableGrades,
      status: newFeeItem.status,
      category: newFeeItem.category,
      subItems: newFeeItem.subItems
    }

    setFeeItems([...feeItems, feeItem])
    setNewFeeItem({
      name: "",
      amount: "",
      type: "",
      description: "",
      applicableGrades: [],
      status: "active",
      category: "",
      subItems: []
    })
    setIsAddFeeDialogOpen(false)
  }

  const handleEditFeeItem = (feeItem: any) => {
    setEditingFeeItem(feeItem)
    setNewFeeItem({
      name: feeItem.name,
      amount: feeItem.amount.toString(),
      type: feeItem.type,
      description: feeItem.description,
      applicableGrades: feeItem.applicableGrades,
      status: feeItem.status,
      category: feeItem.category,
      subItems: feeItem.subItems
    })
    setIsEditFeeDialogOpen(true)
  }

  const handleUpdateFeeItem = () => {
    if (!newFeeItem.name || !newFeeItem.type) {
      alert("请填写完整信息")
      return
    }

    const totalAmount = calculateTotalAmount(newFeeItem.subItems)

    const updatedFeeItem = {
      ...editingFeeItem,
      name: newFeeItem.name,
      amount: totalAmount,
      type: newFeeItem.type,
      description: newFeeItem.description,
      applicableGrades: newFeeItem.applicableGrades,
      status: newFeeItem.status,
      category: newFeeItem.category,
      subItems: newFeeItem.subItems
    }

    setFeeItems(feeItems.map(item => item.id === editingFeeItem.id ? updatedFeeItem : item))
    setEditingFeeItem(null)
    setNewFeeItem({
      name: "",
      amount: "",
      type: "",
      description: "",
      applicableGrades: [],
      status: "active",
      category: "",
      subItems: []
    })
    setIsEditFeeDialogOpen(false)
  }

  const handleDeleteFeeItem = (feeItemId: number) => {
    if (confirm("确定要删除这个收费项目吗？")) {
      setFeeItems(feeItems.filter(item => item.id !== feeItemId))
    }
  }

  const handleFeeItemInputChange = (field: string, value: string) => {
    setNewFeeItem(prev => ({ ...prev, [field]: value }))
  }

  const handleGradeSelection = (grade: string) => {
    setNewFeeItem(prev => ({
      ...prev,
      applicableGrades: prev.applicableGrades.includes(grade)
        ? prev.applicableGrades.filter(g => g !== grade)
        : [...prev.applicableGrades, grade]
    }))
  }

  const handleFeeEditMode = () => {
    setIsFeeEditMode(!isFeeEditMode)
  }

  const toggleExpanded = (itemId: number) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const addSubItem = () => {
    const newSubItem = {
      id: Date.now(),
      name: "",
      amount: 0,
      description: "",
      active: true
    }
    setNewFeeItem(prev => ({
      ...prev,
      subItems: [...prev.subItems, newSubItem]
    }))
  }

  const updateSubItem = (index: number, field: string, value: string | number | boolean) => {
    setNewFeeItem(prev => ({
      ...prev,
      subItems: prev.subItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeSubItem = (index: number) => {
    setNewFeeItem(prev => ({
      ...prev,
      subItems: prev.subItems.filter((_, i) => i !== index)
    }))
  }

  const calculateTotalAmount = (subItems: any[]) => {
    return subItems
      .filter(subItem => subItem.active)
      .reduce((total, subItem) => total + subItem.amount, 0)
  }

  const toggleSubItemActive = (itemId: number, subItemId: number) => {
    setFeeItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          subItems: item.subItems.map(subItem => 
            subItem.id === subItemId 
              ? { ...subItem, active: !subItem.active }
              : subItem
          ),
          amount: calculateTotalAmount(
            item.subItems.map(subItem => 
              subItem.id === subItemId 
                ? { ...subItem, active: !subItem.active }
                : subItem
            )
          )
        }
      }
      return item
    }))
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">财务管理系统</h2>
          <p className="text-gray-600">学费管理、缴费记录、收费提醒和财务报表</p>
        </div>
        <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加收费项目
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>添加收费项目</DialogTitle>
              <DialogDescription>创建新的收费项目</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">分类</Label>
                  <Input
                    id="category"
                    value={newFeeItem.category}
                    onChange={(e) => handleFeeItemInputChange("category", e.target.value)}
                    placeholder="例如：教育费用、生活费用"
                  />
                </div>
                <div>
                  <Label htmlFor="name">项目名称</Label>
                  <Input
                    id="name"
                    value={newFeeItem.name}
                    onChange={(e) => handleFeeItemInputChange("name", e.target.value)}
                    placeholder="例如：学费、餐费"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="type">收费类型</Label>
                <Select value={newFeeItem.type} onValueChange={(value) => handleFeeItemInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择收费类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">按月收费</SelectItem>
                    <SelectItem value="one-time">一次性收费</SelectItem>
                    <SelectItem value="semester">学期收费</SelectItem>
                    <SelectItem value="annual">年度收费</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">项目描述</Label>
                <Textarea
                  id="description"
                  value={newFeeItem.description}
                  onChange={(e) => handleFeeItemInputChange("description", e.target.value)}
                  placeholder="详细描述收费项目"
                />
              </div>

              <div>
                <Label>子项目</Label>
                <div className="space-y-3 mt-2">
                  {newFeeItem.subItems.map((subItem, index) => (
                    <div key={subItem.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">子项目 {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubItem(index)}
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">名称</Label>
                          <Input
                            value={subItem.name}
                            onChange={(e) => updateSubItem(index, "name", e.target.value)}
                            placeholder="子项目名称"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">金额</Label>
                          <Input
                            type="number"
                            value={subItem.amount}
                            onChange={(e) => updateSubItem(index, "amount", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">描述</Label>
                          <Input
                            value={subItem.description}
                            onChange={(e) => updateSubItem(index, "description", e.target.value)}
                            placeholder="子项目描述"
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={subItem.active}
                          onChange={() => updateSubItem(index, "active", !subItem.active)}
                        />
                        <span className="text-xs text-gray-600">
                          {subItem.active ? "启用" : "停用"}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加子项目
                  </Button>
                </div>
              </div>


            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddFeeDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddFeeItem}>
                添加项目
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">财务概览</TabsTrigger>
          <TabsTrigger value="fee-items">收费项目</TabsTrigger>
          <TabsTrigger value="student-fees">学生费用分配</TabsTrigger>
          <TabsTrigger value="invoices">发票管理</TabsTrigger>
          <TabsTrigger value="payments">缴费管理</TabsTrigger>
          <TabsTrigger value="reminders">收费提醒</TabsTrigger>
          <TabsTrigger value="reports">财务报表</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => (document.querySelector('[data-value="student-fees"]') as HTMLElement)?.click()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">学生费用分配</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥45,600</div>
                <p className="text-xs text-muted-foreground">管理学生费用分配</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => (document.querySelector('[data-value="invoices"]') as HTMLElement)?.click()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">发票管理</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥8,400</div>
                <p className="text-xs text-muted-foreground">管理发票和账单</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => (document.querySelector('[data-value="payments"]') as HTMLElement)?.click()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">缴费管理</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.1%</div>
                <p className="text-xs text-muted-foreground">跟踪缴费状态</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => (document.querySelector('[data-value="reminders"]') as HTMLElement)?.click()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">收费提醒</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥425,800</div>
                <p className="text-xs text-muted-foreground">发送缴费提醒</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>收入构成</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>学费收入</span>
                    <Badge variant="default">¥38,400 (84%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>餐费收入</span>
                    <Badge variant="secondary">¥5,200 (11%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>教材费</span>
                    <Badge variant="outline">¥1,800 (4%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>其他费用</span>
                    <Badge variant="outline">¥200 (1%)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>支付方式统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>微信支付</span>
                    <Badge variant="default">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>支付宝</span>
                    <Badge variant="secondary">32%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>银行转账</span>
                    <Badge variant="outline">18%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>现金</span>
                    <Badge variant="outline">5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fee-items" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    收费项目管理
                  </CardTitle>
                  <CardDescription>管理所有收费项目</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleFeeEditMode}>
                    <Edit className="h-4 w-4 mr-2" />
                    {isFeeEditMode ? "完成编辑" : "编辑"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分类</TableHead>
                    <TableHead>总金额</TableHead>
                    <TableHead>收费类型</TableHead>
                    {isFeeEditMode && <TableHead>操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-2">
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            <span>{item.category}</span>
                          </div>
                          {expandedItems.includes(item.id) && (
                            <div className="pl-8 space-y-2">
                              {item.subItems.map((subItem) => (
                                <div key={subItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-2 border-blue-200">
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium min-w-[120px]">{subItem.name}</span>
                                    <ToggleSwitch
                                      checked={subItem.active}
                                      onChange={() => toggleSubItemActive(item.id, subItem.id)}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-blue-600">¥{subItem.amount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">¥{calculateTotalAmount(item.subItems)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.type === "monthly" ? "按月收费" : 
                           item.type === "one-time" ? "一次性收费" :
                           item.type === "semester" ? "学期收费" : "年度收费"}
                        </Badge>
                      </TableCell>
                      {isFeeEditMode && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditFeeItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFeeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student-fees">
          <StudentFeeMatrix />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                发票管理
              </CardTitle>
              <CardDescription>学生发票开具和管理</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <Select value={invoiceFilters.status} onValueChange={(value) => setInvoiceFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="发票状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="issued">已开具</SelectItem>
                    <SelectItem value="sent">已发送</SelectItem>
                    <SelectItem value="pending">待付款</SelectItem>
                    <SelectItem value="overdue">逾期</SelectItem>
                    <SelectItem value="paid">已付款</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input 
                  placeholder="搜索学生姓名..." 
                  value={invoiceFilters.studentName}
                  onChange={(e) => setInvoiceFilters(prev => ({ ...prev, studentName: e.target.value }))}
                  className="w-[200px]"
                />
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsBulkInvoiceDialogOpen(true)}>
                    批量开具
                  </Button>
                  <Button variant="outline" size="sm">
                    导出发票
                  </Button>
                  <Button variant="outline" size="sm">
                    发送提醒
                  </Button>
                </div>
                <Button size="sm" onClick={() => setIsCreateInvoiceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建发票
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>发票号码</TableHead>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>发票状态</TableHead>
                    <TableHead>开具日期</TableHead>
                    <TableHead>到期日期</TableHead>
                    <TableHead>付款日期</TableHead>
                    <TableHead>提醒状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredInvoices().map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.student}</TableCell>
                      <TableCell>¥{invoice.totalAmount}</TableCell>
                      <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{invoice.issueDate}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>{invoice.paidDate || "-"}</TableCell>
                      <TableCell>
                        {invoice.reminderSent ? (
                          <Badge variant="outline" className="text-xs">
                            已提醒 ({invoice.lastReminderDate})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">未提醒</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setIsInvoiceDetailDialogOpen(true)
                            }}
                          >
                            查看
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                            disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                          >
                            发送
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => sendInvoiceReminder(invoice.id)}
                            disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                          >
                            提醒
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                          >
                            标记已付
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Invoice Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">本月发票</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoices.length}</div>
                <p className="text-xs text-muted-foreground">已开具发票数量</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">发票总额</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥{invoices.reduce((sum, invoice) => sum + invoice.amount, 0)}</div>
                <p className="text-xs text-muted-foreground">所有发票总金额</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已付款</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'paid').length}</div>
                <p className="text-xs text-muted-foreground">已付款发票</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待付款</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">待付款发票</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Detail Dialog */}
          <Dialog open={isInvoiceDetailDialogOpen} onOpenChange={setIsInvoiceDetailDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>发票详情 - {selectedInvoice?.invoiceNumber}</DialogTitle>
              </DialogHeader>
              {selectedInvoice && (
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">发票信息</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">发票号码:</span> {selectedInvoice.invoiceNumber}</div>
                        <div><span className="font-medium">学生姓名:</span> {selectedInvoice.student}</div>
                        <div><span className="font-medium">开具日期:</span> {selectedInvoice.issueDate}</div>
                        <div><span className="font-medium">到期日期:</span> {selectedInvoice.dueDate}</div>
                        <div><span className="font-medium">状态:</span> {getInvoiceStatusBadge(selectedInvoice.status)}</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">付款信息</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">付款方式:</span> {selectedInvoice.paymentMethod || "未付款"}</div>
                        <div><span className="font-medium">付款日期:</span> {selectedInvoice.paidDate || "未付款"}</div>
                        <div><span className="font-medium">家长邮箱:</span> {selectedInvoice.parentEmail}</div>
                        <div><span className="font-medium">提醒状态:</span> {selectedInvoice.reminderSent ? "已发送" : "未发送"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div>
                    <h3 className="font-semibold mb-3">费用明细</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目名称</TableHead>
                          <TableHead>金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item: { name: string; amount: number }, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>¥{item.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Invoice Summary */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="text-sm">小计: ¥{selectedInvoice.amount}</div>
                        <div className="text-sm">税费: ¥{selectedInvoice.tax}</div>
                        <div className="text-sm">折扣: -¥{selectedInvoice.discount}</div>
                        <div className="font-semibold">总计: ¥{selectedInvoice.totalAmount}</div>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">下载PDF</Button>
                        <Button variant="outline" size="sm">发送邮件</Button>
                        <Button variant="outline" size="sm">打印</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Create Invoice Dialog */}
          <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新建发票</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>选择学生</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择学生" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name} ({student.grade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>发票类型</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuition">学费</SelectItem>
                        <SelectItem value="meal">餐费</SelectItem>
                        <SelectItem value="activity">活动费</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>备注</Label>
                  <Textarea placeholder="发票备注..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateInvoiceDialogOpen(false)}>
                    取消
                  </Button>
                  <Button>创建发票</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Invoice Dialog */}
          <Dialog open={isBulkInvoiceDialogOpen} onOpenChange={setIsBulkInvoiceDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>批量开具发票</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>选择年级</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[...new Set(students.map(student => student.grade))].map(grade => (
                      <div key={grade} className="flex items-center space-x-2">
                        <Checkbox id={`bulk-grade-${grade}`} />
                        <Label htmlFor={`bulk-grade-${grade}`} className="text-sm">{grade}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>发票类型</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuition">学费</SelectItem>
                      <SelectItem value="meal">餐费</SelectItem>
                      <SelectItem value="activity">活动费</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>到期日期</Label>
                  <Input type="date" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBulkInvoiceDialogOpen(false)}>
                    取消
                  </Button>
                  <Button>批量开具</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                缴费记录
              </CardTitle>
              <CardDescription>学生缴费情况管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>付款编号</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>缴费状态</TableHead>
                    <TableHead>缴费日期</TableHead>
                    <TableHead>支付方式</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredPayments().map((payment) => {
                    const invoice = invoices.find(inv => inv.id === payment.invoiceId)
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{invoice?.student || '未知学生'}</TableCell>
                        <TableCell>{payment.reference}</TableCell>
                        <TableCell>¥{payment.amount}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              查看
                            </Button>
                            {payment.status === "pending" && (
                              <Button variant="ghost" size="sm">
                                退款
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                收费提醒
              </CardTitle>
              <CardDescription>自动发送缴费提醒通知</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">李小红 - 1月学费</div>
                      <div className="text-sm text-gray-500">应缴金额：¥1,200</div>
                    </div>
                    <Badge variant="destructive">逾期3天</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      发送提醒
                    </Button>
                    <Button size="sm" variant="outline">
                      电话联系
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">陈小军 - 餐费充值</div>
                      <div className="text-sm text-gray-500">应缴金额：¥300</div>
                    </div>
                    <Badge variant="secondary">即将到期</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      发送提醒
                    </Button>
                    <Button size="sm" variant="outline">
                      电话联系
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                财务报表
              </CardTitle>
              <CardDescription>收入支出统计报告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">月度收入报告</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>2024年1月</span>
                      <span>¥45,600</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2023年12月</span>
                      <span>¥42,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2023年11月</span>
                      <span>¥41,200</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">班级收费统计</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>三年级A班</span>
                      <span>¥16,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span>四年级B班</span>
                      <span>¥19,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span>五年级C班</span>
                      <span>¥14,400</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Fee Item Dialog */}
      <Dialog open={isEditFeeDialogOpen} onOpenChange={setIsEditFeeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑收费项目</DialogTitle>
            <DialogDescription>修改收费项目信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">分类</Label>
                <Input
                  id="edit-category"
                  value={newFeeItem.category}
                  onChange={(e) => handleFeeItemInputChange("category", e.target.value)}
                  placeholder="例如：教育费用、生活费用"
                />
              </div>
              <div>
                <Label htmlFor="edit-name">项目名称</Label>
                <Input
                  id="edit-name"
                  value={newFeeItem.name}
                  onChange={(e) => handleFeeItemInputChange("name", e.target.value)}
                  placeholder="例如：学费、餐费"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">收费类型</Label>
                <Select value={newFeeItem.type} onValueChange={(value) => handleFeeItemInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择收费类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">按月收费</SelectItem>
                    <SelectItem value="one-time">一次性收费</SelectItem>
                    <SelectItem value="semester">学期收费</SelectItem>
                    <SelectItem value="annual">年度收费</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">状态</Label>
                <Select value={newFeeItem.status} onValueChange={(value) => handleFeeItemInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">项目描述</Label>
              <Textarea
                id="edit-description"
                value={newFeeItem.description}
                onChange={(e) => handleFeeItemInputChange("description", e.target.value)}
                placeholder="详细描述收费项目"
              />
            </div>

            <div>
              <Label>子项目</Label>
              <div className="space-y-3 mt-2">
                {newFeeItem.subItems.map((subItem, index) => (
                  <div key={subItem.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">子项目 {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubItem(index)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">名称</Label>
                        <Input
                          value={subItem.name}
                          onChange={(e) => updateSubItem(index, "name", e.target.value)}
                          placeholder="子项目名称"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">金额</Label>
                        <Input
                          type="number"
                          value={subItem.amount}
                          onChange={(e) => updateSubItem(index, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">描述</Label>
                        <Input
                          value={subItem.description}
                          onChange={(e) => updateSubItem(index, "description", e.target.value)}
                          placeholder="子项目描述"
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        checked={subItem.active}
                        onChange={() => updateSubItem(index, "active", !subItem.active)}
                      />
                      <span className="text-xs text-gray-600">
                        {subItem.active ? "启用" : "停用"}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加子项目
                </Button>
              </div>
            </div>




          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditFeeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateFeeItem}>
              更新项目
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
