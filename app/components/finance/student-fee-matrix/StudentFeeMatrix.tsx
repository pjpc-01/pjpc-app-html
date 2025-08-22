'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Users, FileText } from "lucide-react"
import { useStudentFeeMatrixQuery } from "@/hooks/useStudentFeeMatrixQuery"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

/**
 * Student Fee Matrix - Core Purpose Only
 * 1. Record each student's fee items
 * 2. Calculate total active fee items amount
 * 3. Enable invoice creation
 */
export const StudentFeeMatrix: React.FC = () => {
  // ========================================
  // Core Data Only
  // ========================================
  const { students, fees, assignments, loading, error, refetch } = useStudentFeeMatrixQuery()

  // ========================================
  // Core Functions Only
  // ========================================
  const assignFee = (studentId: string, feeId: string) => {
    console.log(`Assigning fee ${feeId} to student ${studentId}`)
    // TODO: Implement assignment logic
  }

  const removeFee = (studentId: string, feeId: string) => {
    console.log(`Removing fee ${feeId} from student ${studentId}`)
    // TODO: Implement removal logic
  }

  const getStudentTotal = (studentId: string) => {
    return assignments
      .filter(assignment => assignment.students === studentId)
      .reduce((sum, assignment) => sum + assignment.totalAmount, 0)
  }

  const getAssignedFees = (studentId: string) => {
    return assignments
      .filter(assignment => assignment.students === studentId)
      .flatMap(assignment => assignment.fee_items.map(fee => fee.id))
  }

  const createInvoice = (studentId: string) => {
    const total = getStudentTotal(studentId)
    console.log(`Creating invoice for student ${studentId} with total: ${total}`)
    // TODO: Implement invoice creation
  }

  // ========================================
  // Simple Error Handling
  // ========================================
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>加载失败: {error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>重试</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // ========================================
  // Simple Loading State
  // ========================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">正在加载数据...</span>
      </div>
    )
  }

  // ========================================
  // Simple Empty State
  // ========================================
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学生数据</h3>
        <p className="text-gray-500 mb-4">请先添加学生信息到系统中</p>
        <Button onClick={refetch}>刷新数据</Button>
      </div>
    )
  }

  // ========================================
  // Core UI - Simple List
  // ========================================
  return (
    <div className="space-y-4">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">学生费用分配</h2>
          <p className="text-gray-600 mt-1">为学生分配费用项目并计算总额</p>
        </div>
        <div className="text-sm text-gray-500">
          共 {students.length} 名学生
        </div>
      </div>

      {/* Simple Student List */}
      <div className="space-y-4">
        {students.map(student => {
          const assignedFees = getAssignedFees(student.id)
          const total = getStudentTotal(student.id)
          
          return (
            <StudentFeeRow
              key={student.id}
              student={student}
              fees={fees}
              assignedFees={assignedFees}
              total={total}
              onAssignFee={assignFee}
              onRemoveFee={removeFee}
              onCreateInvoice={createInvoice}
            />
          )
        })}
      </div>
    </div>
  )
}

// ========================================
// Simple Student Row Component
// ========================================
interface StudentFeeRowProps {
  student: { id: string; studentName: string; studentId?: string }
  fees: Array<{ id: string; name: string; amount: number; category?: string }>
  assignedFees: string[]
  total: number
  onAssignFee: (studentId: string, feeId: string) => void
  onRemoveFee: (studentId: string, feeId: string) => void
  onCreateInvoice: (studentId: string) => void
}

const StudentFeeRow: React.FC<StudentFeeRowProps> = ({
  student,
  fees,
  assignedFees,
  total,
  onAssignFee,
  onRemoveFee,
  onCreateInvoice
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        {/* Student Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900">{student.studentName}</h3>
            {student.studentId && (
              <p className="text-sm text-gray-500">学号: {student.studentId}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">¥{total.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{assignedFees.length} 个费用项目</div>
          </div>
        </div>

        {/* Fee List */}
        <div className="space-y-2">
          {fees.map(fee => {
            const isAssigned = assignedFees.includes(fee.id)
            return (
              <div key={fee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => {
                      if (isAssigned) {
                        onRemoveFee(student.id, fee.id)
                      } else {
                        onAssignFee(student.id, fee.id)
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">{fee.name}</span>
                  {fee.category && (
                    <span className="text-xs text-gray-500">({fee.category})</span>
                  )}
                </div>
                <span className="text-sm text-gray-600">¥{fee.amount.toLocaleString()}</span>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        {total > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={() => onCreateInvoice(student.id)}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              创建发票 (¥{total.toLocaleString()})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 