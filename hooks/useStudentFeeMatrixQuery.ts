'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '@/lib/pocketbase'
import { StudentNameCard, FeeItem, StudentFeeAssignment, StudentFeeMatrixState, SaveAssignmentParams } from '@/types/student-fees'

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

// Fetch fees (all active fees, regardless of individual assignments)
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

// Fetch student fee assignments (NEW STRUCTURE: one record per student with JSON array of fee IDs)
const fetchStudentFees = async (): Promise<StudentFeeAssignment[]> => {
  console.log('[useStudentFeeMatrixQuery] Fetching student fee assignments...')
  
  try {
    // Get all student_fee_matrix records
    const records = await pb.collection('student_fee_matrix').getFullList(200)
    console.log(`[useStudentFeeMatrixQuery] Found ${records.length} student fee matrix records`)
    
    const assignments: StudentFeeAssignment[] = records.map(record => {
      console.log('[useStudentFeeMatrixQuery] Processing record:', record)
      
      // Extract student ID from the complex students field
      let studentId = record.students
      if (typeof record.students === 'string' && record.students.length > 50) {
        // Extract ID from complex string using regex
        const idPattern = /[a-zA-Z0-9]{8,20}/g
        const matches = record.students.match(idPattern)
        if (matches && matches.length > 0) {
          studentId = matches[0]
        }
      }
      
      // Parse the fee_items field (could be JSON string or array)
      let assignedFeeIds: string[] = []
      let feeItemsData: any[] = []
      try {
        if (record.fee_items) {
          if (typeof record.fee_items === 'string') {
            // Try to parse as JSON
            const parsed = JSON.parse(record.fee_items)
            if (Array.isArray(parsed)) {
              // Check if it's an array of objects (new format) or just IDs (old format)
              if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].id) {
                // New format: array of objects with id, name, status, etc.
                feeItemsData = parsed
                assignedFeeIds = parsed.map(item => item.id)
              } else {
                // Old format: array of IDs
                assignedFeeIds = parsed
                feeItemsData = parsed.map(id => ({ id }))
              }
            }
          } else if (Array.isArray(record.fee_items)) {
            // Check if it's an array of objects (new format) or just IDs (old format)
            if (record.fee_items.length > 0 && typeof record.fee_items[0] === 'object' && record.fee_items[0].id) {
              // New format: array of objects with id, name, status, etc.
              feeItemsData = record.fee_items
              assignedFeeIds = record.fee_items.map(item => item.id)
            } else {
              // Old format: array of IDs
              assignedFeeIds = record.fee_items
              feeItemsData = record.fee_items.map(id => ({ id }))
            }
          }
        }
      } catch (error) {
        console.error('[useStudentFeeMatrixQuery] Error parsing fee_items:', error)
        assignedFeeIds = []
        feeItemsData = []
      }
      
      console.log('[useStudentFeeMatrixQuery] Parsed assigned fee IDs:', assignedFeeIds)
      console.log('[useStudentFeeMatrixQuery] Parsed fee items data:', feeItemsData)
      
      const assignment: StudentFeeAssignment = {
        id: record.id,
        students: studentId, // Use extracted student ID
        fee_items: feeItemsData.map(item => ({
          id: item.id,
          name: item.name || 'Unknown',
          status: item.status || 'active',
          amount: item.amount || 0,
          category: item.category || '未分类'
        } as FeeItem)), // Convert to FeeItem objects with full data
        totalAmount: record.total_amount || 0,
        assigned_fee_ids: assignedFeeIds // Store the raw array for easy access
      }
      
      console.log('[useStudentFeeMatrixQuery] Created assignment:', assignment)
      return assignment
    })
    
    console.log(`[useStudentFeeMatrixQuery] Fetched ${assignments.length} assignments`)
    return assignments
  } catch (error) {
    console.error('[useStudentFeeMatrixQuery] Error fetching student fees:', error)
    return []
  }
}

