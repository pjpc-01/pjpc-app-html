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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Plus, Eye, Edit, Users } from "lucide-react"
import { InvoiceTemplate } from "./InvoiceTemplateManager"

interface InvoiceCreateDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  students: any[]
  onCreateInvoice: (student: any, formData: any) => void
  onBulkCreate: (selectedGrades: string[], formData: any) => void
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
  onBulkCreate,
  invoiceFormData,
  setInvoiceFormData,
  availableTemplates,
  selectedTemplate,
  setSelectedTemplate,
  isTemplateSelectDialogOpen,
  setIsTemplateSelectDialogOpen
}: InvoiceCreateDialogProps) {
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  // Sort grades in ascending order (primary and secondary school)
  const gradeOrder = [
    '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
    '初一', '初二', '初三',
    '高一', '高二', '高三'
  ]
  const availableGrades = [...new Set(students.map(student => student.standard))]
    .sort((a, b) => {
      const aIndex = gradeOrder.indexOf(a)
      const bIndex = gradeOrder.indexOf(b)
      return aIndex - bIndex
    })

  const studentsWithAmounts = students.map(student => ({
    ...student,
    amount: 1200 // This should be calculated from actual fee data
  }))

  // Filter students by selected grades (show all if no grades selected)
  const filteredStudents = students
    .filter(student => selectedGrades.length === 0 || selectedGrades.includes(student.standard))
    .map(student => ({
      ...student,
      amount: 1200 // This should be calculated from actual fee data
    }))

  // Get selected student objects
  const selectedStudentObjects = studentsWithAmounts.filter(student => 
    selectedStudents.includes(student.id)
  )



  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    )
    // Clear selected students when grade filter changes
    setSelectedStudents([])
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleUnifiedCreate = () => {
    if (selectedStudents.length === 0) return
    
    if (selectedStudents.length === 1) {
      // Single student - use individual create
      const student = filteredStudents.find(s => s.id.toString() === selectedStudents[0])
      if (student) {
        onCreateInvoice(student, invoiceFormData)
      }
    } else {
      // Multiple students - use bulk create
      const selectedGrades = [...new Set(selectedStudentObjects.map(s => s.grade))]
      onBulkCreate(selectedGrades, invoiceFormData)
    }
    
    onOpenChange(false)
    setSelectedStudents([])
    setSelectedGrades([])
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
            {/* Grade Filter */}
            <div>
              <Label>选择年级</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {availableGrades.map(grade => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`grade-${grade}`}
                      checked={selectedGrades.includes(grade)}
                      onCheckedChange={() => handleGradeToggle(grade)}
                    />
                    <Label htmlFor={`grade-${grade}`} className="text-sm">{grade}</Label>
                  </div>
                ))}
              </div>
            </div>

                         {/* Student Selection */}
             <div>
               <Label>选择学生</Label>
               <div className="mb-2 text-sm text-gray-600">
                 {selectedGrades.length > 0 
                   ? `已选择 ${selectedGrades.length} 个年级，共 ${filteredStudents.length} 个学生`
                   : `显示所有学生，共 ${filteredStudents.length} 个学生`
                 }
               </div>
              <div className="max-h-64 overflow-y-auto border rounded-md mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents(filteredStudents.map(s => s.id.toString()))
                            } else {
                              setSelectedStudents([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>学生姓名</TableHead>
                      <TableHead>年级</TableHead>
                      <TableHead>家长姓名</TableHead>
                      <TableHead>应缴费金额</TableHead>
                    </TableRow>
                  </TableHeader>
                                     <TableBody>
                     {filteredStudents.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                           暂无学生数据
                         </TableCell>
                       </TableRow>
                     ) : (
                                               filteredStudents.map(student => (
                          <TableRow 
                            key={student.id}
                            className={`cursor-pointer hover:bg-gray-50 ${
                              selectedStudents.includes(student.id.toString()) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleStudentToggle(student.id.toString())}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox 
                                checked={selectedStudents.includes(student.id.toString())}
                                onCheckedChange={() => handleStudentToggle(student.id.toString())}
                              />
                            </TableCell>
                                                <TableCell className="font-medium">{student.student_name}</TableCell>
                    <TableCell>{student.standard}</TableCell>
                            <TableCell>{student.parentName}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                              RM {student.amount}
                            </TableCell>
                          </TableRow>
                        ))
                     )}
                   </TableBody>
                </Table>
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <Label>到期日期</Label>
              <Input 
                type="date" 
                value={invoiceFormData.dueDate}
                onChange={(e) => setInvoiceFormData((prev: any) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            {/* Selection Summary */}
            {selectedStudents.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">已选择 {selectedStudents.length} 个学生</span>
                  {selectedStudents.length === 1 && (
                    <span className="ml-2">
                      ({selectedStudentObjects[0]?.name})
                    </span>
                  )}
                  {selectedStudents.length > 1 && (
                    <span className="ml-2">
                      (来自 {new Set(selectedStudentObjects.map(s => s.grade)).size} 个年级)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button 
                onClick={handleUnifiedCreate}
                disabled={selectedStudents.length === 0 || !invoiceFormData.dueDate}
              >
                {selectedStudents.length === 1 ? '创建发票' : '批量创建发票'}
              </Button>
            </div>
          </div>
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
