"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BulkInvoiceDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  students: any[]
  onBulkCreate: (selectedGrades: string[], dueDate: string) => void
}

export function BulkInvoiceDialog({
  isOpen,
  onOpenChange,
  students,
  onBulkCreate
}: BulkInvoiceDialogProps) {
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")

  const availableGrades = [...new Set(students.map(student => student.grade))]

  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    )
  }

  const handleBulkCreate = () => {
    if (selectedGrades.length > 0 && dueDate) {
      onBulkCreate(selectedGrades, dueDate)
      onOpenChange(false)
      setSelectedGrades([])
      setDueDate("")
    }
  }

  const studentsWithAmounts = students.map(student => ({
    ...student,
    amount: 1200 // This should be calculated from actual fee data
  }))

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>批量开具发票</DialogTitle>
          <DialogDescription>按年级批量创建发票</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>选择年级</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {availableGrades.map(grade => (
                <div key={grade} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`bulk-grade-${grade}`}
                    checked={selectedGrades.includes(grade)}
                    onCheckedChange={() => handleGradeToggle(grade)}
                  />
                  <Label htmlFor={`bulk-grade-${grade}`} className="text-sm">{grade}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>预览选中年级的学生</Label>
            <div className="max-h-64 overflow-y-auto border rounded-md p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>应缴费金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithAmounts.slice(0, 5).map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        RM {student.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                  {studentsWithAmounts.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                        还有 {studentsWithAmounts.length - 5} 个学生...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div>
            <Label>到期日期</Label>
            <Input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              onClick={handleBulkCreate}
              disabled={selectedGrades.length === 0 || !dueDate}
            >
              批量开具
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
