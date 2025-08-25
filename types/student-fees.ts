// ========================================
// Student Fee Matrix Types
// ========================================

/**
 * Fee Item Interface - 费用项目
 */
export interface FeeItem {
  id: string
  name: string
  amount: number
  active: boolean
  category?: string
  description?: string
  status?: 'active' | 'inactive' // Added status field for visual distinction
  frequency?: 'one-time' | 'recurring' // Added frequency field from PocketBase schema
}

/**
 * Student Fee Assignment Interface - 学生费用分配
 */
export interface StudentFeeAssignment {
  id: string
  students: string // student id (relation)
  fee_items: FeeItem[]
  totalAmount: number
  assigned_fee_ids?: string[] // NEW: Raw array of fee IDs for easy access
  expand?: {
    students?: {
      id: string
      student_name: string
      standard: string
      parents_name: string
      studentId: string
    }
  }
}

/**
 * Save Assignment Parameter Interface - 保存分配参数
 */
export interface SaveAssignmentParams {
  studentId: string
  assignedFeeIds: string[]
  assignedFeeItems?: Array<{
    id: string
    name: string
    status: string
    amount: number
    category?: string
  }>
}

/**
 * Student Name Card Interface - 学生姓名卡片信息
 */
export interface StudentNameCard {
  id: string
  studentName: string
  grade?: string
  parentName?: string
  studentId?: string
}

/**
 * Fee Category Interface - 费用分类
 */
export interface FeeCategory {
  name: string
  fees: FeeItem[]
  totalItems: number
  assignedCount: number
  totalAmount: number
}

/**
 * Payment Status Interface - 支付状态
 */
export interface PaymentStatus {
  status: 'not_issued' | 'pending' | 'paid' | 'overdue'
  date?: string
  amount?: number
}

/**
 * Student Fee Matrix State Interface - 学生费用矩阵状态
 */
export interface StudentFeeMatrixState {
  students: StudentNameCard[]
  fees: FeeItem[]
  assignments: StudentFeeAssignment[]
  loading: boolean
  error: string | null
  loadingState: 'idle' | 'loading' | 'error' // NEW: Added loadingState
  editMode: boolean
  expandedStudents: Set<string>
  expandedCategories: Set<string>
  searchTerm: string
  selectedGradeFilter: string
  batchMode: boolean
}

/**
 * Student Fee Matrix Actions Interface - 学生费用矩阵操作
 */
export interface StudentFeeMatrixActions {
  // Data Operations
  fetchData: (signal?: AbortSignal) => Promise<void>
  refreshData: () => Promise<void>
  
  // Assignment Operations
  assignFee: (studentId: string, feeId: string) => Promise<void>
  removeFee: (studentId: string, feeId: string) => Promise<void>
  saveAssignments: () => Promise<void>
  
  // UI State Operations
  toggleEditMode: () => void
  toggleStudentExpansion: (studentId: string) => void
  toggleCategoryExpansion: (category: string) => void
  setSearchTerm: (term: string) => void
  setGradeFilter: (grade: string) => void
  setBatchMode: (enabled: boolean) => void
  
  // Utility Operations
  isAssigned: (studentId: string, feeId: string) => boolean
  getStudentAmount: (studentId: string) => number
  getPaymentStatus: (studentId: string) => PaymentStatus
}

/**
 * API Response Interface - API响应
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Batch Operation Interface - 批量操作
 */
export interface BatchOperation {
  studentIds: string[]
  feeIds: string[]
  operation: 'assign' | 'remove'
}

/**
 * Error Types - 错误类型
 */
export type StudentFeeError = 
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'PERMISSION_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Loading States - 加载状态
 */
export type LoadingState = 
  | 'idle'
  | 'loading'
  | 'saving'
  | 'refreshing'
  | 'error'
