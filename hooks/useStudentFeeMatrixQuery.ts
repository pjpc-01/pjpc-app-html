'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useMemo } from 'react'
import { pb } from '@/lib/pocketbase-instance'
import { FeeItem, StudentFeeAssignment, StudentFeeMatrixState, SaveAssignmentParams, StudentNameCard, FeeCategory, PaymentStatus } from '@/types/student-fees'
import { Student } from '@/lib/pocketbase-students'

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
    fields: 'id,student_name,standard,parents_name,student_id'
  })
  
  const students: StudentNameCard[] = records.map(record => ({
    id: record.id,
    studentName: record.student_name,
    grade: record.standard,
    parentName: record.parents_name,
    studentId: record.student_id,
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
    fields: 'id,name,category,amount,description,status,frequency'
  })
  
  const fees: FeeItem[] = records.map(record => ({
    id: record.id,
    name: record.name,
    category: record.category,
    amount: record.amount,
    description: record.description,
    active: record.status === 'active',
    frequency: record.frequency,
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

  // ========================================
  // Local State Management (for edit mode)
  // ========================================
  const [editMode, setEditMode] = useState(false)
  const [localAssignments, setLocalAssignments] = useState<Map<string, Set<string>>>(new Map())
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all')
  const [batchMode, setBatchMode] = useState(false)

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

  // ========================================
  // Computed Values
  // ========================================

  // Group fees by category
  const groupedFees = useMemo((): Record<string, FeeCategory> => {
    const groups: Record<string, FeeCategory> = {}
    const fees = feesQuery.data || []
    
    fees.forEach(fee => {
      const category = fee.category || '其他'
      
      if (!groups[category]) {
        groups[category] = {
          name: category,
          fees: [],
          totalItems: 0,
          assignedCount: 0,
          totalAmount: 0
        }
      }
      
      groups[category].fees.push(fee)
      groups[category].totalItems++
      groups[category].totalAmount += fee.amount
    })

    // Calculate assigned counts
    Object.keys(groups).forEach(category => {
      const categoryFees = groups[category].fees
      let assignedCount = 0
      
      const students = studentsQuery.data || []
      students.forEach(student => {
        const studentAssignment = localAssignments.get(student.id)
        if (studentAssignment) {
          categoryFees.forEach(fee => {
            if (studentAssignment.has(fee.id)) {
              assignedCount++
            }
          })
        }
      })
      
      groups[category].assignedCount = assignedCount
    })

    return groups
  }, [feesQuery.data, studentsQuery.data, localAssignments])

  // Filter students based on search and filters
  const filteredStudents = useMemo((): StudentNameCard[] => {
    const students = studentsQuery.data || []
    return students.filter(student => {
      const matchesSearch = !searchTerm || 
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
        
      const matchesGrade = selectedGradeFilter === 'all' || 
        student.grade === selectedGradeFilter
      
      return matchesSearch && matchesGrade
    })
  }, [studentsQuery.data, searchTerm, selectedGradeFilter])

  // ========================================
  // Assignment Operations
  // ========================================

  // Check if a fee is assigned to a student
  const isAssigned = useCallback((studentId: string, feeId: string): boolean => {
    if (editMode) {
      const studentAssignment = localAssignments.get(studentId)
      return studentAssignment ? studentAssignment.has(feeId) : false
    } else {
      const assignments = studentFeesQuery.data || []
      const assignment = assignments.find(a => a.students === studentId)
      return assignment?.fee_items.some(item => item.id === feeId && item.active) || false
    }
  }, [editMode, studentFeesQuery.data, localAssignments])

  // Get student's total amount
  const getStudentAmount = useCallback((studentId: string): number => {
    if (editMode) {
      const studentAssignment = localAssignments.get(studentId)
      if (!studentAssignment) return 0
      
      const fees = feesQuery.data || []
      return fees
        .filter(fee => studentAssignment.has(fee.id))
        .reduce((total, fee) => total + fee.amount, 0)
    } else {
      const assignments = studentFeesQuery.data || []
      const assignment = assignments.find(a => a.students === studentId)
      return assignment?.totalAmount || 0
    }
  }, [editMode, studentFeesQuery.data, feesQuery.data, localAssignments])

  // Get payment status
  const getPaymentStatus = useCallback((studentId: string): PaymentStatus => {
    return {
      status: 'not_issued',
      date: undefined,
      amount: getStudentAmount(studentId)
    }
  }, [getStudentAmount])

  // ========================================
  // Edit Mode Operations
  // ========================================

  // Assign fee to student (local state only during edit mode)
  const assignFee = useCallback((studentId: string, feeId: string) => {
    if (!editMode) {
      console.warn('Cannot assign fee outside edit mode')
      return
    }

    console.log(`[useStudentFeeMatrixQuery] Assigning fee ${feeId} to student ${studentId}`)
    
    setLocalAssignments(prev => {
      const newMap = new Map(prev)
      const studentAssignment = new Set(newMap.get(studentId) || [])
      studentAssignment.add(feeId)
      newMap.set(studentId, studentAssignment)
      return newMap
    })
  }, [editMode])

  // Remove fee from student (local state only during edit mode)
  const removeFee = useCallback((studentId: string, feeId: string) => {
    if (!editMode) {
      console.warn('Cannot remove fee outside edit mode')
      return
    }

    console.log(`[useStudentFeeMatrixQuery] Removing fee ${feeId} from student ${studentId}`)
    
    setLocalAssignments(prev => {
      const newMap = new Map(prev)
      const studentAssignment = new Set(newMap.get(studentId) || [])
      studentAssignment.delete(feeId)
      newMap.set(studentId, studentAssignment)
      return newMap
    })
  }, [editMode])

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    const newEditMode = !editMode
    console.log(`[useStudentFeeMatrixQuery] ${newEditMode ? 'Entering' : 'Exiting'} edit mode`)
    
    if (newEditMode) {
      // Initialize local assignments from current data
      const initialAssignments = new Map<string, Set<string>>()
      const assignments = studentFeesQuery.data || []
      
      assignments.forEach(assignment => {
        const feeIds = new Set<string>()
        assignment.fee_items.forEach(item => {
          if (item.active) {
            feeIds.add(item.id)
          }
        })
        if (feeIds.size > 0) {
          initialAssignments.set(assignment.students, feeIds)
        }
      })
      setLocalAssignments(initialAssignments)
    } else {
      // Save assignments when exiting edit mode
      saveAllAssignments()
    }

    setEditMode(newEditMode)
  }, [editMode, studentFeesQuery.data])

  // ========================================
  // UI State Operations
  // ========================================

  const toggleStudentExpansion = useCallback((studentId: string) => {
    setExpandedStudents(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(studentId)) {
        newExpanded.delete(studentId)
      } else {
        newExpanded.add(studentId)
      }
      return newExpanded
    })
  }, [])

  const toggleCategoryExpansion = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(category)) {
        newExpanded.delete(category)
      } else {
        newExpanded.add(category)
      }
      return newExpanded
    })
  }, [])

  // ========================================
  // Mutations
  // ========================================

  // Mutation for saving all student assignments at once (batch save)
  const saveAllAssignmentsMutation = useMutation({
    mutationFn: async (studentAssignments: SaveAssignmentParams[]) => {
      console.log(`[useStudentFeeMatrixQuery] Saving ${studentAssignments.length} student assignments`)
      
      try {
        const results = []
        const fees = feesQuery.data || []
        
        for (const { studentId, assignedFeeIds, assignedFeeItems } of studentAssignments) {
          console.log(`[useStudentFeeMatrixQuery] Processing student ${studentId} with ${assignedFeeIds.length} fee assignments`)
          
          // Calculate total amount for this student
          const totalAmount = assignedFeeIds.reduce((sum, feeId) => {
            const fee = fees.find(f => f.id === feeId)
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

  // Save assignments function
  const saveAllAssignments = useCallback(() => {
    const assignments: SaveAssignmentParams[] = []
    
    localAssignments.forEach((feeIds, studentId) => {
      const assignedFeeItems = Array.from(feeIds).map(feeId => {
        const fee = feesQuery.data?.find(f => f.id === feeId)
        return {
          id: feeId,
          name: fee?.name || 'Unknown',
          status: fee?.status || 'active',
          amount: fee?.amount || 0,
          category: fee?.category || '未分类'
        }
      })
      
      assignments.push({
        studentId,
        assignedFeeIds: Array.from(feeIds),
        assignedFeeItems
      })
    })
    
    if (assignments.length > 0) {
      saveAllAssignmentsMutation.mutate(assignments)
    }
  }, [localAssignments, feesQuery.data, saveAllAssignmentsMutation])

  // ========================================
  // Utility Functions
  // ========================================

  // Refetch function
  const refetch = useCallback(() => {
    console.log('[useStudentFeeMatrixQuery] Refetching all data...')
    queryClient.invalidateQueries({ queryKey: queryKeys.students })
    queryClient.invalidateQueries({ queryKey: queryKeys.fees })
    queryClient.invalidateQueries({ queryKey: queryKeys.studentFees })
  }, [queryClient])

  // Diagnostics function
  const runDiagnostics = useCallback(async () => {
    try {
      console.log('[useStudentFeeMatrixQuery] Running diagnostics...')
      
      // Check if collections exist
      const collections = await pb.collections.getFullList()
      const collectionNames = collections.map((c: any) => c.name)
      
      const diagnostics = {
        connectionStatus: 'connected', // Assuming connected if we can reach here
        hasUser: true, // Assuming authenticated if we can reach here
        userId: 'current-user', // You might want to get this from auth context
        userRole: 'admin', // You might want to get this from auth context
        collectionsCount: collections.length,
        collectionNames,
        hasStudents: collectionNames.includes('students'),
        hasFeeItems: collectionNames.includes('fee_items'),
        hasStudentFeeMatrix: collectionNames.includes('student_fee_matrix'),
        hasStudentFees: collectionNames.includes('student_fees'),
        hasFeesItems: collectionNames.includes('fees_items'),
        hasStudentCards: collectionNames.includes('students'), // Updated: student_cards merged into students
        hasCenters: collectionNames.includes('centers'),
        hasLevels: collectionNames.includes('levels'),
        studentsCount: 0,
        feesCount: 0,
        assignmentsCount: 0
      }

      try {
        const studentsResponse = await pb.collection('students').getList(1, 1)
        diagnostics.studentsCount = studentsResponse.totalItems
      } catch (error: any) {
        console.warn('Could not count students:', {
          error: error.message,
          status: error.status
        })
      }

      try {
        const feesResponse = await pb.collection('fee_items').getList(1, 1)
        diagnostics.feesCount = feesResponse.totalItems
      } catch (error: any) {
        console.warn('Could not count fees:', {
          error: error.message,
          status: error.status
        })
      }

      try {
        const assignmentsResponse = await pb.collection('student_fees').getList(1, 1)
        diagnostics.assignmentsCount = assignmentsResponse.totalItems
      } catch (error: any) {
        console.warn('Could not count assignments:', {
          error: error.message,
          status: error.status
        })
      }

      console.log('[useStudentFeeMatrixQuery] Diagnostics completed:', diagnostics)
      return diagnostics
    } catch (error) {
      console.error('[useStudentFeeMatrixQuery] Diagnostics error:', error)
      throw error
    }
  }, [])

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
    editMode,
    expandedStudents,
    expandedCategories,
    searchTerm,
    selectedGradeFilter,
    batchMode
  }

  return {
    // Data
    students: studentsQuery.data || [],
    fees: feesQuery.data || [],
    assignments: studentFeesQuery.data || [],
    
    // Computed values
    groupedFees,
    filteredStudents,
    
    // Loading states
    loading: isLoading,
    loadingState: isLoading ? 'loading' : 'idle',
    
    // Error states
    error: error ? (error as Error).message : null,
    isError,
    
    // Edit mode state
    editMode,
    localAssignments,
    
    // UI state
    expandedStudents,
    expandedCategories,
    searchTerm,
    selectedGradeFilter,
    batchMode,
    
    // Mutations
    saveAllAssignments: saveAllAssignmentsMutation.mutate,
    isSaving: saveAllAssignmentsMutation.isPending,
    
    // Actions
    refetch,
    invalidateQueries: queryClient.invalidateQueries,
    
    // Assignment operations
    assignFee,
    removeFee,
    isAssigned,
    getStudentAmount,
    getPaymentStatus,
    
    // Edit mode operations
    toggleEditMode,
    
    // UI operations
    toggleStudentExpansion,
    toggleCategoryExpansion,
    setSearchTerm,
    setSelectedGradeFilter,
    setBatchMode,
    
    // Debug
    runDiagnostics,
    
    // Raw queries for debugging
    studentsQuery,
    feesQuery,
    studentFeesQuery,
    
    // State object (for compatibility)
    state,
  }
}
