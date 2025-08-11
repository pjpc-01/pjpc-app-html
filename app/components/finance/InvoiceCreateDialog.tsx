"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Plus, Eye, Edit } from "lucide-react"
import { InvoiceTemplate } from "./InvoiceTemplateManager"

interface InvoiceCreateDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  students: any[]
  onCreateInvoice: (student: any, formData: any) => void
  selectedStudent: any
  setSelectedStudent: (student: any) => void
  invoiceFormData: any
  setInvoiceFormData: (data: any) => void
  availableTemplates: InvoiceTemplate[]
  selectedTemplate: InvoiceTemplate | null
  setSelectedTemplate: (template: InvoiceTemplate | null) => void
  isTemplateSelectDialogOpen: boolean
  setIsTemplateSelectDialogOpen: (open: boolean) => void
}

export function InvoiceCreateDialog({
  isOpen,
  onOpenChange,
  students,
  onCreateInvoice,
  selectedStudent,
  setSelectedStudent,
  invoiceFormData,
  setInvoiceFormData,
  availableTemplates,
  selectedTemplate,
  setSelectedTemplate,
  isTemplateSelectDialogOpen,
  setIsTemplateSelectDialogOpen
}: InvoiceCreateDialogProps) {
  const studentsWithAmounts = students.map(student => ({
    ...student,
    amount: 1200 // This should be calculated from actual fee data
  }))

  const handleCreateInvoiceForStudent = (student: any) => {
    setSelectedStudent(student)
    onOpenChange(false)
  }

  const handleSubmitInvoice = () => {
    if (selectedStudent) {
      onCreateInvoice(selectedStudent, invoiceFormData)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建发票</DialogTitle>
            <DialogDescription>为学生创建发票</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择学生</Label>
              <div className="max-h-64 overflow-y-auto border rounded-md mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>年级</TableHead>
                      <TableHead>家长姓名</TableHead>
                      <TableHead>应缴费金额</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithAmounts.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>{student.parentName}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          RM {student.amount}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCreateInvoiceForStudent(student)}
                          >
                            创建发票
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Form Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建发票 - {selectedStudent?.name}</DialogTitle>
            <DialogDescription>为学生 {selectedStudent?.name} 创建发票</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">学生信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">姓名:</span> {selectedStudent.name}</div>
                  <div><span className="font-medium">年级:</span> {selectedStudent.grade}</div>
                  <div><span className="font-medium">家长:</span> {selectedStudent.parentName}</div>
                  <div><span className="font-medium">学生ID:</span> {selectedStudent.id}</div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dueDate">到期日期</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceFormData.dueDate}
                    onChange={(e) => setInvoiceFormData((prev: any) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">支付方式</Label>
                  <Select 
                    value={invoiceFormData.paymentMethod} 
                    onValueChange={(value) => setInvoiceFormData((prev: any) => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">银行转账</SelectItem>
                      <SelectItem value="cash">现金</SelectItem>
                      <SelectItem value="check">支票</SelectItem>
                      <SelectItem value="online">在线支付</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    value={invoiceFormData.notes}
                    onChange={(e) => setInvoiceFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                    placeholder="输入发票备注信息..."
                  />
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">费用明细</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>基础学费</span>
                    <span>RM 800</span>
                  </div>
                  <div className="flex justify-between">
                    <span>特色课程费</span>
                    <span>RM 400</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>折扣</span>
                    <span>-RM 0</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>总计:</span>
                    <span>RM {selectedStudent.amount}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedStudent(null)
                    setInvoiceFormData({
                      dueDate: '',
                      notes: '',
                      paymentMethod: 'bank_transfer'
                    })
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleSubmitInvoice}
                  disabled={!invoiceFormData.dueDate}
                >
                  创建发票
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Management Dialog */}
      <Dialog open={isTemplateSelectDialogOpen} onOpenChange={setIsTemplateSelectDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>发票模板管理</DialogTitle>
            <DialogDescription>管理自定义发票模板</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">可用模板</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加模板
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTemplates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </div>
                      {template.isDefault && (
                        <Badge variant="default" className="text-xs">
                          默认
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-500 mb-2">
                      变量: {template.variables.length} 个
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setIsTemplateSelectDialogOpen(false)
                        }}
                      >
                        选择
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
