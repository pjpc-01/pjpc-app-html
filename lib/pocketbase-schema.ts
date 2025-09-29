// PocketBase集合定义 - 统一文件
// 基于真实服务器数据生成
// 生成时间: 2025-09-24
// 服务器: http://pjpc.tplinkdns.com:8090

// ============================================================================
// 核心业务集合 - 基于真实数据
// ============================================================================

/**
 * 学生集合
 */
export interface Student {
  id: string
  // 基本信息
  student_id?: string
  student_name?: string
  dob?: string
  gender?: string
  standard?: string
  center?: string
  status?: string
  school?: string
  level?: string
  
  // 联系信息
  parentName?: string
  parents_phone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  home_address?: string
  
  // 卡片信息
  cardNumber?: string
  cardType?: string
  cardStatus?: string
  balance?: number
  issuedDate?: string
  expiryDate?: string
  enrollmentDate?: string
  
  // 接送信息
  pickupMethod?: string
  authorizedPickup1Name?: string
  authorizedPickup1Phone?: string
  authorizedPickup2Name?: string
  authorizedPickup2Phone?: string
  authorizedPickup3Name?: string
  authorizedPickup3Phone?: string
  
  // 安全相关
  security_status?: string
  risk_score?: number
  suspicious_activities?: number
  swipe_count_today?: number
  last_swipe_time?: string
  auto_lock_until?: string
  lock_reason?: string
  verification_level?: string
  
  // 加密相关
  encrypted_uid?: string
  encryption_algorithm?: string
  encryption_key_version?: number
  encryption_salt?: string
  key_rotation_date?: string
  
  // 其他信息
  nric?: string
  birthCert?: string
  medicalNotes?: string
  notes?: string
  photo?: string
  studentUrl?: string
  register_form_url?: string
  
  // 系统字段
  created: string
  updated: string
}

/**
 * 教师集合
 */
export interface Teacher {
  id: string
  // 基本信息
  name?: string
  user_id?: string
  email?: string
  phone?: string
  nric?: string
  address?: string
  department?: string
  position?: string
  status?: string
  
  // 银行信息
  bankName?: string
  bankAccountNo?: number
  bankAccountName?: string
  
  // 工作信息
  epfNo?: number
  socsoNo?: number
  hireDate?: string
  idNumber?: number
  childrenCount?: number
  maritalStatus?: string
  assigned_classes?: string
  center_assignment?: string
  
  // 卡片信息
  cardNumber?: string
  teacher_url?: string
  nfc_card_issued_date?: string
  nfc_card_expiry_date?: string
  
  // 权限和安全
  permissions?: string
  security_status?: string
  risk_score?: number
  suspicious_activities?: number
  swipe_count_today?: number
  last_swipe_time?: string
  auto_lock_until?: string
  lock_reason?: string
  verification_level?: string
  
  // 加密相关
  encrypted_uid?: string
  encryption_algorithm?: string
  encryption_key_version?: number
  encryption_salt?: string
  key_rotation_date?: string
  
  // 系统字段
  created: string
  updated: string
}

/**
 * 用户集合
 */
export interface User {
  id: string
  email: string
  emailVisibility: boolean
  name?: string
  role?: string
  status?: string
  verified: boolean
  center?: string
  created: string
  updated: string
}

/**
 * 中心集合
 */
export interface Center {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  status?: string
  description?: string
  manager?: string
  capacity?: number
  current_students?: number
  teacherCount?: number
  opening_date?: string
  created: string
  updated: string
}

// ============================================================================
// 考勤系统集合
// ============================================================================

/**
 * 学生考勤集合
 */
export interface StudentAttendance {
  id: string
  student_id: string
  student_name?: string
  date: string
  check_in?: string
  check_out?: string
  status: string
  center?: string
  branch_name?: string
  method?: string
  notes?: string
  detail?: string
  reason?: string
  
  // 安全相关
  device_id?: string
  ip_address?: string
  location?: string
  user_agent?: string
  risk_score?: number
  verification_level?: string
  security_flags?: any
  
  // 加密相关
  encryption_algorithm?: string
  encryption_version?: number
  
  // 系统字段
  teacher_id?: string
  created: string
  updated: string
}

/**
 * 教师考勤集合
 */
export interface TeacherAttendance {
  id: string
  teacher_id: string
  teacher_name?: string
  date: string
  check_in?: string
  check_out?: string
  status: string
  branch_code?: string
  branch_name?: string
  notes?: string
  
  // 安全相关
  device_id?: string
  ip_address?: string
  location?: string
  user_agent?: string
  risk_score?: number
  verification_level?: string
  security_flags?: any
  
  // 加密相关
  encryption_algorithm?: string
  encryption_version?: number
  
  // 系统字段
  created: string
  updated: string
}

// ============================================================================
// 积分系统集合
// ============================================================================

/**
 * 学生积分集合
 */
export interface StudentPoints {
  id: string
  student_id: string
  current_points: number
  total_earned: number
  total_spent: number
  season_number: number
  season_start_date: string
  season_end_date: string
  created: string
  updated: string
}

// ============================================================================
// 财务系统集合
// ============================================================================