// Main hook that combines all queries
export const useStudentFeeMatrixQuery = (feeItems: Array<{ id: string; name: string; amount: number; active: boolean; category?: string; description?: string; status?: 'active' | 'inactive' }> = []) => {
  const queryClient = useQueryClient()

  // Fetch students
  const studentsQuery = useQuery({
    queryKey: queryKeys.students,
    queryFn: fetchStudents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Note: fees are now passed as parameter instead of fetched internally

  // Fetch student fee assignments
  const studentFeesQuery = useQuery({
    queryKey: queryKeys.studentFees,
    queryFn: fetchStudentFees,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // NEW: Mutation for saving all student assignments at once (batch save)
  const saveAllAssignmentsMutation = useMutation({
    mutationFn: async (studentAssignments: SaveAssignmentParams[]) => {
      console.log(`[useStudentFeeMatrixQuery] Saving ${studentAssignments.length} student assignments`)
      
      try {
        const results = []
        
        for (const { studentId, assignedFeeIds, assignedFeeItems } of studentAssignments) {
          console.log(`[useStudentFeeMatrixQuery] Processing student ${studentId} with ${assignedFeeIds.length} fee assignments`)
          
          // Calculate total amount for this student
          const totalAmount = assignedFeeIds.reduce((sum, feeId) => {
            const fee = feeItems.find(f => f.id === feeId)
            return sum + (fee?.amount || 0)
          }, 0)
          
          console.log(`[useStudentFeeMatrixQuery] Calculated total amount for student ${studentId}: ¥${totalAmount}`)
          
          // Check if student already has a record
          const existingRecords = await pb.collection('student_fee_matrix').getFullList(1, {
            filter: `students = "${studentId}"`
          })
          
          // Prepare fee_items data - use detailed objects if available, otherwise use IDs
          const feeItemsData = assignedFeeItems && assignedFeeItems.length > 0 
            ? assignedFeeItems 
            : assignedFeeIds
          
          if (existingRecords.length > 0) {
            // Update existing record
            const existingRecord = existingRecords[0]
            console.log(`[useStudentFeeMatrixQuery] Updating existing record for student ${studentId}`)
            
            const result = await pb.collection('student_fee_matrix').update(existingRecord.id, {
              fee_items: JSON.stringify(feeItemsData), // Store detailed fee items or IDs
              total_amount: totalAmount, // Save calculated total amount
              updated: new Date().toISOString()
            })
            results.push(result)
          } else {
            // Create new record
            console.log(`[useStudentFeeMatrixQuery] Creating new record for student ${studentId}`)
            
            const result = await pb.collection('student_fee_matrix').create({
              students: studentId,
              fee_items: JSON.stringify(feeItemsData), // Store detailed fee items or IDs
              total_amount: totalAmount, // Save calculated total amount
              created: new Date().toISOString(),
              updated: new Date().toISOString()
            })
            results.push(result)
          }
        }
        
        console.log(`[useStudentFeeMatrixQuery] Successfully saved ${results.length} student assignments`)
        return results
      } catch (error) {
        console.error(`[useStudentFeeMatrixQuery] Error saving assignments:`, error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentFees })
      console.log('[useStudentFeeMatrixQuery] ✅ All assignments saved successfully')
    },
    onError: (error) => {
      console.error('[useStudentFeeMatrixQuery] ❌ Error saving assignments:', error)
    }
  })

  // Refetch function
  const refetch = () => {
    console.log('[useStudentFeeMatrixQuery] Refetching all data...')
    queryClient.invalidateQueries({ queryKey: queryKeys.students })
    queryClient.invalidateQueries({ queryKey: queryKeys.studentFees })
  }

  // Determine overall loading state
  const isLoading = studentsQuery.isLoading || studentFeesQuery.isLoading
  const isError = studentsQuery.isError || studentFeesQuery.isError
  const error = studentsQuery.error || studentFeesQuery.error

  // Prepare the state object
  const state: StudentFeeMatrixState = {
    students: studentsQuery.data || [],
    fees: feeItems, // Use passed feeItems instead of fetched fees
    assignments: studentFeesQuery.data || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    loadingState: isLoading ? 'loading' : 'idle',
    editMode: false,
    expandedStudents: new Set(),
    expandedCategories: new Set(),
    searchTerm: '',
    selectedGradeFilter: 'all',
    batchMode: false
  }

  return {
    // Data
    students: studentsQuery.data || [],
    fees: feeItems, // Use passed feeItems instead of fetched fees
    assignments: studentFeesQuery.data || [],
    
    // Loading states
    loading: isLoading,
    loadingState: isLoading ? 'loading' : 'idle',
    
    // Error states
    error: error ? (error as Error).message : null,
    isError,
    
    // NEW: Only batch save mutation (no individual updates)
    saveAllAssignments: saveAllAssignmentsMutation.mutate,
    isSaving: saveAllAssignmentsMutation.isPending,
    
    // Actions
    refetch,
    invalidateQueries: queryClient.invalidateQueries,
    
    // Raw queries for debugging
    studentsQuery,
    studentFeesQuery,
    
    // State object (for compatibility)
    state,
  }
}
