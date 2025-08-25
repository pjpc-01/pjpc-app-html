import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/pocketbase-auth-context";
import { getPocketBase } from "@/lib/pocketbase";

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  active: boolean;
}

export interface StudentFee {
  id: string;
  students: string;      // student id (relation)
  fee_items: FeeItem[];  // fee items as parsed array (not raw JSON)
  totalAmount: number;   // 🔧 Fixed: PocketBase field is named 'totalAmount', not 'amount'
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
  
  // State to store student name mapping for amount lookup
  const [studentNameMapping, setStudentNameMapping] = useState<Map<string, string>>(new Map());
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Separate abort controller for student name mapping
  const mappingAbortControllerRef = useRef<AbortController | null>(null);
  const mappingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔹 Get authenticated PocketBase instance
  const { user, connectionStatus } = useAuth();
  const [pb, setPb] = useState<any>(null);

  // 🔹 Enhanced debugging: Track component lifecycle
  const componentIdRef = useRef(`StudentFees_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const debugLog = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🔍 [${componentIdRef.current}] [${timestamp}] ${message}`, data || '');
  }, []);

  // 🔹 Initialize PocketBase instance when user is authenticated
  useEffect(() => {
    const initializePocketBase = async () => {
      if (user && connectionStatus === 'connected') {
        try {
          const pocketbaseInstance = await getPocketBase();
          setPb(pocketbaseInstance);
          debugLog('✅ PocketBase instance initialized with authentication');
        } catch (error) {
          debugLog('❌ Failed to initialize PocketBase:', error);
        }
      } else {
        debugLog('⚠️ User not authenticated or connection not ready:', { user: !!user, connectionStatus });
      }
    };

    initializePocketBase();
  }, [user, connectionStatus, debugLog]);

  // 🔹 Safe JSON parser helper
  const safeParse = useCallback((data: any): FeeItem[] => {
    debugLog('🔧 [safeParse] Input data:', data);
    
    if (!data) {
      debugLog('🔧 [safeParse] No data, returning empty array');
      return [];
    }
    
    // If it's already an array, return it
    if (Array.isArray(data)) {
      debugLog('🔧 [safeParse] Data is already an array');
      return data as FeeItem[];
    }
    
    // If it's a string, try to parse it
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        debugLog('🔧 [safeParse] Successfully parsed string:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.error('❌ [safeParse] Failed to parse JSON string:', parseError);
        return [];
      }
    }
    
    // If it's an object but not an array, try to convert
    if (typeof data === 'object') {
      debugLog('🔧 [safeParse] Data is object, converting to array');
      return Array.isArray(data) ? data : [];
    }
    
    debugLog('🔧 [safeParse] Unknown data type, returning empty array');
    return [];
  }, [debugLog]);

  // Safe state setter to prevent updates on unmounted component
  const safeSetState = useCallback((updater: (prev: StudentFee[]) => StudentFee[]) => {
    if (isMountedRef.current) {
      setStudentFees(updater);
    } else {
      debugLog('🔄 Component unmounted, skipping state update');
    }
  }, [debugLog]);

  // 🔹 Enhanced: Load student name mapping with better error handling
  const loadStudentNameMapping = useCallback(async () => {
    debugLog('🔄 loadStudentNameMapping called');
    
    try {
      debugLog('🔄 Making PocketBase request for students...');
      const studentsCard = await pb.collection("students").getFullList();
      
      const mapping = new Map<string, string>();
      studentsCard.forEach((card: any) => {
        if (card.id && card.studentName) {
          mapping.set(card.id, card.studentName);
        }
      });
      
      debugLog('✅ Loaded student name mapping:', {
        totalStudents: studentsCard.length,
        mappedStudents: mapping.size,
        sampleMappings: Array.from(mapping.entries()).slice(0, 3)
      });
      
      setStudentNameMapping(mapping);
      
      // Return the mapping for immediate use
      return mapping;
    } catch (err: any) {
      debugLog('❌ Error loading student name mapping:', err);
      return new Map();
    }
  }, [pb, debugLog]);

  // 🔹 Enhanced: Load all student fee records with better error handling
  const fetchStudentFees = useCallback(async () => {
    if (!pb) {
      debugLog('⚠️ PocketBase not initialized, skipping fetch');
      return;
    }

    debugLog('🔄 fetchStudentFees called');
    
    // Check if student name mapping is available
    if (studentNameMapping.size === 0) {
      debugLog('⚠️ No student name mapping available, attempting to load mapping first');
      const mapping = await loadStudentNameMapping();
      if (mapping.size === 0) {
        debugLog('❌ Still no mapping available after load attempt, skipping fetch');
        return;
      }
    }
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      debugLog('🔄 Cancelling previous fetch request');
      abortControllerRef.current.abort();
    }
    
    // Check if component is still mounted
    if (!isMountedRef.current) {
      debugLog('🔄 Component unmounted, skipping fetch');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    abortControllerRef.current = new AbortController();
    
    try {
      debugLog('🔄 Making PocketBase request for student_fees...');
      
      const studentFeesData = await pb.collection("student_fees").getFullList({
        expand: "students",
        signal: abortControllerRef.current.signal,
      });
      
      if (!isMountedRef.current) {
        debugLog('🔄 Component unmounted during fetch, skipping state update');
        return;
      }
      
      debugLog('✅ Successfully fetched student_fees data:', {
        count: studentFeesData.length,
        sample: studentFeesData.slice(0, 2).map((sf: any) => ({
          id: sf.id,
          studentName: sf.expand?.students?.student_name,
          feeItemsCount: sf.fee_items?.length || 0,
          totalAmount: sf.totalAmount
        }))
      });
      
      // Process the data
      const processedData = studentFeesData.map((record: any) => ({
        id: record.id,
        students: record.students,
        fee_items: safeParse(record.fee_items),
        totalAmount: record.totalAmount || 0,
        expand: record.expand
      }));
      
      safeSetState(() => processedData);
      debugLog('✅ Processed and set student fees data');
      
    } catch (err: any) {
      debugLog('❌ Error caught in fetchStudentFees:', err);
      
      // Don't set error if request was cancelled or component unmounted
      if (err.name === 'AbortError' || err.message?.includes('autocancelled')) {
        debugLog('🔄 Fetch request was cancelled - ignoring error');
        return;
      }
      
      if (isMountedRef.current) {
        setError(`Failed to fetch student fees: ${err.message}`);
        debugLog('❌ Set error state:', err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pb, studentNameMapping, safeSetState, safeParse, debugLog, loadStudentNameMapping]);

  // 🔹 Enhanced: Check if a fee is assigned to a student
  const isAssigned = useCallback((studentCardId: string, feeId: string): boolean => {
    debugLog(`🔍 [isAssigned] Checking assignment - Student ID: ${studentCardId}, Fee ID: ${feeId}, Edit Mode: ${isEditMode}`);
    
    if (isEditMode) {
      // During edit mode, check local assignments
      const studentAssignments = localFeeAssignments.get(studentCardId);
      const isAssignedLocally = studentAssignments ? studentAssignments.has(feeId) : false;
      debugLog(`🔍 [isAssigned] Edit mode - Student: ${studentCardId}, Fee: ${feeId}, Result: ${isAssignedLocally}`);
      return isAssignedLocally;
    } else {
      // Get the student name from the mapping
      const studentName = studentNameMapping.get(studentCardId);
      
      if (!studentName) {
        debugLog(`🔍 [isAssigned] View mode - No student name mapping found for ID: ${studentCardId}`);
        debugLog(`🔍 [isAssigned] Available mappings:`, Array.from(studentNameMapping.entries()).slice(0, 3));
        debugLog(`🔍 [isAssigned] Mapping size: ${studentNameMapping.size}`);
        return false;
      }
      
      // Find the student_fees record by student name (not by ID)
      const assignment = studentFees.find(sf => 
        sf.expand?.students?.student_name === studentName
      );
      
      if (!assignment) {
        debugLog(`🔍 [isAssigned] View mode - No student_fees record found for student: ${studentName}`);
        return false;
      }
      
      // Check if the fee is active in the fee_items array
      const isFeeActive = assignment.fee_items && 
        Array.isArray(assignment.fee_items) &&
        assignment.fee_items.some((item: FeeItem) => item.id === feeId && item.active === true);
      
      debugLog(`🔍 [isAssigned] View mode - Student: ${studentName}, Fee: ${feeId}, Assignment found: ${!!assignment}, Fee active: ${isFeeActive}`);
      debugLog(`🔍 [isAssigned] View mode - Available fee items:`, assignment.fee_items);
      
      return isFeeActive;
    }
  }, [studentFees, localFeeAssignments, isEditMode, studentNameMapping, debugLog]);

  // 🔹 Enhanced: Calculate and get the total amount of active fee items for a student
  const getStudentAmount = useCallback((studentCardId: string, allFees?: any[]): number => {
    debugLog(`📋 [getStudentAmount] Called - Student ID: ${studentCardId}, Edit Mode: ${isEditMode}`);
    
    if (isEditMode) {
      // During edit mode, calculate from local assignments
      const studentAssignments = localFeeAssignments.get(studentCardId);
      if (!studentAssignments || !allFees) {
        debugLog(`📋 [getStudentAmount] Edit mode - No assignments or fees, returning 0`);
        return 0;
      }
      
      // Calculate total from assigned fees
      const totalAmount = allFees
        .filter(fee => studentAssignments.has(fee.id))
        .reduce((total, fee) => total + (fee.amount || 0), 0);
      
      debugLog(`📋 [getStudentAmount] Edit mode - Student ID: ${studentCardId}, Calculated total: ${totalAmount}`);
      return totalAmount;
    } else {
      // Get the student name from the mapping
      const studentName = studentNameMapping.get(studentCardId);
      
      if (!studentName) {
        debugLog(`📋 [getStudentAmount] No student name mapping found for ID: ${studentCardId}`);
        debugLog(`📋 [getStudentAmount] Available mappings:`, Array.from(studentNameMapping.entries()).slice(0, 3));
        debugLog(`📋 [getStudentAmount] Mapping size: ${studentNameMapping.size}`);
        return 0;
      }
      
      // Find the student_fees record by student name
      const assignment = studentFees.find(sf => 
        sf.expand?.students?.student_name === studentName
      );
      
      if (!assignment) {
        debugLog(`📋 [getStudentAmount] No student_fees record found for: ${studentName}`);
        debugLog(`📋 [getStudentAmount] Available student_fees records:`, studentFees.map(sf => ({
          id: sf.id,
          studentName: sf.expand?.students?.student_name,
          totalAmount: sf.totalAmount,
          feeItemsCount: sf.fee_items?.length || 0
        })));
        return 0;
      }
      
      debugLog(`📋 [getStudentAmount] Found assignment for student: ${studentName}`);
      debugLog(`📋 [getStudentAmount] Assignment fee items:`, assignment.fee_items);
      
      // Calculate total from active fee items
      const activeItems = assignment.fee_items.filter((item: FeeItem) => item.active === true);
      const totalAmount = activeItems.reduce((total, item: FeeItem) => total + (item.amount || 0), 0);
      
      debugLog(`📋 [getStudentAmount] View mode - Student: ${studentName}, Active items: ${activeItems.length}, Total: ${totalAmount}`);
      debugLog(`📋 [getStudentAmount] PocketBase stored amount: ${assignment.totalAmount}`);
      
      // If PocketBase amount is undefined, use calculated amount
      if (assignment.totalAmount === undefined || assignment.totalAmount === null) {
        debugLog(`📋 [getStudentAmount] Using calculated amount since PocketBase amount is undefined`);
        return totalAmount;
      }
      
      return totalAmount;
    }
  }, [studentFees, isEditMode, studentNameMapping, localFeeAssignments, debugLog]);

  // 🔹 Calculate total amount for a student (legacy - now uses getStudentAmount)
  const calculateStudentTotal = useCallback((studentId: string, fees: any[]): number => {
    return getStudentAmount(studentId);
  }, [getStudentAmount]);

  // 🔹 Enhanced: Assign a fee to a student (local state only during edit mode)
  const assignFeeToStudent = useCallback(async (studentId: string, feeId: string) => {
    debugLog(`🔄 Assigning fee to student (local): ${studentId}, ${feeId}`);
    
    setLocalFeeAssignments(prev => {
      const newMap = new Map(prev);
      const studentAssignments = new Set(newMap.get(studentId) || []);
      studentAssignments.add(feeId);
      newMap.set(studentId, studentAssignments);
      return newMap;
    });
  }, [debugLog]);

  // 🔹 Enhanced: Remove a fee from a student (local state only during edit mode)
  const removeFeeFromStudent = useCallback(async (studentId: string, feeId: string) => {
    debugLog(`🔄 Removing fee from student (local): ${studentId}, ${feeId}`);
    
    setLocalFeeAssignments(prev => {
      const newMap = new Map(prev);
      const studentAssignments = new Set(newMap.get(studentId) || []);
      studentAssignments.delete(feeId);
      newMap.set(studentId, studentAssignments);
      return newMap;
    });
  }, [debugLog]);

  // 🔹 Enhanced: Enter edit mode
  const enterEditMode = useCallback(() => {
    debugLog(`🔄 Entering edit mode`);
    
    // Initialize local assignments with current data from PocketBase
    const initialAssignments = new Map<string, Set<string>>();
    
    studentFees.forEach(studentFee => {
      const studentName = studentFee.expand?.students?.student_name;
      if (studentName) {
        // Find the student card ID for this student name
        for (const [cardId, name] of studentNameMapping.entries()) {
          if (name === studentName) {
            const feeIds = new Set<string>();
            
            // Add all active fee items to the set
            if (studentFee.fee_items && Array.isArray(studentFee.fee_items)) {
              studentFee.fee_items.forEach((item: FeeItem) => {
                if (item.active === true) {
                  feeIds.add(item.id);
                }
              });
            }
            
            if (feeIds.size > 0) {
              initialAssignments.set(cardId, feeIds);
              debugLog(`🔄 Initialized local assignments for ${studentName}: ${Array.from(feeIds).join(', ')}`);
            }
            break;
          }
        }
      }
    });
    
    setLocalFeeAssignments(initialAssignments);
    setIsEditMode(true);
    debugLog(`🔄 Entered edit mode with ${initialAssignments.size} students having assignments`);
  }, [studentFees, studentNameMapping, debugLog]);

  // 🔹 Enhanced: Save changes to PocketBase
  const saveChangesToPocketBase = useCallback(async () => {
    if (!pb) {
      debugLog('⚠️ PocketBase not initialized, cannot save changes');
      return;
    }

    debugLog(`🔄 Saving changes to PocketBase`);
    
    if (localFeeAssignments.size === 0) {
      debugLog(`🔄 No local assignments to save`);
      return;
    }
    
    // Get all fees to calculate amounts
    try {
      const allFees = await pb.collection("fees_items").getFullList();
      debugLog(`🔄 Loaded ${allFees.length} fee items for calculation`);
      
      // Process each student's assignments
      for (const [studentCardId, feeIds] of localFeeAssignments) {
        const studentName = studentNameMapping.get(studentCardId);
        if (!studentName) {
          debugLog(`⚠️ No student name found for ID: ${studentCardId}, skipping`);
          continue;
        }
        
        // Calculate total amount
        const totalAmount = allFees
          .filter((fee: any) => feeIds.has(fee.id))
          .reduce((total: number, fee: any) => total + (fee.amount || 0), 0);
        
        // Create fee items array
        const feeItems = allFees
          .filter((fee: any) => feeIds.has(fee.id))
          .map((fee: any) => ({
            id: fee.id,
            name: fee.name,
            amount: fee.amount,
            active: true
          }));
        
        debugLog(`🔄 Saving for student: ${studentName}, Total: ${totalAmount}, Items: ${feeItems.length}`);
        
        // Find existing record or create new one
        const existingRecord = studentFees.find(sf => 
          sf.expand?.students?.student_name === studentName
        );
        
        if (existingRecord) {
          // Update existing record
          await pb.collection("student_fees").update(existingRecord.id, {
            fee_items: JSON.stringify(feeItems),
            totalAmount: totalAmount
          });
          debugLog(`✅ Updated existing record for: ${studentName}`);
        } else {
          // Create new record
          const studentRecord = await pb.collection("students").getFirstListItem(`student_name = "${studentName}"`);
          await pb.collection("student_fees").create({
            students: studentRecord.id,
            fee_items: JSON.stringify(feeItems),
            totalAmount: totalAmount
          });
          debugLog(`✅ Created new record for: ${studentName}`);
        }
      }
      
      debugLog(`✅ Successfully saved all changes to PocketBase`);
      
      // Wait a bit before refreshing data
      debugLog(`🔄 Waiting before refreshing data...`);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Final check before refresh
      if (!isMountedRef.current) {
        debugLog(`🔄 Component unmounted during wait, skipping refresh`);
        return;
      }
      
      // Refresh data from PocketBase after saving
      debugLog(`🔄 Refreshing data from PocketBase`);
      await fetchStudentFees();
      
      debugLog(`📊 Data refresh completed`);
    } catch (error) {
      debugLog(`❌ Error during saveChangesToPocketBase:`, error);
      throw error;
    }
  }, [pb, localFeeAssignments, studentNameMapping, studentFees, fetchStudentFees, debugLog]);

  // 🔹 Enhanced: Exit edit mode and save changes
  const exitEditMode = useCallback(async () => {
    debugLog(`🔄 Exiting edit mode and saving changes`);
    
    try {
      // Save changes to PocketBase
      await saveChangesToPocketBase();
      
      // Exit edit mode
      setIsEditMode(false);
      
      // Clear local assignments
      setLocalFeeAssignments(new Map());
      
      debugLog(`✅ Successfully exited edit mode`);
    } catch (error) {
      debugLog(`❌ Error during exitEditMode:`, error);
      // Still exit edit mode even if save fails
      setIsEditMode(false);
      setLocalFeeAssignments(new Map());
    }
  }, [debugLog, saveChangesToPocketBase]);

  // 🔹 Enhanced: Load data on mount with better error handling
  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      if (!pb) {
        debugLog(`⚠️ PocketBase not initialized, retrying in 500ms...`);
        setTimeout(fetchData, 500);
        return;
      }
      
      if (!pb.authStore.isValid) {
        debugLog(`⚠️ Auth not ready, retrying in 500ms...`);
        setTimeout(fetchData, 500);
        return;
      }
      
      debugLog(`✅ Auth ready, starting data fetch`);
      
      try {
        // Load student name mapping first
        const mapping = await loadStudentNameMapping();
        
        if (cancelled) {
          debugLog(`🔄 Request cancelled during mapping load`);
          return;
        }
        
        // Fetch student fees data
        debugLog(`🔄 Making PocketBase request for student_fees...`);
        const studentFeesData = await pb.collection("student_fees").getFullList({
          expand: "students",
        });
        
        if (cancelled) {
          debugLog(`🔄 Request cancelled during fetch`);
          return;
        }
        
        debugLog(`✅ Successfully fetched student_fees data:`, {
          count: studentFeesData.length,
          sample: studentFeesData.slice(0, 2).map((sf: any) => ({
            id: sf.id,
            studentName: sf.expand?.students?.student_name,
            feeItemsCount: sf.fee_items?.length || 0,
            totalAmount: sf.totalAmount
          }))
        });
        
        // Process the data
        const processedData = studentFeesData.map((record: any) => ({
          id: record.id,
          students: record.students,
          fee_items: safeParse(record.fee_items),
          totalAmount: record.totalAmount || 0,
          expand: record.expand
        }));
        
        if (!cancelled) {
          setStudentFees(processedData);
          setLoading(false);
          setError(null);
          debugLog(`✅ Processed and set student fees data`);
        }
        
      } catch (err: any) {
        if (!cancelled) {
          debugLog(`❌ Error during fetch:`, err);
          setError(`Failed to fetch student fees: ${err.message}`);
          setLoading(false);
        }
      }
    }
    
    setLoading(true);
    setError(null);
    fetchData();
    
    return () => {
      debugLog(`🔄 Component unmounting - cancelling fetch`);
      cancelled = true;
      isMountedRef.current = false;
    };
  }, [pb?.authStore.isValid, loadStudentNameMapping, safeParse, debugLog]); // Only depend on auth state

  // 🔹 Enhanced: Cleanup on unmount
  useEffect(() => {
    return () => {
      debugLog(`🔄 Component unmounting - cleaning up`);
      isMountedRef.current = false;
      
      // Cleanup fetch timeouts and abort controllers
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cleanup mapping timeouts and abort controllers
      if (mappingTimeoutRef.current) {
        clearTimeout(mappingTimeoutRef.current);
      }
      if (mappingAbortControllerRef.current) {
        mappingAbortControllerRef.current.abort();
      }
    };
  }, [debugLog]);

  return {
    studentFees,
    loading,
    error,
    fetchStudentFees,
    upsertStudentFee: saveChangesToPocketBase,  // 🔹 New update-or-create function
    updateStudentFee: saveChangesToPocketBase,  // Legacy
    createStudentFee: saveChangesToPocketBase,  // Legacy
    deleteStudentFee: () => {}, // TODO: Implement if needed
    isAssigned,
    getStudentAmount,  // 🔹 New function to get actual amount from PocketBase
    calculateStudentTotal,  // Legacy - now uses getStudentAmount
    assignFeeToStudent,
    removeFeeFromStudent,
    isEditMode,
    enterEditMode,
    exitEditMode,
  };
} 