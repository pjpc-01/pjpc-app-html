import { useState, useCallback } from 'react'
import { FeeItem } from './useFees'

export interface StudentFeeAssignment {
  studentId: number
  feeId: number
  isAssigned: boolean
  dueDate?: Date
}

export interface StudentSubItemState {
  studentId: number
  feeId: number
  subItemId: number
  active: boolean
}

export const useStudentFees = () => {
  const [assignments, setAssignments] = useState<Map<string, boolean>>(new Map())
  const [studentSubItemStates, setStudentSubItemStates] = useState<Map<string, boolean>>(new Map())

  const toggleStudentFee = useCallback((studentId: number, feeId: number) => {
    const key = `${studentId}-${feeId}`
    setAssignments(prev => {
      const newMap = new Map(prev)
      newMap.set(key, !prev.get(key))
      return newMap
    })
  }, [])

  const isAssigned = useCallback((studentId: number, feeId: number) => {
    const key = `${studentId}-${feeId}`
    return assignments.get(key) || false
  }, [assignments])

  const assignFeeToAllStudents = useCallback((feeId: number, studentIds: number[]) => {
    setAssignments(prev => {
      const newMap = new Map(prev)
      studentIds.forEach(studentId => {
        newMap.set(`${studentId}-${feeId}`, true)
      })
      return newMap
    })
  }, [])

  // New function to toggle sub-item state for a specific student
  const toggleStudentSubItem = useCallback((studentId: number, feeId: number, subItemId: number) => {
    const key = `${studentId}-${feeId}-${subItemId}`
    console.log(`Toggling student sub-item: ${key}`)
    setStudentSubItemStates(prev => {
      const newMap = new Map(prev)
      const currentState = prev.get(key) || false
      const newState = !currentState
      console.log(`Setting ${key} from ${currentState} to ${newState}`)
      newMap.set(key, newState)
      return newMap
    })
  }, [])

  // New function to get sub-item state for a specific student
  const getStudentSubItemState = useCallback((studentId: number, feeId: number, subItemId: number) => {
    const key = `${studentId}-${feeId}-${subItemId}`
    const state = studentSubItemStates.get(key) || false
    console.log(`Getting state for ${key}: ${state}`)
    return state
  }, [studentSubItemStates])

  // New function to set sub-item state for a specific student
  const setStudentSubItemState = useCallback((studentId: number, feeId: number, subItemId: number, active: boolean) => {
    const key = `${studentId}-${feeId}-${subItemId}`
    setStudentSubItemStates(prev => {
      const newMap = new Map(prev)
      newMap.set(key, active)
      return newMap
    })
  }, [])

  const calculateStudentTotal = useCallback((studentId: number, feeItems: FeeItem[]) => {
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