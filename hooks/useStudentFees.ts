import { useState, useCallback, useMemo } from 'react'

// StudentFee interface matching exact PocketBase field names
export interface StudentFee {
  id: string
  studentId: string
  feeId: string
  subItemStates: Record<string, boolean>
  assignedDate: string
  status: 'active' | 'inactive' | 'removed'
}

// StudentSubItemState interface for tracking individual sub-item states
export interface StudentSubItemState {
  studentId: string
  feeId: string
  subItemId: number
  active: boolean
}

export const useStudentFees = () => {
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [studentSubItemStates, setStudentSubItemStates] = useState<Map<string, StudentSubItemState>>(new Map())

  // Helper function to generate state key
  const getStateKey = useCallback((studentId: string, feeId: string, subItemId: number) => {
    return `${studentId}-${feeId}-${subItemId}`
  }, [])

  // Get the state of a specific sub-item for a student
  const getStudentSubItemState = useCallback((studentId: string, feeId: string, subItemId: number): boolean => {
    const key = getStateKey(studentId, feeId, subItemId)
    const state = studentSubItemStates.get(key)
    return state?.active || false
  }, [studentSubItemStates, getStateKey])

  // Toggle a sub-item state for a student
  const toggleStudentSubItem = useCallback((studentId: string, feeId: string, subItemId: number) => {
    console.log('toggleStudentSubItem called:', { studentId, feeId, subItemId })
    
    const key = getStateKey(studentId, feeId, subItemId)
    const currentState = studentSubItemStates.get(key)
    const newActive = !(currentState?.active || false)

    console.log('Current state:', currentState?.active, 'New state:', newActive)

    setStudentSubItemStates(prev => {
      const newMap = new Map(prev)
      newMap.set(key, {
        studentId,
        feeId,
        subItemId,
        active: newActive
      })
      return newMap
    })

    // Update the student_fees record
    setStudentFees(prev => prev.map(sf => {
      if (sf.studentId === studentId && sf.feeId === feeId) {
        const newSubItemStates = { ...sf.subItemStates }
        newSubItemStates[subItemId.toString()] = newActive
        return { ...sf, subItemStates: newSubItemStates }
      }
      return sf
    }))
  }, [studentSubItemStates, getStateKey])

  // Check if a fee is assigned to a student
  const isAssigned = useCallback((studentId: string, feeId: string): boolean => {
    // Check if any sub-item is active for this student and fee
    return true // For now, assume all fees are assigned since we're using sub-item states
  }, [])

  // Calculate total amount for a student based on active sub-items
  const calculateStudentTotal = useCallback((studentId: string, fees: any[]): number => {
    let total = 0
    
    console.log('calculateStudentTotal called for student:', studentId, 'with fees:', fees.length)
    
    // Calculate total based on current sub-item states
    fees.forEach(fee => {
      if (fee.subItems) {
        fee.subItems.forEach((subItem: any) => {
          const isActive = getStudentSubItemState(studentId, fee.id, subItem.id)
          if (isActive) {
            total += subItem.amount
            console.log('Active sub-item:', subItem.name, 'amount:', subItem.amount)
          }
        })
      }
    })
    
    console.log('Total calculated for student', studentId, ':', total)
    return total
  }, [getStudentSubItemState])

  // Assign a fee to a student
  const assignFeeToStudent = useCallback((studentId: string, feeId: string, subItemStates: Record<string, boolean> = {}) => {
    const existingAssignment = studentFees.find(sf => 
      sf.studentId === studentId && sf.feeId === feeId
    )

    if (existingAssignment) {
      // Update existing assignment
      setStudentFees(prev => prev.map(sf => 
        sf.id === existingAssignment.id 
          ? { ...sf, status: 'active', subItemStates: { ...sf.subItemStates, ...subItemStates } }
          : sf
      ))
    } else {
      // Create new assignment
      const newAssignment: StudentFee = {
        id: Math.max(...studentFees.map(sf => parseInt(sf.id)), 0) + 1 + "",
        studentId,
        feeId,
        subItemStates,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active'
      }
      setStudentFees(prev => [...prev, newAssignment])
    }
  }, [studentFees])

  // Remove a fee assignment from a student
  const removeFeeFromStudent = useCallback((studentId: string, feeId: string) => {
    setStudentFees(prev => prev.map(sf => 
      sf.studentId === studentId && sf.feeId === feeId
        ? { ...sf, status: 'removed' }
        : sf
    ))
  }, [])

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