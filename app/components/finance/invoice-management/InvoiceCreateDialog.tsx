"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dialog"
import { FileText, Plus } from "lucide-react"

interface InvoiceCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: any[]
  feeItems: any[]
  onCreateInvoice: (invoiceData: any) => void
  getStudentTotalAmount: (studentId: string) => number
}

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  students,
  feeItems,
  onCreateInvoice,
  getStudentTotalAmount
}: InvoiceCreateDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")

  const handleCreateInvoice = () => {
    if (!selectedStudentId || !dueDate) {
      return
    }

    const selectedStudent = students.find(s => s.id === selectedStudentId)
    if (!selectedStudent) {
      return
    }

    const totalAmount = getStudentTotalAmount(selectedStudentId)

    const invoiceData = {
      studentId: selectedStudentId,
      studentName: selectedStudent.name,
      studentGrade: selectedStudent.standard,
      totalAmount: totalAmount,
      dueDate: dueDate,
      notes: notes,
      status: "pending",
      createdAt: new Date().toISOString()
    }

    onCreateInvoice(invoiceData)
    
    // Reset form
    setSelectedStudentId("")
    setDueDate("")
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            创建发票
          </DialogTitle>
          <DialogDescription>
            为学生创建新的发票
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Student Selection */}
          <div>
            <Label htmlFor="student">选择学生 *</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="选择学生" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - {student.standard} (RM {getStudentTotalAmount(student.id)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">到期日期 *</Label>
            <Input 
              id="dueDate"
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="发票备注信息..."
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedStudentId && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="font-medium">发票摘要:</div>
                <div>学生: {students.find(s => s.id === selectedStudentId)?.name}</div>
                <div>年级: {students.find(s => s.id === selectedStudentId)?.standard}</div>
                <div>总金额: RM {getStudentTotalAmount(selectedStudentId)}</div>
                {dueDate && <div>到期日期: {new Date(dueDate).toLocaleDateString('zh-CN')}</div>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              onClick={handleCreateInvoice}
              disabled={!selectedStudentId || !dueDate}
            >
              创建发票
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
