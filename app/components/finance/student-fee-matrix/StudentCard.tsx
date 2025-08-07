import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, DollarSign, FileText } from "lucide-react"
import { FeeCard } from "./FeeCard"
import { ToggleSwitch } from "../ToggleSwitch"

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

interface Student {
  id: string
  name: string
  grade: string
  parentName: string
}

interface StudentCardProps {
  student: Student
  isExpanded: boolean
  onToggleExpansion: () => void
  activeFees: FeeItem[]
  studentTotal: number
  onUpdatePaymentStatus: (studentId: string, status: string) => void
  getPaymentStatus: (studentId: string) => { status: string; date: string }
  getStatusBadge: (status: string) => React.ReactNode
  onCreateInvoice: () => void
  editMode: boolean
  expandedFees: Map<string, boolean>
  onToggleFeeExpansion: (studentId: string, feeId: number) => void
  isFeeExpanded: (studentId: string, feeId: number) => boolean
  isAssigned: (studentId: number, feeId: number) => boolean
  toggleStudentSubItem: (studentId: number, feeId: number, subItemId: number) => void
  getStudentSubItemState: (studentId: number, feeId: number, subItemId: number) => boolean
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
  getStudentSubItemState
}: StudentCardProps) => {
  const studentId = student.id

  const toggleSubItemActive = (studentId: string, feeId: number, subItemId: number) => {
    if (editMode) {
      toggleStudentSubItem(Number(studentId), feeId, subItemId)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Student Header - Clickable */}
        <div 
          className="bg-gray-50 px-4 py-3 border-b cursor-pointer hover:bg-gray-100 transition-colors"
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
                  {student.grade} • {student.parentName} • ID: {student.id}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-12">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    ¥{studentTotal}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 bg-black hover:bg-gray-800 border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateInvoice()
                  }}
                >
                  <FileText className="h-3 w-3 text-white" />
                </Button>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdatePaymentStatus(studentId, 'paid')
                    }}
                  >
                    已缴费
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdatePaymentStatus(studentId, 'overdue')
                    }}
                  >
                    逾期
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdatePaymentStatus(studentId, 'pending')
                    }}
                  >
                    待缴费
                  </Button>
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
          <div className="p-4">
            <div className="space-y-3">
              {activeFees.map(fee => {
                const feeExpanded = isFeeExpanded(studentId, fee.id)
                const feeTotal = fee.subItems
                  .filter(subItem => getStudentSubItemState(Number(studentId), fee.id, subItem.id))
                  .reduce((total, subItem) => total + subItem.amount, 0)
                
                return (
                  <div key={fee.id} className="space-y-2">
                    <FeeCard
                      fee={fee}
                      isAssigned={isAssigned(Number(studentId), fee.id)}
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
                                checked={getStudentSubItemState(Number(studentId), fee.id, subItem.id)}
                                onChange={() => toggleSubItemActive(studentId, fee.id, subItem.id)}
                                className={!editMode ? "opacity-50 cursor-not-allowed" : ""}
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
}
