import { useState, useCallback, useMemo, useEffect } from 'react'
import { pb } from '@/lib/pocketbase'

// StudentFee interface matching exact PocketBase field names
export interface StudentFee {
  id: string
  studentId: string
  feeId: string
  assignedAmount?: number
  assignedDate: string
  status: 'active' | 'inactive' | 'removed'
}

// StudentSubItemState interface for tracking individual sub-item states
export interface StudentSubItemState {}

export const useStudentFees = () => {
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [studentSubItemStates] = useState<Map<string, StudentSubItemState>>(new Map())

  // Load existing assignments from PocketBase on mount
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const records = await pb.collection('student_fees').getFullList({
          sort: '-assignedDate'
        })
        const mapped: StudentFee[] = records.map((r: any) => ({
          id: r.id,
          studentId: r.studentId,
          feeId: r.feeId,
          assignedAmount: r.assignedAmount,
          assignedDate: r.assignedDate || new Date().toISOString().split('T')[0],
          status: 'active'
        }))
        setStudentFees(mapped)
      } catch (error) {
        console.error('Failed to load student_fees from PocketBase:', error)
      }
    }
    loadAssignments()
  }, [])

  // Helper function to generate state key
  const getStateKey = useCallback((_studentId: string, _feeId: string, _subItemId: number) => {
    return ''
  }, [])

  // Get the state of a specific sub-item for a student
  const getStudentSubItemState = useCallback((_studentId: string, _feeId: string, _subItemId: number): boolean => {
    return false
  }, [])

  // Toggle a sub-item state for a student
  const toggleStudentSubItem = useCallback((_studentId: string, _feeId: string, _subItemId: number) => {
    return
  }, [])

  // Check if a fee is assigned to a student
  const isAssigned = useCallback((studentId: string, feeId: string): boolean => {
    return studentFees.some(sf => sf.studentId === studentId && sf.feeId === feeId && sf.status === 'active')
  }, [studentFees])

  // Calculate total amount for a student (flat fee model)
  const calculateStudentTotal = useCallback((studentId: string, fees: any[]): number => {
    let total = 0
    
    console.log('calculateStudentTotal called for student:', studentId, 'with fees:', fees.length)
    
    fees.forEach(fee => {
      // Find any assignment for this student and fee
      const assignment = studentFees.find(sf => sf.studentId === studentId && sf.feeId === fee.id && sf.status === 'active')
      if (assignment?.assignedAmount !== undefined && assignment.assignedAmount !== null) {
        total += assignment.assignedAmount
        return
      }
      // Flat fee: add full fee amount
      total += fee.amount
    })
    
    console.log('Total calculated for student', studentId, ':', total)
    return total
  }, [getStudentSubItemState])

  // Assign a fee to a student
  const assignFeeToStudent = useCallback((studentId: string, feeId: string, _subItemStates: Record<string, boolean> = {}, assignedAmount?: number, _itemOverrides?: Record<string, number>) => {
    const existingAssignment = studentFees.find(sf => 
      sf.studentId === studentId && sf.feeId === feeId
    )

    if (existingAssignment) {
      // Update existing assignment
      setStudentFees(prev => prev.map(sf => 
        sf.id === existingAssignment.id 
          ? { 
              ...sf, 
              status: 'active', 
              assignedAmount: assignedAmount !== undefined ? assignedAmount : sf.assignedAmount
            }
          : sf
      ))
      pb.collection('student_fees').update(existingAssignment.id, {
        assignedAmount
      }).catch(err => console.error('Failed to update student_fees:', err))
    } else {
      // Create new assignment
      const assignedDate = new Date().toISOString().split('T')[0]
      pb.collection('student_fees').create({ studentId, feeId, assignedAmount, assignedDate })
        .then((created: any) => {
          const newAssignment: StudentFee = {
            id: created.id,
            studentId,
            feeId,
            assignedAmount,
            assignedDate,
            status: 'active'
          }
          setStudentFees(prev => [...prev, newAssignment])
        })
        .catch(err => console.error('Failed to create student_fees:', err))
    }
  }, [studentFees])

  // Remove a fee assignment from a student
  const removeFeeFromStudent = useCallback((studentId: string, feeId: string) => {
    const existing = studentFees.find(sf => sf.studentId === studentId && sf.feeId === feeId && sf.status === 'active')
    if (existing) {
      pb.collection('student_fees').delete(existing.id).catch(err => console.error('Failed to delete student_fees:', err))
      setStudentFees(prev => prev.map(sf => sf.id === existing.id ? { ...sf, status: 'removed' } : sf))
    }
  }, [studentFees])

  // Get all fee assignments for a student
  const getStudentFeeAssignments = useCallback((studentId: string): StudentFee[] => {
    return studentFees.filter(sf => 
      sf.studentId === studentId && sf.status === 'active'
    )
  }, [studentFees])

  // Get all students assigned to a fee
  const getStudentsForFee = useCallback((feeId: string): string[] => {
    return studentFees
      .filter(sf => sf.feeId === feeId && sf.status === 'active')
      .map(sf => sf.studentId)
  }, [studentFees])

  // Batch assign fee to multiple students
  const batchAssignFee = useCallback((feeId: string, studentIds: string[], subItemStates: Record<string, boolean> = {}) => {
    studentIds.forEach(studentId => {
      assignFeeToStudent(studentId, feeId, subItemStates)
    })
  }, [assignFeeToStudent])

  // Batch remove fee from multiple students
  const batchRemoveFee = useCallback((feeId: string, studentIds: string[]) => {
    studentIds.forEach(studentId => {
      removeFeeFromStudent(studentId, feeId)
    })
  }, [removeFeeFromStudent])

  // Get statistics
  const getStatistics = useCallback(() => {
    const totalAssignments = studentFees.filter(sf => sf.status === 'active').length
    const activeAssignments = studentFees.filter(sf => sf.status === 'active').length
    const inactiveAssignments = studentFees.filter(sf => sf.status === 'inactive').length
    const removedAssignments = studentFees.filter(sf => sf.status === 'removed').length

    return {
      totalAssignments,
      activeAssignments,
      inactiveAssignments,
      removedAssignments
    }
  }, [studentFees])

  return {
    studentFees,
    getStudentSubItemState,
    toggleStudentSubItem,
    isAssigned,
    calculateStudentTotal,
    assignFeeToStudent,
    removeFeeFromStudent,
    getStudentFeeAssignments,
    getStudentsForFee,
    batchAssignFee,
    batchRemoveFee,
    getStatistics
  }
} 