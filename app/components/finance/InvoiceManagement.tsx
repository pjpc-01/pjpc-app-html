"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FileText, Download, Search, Calendar, DollarSign, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useInvoices } from "@/hooks/useInvoices"
import { useStudents } from "@/hooks/useStudents"
import { useFees } from "@/hooks/useFees"
import { exportInvoicePDF } from "@/lib/pdf-export"

export default function InvoiceManagement() {
  const { invoices, loading, createInvoice } = useInvoices()
  const { students } = useStudents()
  const { fees } = useFees()

  const searchParams = useSearchParams()
  const centerFilter = searchParams.get("center")

  const [isOpen, setIsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedFeeItems, setSelectedFeeItems] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredInvoices = invoices.filter(inv => {
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

  const selectedStudentData = activeStudents.find(s => s.id === selectedStudent)

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
      })

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

  const handleDownloadPDF = (invoice: any) => {
    try {
      exportInvoicePDF({
        invoiceNo: invoice.invoiceNumber || "N/A",
        studentName: invoice.studentName || "未知学生",
        date: invoice.issueDate || invoice.issue_date || "",
        items: invoice.items || [{ description: "学费", amount: invoice.totalAmount }],
        total: invoice.totalAmount || 0,
        status: invoice.status || "issued",
      })
      toast.success("发票 PDF 已下载")
    } catch (err) {
      toast.error("下载失败")
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
                选择学生和费用项目，自动生成发票和应缴金额
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">选择学生</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择学生" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeStudents.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.student_name || s.name || "未知学生"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <Badge variant={
                        invoice.status === "paid" ? "default" :
                        invoice.status === "partially_paid" ? "secondary" :
                        invoice.status === "overdue" ? "destructive" : "outline"
                      }>
                        {invoice.status === "paid" ? "已付款" :
                         invoice.status === "partially_paid" ? "部分付款" :
                         invoice.status === "overdue" ? "已逾期" :
                         invoice.status === "issued" ? "已发出" : invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {invoice.dueDate || invoice.due_date || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
