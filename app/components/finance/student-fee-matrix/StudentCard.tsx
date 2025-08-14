import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, DollarSign, FileText, CheckCircle } from "lucide-react"
import { FeeCard } from "./FeeCard"
import { ToggleSwitch } from "../ToggleSwitch"
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
import { Fee } from "@/hooks/useFees"
import { Student } from "@/hooks/useStudents"

interface SubItem {
  id: number
  name: string
  amount: number
  description: string
  active: boolean
}

interface FeeItem {
  id: number
  name: string
  amount: number
  type: string
  description: string
  applicableGrades: string[]
  status: string
  category: string
  subItems: SubItem[]
}

interface StudentCardProps {
  student: Student
  isExpanded: boolean
  onToggleExpansion: () => void
  activeFees: Fee[]
  studentTotal: number
  onUpdatePaymentStatus: (studentId: string, status: string) => void
  getPaymentStatus: (studentId: string) => { status: string; date: string }
  getStatusBadge: (status: string) => React.ReactNode
  onCreateInvoice: (studentId: string) => void
  editMode: boolean
  expandedFees: Map<string, boolean>
  onToggleFeeExpansion: (studentId: string, feeId: string) => void
  isFeeExpanded: (studentId: string, feeId: string) => boolean
  isAssigned: (studentId: string, feeId: string) => boolean
  toggleStudentSubItem: (studentId: string, feeId: string, subItemId: number) => void
  getStudentSubItemState: (studentId: string, feeId: string, subItemId: number) => boolean
  hasInvoiceThisMonth: (studentId: string) => boolean
  batchMode: boolean
  onBatchToggleSubItem: (feeId: string, subItemId: number, targetState: boolean) => void
}

export const StudentCard = ({
  student,
  isExpanded,
  onToggleExpansion,
  activeFees,
  studentTotal,
  onUpdatePaymentStatus,
  getPaymentStatus,
  getStatusBadge,
  onCreateInvoice,
  editMode,
  expandedFees,
  onToggleFeeExpansion,
  isFeeExpanded,
  isAssigned,
  toggleStudentSubItem,
  getStudentSubItemState,
  hasInvoiceThisMonth,
  batchMode,
  onBatchToggleSubItem
}: StudentCardProps) => {
  const studentId = student.id
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const toggleSubItemActive = (studentId: string, feeId: string, subItemId: number) => {
    if (editMode) {
      if (batchMode) {
        // In batch mode, toggle the same sub-item for all students
        const currentState = getStudentSubItemState(studentId, feeId, subItemId)
        const targetState = !currentState
        onBatchToggleSubItem(feeId, subItemId, targetState)
      } else {
        // Normal mode, toggle just for this student
        toggleStudentSubItem(studentId, feeId, subItemId)
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
                   <h3 className="font-medium text-gray-900">{student.name}</h3>
                   <p className="text-sm text-gray-600">
                     {student.grade} • 学号: {student.studentId}
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
              <div className="space-y-3">
                {activeFees.map(fee => {
                  const feeExpanded = isFeeExpanded(studentId, fee.id)
                  const feeTotal = fee.subItems
                    .filter(subItem => getStudentSubItemState(studentId, fee.id, subItem.id))
                    .reduce((total, subItem) => total + subItem.amount, 0)
                  
                  return (
                    <div key={fee.id} className="space-y-2">
                                             <FeeCard
                         fee={fee}
                         isAssigned={isAssigned(studentId, fee.id)}
                         onToggle={() => onToggleFeeExpansion(studentId, fee.id)}
                         isExpanded={feeExpanded}
                         calculateAmount={() => feeTotal}
                       />
                       
                       {/* Sub-items - Only show when fee is expanded */}
                       {feeExpanded && fee.subItems && (
                         <div className="pl-8 space-y-2">
                           {fee.subItems.map((subItem) => (
                             <div key={subItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-2 border-blue-200">
                               <div className="flex items-center gap-4">
                                 <span className="text-sm font-medium min-w-[120px]">{subItem.name}</span>
                                 <ToggleSwitch
                                   checked={getStudentSubItemState(studentId, fee.id, subItem.id)}
                                   onChange={() => toggleSubItemActive(studentId, fee.id, subItem.id)}
                                   className={!editMode ? "opacity-50 cursor-not-allowed" : ""}
                                 />
                               </div>
                               <span className="text-sm font-medium text-blue-600">RM {subItem.amount}</span>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认开具发票</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要为 {student.name} 开具发票吗？这将创建一个新的发票记录。
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
