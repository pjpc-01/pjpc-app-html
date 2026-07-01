"use client"

import { useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FileText, Download, Search, Calendar, DollarSign, Loader2, Eye, Printer } from "lucide-react"
import { toast } from "sonner"
import { useInvoices } from "@/hooks/useInvoices"
import { useStudents } from "@/hooks/useStudents"
import { useFees } from "@/hooks/useFees"
import { useStudentFees } from "@/hooks/useStudentFees"
import { exportInvoicePDF } from "@/lib/pdf-export"

export default function InvoiceManagement() {
  const { invoices, loading, createInvoice } = useInvoices()
  const { students } = useStudents()
  const { fees } = useFees()
  const { feeByStudentId } = useStudentFees()

  const searchParams = useSearchParams()
  const centerFilter = searchParams.get("center")

  const [isOpen, setIsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedFeeItems, setSelectedFeeItems] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Detail dialog state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  const filteredInvoices = invoices.filter((inv: any) => {
    // Center filter: cross-reference student's centerId
    if (centerFilter && centerFilter !== "all") {
      const student = students.find(s => s.id === inv.studentId)
      if (!student || student.centerId !== centerFilter) return false
    }
    return (
      inv.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const activeStudents = students.filter(s => s.status !== "graduated")
  const activeFees = fees.filter(f => f.status === "active")

  const selectedStudentData = activeStudents.find(s => s.id === selectedStudent) as any

  // Auto-fill fee items from student_fees when a student is selected
  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudent(studentId)
    const studentFeeRecord = feeByStudentId.get(studentId)
    if (studentFeeRecord && Array.isArray(studentFeeRecord.fee_items)) {
      // Only include active fee items that also exist in the activeFees list
      const activeFeeIds = new Set(activeFees.map(f => f.id))
      const autoItems = studentFeeRecord.fee_items
        .filter((item: any) => item.active === true && activeFeeIds.has(item.id))
        .map((item: any) => item.id)
      setSelectedFeeItems(autoItems)
      if (autoItems.length > 0) {
        toast.info(`已自动填入 ${autoItems.length} 项费用`)
      } else if (studentFeeRecord.fee_items.length > 0) {
        toast.warning("该学生有费用记录，但当前无匹配的活跃费用项目")
      }
    } else {
      // No student fee record — start with empty selection
      setSelectedFeeItems([])
    }
  }, [feeByStudentId, activeFees])

  const toggleFeeItem = (feeId: string) => {
    setSelectedFeeItems(prev =>
      prev.includes(feeId) ? prev.filter(id => id !== feeId) : [...prev, feeId]
    )
  }

  const totalAmount = activeFees
    .filter(f => selectedFeeItems.includes(f.id))
    .reduce((sum, f) => sum + f.amount, 0)

  const handleCreateInvoice = async () => {
    if (!selectedStudent || selectedFeeItems.length === 0) {
      toast.error("请选择学生和费用项目")
      return
    }

    setIsSubmitting(true)
    try {
      const currentDate = new Date()
      const dueDate = new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000)

      const items = activeFees
        .filter(f => selectedFeeItems.includes(f.id))
        .map(f => ({ name: f.name, amount: f.amount }))

      await createInvoice({
        studentId: selectedStudent,
        studentName: selectedStudentData?.student_name || selectedStudentData?.name || "未知学生",
        studentGrade: selectedStudentData?.standard || selectedStudentData?.grade || "",
        totalAmount,
        items,
        status: "issued",
        issueDate: currentDate.toISOString().split("T")[0],
        dueDate: dueDate.toISOString().split("T")[0],
        notes: `${currentDate.toLocaleString("zh-CN", { month: "long" })}学费`,
      } as any)

      toast.success("发票创建成功")
      setIsOpen(false)
      setSelectedStudent("")
      setSelectedFeeItems([])
    } catch (err) {
      toast.error("创建发票失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildInvoicePDFData = (invoice: any) => ({
    invoiceNo: invoice.invoiceNumber || "N/A",
    studentName: invoice.studentName || "未知学生",
    date: invoice.issueDate || invoice.issue_date || "",
    items: (invoice.items && invoice.items.length > 0
      ? invoice.items.map((it: any) => ({ description: it.name || it.description || "学费", amount: it.amount || 0 }))
      : [{ description: "学费", amount: invoice.totalAmount || 0 }]),
    total: invoice.totalAmount || 0,
    status: invoice.status || "issued",
  })

  const handleDownloadPDF = (invoice: any) => {
    try {
      exportInvoicePDF(buildInvoicePDFData(invoice))
      toast.success("发票 PDF 已下载")
    } catch (err) {
      toast.error("下载失败")
    }
  }

  const handlePrintInvoice = (invoice: any) => {
    try {
      exportInvoicePDF(buildInvoicePDFData(invoice))
      toast.success("PDF 已生成，请在弹窗中打印")
    } catch (err) {
      toast.error("打印失败")
    }
  }

  const openDetail = (invoice: any) => {
    setSelectedInvoice(invoice)
    setDetailOpen(true)
  }

  const getStatusBadge = (status: string) => (
    <Badge variant={
      status === "paid" ? "default" :
      status === "partially_paid" ? "secondary" :
      status === "overdue" ? "destructive" : "outline"
    }>
      {status === "paid" ? "已付款" :
       status === "partially_paid" ? "部分付款" :
       status === "overdue" ? "已逾期" :
       status === "issued" ? "已发出" : status}
    </Badge>
  )

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN")
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            发票管理
          </h2>
          <p className="text-slate-500">管理所有学生发票和缴费状态</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="h-4 w-4" /> 创建发票
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <DialogTitle className="text-xl">创建新发票</DialogTitle>
              </div>
              <DialogDescription>
                选择学生后自动填入已分配的费用项目，您仍可手动增删
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">选择学生</Label>
                  <Select value={selectedStudent} onValueChange={handleSelectStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择学生" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeStudents.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.student_name || s.name || "未知学生"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStudent && feeByStudentId.has(selectedStudent) && (
                    <p className="text-xs text-indigo-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      已从学生费用记录自动填入费用项目
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">费用项目</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {activeFees.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center">暂无费用项目，请先在费用管理中添加</p>
                    ) : (
                      activeFees.map(fee => (
                        <label key={fee.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={selectedFeeItems.includes(fee.id)}
                            onChange={() => toggleFeeItem(fee.id)}
                            className="rounded"
                          />
                          <span className="text-sm flex-1">{fee.name}</span>
                          <span className="text-sm font-mono text-gray-500">RM {fee.amount}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <div className="text-center mb-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">发票摘要</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">学生:</span>
                      <span className="font-medium">{selectedStudentData?.student_name || selectedStudentData?.name || "未选择"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">年级:</span>
                      <span className="font-medium">{selectedStudentData?.standard || selectedStudentData?.grade || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">费用项目:</span>
                      <span className="font-medium">{selectedFeeItems.length} 项</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-base font-bold">
                      <span className="text-slate-900">总金额:</span>
                      <span className="font-mono text-indigo-600">RM {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={isSubmitting || !selectedStudent || selectedFeeItems.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 min-w-32"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> 创建中...</>
                ) : (
                  "确认创建"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>发票列表</CardTitle>
              <CardDescription>所有发票及缴费状态</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索发票号码或学生..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
              <p className="text-slate-500">加载发票数据...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              暂无发票数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发票号码</TableHead>
                  <TableHead>学生</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>到期日</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{invoice.studentName}</TableCell>
                    <TableCell className="font-mono font-semibold">RM {(invoice.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {invoice.dueDate || invoice.due_date || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(invoice)} title="查看详情">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)} title="下载 PDF">
                          <Download className="h-4 w-4" />
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

      {/* Invoice Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              发票详情 - {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>查看发票的详细信息</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">发票号码</p>
                    <p className="font-semibold text-lg">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">状态</p>
                    <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">开具日期</p>
                    <p className="font-semibold">{formatDate(selectedInvoice.issueDate || selectedInvoice.issue_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">到期日期</p>
                    <p className="font-semibold">{formatDate(selectedInvoice.dueDate || selectedInvoice.due_date)}</p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">学生信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">学生姓名</p>
                      <p className="font-semibold">{selectedInvoice.studentName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">学生ID</p>
                      <p className="font-semibold font-mono text-sm">{selectedInvoice.studentId || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">年级</p>
                      <p className="font-semibold">{selectedInvoice.studentGrade || selectedInvoice.grade || "未指定"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">费用明细</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                          selectedInvoice.items.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{item.name || item.description || "-"}</TableCell>
                              <TableCell className="text-right font-semibold">
                                RM {(item.amount || 0).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell>学生费用</TableCell>
                            <TableCell className="text-right font-semibold">
                              RM {(selectedInvoice.totalAmount || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>总计:</span>
                      <span className="text-green-600">RM {(selectedInvoice.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedInvoice.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">备注</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载 PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  打印
                </Button>
                <Button onClick={() => setDetailOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}