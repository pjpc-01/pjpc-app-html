import { useState, useCallback, useEffect, useRef } from "react";
import { pb } from "@/lib/pocketbase";

export interface StudentFee {
  id: string;
  students: string;      // student id (relation)
  fee_items: any;        // fee items as JSON (only active items)
  amount: number;
  expand?: {
    students?: {
      id: string;
      student_name: string;
    };
  };
}

export function useStudentFees() {
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for editing - this won't be saved to PocketBase until edit mode is exited
  const [localFeeAssignments, setLocalFeeAssignments] = useState<Map<string, Set<string>>>(new Map());
  const [isEditMode, setIsEditMode] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe state setter to prevent updates on unmounted component
  const safeSetState = useCallback((updater: (prev: StudentFee[]) => StudentFee[]) => {
    if (isMountedRef.current) {
      setStudentFees(updater);
    }
  }, []);

  // 🔹 Load all student fee records
  const fetchStudentFees = useCallback(async () => {
    console.log('🔄 [StudentFees] fetchStudentFees called');
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      console.log('🔄 [StudentFees] Cancelling previous request');
      abortControllerRef.current.abort();
    }
    
    // Add a small delay to prevent rapid successive calls
    fetchTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) {
        console.log('🔄 [StudentFees] Component unmounted, skipping fetch');
        return;
      }
      
      abortControllerRef.current = new AbortController();
      
      console.log('🔄 [StudentFees] Starting fetch with signal:', abortControllerRef.current.signal);
      
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      try {
        console.log('🔄 [StudentFees] Making PocketBase request...');
        const records = await pb.collection("student_fees").getFullList<StudentFee>({
          sort: "-updated",
          expand: "students",   // 🔑 expand related data
          fields: "id,students,fee_items,amount,updated,expand",
          signal: abortControllerRef.current.signal,
        });
        
        console.log('✅ [StudentFees] Successfully fetched', records.length, 'records');
        console.log('📊 [StudentFees] Records from PocketBase:', records);
        
        if (isMountedRef.current) {
          setStudentFees(records);
          
          // Initialize local assignments from PocketBase data
          const initialAssignments = new Map<string, Set<string>>();
          
          // Process existing records from PocketBase
          records.forEach(record => {
            console.log('📊 [StudentFees] Processing record for student:', record.students);
            console.log('📊 [StudentFees] Fee items:', record.fee_items);
            
            if (record.fee_items && Array.isArray(record.fee_items)) {
              const activeFees = new Set<string>();
              record.fee_items.forEach((item: any) => {
                if (item.active === true) {
                  activeFees.add(item.id);
                  console.log('✅ [StudentFees] Added active fee:', item.id, 'for student:', record.students);
                }
              });
              initialAssignments.set(record.students, activeFees);
            }
          });
          
          // Preserve any existing local assignments for students not in PocketBase
          // This prevents losing changes for students who haven't been saved yet
          if (isEditMode) {
            localFeeAssignments.forEach((assignedFees, studentId) => {
              if (!initialAssignments.has(studentId)) {
                console.log('📊 [StudentFees] Preserving local assignments for student:', studentId);
                initialAssignments.set(studentId, new Set(assignedFees));
              }
            });
          }
          
          console.log('📊 [StudentFees] Final initial assignments:', initialAssignments);
          setLocalFeeAssignments(initialAssignments);
        }
      } catch (err: any) {
        console.log('❌ [StudentFees] Error caught:', err);
        
        // Don't set error if request was cancelled or component unmounted
        if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
          console.log('🔄 [StudentFees] Request was cancelled - ignoring error');
          return;
        }
        
        console.error("❌ Failed to fetch student fees:", err);
        if (isMountedRef.current) {
          setError(err.message || "Failed to fetch student fees");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, 100); // 100ms delay
  }, []);

  // 🔹 Update a student fee record
  const updateStudentFee = useCallback(async (id: string, data: Partial<StudentFee>) => {
    try {
      console.log('🔄 [StudentFees] Updating student fee:', id, data);
      const record = await pb.collection("student_fees").update<StudentFee>(id, data);
      
      safeSetState(prev => prev.map(sf => 
        sf.id === id ? { ...sf, ...record } : sf
      ));
      
      console.log('✅ [StudentFees] Successfully updated student fee');
      return record;
    } catch (err: any) {
      console.error("❌ Failed to update student fee:", err);
      throw err;
    }
  }, [safeSetState]);

  // 🔹 Create a new student fee record
  const createStudentFee = useCallback(async (data: Partial<StudentFee>) => {
    try {
      console.log('🔄 [StudentFees] Creating student fee:', data);
      const record = await pb.collection("student_fees").create<StudentFee>(data);
      
      safeSetState(prev => [...prev, record]);
      
      console.log('✅ [StudentFees] Successfully created student fee');
      return record;
    } catch (err: any) {
      console.error("❌ Failed to create student fee:", err);
      throw err;
    }
  }, [safeSetState]);

  // 🔹 Delete a student fee record
  const deleteStudentFee = useCallback(async (id: string) => {
    try {
      console.log('🔄 [StudentFees] Deleting student fee:', id);
      await pb.collection("student_fees").delete(id);
      
      safeSetState(prev => prev.filter(sf => sf.id !== id));
      
      console.log('✅ [StudentFees] Successfully deleted student fee');
    } catch (err: any) {
      console.error("❌ Failed to delete student fee:", err);
      throw err;
    }
  }, [safeSetState]);

  // 🔹 Check if a fee is assigned to a student (uses local state during edit mode)
  const isAssigned = useCallback((studentId: string, feeId: string): boolean => {
    if (isEditMode) {
      // Use local state during edit mode
      const studentAssignments = localFeeAssignments.get(studentId);
      const result = studentAssignments ? studentAssignments.has(feeId) : false;
      console.log(`🔍 [isAssigned] Edit mode - Student: ${studentId}, Fee: ${feeId}, Result: ${result}`);
      return result;
    } else {
      // Use PocketBase data when not in edit mode
      const assignment = studentFees.find(sf => 
        sf.students === studentId && 
        sf.fee_items && 
        Array.isArray(sf.fee_items) &&
        sf.fee_items.some((item: any) => item.id === feeId && item.active === true)
      );
      const result = !!assignment;
      console.log(`🔍 [isAssigned] View mode - Student: ${studentId}, Fee: ${feeId}, Result: ${result}`);
      return result;
    }
  }, [studentFees, localFeeAssignments, isEditMode]);

  // 🔹 Calculate total amount for a student (uses local state during edit mode)
  const calculateStudentTotal = useCallback((studentId: string, fees: any[]): number => {
    if (isEditMode) {
      // Use local state during edit mode
      const studentAssignments = localFeeAssignments.get(studentId);
      if (!studentAssignments) return 0;
      
      return fees
        .filter(fee => studentAssignments.has(fee.id))
        .reduce((total, fee) => total + (fee.amount || 0), 0);
    } else {
      // Use PocketBase data when not in edit mode
      const assignment = studentFees.find(sf => sf.students === studentId);
      if (!assignment || !assignment.fee_items || !Array.isArray(assignment.fee_items)) {
        return 0;
      }
      
      return assignment.fee_items
        .filter((item: any) => item.active === true)
        .reduce((total, item: any) => total + (item.amount || 0), 0);
    }
  }, [studentFees, localFeeAssignments, isEditMode]);

  // 🔹 Assign a fee to a student (local state only during edit mode)
  const assignFeeToStudent = useCallback(async (studentId: string, feeId: string) => {
    console.log('🔄 [StudentFees] Assigning fee to student (local):', { studentId, feeId });
    
    setLocalFeeAssignments(prev => {
      const newMap = new Map(prev);
      const studentAssignments = new Set(newMap.get(studentId) || []);
      studentAssignments.add(feeId);
      newMap.set(studentId, studentAssignments);
      return newMap;
    });
  }, []);

  // 🔹 Remove a fee assignment from a student (local state only during edit mode)
  const removeFeeFromStudent = useCallback(async (studentId: string, feeId: string) => {
    console.log('🔄 [StudentFees] Removing fee from student (local):', { studentId, feeId });
    
    setLocalFeeAssignments(prev => {
      const newMap = new Map(prev);
      const studentAssignments = new Set(newMap.get(studentId) || []);
      studentAssignments.delete(feeId);
      newMap.set(studentId, studentAssignments);
      return newMap;
    });
  }, []);

  // 🔹 Save all local changes to PocketBase
  const saveChangesToPocketBase = useCallback(async () => {
    console.log('🔄 [StudentFees] Saving changes to PocketBase...');
    console.log('📊 [StudentFees] Local assignments to save:', localFeeAssignments);
    
    try {
      // Get all fees to calculate amounts
      const allFees = await pb.collection("fees_items").getFullList();
      
      // Process each student's assignments
      for (const [studentId, assignedFeeIds] of localFeeAssignments) {
        console.log('📊 [StudentFees] Processing student:', studentId, 'with fees:', Array.from(assignedFeeIds));
        
        const activeFees = allFees.filter(fee => assignedFeeIds.has(fee.id));
        const totalAmount = activeFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
        
        // Create fee_items array with only active items
        const feeItems = activeFees.map(fee => ({
          id: fee.id,
          name: fee.name,
          amount: fee.amount || 0,
          active: true
        }));
        
        console.log('📊 [StudentFees] Fee items to save:', feeItems);
        console.log('📊 [StudentFees] Total amount:', totalAmount);
        
        // Check if student already has a record
        const existingAssignment = studentFees.find(sf => sf.students === studentId);
        
        if (existingAssignment) {
          console.log('📊 [StudentFees] Updating existing record for student:', studentId);
          // Update existing record
          await updateStudentFee(existingAssignment.id, {
            fee_items: feeItems,
            amount: totalAmount
          });
        } else {
          console.log('📊 [StudentFees] Creating new record for student:', studentId);
          // Create new record
          await createStudentFee({
            students: studentId,
            fee_items: feeItems,
            amount: totalAmount
          });
        }
      }
      
      console.log('✅ [StudentFees] Successfully saved all changes to PocketBase');
    } catch (err: any) {
      console.error("❌ Failed to save changes to PocketBase:", err);
      throw err;
    }
  }, [localFeeAssignments, studentFees, updateStudentFee, createStudentFee]);

  // 🔹 Enter edit mode
  const enterEditMode = useCallback(() => {
    console.log('🔄 [StudentFees] Entering edit mode');
    setIsEditMode(true);
  }, []);

  // 🔹 Exit edit mode and save changes
  const exitEditMode = useCallback(async () => {
    console.log('🔄 [StudentFees] Exiting edit mode and saving changes');
    console.log('📊 [StudentFees] Current local assignments before save:', localFeeAssignments);
    
    setIsEditMode(false);
    await saveChangesToPocketBase();
    
    // Refresh data from PocketBase after saving
    console.log('🔄 [StudentFees] Refreshing data from PocketBase');
    await fetchStudentFees();
    
    console.log('📊 [StudentFees] Data refresh completed');
  }, [saveChangesToPocketBase, fetchStudentFees, localFeeAssignments]);

  // load on mount
  useEffect(() => {
    console.log('🔄 [StudentFees] useEffect triggered - fetching data');
    fetchStudentFees();
  }, [fetchStudentFees]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🔄 [StudentFees] Component unmounting - cleaning up');
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    studentFees,
    loading,
    error,
    fetchStudentFees,
    updateStudentFee,
    createStudentFee,
    deleteStudentFee,
    isAssigned,
    calculateStudentTotal,
    assignFeeToStudent,
    removeFeeFromStudent,
    isEditMode,
    enterEditMode,
    exitEditMode,
  };
} 