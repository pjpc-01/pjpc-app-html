/**
 * Centralized Query Keys for React Query
 * 
 * This file defines all query keys used throughout the PJPC School Management System.
 * Using centralized query keys ensures consistency and makes cache invalidation easier.
 */

export const queryKeys = {
  // Students
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  studentsByGrade: (grade: string) => ['students', 'grade', grade] as const,
  studentsByStatus: (status: string) => ['students', 'status', status] as const,
  
  // Teachers
  teachers: ['teachers'] as const,
  teacher: (id: string) => ['teachers', id] as const,
  teachersByDepartment: (department: string) => ['teachers', 'department', department] as const,
  teachersByStatus: (status: string) => ['teachers', 'status', status] as const,
  
  // Finance
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
  invoicesByStatus: (status: string) => ['invoices', 'status', status] as const,
  invoicesByStudent: (studentId: string) => ['invoices', 'student', studentId] as const,
  
  fees: ['fees'] as const,
  fee: (id: string) => ['fees', id] as const,
  feeItems: ['fee-items'] as const,
  feeItem: (id: string) => ['fee-items', id] as const,
  
  payments: ['payments'] as const,
  payment: (id: string) => ['payments', id] as const,
  paymentsByInvoice: (invoiceId: string) => ['payments', 'invoice', invoiceId] as const,
  
  receipts: ['receipts'] as const,
  receipt: (id: string) => ['receipts', id] as const,
  receiptsByPayment: (paymentId: string) => ['receipts', 'payment', paymentId] as const,
  
  // Student Management
  studentFees: ['student-fees'] as const,
  studentFee: (id: string) => ['student-fees', id] as const,
  studentFeesByStudent: (studentId: string) => ['student-fees', 'student', studentId] as const,
  
  studentFeeMatrix: ['student-fee-matrix'] as const,
  studentFeeMatrixByStudent: (studentId: string) => ['student-fee-matrix', 'student', studentId] as const,
  
  studentCards: ['student-cards'] as const,
  studentCard: (id: string) => ['student-cards', id] as const,
  studentCardsByStudent: (studentId: string) => ['student-cards', 'student', studentId] as const,
  
  // User Management
  userApprovals: ['user-approvals'] as const,
  userApproval: (id: string) => ['user-approvals', id] as const,
  userApprovalsByStatus: (status: string) => ['user-approvals', 'status', status] as const,
  
  // Attendance
  attendance: ['attendance'] as const,
  attendanceByDate: (date: string) => ['attendance', 'date', date] as const,
  attendanceByStudent: (studentId: string) => ['attendance', 'student', studentId] as const,
  attendanceByDateRange: (startDate: string, endDate: string) => ['attendance', 'range', startDate, endDate] as const,
  
  // NFC/RFID
  nfc: ['nfc'] as const,
  nfcDevices: ['nfc', 'devices'] as const,
  nfcDevice: (id: string) => ['nfc', 'devices', id] as const,
  nfcCards: ['nfc', 'cards'] as const,
  nfcCard: (id: string) => ['nfc', 'cards', id] as const,
  
  // Dashboard & Statistics
  dashboardStats: ['dashboard', 'stats'] as const,
  financialStats: ['financial', 'stats'] as const,
  attendanceStats: ['attendance', 'stats'] as const,
  
  // Reminders
  reminders: ['reminders'] as const,
  reminder: (id: string) => ['reminders', id] as const,
  remindersByType: (type: string) => ['reminders', 'type', type] as const,
  
  // Google Sheets Integration
  googleSheets: ['google-sheets'] as const,
  googleSheetsData: (sheetId: string) => ['google-sheets', 'data', sheetId] as const,
  
  // System
  systemStatus: ['system', 'status'] as const,
  pocketbaseStatus: ['pocketbase', 'status'] as const,
} as const

/**
 * Helper function to get all related query keys for cache invalidation
 */
export const getRelatedQueryKeys = {
  // Invalidate all student-related queries
  students: () => [
    queryKeys.students,
    queryKeys.studentFeeMatrix,
    queryKeys.studentCards,
    queryKeys.attendance,
  ],
  
  // Invalidate all teacher-related queries
  teachers: () => [
    queryKeys.teachers,
  ],
  
  // Invalidate all finance-related queries
  finance: () => [
    queryKeys.invoices,
    queryKeys.payments,
    queryKeys.receipts,
    queryKeys.financialStats,
  ],
  
  // Invalidate all attendance-related queries
  attendance: () => [
    queryKeys.attendance,
    queryKeys.attendanceStats,
  ],
  
  // Invalidate all dashboard queries
  dashboard: () => [
    queryKeys.dashboardStats,
    queryKeys.financialStats,
    queryKeys.attendanceStats,
  ],
}

/**
 * Type-safe query key helpers
 */
export type QueryKey = typeof queryKeys[keyof typeof queryKeys]

/**
 * Example usage:
 * 
 * // In a hook
 * const studentsQuery = useQuery({
 *   queryKey: queryKeys.students,
 *   queryFn: fetchStudents,
 * })
 * 
 * // In a mutation
 * const addStudentMutation = useMutation({
 *   mutationFn: addStudent,
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: queryKeys.students })
 *   },
 * })
 * 
 * // Invalidate related queries
 * queryClient.invalidateQueries({ 
 *   queryKey: getRelatedQueryKeys.students() 
 * })
 */
