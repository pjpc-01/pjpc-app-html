import { useState, useCallback } from 'react'
import { FeeItem } from './useFees'

export interface StudentFeeAssignment {
  studentId: string
  feeId: number
  isAssigned: boolean
  dueDate?: Date
}

export interface StudentSubItemState {
  studentId: string
  feeId: number
  subItemId: number
  active: boolean
}

export const useStudentFees = () => {
  const [assignments, setAssignments] = useState<Map<string, boolean>>(new Map())
  const [studentSubItemStates, setStudentSubItemStates] = useState<Map<string, boolean>>(new Map())

  const toggleStudentFee = useCallback((studentId: string, feeId: number) => {
    const key = `${studentId}-${feeId}`
    setAssignments(prev => {
      const newMap = new Map(prev)
      newMap.set(key, !prev.get(key))
      return newMap
    })
  }, [])

  const isAssigned = useCallback((studentId: string, feeId: number) => {
    const key = `${studentId}-${feeId}`
    return assignments.get(key) || false
  }, [assignments])

  const assignFeeToAllStudents = useCallback((feeId: number, studentIds: string[]) => {
    setAssignments(prev => {
      const newMap = new Map(prev)
      studentIds.forEach(studentId => {
        newMap.set(`${studentId}-${feeId}`, true)
      })
      return newMap
    })
  }, [])

  // Function to toggle sub-item state for a specific student
  const toggleStudentSubItem = useCallback((studentId: string, feeId: number, subItemId: number) => {
    const key = `${studentId}-${feeId}-${subItemId}`
    setStudentSubItemStates(prev => {
      const newMap = new Map(prev)
      const currentState = prev.get(key) || false
      const newState = !currentState
      newMap.set(key, newState)
      return newMap
    })
  }, [])

  // Function to get sub-item state for a specific student
  const getStudentSubItemState = useCallback((studentId: string, feeId: number, subItemId: number) => {
    const key = `${studentId}-${feeId}-${subItemId}`
    return studentSubItemStates.get(key) || false
  }, [studentSubItemStates])

  // Function to set sub-item state for a specific student
  const setStudentSubItemState = useCallback((studentId: string, feeId: number, subItemId: number, active: boolean) => {
    const key = `${studentId}-${feeId}-${subItemId}`
    setStudentSubItemStates(prev => {
      const newMap = new Map(prev)
      newMap.set(key, active)
      return newMap
    })
  }, [])

  const calculateStudentTotal = useCallback((studentId: string, feeItems: FeeItem[]) => {
    return feeItems.reduce((total, fee) => {
      // Calculate total based on active sub-items for this specific student
      const activeSubItemsTotal = fee.subItems
        .filter(subItem => getStudentSubItemState(studentId, fee.id, subItem.id))
        .reduce((subTotal, subItem) => subTotal + subItem.amount, 0)
      return total + activeSubItemsTotal
    }, 0)
  }, [getStudentSubItemState])

  return {
    assignments,
    toggleStudentFee,
    isAssigned,
    assignFeeToAllStudents,
    calculateStudentTotal,
    toggleStudentSubItem,
    getStudentSubItemState,
    setStudentSubItemState
  }
} 