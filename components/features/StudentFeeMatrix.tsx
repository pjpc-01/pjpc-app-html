import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FeeCard } from "./FeeCard"
import { useFees } from "../../hooks/useFees"
import { useStudents } from "../../hooks/useStudents"
import { useStudentFees } from "../../hooks/useStudentFees"
import { Users, DollarSign, ChevronDown, ChevronRight } from "lucide-react"
import { ToggleSwitch } from "../ui/ToggleSwitch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export const StudentFeeMatrix = () => {
  const { feeItems } = useFees()
  const { students } = useStudents()
  const { 
    toggleStudentFee, 
    isAssigned, 
    calculateStudentTotal, 
    assignFeeToAllStudents,
    toggleStudentSubItem,
    getStudentSubItemState,
    setStudentSubItemState
  } = useStudentFees()
  const [expandedStudents, setExpandedStudents] = useState<number[]>([])
  const [expandedFees, setExpandedFees] = useState<Map<string, boolean>>(new Map())
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [selectedSubItems, setSelectedSubItems] = useState<Map<string, boolean>>(new Map())
  const [batchAction, setBatchAction] = useState<'activate' | 'deactivate'>('activate')
  const [studentPayments, setStudentPayments] = useState<Map<number, { status: string; date: string }>>(new Map())

  const activeFees = feeItems.filter(fee => fee.status === 'active')

  const toggleStudentExpansion = (studentId: number) => {
    setExpandedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const toggleFeeExpansion = (studentId: number, feeId: number) => {
    const key = `${studentId}-${feeId}`
    setExpandedFees(prev => {
      const newMap = new Map(prev)
      newMap.set(key, !prev.get(key))
      return newMap
    })
  }

  const isFeeExpanded = (studentId: number, feeId: number) => {
    const key = `${studentId}-${feeId}`
    return expandedFees.get(key) || false
  }

  const toggleSubItemActive = (studentId: number, feeId: number, subItemId: number) => {
    // Toggle the sub-item state for this specific student
    toggleStudentSubItem(studentId, feeId, subItemId)
  }

  const batchAssignByGrade = () => {
    // Get unique grades from students
    const grades = [...new Set(students.map(student => student.grade))]
    setSelectedGrades(grades) // Select all grades by default
    
    // Initialize selected sub-items
    const subItemsMap = new Map<string, boolean>()
    activeFees.forEach(fee => {
      fee.subItems.forEach(subItem => {
        const key = `${fee.id}-${subItem.id}`
        subItemsMap.set(key, false)
      })
    })
    setSelectedSubItems(subItemsMap)
    
    setIsBatchDialogOpen(true)
  }

  const handleGradeSelection = (grade: string, checked: boolean) => {
    setSelectedGrades(prev => 
      checked 
        ? [...prev, grade]
        : prev.filter(g => g !== grade)
    )
  }

  const handleSubItemSelection = (feeId: number, subItemId: number, checked: boolean) => {
    const key = `${feeId}-${subItemId}`
    setSelectedSubItems(prev => {
      const newMap = new Map(prev)
      newMap.set(key, checked)
      return newMap
    })
  }

  const executeBatchAssignment = () => {
    // For each selected grade
    selectedGrades.forEach(grade => {
      const studentsInGrade = students.filter(student => student.grade === grade)
      
      // For each selected sub-item
      selectedSubItems.forEach((isSelected, key) => {
        if (isSelected) {
          const [feeId, subItemId] = key.split('-').map(Number)
          
          // Set the sub-item active/inactive for all students in this grade
          studentsInGrade.forEach(student => {
            setStudentSubItemState(student.id, feeId, subItemId, batchAction === 'activate')
          })
        }
      })
    })
    
    setIsBatchDialogOpen(false)
    setSelectedGrades([])
    setSelectedSubItems(new Map())
    setBatchAction('activate')
  }

  const getPaymentStatus = (studentId: number) => {
    return studentPayments.get(studentId) || { status: 'pending', date: '' }
  }

  const updatePaymentStatus = (studentId: number, status: string) => {
    const currentPayment = getPaymentStatus(studentId)
    const newPayment = {
      ...currentPayment,
      status,
      date: status === 'paid' ? new Date().toISOString().split('T')[0] : currentPayment.date
    }
    setStudentPayments(prev => {
      const newMap = new Map(prev)
      newMap.set(studentId, newPayment)
      return newMap
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="text-xs">已缴费</Badge>
      case "pending":
        return <Badge variant="secondary" className="text-xs">待缴费</Badge>
      case "overdue":
        return <Badge variant="destructive" className="text-xs">逾期</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            学生费用分配
          </h2>
          <p className="text-gray-600 text-sm">为每位学生选择适用的收费项目</p>
        </div>
                           <div className="flex gap-2">
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={batchAssignByGrade}>
                  批量分配
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>批量分配费用项目</DialogTitle>
                </DialogHeader>
                
                                 <div className="space-y-6">
                   {/* Action Selection */}
                   <div>
                     <Label className="text-sm font-medium">选择操作</Label>
                     <div className="flex gap-4 mt-2">
                       <div className="flex items-center space-x-2">
                         <input
                           type="radio"
                           id="activate"
                           name="batchAction"
                           value="activate"
                           checked={batchAction === 'activate'}
                           onChange={() => setBatchAction('activate')}
                           className="rounded"
                         />
                         <Label htmlFor="activate" className="text-sm">激活</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                         <input
                           type="radio"
                           id="deactivate"
                           name="batchAction"
                           value="deactivate"
                           checked={batchAction === 'deactivate'}
                           onChange={() => setBatchAction('deactivate')}
                           className="rounded"
                         />
                         <Label htmlFor="deactivate" className="text-sm">停用</Label>
                       </div>
                     </div>
                   </div>

                   {/* Grade Selection */}
                   <div>
                     <Label className="text-sm font-medium">选择年级</Label>
                     <div className="grid grid-cols-3 gap-2 mt-2">
                       {[...new Set(students.map(student => student.grade))].map(grade => (
                         <div key={grade} className="flex items-center space-x-2">
                           <Checkbox
                             id={`grade-${grade}`}
                             checked={selectedGrades.includes(grade)}
                             onCheckedChange={(checked) => handleGradeSelection(grade, checked as boolean)}
                           />
                           <Label htmlFor={`grade-${grade}`} className="text-sm">{grade}</Label>
                         </div>
                       ))}
                     </div>
                   </div>

                  {/* Sub-item Selection */}
                  <div>
                    <Label className="text-sm font-medium">选择子项目</Label>
                    <div className="space-y-3 mt-2">
                      {activeFees.map(fee => (
                        <div key={fee.id} className="border rounded-lg p-3">
                          <h4 className="font-medium text-sm mb-2">{fee.name}</h4>
                          <div className="space-y-2">
                            {fee.subItems.map(subItem => {
                              const key = `${fee.id}-${subItem.id}`
                              return (
                                <div key={subItem.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`subitem-${key}`}
                                    checked={selectedSubItems.get(key) || false}
                                    onCheckedChange={(checked) => handleSubItemSelection(fee.id, subItem.id, checked as boolean)}
                                  />
                                  <Label htmlFor={`subitem-${key}`} className="text-sm">
                                    {subItem.name} (¥{subItem.amount})
                                  </Label>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={executeBatchAssignment}>
                    确认分配
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm">
              导出报表
            </Button>
          </div>
      </div>

      

      {/* Student Fee Matrix */}
      <div className="grid gap-4">
        {students.map(student => {
          const isExpanded = expandedStudents.includes(student.id)
          return (
            <Card key={student.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {/* Student Header - Clickable */}
                <div 
                  className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleStudentExpansion(student.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.grade} • {student.parentName}</p>
                      </div>
                    </div>
                                         <div className="text-right">
                                               <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            ¥{activeFees.reduce((total, fee) => {
                              // Calculate amount based on this student's active sub-items for this fee
                              const feeAmount = fee.subItems
                                .filter(subItem => getStudentSubItemState(student.id, fee.id, subItem.id))
                                .reduce((subTotal, subItem) => subTotal + subItem.amount, 0)
                              return total + feeAmount
                            }, 0)}
                          </span>
                        </div>
                       <div className="flex items-center gap-2 mt-1">
                         {getStatusBadge(getPaymentStatus(student.id).status)}
                         {getPaymentStatus(student.id).date && (
                           <span className="text-xs text-gray-500">
                             {getPaymentStatus(student.id).date}
                           </span>
                         )}
                       </div>
                       <div className="flex gap-1 mt-1">
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-6 px-2 text-xs"
                           onClick={() => updatePaymentStatus(student.id, 'paid')}
                         >
                           已缴费
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-6 px-2 text-xs"
                           onClick={() => updatePaymentStatus(student.id, 'pending')}
                         >
                           待缴费
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-6 px-2 text-xs"
                           onClick={() => updatePaymentStatus(student.id, 'overdue')}
                         >
                           逾期
                         </Button>
                       </div>
                     </div>
                  </div>
                </div>

                                 {/* Fee Assignment Grid - Only show when expanded */}
                 {isExpanded && (
                   <div className="p-4">
                     <div className="space-y-3">
                                               {activeFees.map(fee => {
                          const feeExpanded = isFeeExpanded(student.id, fee.id)
                          return (
                                                       <div key={fee.id} className="space-y-2">
                              <FeeCard
                                fee={fee}
                                isAssigned={isAssigned(student.id, fee.id)}
                                onToggle={() => toggleFeeExpansion(student.id, fee.id)}
                                isExpanded={feeExpanded}
                                calculateAmount={() => {
                                  // Calculate amount based on this student's active sub-items
                                  return fee.subItems
                                    .filter(subItem => getStudentSubItemState(student.id, fee.id, subItem.id))
                                    .reduce((total, subItem) => total + subItem.amount, 0)
                                }}
                              />
                              
                                                             {/* Sub-items - Only show when fee is expanded */}
                               {feeExpanded && fee.subItems && (
                                <div className="pl-8 space-y-2">
                                                                     {fee.subItems.map((subItem) => (
                                     <div key={subItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-2 border-blue-200">
                                       <div className="flex items-center gap-4">
                                         <span className="text-sm font-medium min-w-[120px]">{subItem.name}</span>
                                         <ToggleSwitch
                                           checked={getStudentSubItemState(student.id, fee.id, subItem.id)}
                                           onChange={() => toggleSubItemActive(student.id, fee.id, subItem.id)}
                                           size="sm"
                                         />
                                       </div>
                                       <span className="text-sm font-medium text-blue-600">¥{subItem.amount}</span>
                                     </div>
                                   ))}
                                </div>
                              )}
                           </div>
                         )
                       })}
                     </div>

                     {activeFees.length === 0 && (
                       <div className="text-center py-8 text-gray-500">
                         <p>暂无可分配的费用项目</p>
                         <p className="text-sm">请先在收费项目管理中添加费用项目</p>
                       </div>
                     )}
                   </div>
                 )}
              </CardContent>
            </Card>
          )
        })}
      </div>


    </div>
  )
} 