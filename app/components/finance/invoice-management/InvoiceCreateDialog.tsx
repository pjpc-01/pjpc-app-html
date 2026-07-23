"use client"

import { useState, useMemo } from "react"
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
import { useLanguage } from "@/contexts/language-context"
import { FileText, Users, AlertCircle, Loader2 } from "lucide-react"

interface InvoiceCreateDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  students: any[]
  activeFees: any[]
  isFeeAssigned: (studentId: string, feeId: string) => boolean
  calculateStudentTotal: (studentId: string) => number
  onDirectCreate: (student: any, dueDate: string, notes: string) => void
  onBulkCreate: (selectedGrades: string[], formData: any) => void
}

export function InvoiceCreateDialog({
  isOpen,
  onOpenChange,
  students,
  activeFees,
  isFeeAssigned,
  calculateStudentTotal,
  onDirectCreate,
  onBulkCreate,
}: InvoiceCreateDialogProps) {
  const { t } = useLanguage()
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  
  const gradeOrder = [
    '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
    '初一', '初二', '初三', '高一', '高二', '高三'
  ]
  const availableGrades = [...new Set(students.map((s: any) => s.standard))]
    .sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b))

  const filteredStudents = students.filter(
    (s: any) => selectedGrades.length === 0 || selectedGrades.includes(s.standard)
  )

  const selectedStudentObjects = students.filter((s: any) => 
    selectedStudents.includes(s.id || s.id?.toString())
  )

  // Calculate fee breakdown for preview using parent's loaded hooks
  const feePreview = useMemo(() => {
    if (selectedStudents.length === 0) return null
    const firstStudent = selectedStudentObjects[0]
    if (!firstStudent) return null
    const studentId = firstStudent.id
    const items = activeFees
      .filter(fee => isFeeAssigned(studentId, fee.id))
      .map(fee => ({ name: fee.name, amount: fee.amount }))
    const total = items.reduce((sum, it) => sum + it.amount, 0)
    return { items, total, studentName: firstStudent.name || firstStudent.student_name }
  }, [selectedStudents, activeFees, isFeeAssigned, selectedStudentObjects])

  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    )
    setSelectedStudents([])
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    )
  }

  const handleCreate = () => {
    if (selectedStudents.length === 0 || !dueDate) return
    
    if (selectedStudents.length === 1) {
      const student = selectedStudentObjects[0]
      if (student) {
        onDirectCreate(student, dueDate, notes)
      }
    } else {
      const grades = [...new Set(selectedStudentObjects.map((s: any) => s.grade || s.standard))]
      onBulkCreate(grades, { dueDate, notes: notes || '' })
    }
    
    onOpenChange(false)
    setSelectedStudents([])
    setSelectedGrades([])
    setDueDate("")
    setNotes("")
  }

  const allFilteredSelected = filteredStudents.length > 0 && 
    selectedStudents.length === filteredStudents.length

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            创建发票
          </DialogTitle>
          <DialogDescription>选择学生并确认费用明细后创建发票</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Grade Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">选择年级</Label>
            <div className="flex flex-wrap gap-2">
              {availableGrades.map(grade => (
                <Badge
                  key={grade}
                  variant={selectedGrades.includes(grade) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => handleGradeToggle(grade)}
                >
                  {grade}
                </Badge>
              ))}
            </div>
          </div>

          {/* Student Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">{t('common.select_student')}</Label>
              <span className="text-xs text-muted-foreground">
                {selectedGrades.length > 0 
                  ? `${selectedGrades.length} 年级 · ${filteredStudents.length} 人`
                  : `全部 · ${filteredStudents.length} 人`
                }
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={allFilteredSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents(filteredStudents.map((s: any) => s.id?.toString()))
                          } else {
                            setSelectedStudents([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>{t('student.student_name')}</TableHead>
                    <TableHead className="w-20">{t('student.grade')}</TableHead>
                    <TableHead className="w-28 text-right">应缴费</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                        暂无学生数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student: any) => {
                      const sid = student.id?.toString()
                      const amount = calculateStudentTotal(student.id)
                      return (
                        <TableRow 
                          key={sid}
                          className={`cursor-pointer ${selectedStudents.includes(sid) ? 'bg-primary/5' : ''}`}
                          onClick={() => handleStudentToggle(sid)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedStudents.includes(sid)}
                              onCheckedChange={() => handleStudentToggle(sid)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.name || student.student_name}
                            {amount === 0 && (
                              <span className="ml-2 text-xs text-amber-600">
                                <AlertCircle className="h-3 w-3 inline" /> 未分配
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{student.standard || student.grade}</TableCell>
                          <TableCell className={`text-right font-semibold ${amount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            RM {amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Fee Preview */}
          {feePreview && feePreview.items.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  费用明细预览
                  {selectedStudents.length === 1 && ` — ${feePreview.studentName}`}
                  {selectedStudents.length > 1 && ` (${selectedStudents.length} 位学生)`}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>费用项目</TableHead>
                    <TableHead className="w-28 text-right">金额 (RM)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feePreview.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-sm">{item.name}</TableCell>
                      <TableCell className="text-right font-medium">{item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={2} className="text-right font-bold text-sm">{t('finance.total')}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      RM {feePreview.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {feePreview && feePreview.items.length === 0 && selectedStudents.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                所选学生尚未分配费用项目。请先在「收费管理」中为学生分配费用。
              </span>
            </div>
          )}

          {/* Invoice Details Form */}
          <div className="grid grid-cols-1 gap-3 pt-2 border-t">
            <div>
              <Label htmlFor="dueDate">到期日期 *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">{t('teacher.notes')}</Label>
              <Input
                id="notes"
                placeholder="发票备注（可选）"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Selection Summary */}
          {selectedStudents.length > 0 && (
            <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  已选择 {selectedStudents.length} 位学生
                  {selectedStudents.length === 1 && ` (${selectedStudentObjects[0]?.name || selectedStudentObjects[0]?.student_name})`}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                总计: <span className="font-bold text-green-600">
                  RM {selectedStudentObjects.reduce((sum: number, s: any) => sum + (calculateStudentTotal(s.id) || 0), 0).toFixed(2)}
                </span>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={selectedStudents.length === 0 || !dueDate}
            >
              {selectedStudents.length <= 1 ? '创建发票' : `批量创建 (${selectedStudents.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
