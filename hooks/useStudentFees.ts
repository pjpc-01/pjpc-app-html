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
  fee_items: FeeItem[];  // fee items as parsed array
  totalAmount: number;
  expand?: {
    students?: {
      id: string;
      name: string;
    };
  };
}

export function useStudentFees() {
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for editing - saved to PocketBase when edit mode is exited
  const [localFeeAssignments, setLocalFeeAssignments] = useState<Map<string, Set<string>>>(new Map());
  const [isEditMode, setIsEditMode] = useState(false);

  // Map: studentId → StudentFee record (for quick lookup)
  const [feeByStudentId, setFeeByStudentId] = useState<Map<string, StudentFee>>(new Map());

  const isMountedRef = useRef(true);
  const pbRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user, connectionStatus } = useAuth();
  const [pb, setPb] = useState<any>(null);

  const debugLog = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🔍 [StudentFees] [${timestamp}] ${message}`, data || '');
  }, []);

  // Initialize PocketBase instance when user is authenticated
  useEffect(() => {
    const initializePocketBase = async () => {
      if (user && connectionStatus === 'connected') {
        try {
          const pocketbaseInstance = await getPocketBase();
          pbRef.current = pocketbaseInstance;
          setPb(pocketbaseInstance);
          debugLog('✅ PocketBase instance initialized');
        } catch (error) {
          debugLog('❌ Failed to initialize PocketBase:', error);
        }
      }
    };
    initializePocketBase();
  }, [user, connectionStatus, debugLog]);

  // Safe JSON parser
  const safeParse = useCallback((data: any): FeeItem[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as FeeItem[];
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, []);

  // Load all student fee records
  const fetchStudentFees = useCallback(async () => {
    const pbInstance = pbRef.current;
    if (!pbInstance) return;

    setLoading(true);
    setError(null);

    try {
      const studentFeesData = await pbInstance.collection("student_fees").getFullList({
        expand: "students",
      });

      if (!isMountedRef.current) return;

      const processedData: StudentFee[] = studentFeesData.map((record: any) => ({
        id: record.id,
        students: record.students,
        fee_items: safeParse(record.fee_items),
        totalAmount: record.totalAmount || 0,
        expand: record.expand
      }));

      // Build lookup map: studentId → StudentFee record
      const lookupMap = new Map<string, StudentFee>();
      processedData.forEach(sf => {
        if (sf.students) {
          lookupMap.set(sf.students, sf);
        }
      });

      setStudentFees(processedData);
      setFeeByStudentId(lookupMap);
      debugLog(`✅ Loaded ${processedData.length} student fee records`);
    } catch (err: any) {
      debugLog('❌ Error fetching student fees:', err);
      if (isMountedRef.current) {
        setError(`Failed to fetch student fees: ${err.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pb, safeParse, debugLog]);

  // Check if a fee is assigned to a student
  const isAssigned = useCallback((studentId: string, feeId: string): boolean => {
    if (isEditMode) {
      // During edit mode, check local assignments
      const studentAssignments = localFeeAssignments.get(studentId);
      return studentAssignments ? studentAssignments.has(feeId) : false;
    } else {
      // View mode: check from PocketBase data by student ID
      const assignment = feeByStudentId.get(studentId);
      if (!assignment) return false;
      return assignment.fee_items.some((item: FeeItem) => item.id === feeId && item.active === true);
    }
  }, [feeByStudentId, localFeeAssignments, isEditMode]);

  // Get total amount of active fee items for a student
  const getStudentAmount = useCallback((studentId: string, allFees?: any[]): number => {
    if (isEditMode) {
      // During edit mode, calculate from local assignments
      const studentAssignments = localFeeAssignments.get(studentId);
      if (!studentAssignments || !allFees) return 0;
      return allFees
        .filter(fee => studentAssignments.has(fee.id))
        .reduce((total, fee) => total + (fee.amount || 0), 0);
    } else {
      // View mode: calculate from PocketBase data by student ID
      const assignment = feeByStudentId.get(studentId);
      if (!assignment) return 0;
      const activeItems = assignment.fee_items.filter((item: FeeItem) => item.active === true);
      return activeItems.reduce((total, item: FeeItem) => total + (item.amount || 0), 0);
    }
  }, [feeByStudentId, isEditMode, localFeeAssignments]);

  // Assign a fee to a student (local state only during edit mode)
  const assignFeeToStudent = useCallback(async (studentId: string, feeId: string) => {
    setLocalFeeAssignments(prev => {
      const newMap = new Map(prev);
      const studentAssignments = new Set(newMap.get(studentId) || []);
      studentAssignments.add(feeId);
      newMap.set(studentId, studentAssignments);
      return newMap;
    });
  }, []);

  // Remove a fee from a student (local state only during edit mode)
  const removeFeeFromStudent = useCallback(async (studentId: string, feeId: string) => {
    setLocalFeeAssignments(prev => {
      const newMap = new Map(prev);
      const studentAssignments = new Set(newMap.get(studentId) || []);
      studentAssignments.delete(feeId);
      newMap.set(studentId, studentAssignments);
      return newMap;
    });
  }, []);

  // Enter edit mode — initialize local assignments from PocketBase data
  const enterEditMode = useCallback(() => {
    debugLog('🔄 Entering edit mode');

    const initialAssignments = new Map<string, Set<string>>();

    // Initialize from existing PocketBase records
    feeByStudentId.forEach((studentFee, studentId) => {
      const feeIds = new Set<string>();
      if (studentFee.fee_items && Array.isArray(studentFee.fee_items)) {
        studentFee.fee_items.forEach((item: FeeItem) => {
          if (item.active === true) {
            feeIds.add(item.id);
          }
        });
      }
      // Always set the entry (even if empty) so we know this student was loaded
      initialAssignments.set(studentId, feeIds);
    });

    setLocalFeeAssignments(initialAssignments);
    setIsEditMode(true);
    debugLog(`🔄 Entered edit mode with ${initialAssignments.size} students initialized`);
  }, [feeByStudentId, debugLog]);

  // Save changes to PocketBase
  const saveChangesToPocketBase = useCallback(async () => {
    const pbInstance = pbRef.current;
    if (!pbInstance) {
      debugLog('⚠️ PocketBase not initialized, cannot save');
      return;
    }

    debugLog(`🔄 Saving changes to PocketBase, ${localFeeAssignments.size} students`);

    if (localFeeAssignments.size === 0) {
      debugLog('🔄 No local assignments to save');
      return;
    }

    try {
      // Get all fees to calculate amounts
      const allFees = await pbInstance.collection("fee_items").getFullList();
      debugLog(`🔄 Loaded ${allFees.length} fee items for calculation`);

      // Process each student's assignments
      for (const [studentId, feeIds] of localFeeAssignments) {
        // Calculate total amount from assigned fees
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

        debugLog(`🔄 Saving for student ID: ${studentId}, Total: ${totalAmount}, Items: ${feeItems.length}`);

        // Find existing record by student ID
        const existingRecord = feeByStudentId.get(studentId);

        if (existingRecord) {
          // Update existing record
          await pbInstance.collection("student_fees").update(existingRecord.id, {
            fee_items: JSON.stringify(feeItems),
            totalAmount: totalAmount
          });
          debugLog(`✅ Updated record for student: ${studentId}`);
        } else {
          // Create new record — use student ID directly for the relation field
          await pbInstance.collection("student_fees").create({
            students: studentId,
            student_id: studentId,
            fee_items: JSON.stringify(feeItems),
            totalAmount: totalAmount,
            status: 'pending',
            assigned_at: new Date().toISOString()
          });
          debugLog(`✅ Created new record for student: ${studentId}`);
        }
      }

      debugLog('✅ Successfully saved all changes to PocketBase');

      // Wait briefly before refreshing
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!isMountedRef.current) return;

      // Refresh data from PocketBase
      await fetchStudentFees();
      debugLog('📊 Data refresh completed');
    } catch (error) {
      debugLog('❌ Error during saveChangesToPocketBase:', error);
      throw error;
    }
  }, [pb, localFeeAssignments, feeByStudentId, fetchStudentFees, debugLog]);

  // Exit edit mode and save changes
  const exitEditMode = useCallback(async () => {
    debugLog('🔄 Exiting edit mode and saving changes');

    try {
      // Save changes to PocketBase first
      await saveChangesToPocketBase();

      // Exit edit mode after save succeeds
      setIsEditMode(false);
      setLocalFeeAssignments(new Map());
      debugLog('✅ Successfully exited edit mode');
    } catch (error) {
      debugLog('❌ Error during exitEditMode:', error);
      // Still exit edit mode even if save fails
      setIsEditMode(false);
      setLocalFeeAssignments(new Map());
    }
  }, [debugLog, saveChangesToPocketBase]);

  // Load data on mount and when PocketBase is ready
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      // Use ref to get latest pb instance (avoids stale closure in retry)
      const pbInstance = pbRef.current;
      if (!pbInstance) {
        debugLog('⚠️ PocketBase not initialized yet, waiting...');
        return;
      }

      if (!pbInstance.authStore.isValid) {
        debugLog('⚠️ Auth not ready, waiting...');
        return;
      }

      debugLog('✅ Auth ready, starting data fetch');

      try {
        const studentFeesData = await pbInstance.collection("student_fees").getFullList({
          expand: "students",
        });

        if (cancelled) return;

        const processedData: StudentFee[] = studentFeesData.map((record: any) => ({
          id: record.id,
          students: record.students,
          fee_items: safeParse(record.fee_items),
          totalAmount: record.totalAmount || 0,
          expand: record.expand
        }));

        // Build lookup map
        const lookupMap = new Map<string, StudentFee>();
        processedData.forEach(sf => {
          if (sf.students) {
            lookupMap.set(sf.students, sf);
          }
        });

        if (!cancelled) {
          setStudentFees(processedData);
          setFeeByStudentId(lookupMap);
          setLoading(false);
          setError(null);
          debugLog(`✅ Loaded ${processedData.length} student fee records`);
        }
      } catch (err: any) {
        if (!cancelled) {
          debugLog('❌ Error during fetch:', err);
          setError(`Failed to fetch student fees: ${err.message}`);
          setLoading(false);
        }
      }
    }

    setLoading(true);
    setError(null);
    fetchData();

    return () => {
      cancelled = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [pb, safeParse, debugLog]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    studentFees,
    loading,
    error,
    fetchStudentFees,
    upsertStudentFee: saveChangesToPocketBase,
    updateStudentFee: saveChangesToPocketBase,
    createStudentFee: saveChangesToPocketBase,
    deleteStudentFee: () => {},
    isAssigned,
    getStudentAmount,
    calculateStudentTotal: (studentId: string) => getStudentAmount(studentId),
    assignFeeToStudent,
    removeFeeFromStudent,
    isEditMode,
    enterEditMode,
    exitEditMode,
  };
}
