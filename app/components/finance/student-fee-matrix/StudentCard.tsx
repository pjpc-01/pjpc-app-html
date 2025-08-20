import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, DollarSign, FileText, CheckCircle } from "lucide-react"
import { ToggleSwitch } from "../ToggleSwitch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { Fee } from "@/types/fees"
import { Student } from "@/hooks/useStudents"

interface StudentCardProps {
  student: Student
  isExpanded: boolean
  onToggleExpansion: () => void
  activeFees: Fee[] // This prop name is kept for compatibility, but now contains all fees
  groupedFees: Record<string, Fee[]>
  expandedCategories: Set<string>
  onToggleCategory: (category: string) => void
  studentTotal: number
  onUpdatePaymentStatus: (studentId: string, status: string) => void
  getPaymentStatus: (studentId: string) => { status: string; date: string }
  getStatusBadge: (status: string) => React.ReactNode
  onCreateInvoice: (studentId: string) => void
  editMode: boolean
  isAssigned: (studentId: string, feeId: string) => boolean
  assignFeeToStudent: (studentId: string, feeId: string) => void
  removeFeeFromStudent: (studentId: string, feeId: string) => void
  hasInvoiceThisMonth: (studentId: string) => boolean
  batchMode: boolean
}

export const StudentCard = ({
  student,
  isExpanded,
  onToggleExpansion,
  activeFees,
  groupedFees,
  expandedCategories,
  onToggleCategory,
  studentTotal,
  onUpdatePaymentStatus,
  getPaymentStatus,
  getStatusBadge,
  onCreateInvoice,
  editMode,
  isAssigned,
  assignFeeToStudent,
  removeFeeFromStudent,
  hasInvoiceThisMonth,
  batchMode
}: StudentCardProps) => {
  const studentId = student.id
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const toggleFeeAssignment = (feeId: string) => {
    if (!editMode) return

    console.log('👤 [费用分配] Student name:', student.student_name)
    
    if (batchMode) {
      console.log('🔄 [费用分配] Batch mode - toggling for all students')
      // In batch mode, toggle the same fee for all students
      const currentState = isAssigned(studentId, feeId)
      const targetState = !currentState
      
      if (targetState) {
        assignFeeToStudent(studentId, feeId)
      } else {
        removeFeeFromStudent(studentId, feeId)
      }
    } else {
      console.log('🔄 [费用分配] Normal mode - toggling for this student only')
      // Normal mode, toggle just for this student
      const currentState = isAssigned(studentId, feeId)
      const targetState = !currentState
      
      if (targetState) {
        assignFeeToStudent(studentId, feeId)
      } else {
        removeFeeFromStudent(studentId, feeId)
      }
    }
  }

  const handleCreateInvoice = () => {
    setShowConfirmDialog(true)
  }

  const confirmCreateInvoice = () => {
    onCreateInvoice(studentId)
    setShowConfirmDialog(false)
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          {/* Student Header - Clickable */}
          <div 
            className="bg-gray-50 px-6 py-4 border-b cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={onToggleExpansion}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{student.student_name}</h3>
                  <p className="text-sm text-gray-600">
                    {student.standard} • 学号: {student.student_id}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">应缴费 </span>
                    <span className="font-semibold text-green-600">
                      RM {studentTotal}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 bg-black hover:bg-gray-800 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCreateInvoice()
                      }}
                    >
                      <FileText className="h-3 w-3 text-white" />
                    </Button>
                    {hasInvoiceThisMonth(studentId) && (
                      <div className="relative group">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          本月已开具发票
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(getPaymentStatus(studentId).status)}
                    {getPaymentStatus(studentId).date && (
                      <span className="text-xs text-gray-500">
                        {getPaymentStatus(studentId).date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Assignment Grid - Only show when expanded */}
          {isExpanded && (
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(groupedFees).map(([category, categoryFees]) => {
                  const isCategoryExpanded = expandedCategories.has(category)
                  const totalAmount = categoryFees.reduce((sum, fee) => sum + fee.amount, 0)
                  const assignedFees = categoryFees.filter(fee => isAssigned(studentId, fee.id))
                  const assignedCount = assignedFees.length
                  const assignedAmount = assignedFees.reduce((sum, fee) => sum + fee.amount, 0)
                  
                  return (
                    <Collapsible
                      key={category}
                      open={isCategoryExpanded}
                      onOpenChange={() => onToggleCategory(category)}
                    >
                      <Card className="border-2">
                        <CollapsibleTrigger asChild>
                          <CardContent className="cursor-pointer hover:bg-gray-50 transition-colors p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isCategoryExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-500" />
                                )}
                                <div>
                                  <h4 className="text-lg font-medium">{category}</h4>
                                  <p className="text-sm text-gray-600">
                                    {categoryFees.length} 个项目 • {assignedCount} 个已分配
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">
                                    RM {assignedAmount}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-sm">
                                  {categoryFees.length} 项
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="pt-0 px-4 pb-4">
                            <div className="space-y-3">
                              {categoryFees.map((fee) => (
                                <div key={fee.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-6 flex-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {fee.name}
                                      </div>
                                      {fee.description && (
                                        <div className="text-xs text-gray-500 mt-1 truncate">
                                          {fee.description}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm font-medium text-blue-600 whitespace-nowrap">
                                        RM {fee.amount}
                                      </span>
                                      <ToggleSwitch
                                        checked={isAssigned(studentId, fee.id)}
                                        onChange={() => toggleFeeAssignment(fee.id)}
                                        disabled={!editMode}
                                        className={!editMode ? "opacity-50 cursor-not-allowed" : ""}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认开具发票</AlertDialogTitle>
            <AlertDialogDescription>
                                您确定要为 {student.student_name} 开具发票吗？这将创建一个新的发票记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreateInvoice}>
              确认开具
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
