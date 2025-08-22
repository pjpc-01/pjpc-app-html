'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { StudentNameCard, FeeItem, StudentFeeAssignment, StudentFeeMatrixState } from '@/types/student-fees'

// Query keys for React Query
export const queryKeys = {
  students: ['students'] as const,
  fees: ['fees'] as const,
  studentFees: ['student-fees'] as const,
  studentFeeMatrix: ['student-fee-matrix'] as const,
}

// Fetch students
const fetchStudents = async (): Promise<StudentNameCard[]> => {
  console.log('[useStudentFeeMatrixQuery] Fetching students...')
  const records = await pb.collection('students').getFullList(200, {
    filter: 'status = "active"',
    sort: 'student_name',
    fields: 'id,student_name,standard,parents_name,studentId'
  })
  
  const students: StudentNameCard[] = records.map(record => ({
    id: record.id,
    studentName: record.student_name,
    grade: record.standard,
    parentName: record.parents_name,
    studentId: record.studentId,
  }))
  
  console.log(`[useStudentFeeMatrixQuery] Fetched ${students.length} students`)
  return students
}

// Fetch fees
const fetchFees = async (): Promise<FeeItem[]> => {
  console.log('[useStudentFeeMatrixQuery] Fetching fees...')
  const records = await pb.collection('fee_items').getFullList(200, {
    filter: 'status = "active"',
    sort: 'name',
    fields: 'id,name,category,amount,description,status'
  })
  
  const fees: FeeItem[] = records.map(record => ({
    id: record.id,
    name: record.name,
    category: record.category,
    amount: record.amount,
    description: record.description,
    active: record.status === 'active',
  }))
  
  console.log(`[useStudentFeeMatrixQuery] Fetched ${fees.length} fees`)
  return fees
}

// Fetch student fee assignments
const fetchStudentFees = async (): Promise<StudentFeeAssignment[]> => {
  console.log('[useStudentFeeMatrixQuery] Fetching student fee assignments...')
  const records = await pb.collection('student_fee_matrix').getFullList(200, {
    expand: 'student_id,fee_item_id'
  })
  
  const assignments: StudentFeeAssignment[] = records.map(record => ({
    id: record.id,
    students: record.student_id,
    fee_items: record.expand?.fee_item_id ? [record.expand.fee_item_id] : [],
    totalAmount: record.totalAmount || 0,
    expand: record.expand
  }))
  
  console.log(`[useStudentFeeMatrixQuery] Fetched ${assignments.length} assignments`)
  return assignments
}

// Main hook that combines all queries
export const useStudentFeeMatrixQuery = () => {
  const queryClient = useQueryClient()

  // Fetch students
  const studentsQuery = useQuery({
    queryKey: queryKeys.students,
    queryFn: fetchStudents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch fees
  const feesQuery = useQuery({
    queryKey: queryKeys.fees,
    queryFn: fetchFees,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch student fee assignments
  const studentFeesQuery = useQuery({
    queryKey: queryKeys.studentFees,
    queryFn: fetchStudentFees,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Mutation for updating student fee assignments
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ studentId, feeId, paymentStatus }: {
      studentId: string
      feeId: string
      paymentStatus: string
    }) => {
      console.log(`[useStudentFeeMatrixQuery] Updating assignment: ${studentId} - ${feeId} - ${paymentStatus}`)
      
      // Check if assignment exists
      const existingAssignments = await pb.collection('student_fee_matrix').getFullList(1, {
        filter: `student_id = "${studentId}" && fee_item_id = "${feeId}"`
      })

      if (existingAssignments.length > 0) {
        // Update existing assignment
        const assignment = existingAssignments[0]
        return await pb.collection('student_fee_matrix').update(assignment.id, {
          paymentStatus
        })
      } else {
        // Create new assignment
        return await pb.collection('student_fee_matrix').create({
          student_id: studentId,
          fee_item_id: feeId,
          paymentStatus,
          assignedDate: new Date().toISOString()
        })
      }
    },
    onSuccess: () => {
      // Invalidate and refetch student fees
      queryClient.invalidateQueries({ queryKey: queryKeys.studentFees })
      console.log('[useStudentFeeMatrixQuery] Assignment updated successfully')
    },
    onError: (error) => {
      console.error('[useStudentFeeMatrixQuery] Error updating assignment:', error)
    }
  })

  // Mutation for batch operations
  const batchUpdateMutation = useMutation({
    mutationFn: async (assignments: Array<{
      studentId: string
      feeId: string
      paymentStatus: string
    }>) => {
      console.log(`[useStudentFeeMatrixQuery] Batch updating ${assignments.length} assignments`)
      
      const results = await Promise.all(
        assignments.map(async ({ studentId, feeId, paymentStatus }) => {
          const existingAssignments = await pb.collection('student_fee_matrix').getFullList(1, {
            filter: `student_id = "${studentId}" && fee_item_id = "${feeId}"`
          })

          if (existingAssignments.length > 0) {
            return await pb.collection('student_fee_matrix').update(existingAssignments[0].id, {
              paymentStatus
            })
          } else {
            return await pb.collection('student_fee_matrix').create({
              student_id: studentId,
              fee_item_id: feeId,
              paymentStatus,
              assignedDate: new Date().toISOString()
            })
          }
        })
      )
      
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentFees })
      console.log('[useStudentFeeMatrixQuery] Batch update completed successfully')
    },
    onError: (error) => {
      console.error('[useStudentFeeMatrixQuery] Error in batch update:', error)
    }
  })

  // Refetch function
  const refetch = () => {
    console.log('[useStudentFeeMatrixQuery] Refetching all data...')
    queryClient.invalidateQueries({ queryKey: queryKeys.students })
    queryClient.invalidateQueries({ queryKey: queryKeys.fees })
    queryClient.invalidateQueries({ queryKey: queryKeys.studentFees })
  }

  // Determine overall loading state
  const isLoading = studentsQuery.isLoading || feesQuery.isLoading || studentFeesQuery.isLoading
  const isError = studentsQuery.isError || feesQuery.isError || studentFeesQuery.isError
  const error = studentsQuery.error || feesQuery.error || studentFeesQuery.error

  // Prepare the state object
  const state: StudentFeeMatrixState = {
    students: studentsQuery.data || [],
    fees: feesQuery.data || [],
    assignments: studentFeesQuery.data || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    loadingState: isLoading ? 'loading' : 'idle',
  }

  return {
    // Data
    students: studentsQuery.data || [],
    fees: feesQuery.data || [],
    assignments: studentFeesQuery.data || [],
    
    // Loading states
    loading: isLoading,
    loadingState: isLoading ? 'loading' : 'idle',
    
    // Error states
    error: error ? (error as Error).message : null,
    isError,
    
    // Mutations
    updateAssignment: updateAssignmentMutation.mutate,
    batchUpdate: batchUpdateMutation.mutate,
    isUpdating: updateAssignmentMutation.isPending,
    isBatchUpdating: batchUpdateMutation.isPending,
    
    // Actions
    refetch,
    invalidateQueries: queryClient.invalidateQueries,
    
    // Raw queries for debugging
    studentsQuery,
    feesQuery,
    studentFeesQuery,
    
    // State object (for compatibility)
    state,
  }
}
