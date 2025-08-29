'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Users, FileText, ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react"
import { ToggleSwitch } from "@/components/ui/ToggleSwitch"
import { useStudentFeeMatrixQuery } from "@/hooks/useStudentFeeMatrixQuery"
import { useFeeItems } from "@/hooks/useFeeItems"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SaveAssignmentParams } from "@/types/student-fees"

/**
 * Student Fee Matrix - Core Purpose Only
 * 1. Record each student's fee items (independent of global fee status)
 * 2. Calculate total active fee items amount
 * 3. Enable invoice creation
 * 4. NEW: Edit mode for batch changes with single record per student
 */
export const StudentFeeMatrix: React.FC = () => {
  // ========================================
  // Core Data Only
  // ========================================
  const { feeItems, loading: feesLoading, error: feesError, refetch: refetchFees } = useFeeItems()
  const { students, assignments, loading: studentsLoading, error: studentsError, refetch: refetchStudents, saveAllAssignments, isSaving } = useStudentFeeMatrixQuery(feeItems)
  
  // Combine loading states
  const loading = studentsLoading || feesLoading
  const error = studentsError || feesError
  
  const refetch = () => {
    refetchStudents()
    refetchFees()
  }

  // ========================================
  // Edit Mode State Management
  // ========================================
  const [isEditMode, setIsEditMode] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Map<string, Set<string>>>(new Map()) // studentId -> Set of assigned fee IDs
  const [originalAssignments, setOriginalAssignments] = useState<Map<string, Set<string>>>(new Map()) // studentId -> Set of original assigned fee IDs

  // ========================================
  // Edit Mode Functions
  // ========================================
  const enterEditMode = () => {
    // Store current assignments as original state
    const currentAssignments = new Map<string, Set<string>>()
    const initialPendingChanges = new Map<string, Set<string>>()
    
    assignments.forEach(assignment => {
      const assignedFeeIds = assignment.assigned_fee_ids || assignment.fee_items.map(fee => fee.id)
      currentAssignments.set(assignment.students, new Set(assignedFeeIds))
      // Initialize pending changes with current assignments
      initialPendingChanges.set(assignment.students, new Set(assignedFeeIds))
    })
    
    setOriginalAssignments(currentAssignments)
    setPendingChanges(initialPendingChanges) // Start with current assignments as pending
    setIsEditMode(true)
  }

  const exitEditMode = () => {
    setIsEditMode(false)
    setPendingChanges(new Map())
    setOriginalAssignments(new Map())
  }

  const saveChanges = async () => {
    if (pendingChanges.size === 0) {
      exitEditMode()
      return
    }

    try {
      // Convert pending changes to the format expected by the mutation
      const studentAssignments: SaveAssignmentParams[] = []
      
      pendingChanges.forEach((assignedFeeIds, studentId) => {
        studentAssignments.push({
          studentId,
          assignedFeeIds: Array.from(assignedFeeIds)
        })
      })

      console.log('[StudentFeeMatrix] Saving student assignments:', studentAssignments)
      await saveAllAssignments(studentAssignments)
      exitEditMode()
    } catch (error) {
      console.error('Failed to save changes:', error)
      // Keep edit mode open so user can retry
    }
  }

  const hasPendingChanges = pendingChanges.size > 0

  // ========================================
  // Core Functions Only
  // ========================================
  const assignFee = (studentId: string, feeId: string) => {
    if (isEditMode) {
      // In edit mode, update pending changes
      setPendingChanges(prev => {
        const newChanges = new Map(prev)
        const currentAssigned = newChanges.get(studentId) || new Set()
        currentAssigned.add(feeId)
        newChanges.set(studentId, currentAssigned)
        return newChanges
      })
    } else {
      // Normal mode - this shouldn't happen since toggles are disabled
      console.warn('Attempted to assign fee outside of edit mode')
    }
  }

  const removeFee = (studentId: string, feeId: string) => {
    if (isEditMode) {
      // In edit mode, update pending changes
      setPendingChanges(prev => {
        const newChanges = new Map(prev)
        const currentAssigned = newChanges.get(studentId) || new Set()
        currentAssigned.delete(feeId)
        if (currentAssigned.size === 0) {
          newChanges.delete(studentId)
        } else {
          newChanges.set(studentId, currentAssigned)
        }
        return newChanges
      })
    } else {
      // Normal mode - this shouldn't happen since toggles are disabled
      console.warn('Attempted to remove fee outside of edit mode')
    }
  }

  // Get assigned fees for a specific student (including pending changes)
  const getAssignedFees = (studentId: string) => {
    
    // Get current assignments from database
    const currentAssignment = assignments.find(assignment => assignment.students === studentId)
    
    // Handle both old format (assigned_fee_ids) and new format (fee_items with objects)
    let currentAssignedFeeIds: string[] = []
    if (currentAssignment) {
      
      if (currentAssignment.assigned_fee_ids && currentAssignment.assigned_fee_ids.length > 0) {
        // Old format: use assigned_fee_ids
        currentAssignedFeeIds = currentAssignment.assigned_fee_ids
      } else if (currentAssignment.fee_items && currentAssignment.fee_items.length > 0) {
        // New format: extract IDs from fee_items objects
        currentAssignedFeeIds = currentAssignment.fee_items.map(fee => fee.id)
      } else {
      }
    } else {
    }
    
    if (!isEditMode) {
      return currentAssignedFeeIds
    }

    // In edit mode, check if there are pending changes for this student
    const pendingAssigned = pendingChanges.get(studentId)
    
    if (pendingAssigned) {
      // If there are pending changes, use them as the current state
      const result = Array.from(pendingAssigned)
      return result
    }

    // No pending changes, return current assignments
    return currentAssignedFeeIds
  }

  // Calculate total for a specific student based on their assignments (including pending changes)
  const getStudentTotal = (studentId: string) => {
    const assignedFeeIds = getAssignedFees(studentId)
    return feeItems
      .filter(fee => assignedFeeIds.includes(fee.id))
      .reduce((sum, fee) => sum + fee.amount, 0)
  }

  const createInvoice = (studentId: string) => {
    const total = getStudentTotal(studentId)
    console.log(`Creating invoice for student ${studentId} with total: ${total}`)
    // TODO: Implement invoice creation
  }

  // Check if a fee has pending changes
  const hasPendingChange = (studentId: string, feeId: string) => {
    const pendingAssigned = pendingChanges.get(studentId)
    if (!pendingAssigned) return false
    
    const originalAssigned = originalAssignments.get(studentId) || new Set()
    const isCurrentlyAssigned = pendingAssigned.has(feeId)
    const wasOriginallyAssigned = originalAssigned.has(feeId)
    
    return isCurrentlyAssigned !== wasOriginallyAssigned
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
      {/* Header with Edit Mode Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">学生费用分配</h2>
          <p className="text-gray-600 mt-1">
            {isEditMode 
              ? "编辑模式 - 点击保存按钮保存所有更改" 
              : "为学生分配费用项目并计算总额（独立于全局费用状态）- 点击编辑按钮开始修改"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            共 {students.length} 名学生
          </div>
          
          {/* Edit Mode Controls */}
          {isEditMode ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exitEditMode}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={isSaving || !hasPendingChanges}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? '保存中...' : `保存 (${pendingChanges.size} 名学生)`}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline" 
              size="sm"
              onClick={enterEditMode}
            >
              <Edit className="h-4 w-4 mr-1" />
              编辑
            </Button>
          )}
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                🎯 编辑模式已启用 - 您可以进行多个更改，然后点击"保存"按钮一次性保存所有更改
              </span>
              <span className="text-sm font-medium">
                待保存学生: {pendingChanges.size}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Simple Student List */}
      <div className="space-y-4">
        {students.map(student => {
          const assignedFees = getAssignedFees(student.id)
          const total = getStudentTotal(student.id)
          
          return (
            <StudentFeeRow
              key={student.id}
              student={student}
              fees={feeItems}
              assignedFees={assignedFees}
              total={total}
              onAssignFee={assignFee}
              onRemoveFee={removeFee}
              onCreateInvoice={createInvoice}
              isEditMode={isEditMode}
              hasPendingChange={hasPendingChange}
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
  isEditMode: boolean
  hasPendingChange: (studentId: string, feeId: string) => boolean
}

const StudentFeeRow: React.FC<StudentFeeRowProps> = ({
  student,
  fees,
  assignedFees,
  total,
  onAssignFee,
  onRemoveFee,
  onCreateInvoice,
  isEditMode,
  hasPendingChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Group fees by category
  const groupedFees = useMemo(() => {
    const groups: Record<string, typeof fees> = {}
    fees.forEach(fee => {
      const category = fee.category || '未分类'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(fee)
    })
    return groups
  }, [fees])

  // Calculate category totals based on assigned fees
  const getCategoryTotal = (categoryFees: typeof fees) => {
    return categoryFees.reduce((sum, fee) => {
      const isAssigned = assignedFees.includes(fee.id)
      return isAssigned ? sum + fee.amount : sum
    }, 0)
  }

  // Count assigned fees in category
  const getAssignedCount = (categoryFees: typeof fees) => {
    return categoryFees.filter(fee => assignedFees.includes(fee.id)).length
  }

  return (
    <Card className={isEditMode ? "ring-2 ring-blue-200" : ""}>
      <CardContent className="p-4">
        {/* Student Info with Expand/Collapse */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleExpansion}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={isExpanded ? "收起费用项目" : "展开费用项目"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            <div>
              <h3 className="font-medium text-gray-900">{student.studentName}</h3>
              {student.studentId && (
                <p className="text-sm text-gray-500">学号: {student.studentId}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">¥{total.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{assignedFees.length} 个费用项目</div>
          </div>
        </div>

        {/* Fee Categories - Collapsible */}
        {isExpanded && (
          <div className="space-y-3 mb-4">
            {Object.keys(groupedFees).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>暂无费用项目</p>
              </div>
            ) : (
              Object.entries(groupedFees).map(([category, categoryFees]) => {
                const isCategoryExpanded = expandedCategories.has(category)
                const categoryTotal = getCategoryTotal(categoryFees)
                const assignedCount = getAssignedCount(categoryFees)
                
                return (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isCategoryExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <div className="text-left">
                          <h4 className="font-medium text-gray-900">{category}</h4>
                          <p className="text-sm text-gray-500">
                            {assignedCount} / {categoryFees.length} 个项目
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ¥{categoryTotal.toLocaleString()}
                        </div>
                      </div>
                    </button>

                    {/* Category Items */}
                    {isCategoryExpanded && (
                      <div className="p-3 bg-white">
                        <div className="space-y-2">
                          {categoryFees.map(fee => {
                            const isAssigned = assignedFees.includes(fee.id)
                            const hasChange = hasPendingChange(student.id, fee.id)
                            
                            return (
                              <div 
                                key={fee.id} 
                                className={`flex items-center justify-between p-2 rounded transition-colors ${
                                  hasChange 
                                    ? 'bg-blue-50 border border-blue-200' 
                                    : 'bg-gray-50'
                                } ${!isEditMode ? 'opacity-60' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${!isEditMode ? 'text-gray-500' : ''}`}>
                                    {fee.name}
                                  </span>

                                  {hasChange && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      待保存
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm ${!isEditMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    ¥{fee.amount.toLocaleString()}
                                  </span>
                                  <ToggleSwitch
                                    checked={isAssigned}
                                    onChange={() => {
                                      if (isAssigned) {
                                        onRemoveFee(student.id, fee.id)
                                      } else {
                                        onAssignFee(student.id, fee.id)
                                      }
                                    }}
                                    disabled={!isEditMode}
                                    size="sm"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Action Buttons */}
        {total > 0 && !isEditMode && (
          <div className="pt-4 border-t">
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