"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Download, Printer, CheckCircle, AlertCircle, Eye, Link } from "lucide-react"
import { useReceipts } from "@/hooks/useReceipts"
import { useInvoices } from "@/hooks/useInvoices"
import { useStudents } from "@/hooks/useStudents"



// Utility functions
const getReceiptStatusBadge = (status: string) => {
  const statusMap = {
    pending: { variant: "outline" as const, text: "待处理" },
    issued: { variant: "default" as const, text: "已开具" },
    sent: { variant: "secondary" as const, text: "已发送" },
    cancelled: { variant: "destructive" as const, text: "已取消" }
  }
  
  const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: "outline" as const, text: status }
  return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
}

export default function ReceiptManagement() {
  const {
    receipts,
    filters: receiptFilters,
    setFilters: setReceiptFilters,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    getReceiptByPayment,
    getFilteredReceipts,
    getReceiptStatistics,
    generateReceiptNumber
  } = useReceipts()

  const {
    invoices
  } = useInvoices()

  const { students } = useStudents()

  // State
  const [isReceiptDetailDialogOpen, setIsReceiptDetailDialogOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)



  // Get filtered receipts
  const filteredReceipts = getFilteredReceipts()
  const receiptStats = getReceiptStatistics()



  const handleViewReceipt = (receipt: any) => {
    setSelectedReceipt(receipt)
    setIsReceiptDetailDialogOpen(true)
  }

  const handleDownloadReceipt = (receipt: any) => {
    // TODO: Implement receipt PDF download
    console.log('Downloading receipt:', receipt.receiptNumber)
  }

  const handlePrintReceipt = (receipt: any) => {
    // TODO: Implement receipt printing
    console.log('Printing receipt:', receipt.receiptNumber)
  }



  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex justify-between items-center">
         <div>
           <h3 className="text-2xl font-bold">收据管理</h3>
           <p className="text-gray-600">自动生成的学生缴费收据和凭证</p>
           <p className="text-sm text-green-600 mt-1">
             💡 收据会在缴费状态更改为&quot;已缴费&quot;且发票全额付款时自动生成并发送给付款人
           </p>
         </div>
       </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总收据数</p>
                <p className="text-2xl font-bold text-green-600">{receiptStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已开具</p>
                <p className="text-2xl font-bold text-blue-600">{receiptStats.issued}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待处理</p>
                <p className="text-2xl font-bold text-orange-600">{receiptStats.draft}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总金额</p>
                <p className="text-2xl font-bold text-purple-600">RM {receiptStats.totalAmount.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>筛选收据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">状态</Label>
                             <Select 
                 value={receiptFilters.status || "all"} 
                 onValueChange={(value) => setReceiptFilters(prev => ({ ...prev, status: value }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="选择状态" />
                 </SelectTrigger>
                                 <SelectContent>
                   <SelectItem value="all">全部</SelectItem>
                   <SelectItem value="pending">待处理</SelectItem>
                   <SelectItem value="issued">已开具</SelectItem>
                   <SelectItem value="sent">已发送</SelectItem>
                   <SelectItem value="cancelled">已取消</SelectItem>
                 </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="student-filter">学生姓名</Label>
              <Input
                id="student-filter"
                placeholder="搜索学生姓名..."
                value={receiptFilters.dateRange?.start || ''}
                onChange={(e) => setReceiptFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
              />
            </div>

            <div>
              <Label htmlFor="invoice-filter">发票号码</Label>
              <Input
                id="invoice-filter"
                placeholder="搜索发票号码..."
                value={receiptFilters.dateRange?.end || ''}
                onChange={(e) => setReceiptFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>收据列表</CardTitle>
                   <CardDescription>
           自动生成的收据列表，包含发票链接信息
         </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>收据号码</TableHead>
                <TableHead>发票号码</TableHead>
                <TableHead>学生姓名</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>付款日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-blue-600">
                        {(() => {
                          const invoice = invoices.find(inv => inv.id === receipt.invoiceId);
                          return invoice ? invoice.invoiceNumber : receipt.paymentId;
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{receipt.recipientName}</TableCell>
                  <TableCell className="font-semibold text-green-600">RM {receipt.totalPaid.toLocaleString()}</TableCell>
                  <TableCell>{new Date(receipt.dateIssued).toLocaleDateString('zh-CN')}</TableCell>
                  <TableCell>{getReceiptStatusBadge(receipt.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewReceipt(receipt)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(receipt)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(receipt)}>
                        <Printer className="h-4 w-4" />
                      </Button>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      

      {/* Receipt Detail Dialog */}
      <Dialog open={isReceiptDetailDialogOpen} onOpenChange={setIsReceiptDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>收据详情</DialogTitle>
            <DialogDescription>
              查看收据的详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">收据号码</Label>
                  <p className="text-lg font-semibold">{selectedReceipt.receiptNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">发票号码</Label>
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-blue-600" />
                    <p className="text-lg font-semibold text-blue-600">
                      {(() => {
                        const invoice = invoices.find(inv => inv.id === selectedReceipt.invoiceId);
                        return invoice ? invoice.invoiceNumber : selectedReceipt.paymentId;
                      })()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">付款ID</Label>
                  <p className="text-lg font-semibold text-gray-600">{selectedReceipt.paymentId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">收款人</Label>
                  <p className="text-lg">{selectedReceipt.recipientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">总金额</Label>
                  <p className="text-lg font-semibold text-green-600">RM {selectedReceipt.totalPaid.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">开具日期</Label>
                  <p className="text-lg">{new Date(selectedReceipt.dateIssued).toLocaleDateString('zh-CN')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">状态</Label>
                  <div className="mt-1">{getReceiptStatusBadge(selectedReceipt.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">收费项目</Label>
                <div className="mt-2 space-y-2">
                  {selectedReceipt.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>{item.name}</span>
                      <span className="font-medium">RM {item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReceipt.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">备注</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{selectedReceipt.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleDownloadReceipt(selectedReceipt)}>
                  <Download className="h-4 w-4 mr-2" />
                  下载收据
                </Button>
                <Button variant="outline" onClick={() => handlePrintReceipt(selectedReceipt)}>
                  <Printer className="h-4 w-4 mr-2" />
                  打印收据
                </Button>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
