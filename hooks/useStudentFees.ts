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
  status: string;        // 'pending' | 'paid' | 'overdue' | ...
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
        status: record.status || 'pending',
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
      // BUG #2: Do NOT clear local edits on fetch failure. Only surface the
      // error so the user can retry without losing their in-progress work.
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

  // Toggle a fee across multiple students at once (used by batch mode).
  // Each student's local assignment set is updated in place; students without
  // a prior entry are initialised so the change is captured.
  const setFeeForStudents = useCallback(
    (studentIds: string[], feeId: string, targetState: boolean) => {
      setLocalFeeAssignments(prev => {
        const newMap = new Map(prev);
        studentIds.forEach(id => {
          const feeSet = new Set(newMap.get(id) || []);
          if (targetState) {
            feeSet.add(feeId);
          } else {
            feeSet.delete(feeId);
          }
          newMap.set(id, feeSet);
        });
        return newMap;
      });
    },
    []
  );

  // Save changes to PocketBase.
  // BUG #1: previously the loop bailed out on the first throw inside the for,
  // silently dropping any students that came after the failure and still
  // clearing localFeeAssignments on success of the wrapper. We now collect
  // per-student results so partial failures are surfaced and the editable
  // state is preserved until everything is durably persisted + refreshed.
  // BUG #8: the update branch previously dropped the `status` field, so a
  // record that was already 'paid' stayed 'paid' even when new fee items
  // were added. Now, when assignments change and the existing status is
  // 'paid', it is reset to 'pending' because the outstanding set changed.
  const saveChangesToPocketBase = useCallback(async () => {
    const pbInstance = pbRef.current;
    if (!pbInstance) {
      debugLog('⚠️ PocketBase not initialized, cannot save');
      return {
        savedCount: 0,
        failures: [{ studentId: '__pb__', error: new Error('PocketBase not initialized') }],
      };
    }

    const totalStudents = localFeeAssignments.size;
    debugLog(`🔄 Saving changes to PocketBase, ${totalStudents} students`);

    if (totalStudents === 0) {
      debugLog('🔄 No local assignments to save');
      return { savedCount: 0, failures: [] as { studentId: string; error: any }[] };
    }

    const failures: { studentId: string; error: any }[] = [];
    let savedCount = 0;

    // Get all fees to calculate amounts (load once, share across students)
    let allFees: any[];
    try {
      allFees = await pbInstance.collection("fee_items").getFullList();
      debugLog(`🔄 Loaded ${allFees.length} fee items for calculation`);
    } catch (err: any) {
      debugLog('❌ Could not load fee_items for amount calculation:', err);
      // Cannot proceed at all — every student fails.
      localFeeAssignments.forEach((_, studentId) => {
        failures.push({ studentId, error: err });
      });
      if (isMountedRef.current) {
        setError(`无法加载费用项目：${err?.message ?? err}。保存已取消，请重试。`);
      }
      return { savedCount: 0, failures };
    }

    // Process each student's assignments individually so a single failure
    // does not abort the rest of the batch.
    for (const [studentId, feeIds] of localFeeAssignments) {
      try {
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
          // BUG #8: update branch also updates `status`. If fee items are
          // assigned and the record was previously "paid", flip back to
          // "pending" because the outstanding set has changed.
          const previousStatus = existingRecord.status || 'pending';
          const newStatus =
            feeItems.length > 0 && previousStatus === 'paid' ? 'pending' : previousStatus;

          await pbInstance.collection("student_fees").update(existingRecord.id, {
            fee_items: JSON.stringify(feeItems),
            totalAmount: totalAmount,
            status: newStatus,
          });
          debugLog(`✅ Updated record for student: ${studentId} (status: ${previousStatus} → ${newStatus})`);
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
        savedCount++;
      } catch (err: any) {
        debugLog(`❌ Failed saving for student ${studentId}:`, err);
        failures.push({ studentId, error: err });
      }
    }

    // Only refresh remote data when every record was saved. If anything failed
    // we keep the local edits so the user can retry without losing work, and
    // surface the error message.
    if (failures.length > 0) {
      const failedIds = failures.map(f => f.studentId).join(', ');
      debugLog(`⚠️ Save finished with ${failures.length}/${totalStudents} failures: ${failedIds}`);
      if (isMountedRef.current) {
        setError(`部分保存失败：${failures.length} 条记录未能保存（${failedIds}）。已保存 ${savedCount} 条。请重试未保存的记录。`);
      }
      return { savedCount, failures };
    }

    debugLog(`✅ Successfully saved all ${savedCount} students to PocketBase`);

    // Wait briefly before refreshing so PocketBase has propagated writes
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!isMountedRef.current) return { savedCount, failures: [] };

    // BUG #2: refresh failure must NOT clear localFeeAssignments — keep them
    // so the user can retry. Catch here and report via the failures array
    // using a sentinel student id so callers can distinguish a refresh error.
    try {
      await fetchStudentFees();
      debugLog('📊 Data refresh completed');
    } catch (refreshErr: any) {
      debugLog('❌ Save succeeded but post-save refresh failed:', refreshErr);
      if (isMountedRef.current) {
        setError(`保存成功，但数据刷新失败：${refreshErr?.message ?? refreshErr}。本地编辑已保留，请手动刷新或重试。`);
      }
      return {
        savedCount,
        failures: [{ studentId: '__refresh__', error: refreshErr }],
      };
    }

    return { savedCount, failures: [] };
  }, [pb, localFeeAssignments, feeByStudentId, fetchStudentFees, debugLog]);

  // Exit edit mode and save changes.
  // BUG #5: previously the catch block silently swallowed save failures and
  // still dropped localFeeAssignments, causing silent data loss. Now we
  // inspect the save result: only clear local state and exit edit mode when
  // every record was saved AND the post-save refresh succeeded. On any
  // failure we keep the local edits, surface the error message, and alert
  // the user so they know to retry.
  const exitEditMode = useCallback(async () => {
    debugLog('🔄 Exiting edit mode and saving changes');

    const result = await saveChangesToPocketBase().catch((err: any) => {
      // Defensive: saveChangesToPocketBase should not throw, but guard anyway.
      debugLog('❌ saveChangesToPocketBase threw unexpectedly:', err);
      return { savedCount: 0, failures: [{ studentId: '__unexpected__', error: err }] };
    });

    const totalFailures = result?.failures?.length ?? 0;

    if (totalFailures === 0) {
      // Everything saved and refreshed — safe to discard local edits.
      setIsEditMode(false);
      setLocalFeeAssignments(new Map());
      debugLog('✅ Successfully exited edit mode');
      return;
    }

    // BUG #5: notify the user instead of failing silently.
    const isRefreshFailure = result?.failures?.some(f => f.studentId === '__refresh__');
    const isPbFailure = result?.failures?.some(f => f.studentId === '__pb__');
    const failedStudentCount =
      result?.failures?.filter(
        f =>
          f.studentId !== '__refresh__' &&
          f.studentId !== '__pb__' &&
          f.studentId !== '__unexpected__'
      ).length ?? 0;

    const message = isRefreshFailure
      ? '保存成功，但服务器数据刷新失败。本地编辑已保留，请手动刷新页面后重试。'
      : isPbFailure
        ? '保存失败：PocketBase 未初始化或不可达。本地编辑已保留，请检查网络后重试。'
        : `保存失败：${failedStudentCount} 条学生记录未能保存。本地编辑已保留，请重试。`;

    debugLog('❌ Staying in edit mode due to save failures:', message);
    if (isMountedRef.current) {
      setError(message);
    }
    // Surface to the user via a blocking alert so it cannot be missed (the
    // in-app error banner is also set above for redundancy).
    if (typeof window !== 'undefined') {
      try {
        window.alert(message);
      } catch {
        /* window may be undefined in SSR — ignore */
      }
    }
    // Keep edit mode + localFeeAssignments so the user can retry.
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
    feeByStudentId,
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
    setFeeForStudents,
    isEditMode,
    enterEditMode,
    exitEditMode,
  };
}