/**
 * 费用项目集合
 */
export interface FeeItem {
  id: string
  name: string
  amount: number
  category: string
  description?: string
  frequency: string
  status: string
  created: string
  updated: string
}

/**
 * 发票集合
 */
export interface Invoice {
  id: string
  invoice_id: string
  issue_date: string
  due_date: string
  total_amount: number
  discounts: number
  tax: number
  status: string
  notes?: string
  student_fee_matrix: string
  created: string
  updated: string
}

/**
 * 收据集合
 */
export interface Receipt {
  id: string
  receipt_id: string
  invoice_id: string
  amount: number
  receipt_date: string
  created: string
  updated: string
}

/**
 * 学生费用矩阵集合
 */
export interface StudentFeeMatrix {
  id: string
  students: string
  fee_items: any[]
  total_amount: number
  created: string
  updated: string
}

// ============================================================================
// 排班系统集合
// ============================================================================

/**
 * 排班集合
 */
export interface Schedule {
  id: string
  teacher_id: string
  date: string
  start_time: string
  end_time: string
  total_hours: number
  hourly_rate: number
  center: string
  class_id?: string
  room?: string
  schedule_type: string
  status: string
  is_overtime: boolean
  notes?: string
  template_id?: string
  created_by: string
  approved_by?: string
  created: string
  updated: string
}

/**
 * 排班模板集合
 */
export interface ScheduleTemplate {
  id: string
  name: string
  type: string
  start_time: string
  end_time: string
  work_days: number[]
  max_hours_per_week: number
  color: string
  is_active: boolean
  created: string
  updated: string
}

// ============================================================================
// 设备系统集合
// ============================================================================

/**
 * WiFi网络集合
 */
export interface WiFiNetwork {
  id: string
  network_name: string
  center_id: string
  description?: string
  is_active: boolean
  created: string
  updated: string
}

/**
 * NFC卡片集合
 */
export interface NFCCard {
  id: string
  student: string
  cardNumber?: string
  card_status: string
  replacement_status: string
  replacement_urgency: string
  replacement_reason?: string
  replacement_notes?: string
  replacement_lost_date?: string
  replacement_lost_location?: string
  replacement_request_date: string
  replacement_request_id?: string
  created: string
  updated: string
}

/**
 * 加密密钥集合
 */
export interface EncryptionKey {
  id: string
  key_name?: string
  key_version: number
  encryption_algorithm?: string
  status: string
  usage_count: number
  last_used?: string
  rotation_reason?: string
  created: string
  updated: string
}

// ============================================================================
// 集合名称常量
// ============================================================================

export const COLLECTION_NAMES = {
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  USERS: 'users',
  CENTERS: 'centers',
  STUDENT_ATTENDANCE: 'student_attendance',
  TEACHER_ATTENDANCE: 'teacher_attendance',
  STUDENT_POINTS: 'student_points',
  POINT_TRANSACTIONS: 'point_transactions',
  FEE_ITEMS: 'fee_items',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  RECEIPTS: 'receipts',
  STUDENT_FEE_MATRIX: 'student_fee_matrix',
  SCHEDULES: 'schedules',
  SCHEDULE_TEMPLATES: 'schedule_templates',
  SCHEDULE_LOGS: 'schedule_logs',
  WIFI_NETWORKS: 'wifi_networks',
  NFC_CARDS: 'nfc_cards',
  ENCRYPTION_KEYS: 'encryption_keys',
  ALERTS: 'alerts',
  ANNOUNCEMENTS: 'announcements',
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_TEMPLATES: 'notification_templates',
  ASSIGNMENTS: 'assignments',
  ASSIGNMENT_RECORDS: 'assignment_records',
  COURSES: 'courses',
  CLASSES: 'classes',
  CLASS_ENROLLMENTS: 'class_enrollments',
  DEVICES: 'devices',
  REMINDERS: 'reminders',
  INVOICES_BACKUP: 'invoices_backup',
  PAYMENTS_BACKUP: 'payments_backup',
  RECEIPTS_BACKUP: 'receipts_backup',
  REMINDERS_BACKUP: 'reminders_backup'
} as const

// ============================================================================
// 字段统计信息
// ============================================================================

export const FIELD_STATISTICS = {
  totalCollections: 35,
  totalFields: 251,
  fieldTypes: {
    string: 207,
    number: 35,
    boolean: 5,
    object: 4
  },
  commonFields: {
    status: 10,
    name: 5,
    center: 4,
    cardNumber: 3,
    student_id: 3,
    email: 3,
    description: 3,
    date: 3,
    teacher_id: 3
  }
} as const

// ============================================================================
// 类型映射
// ============================================================================

export type CollectionName = typeof COLLECTION_NAMES[keyof typeof COLLECTION_NAMES]

export type CollectionType = 
  | Student
  | Teacher
  | User
  | Center
  | StudentAttendance
  | TeacherAttendance
  | StudentPoints
  | FeeItem
  | Invoice
  | Receipt
  | StudentFeeMatrix
  | Schedule
  | ScheduleTemplate
  | WiFiNetwork
  | NFCCard
  | EncryptionKey
