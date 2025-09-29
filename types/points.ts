// ============================================================================
// 基础接口和枚举定义
// ============================================================================

/**
 * 基础实体接口，包含公共字段
 */
export interface BaseEntity {
  id: string
  created: string
  updated: string
}

/**
 * 积分交易类型枚举
 */
export enum TransactionType {
  Add = "add_points",
  Deduct = "deduct_points", 
  Redeem = "redeem_gift"
}

/**
 * 积分交易状态枚举
 */
export enum TransactionStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected"
}

/**
 * 教师权限枚举
 */
export enum TeacherPermission {
  Normal = "normal_teacher",
  Senior = "senior_teacher", 
  Admin = "admin"
}

// ============================================================================
// 积分系统相关接口
// ============================================================================

/**
 * 积分赛季接口
 */
export interface PointSeason extends BaseEntity {
  season_name: string
  start_date: string
  end_date: string
  is_active: boolean
  clear_date?: string
}

/**
 * 学生积分接口
 */
export interface StudentPoints extends BaseEntity {
  student_id: string
  current_points: number
  total_earned: number
  total_spent: number
  season_id: string  // 关联到 PointSeason.id
  expand?: {
    student_id?: {
      id: string
      student_name: string
      student_id: string
      cardNumber?: string
      center?: string
      standard?: string
    }
    season_id?: PointSeason
  }
}

/**
 * 积分交易接口
 */
export interface PointTransaction extends BaseEntity {
  student_id: string
  teacher_id: string
  points_change: number
  transaction_type: TransactionType
  reason: string
  proof_image?: string
  status: TransactionStatus
  season_id: string  // 关联到 PointSeason.id
  gift_name?: string
  gift_points?: number
  expand?: {
    student_id?: {
      id: string
      student_name: string
      student_id: string
    }
    teacher_id?: {
      id: string
      name: string  // 统一使用 name 字段
      email?: string
      cardNumber?: string
    }
    season_id?: PointSeason
  }
}

/**
 * 积分交易创建数据接口
 * 默认状态为 pending，需要审核流程
 */
export interface PointTransactionCreateData {
  student_id: string
  teacher_id: string
  points_change: number
  transaction_type: TransactionType
  reason: string
  proof_image?: File
  gift_name?: string
  gift_points?: number
  status?: TransactionStatus  // 默认为 pending，需要审核
  season_id?: string  // 关联到 PointSeason.id
}

/**
 * 带NFC功能的教师接口
 * 统一使用 name 字段，移除 teacher_name
 */
export interface TeacherWithNFC extends BaseEntity {
  name: string  // 统一使用 name 字段
  email?: string
  cardNumber?: string
  permissions?: TeacherPermission
  nfc_card_issued_date?: string
  nfc_card_expiry_date?: string
}

// ============================================================================
// 工具函数和常量
// ============================================================================

/**
 * 积分交易类型显示名称映射
 */
export const TransactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.Add]: '加分',
  [TransactionType.Deduct]: '扣分',
  [TransactionType.Redeem]: '兑换礼品'
}

/**
 * 积分交易状态显示名称映射
 */
export const TransactionStatusLabels: Record<TransactionStatus, string> = {
  [TransactionStatus.Pending]: '待审核',
  [TransactionStatus.Approved]: '已通过',
  [TransactionStatus.Rejected]: '已拒绝'
}

/**
 * 教师权限显示名称映射
 */
export const TeacherPermissionLabels: Record<TeacherPermission, string> = {
  [TeacherPermission.Normal]: '普通教师',
  [TeacherPermission.Senior]: '高级教师',
  [TeacherPermission.Admin]: '管理员'
}

/**
 * 获取积分交易类型显示名称
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  return TransactionTypeLabels[type] || type
}

/**
 * 获取积分交易状态显示名称
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  return TransactionStatusLabels[status] || status
}

/**
 * 获取教师权限显示名称
 */
export function getTeacherPermissionLabel(permission: TeacherPermission): string {
  return TeacherPermissionLabels[permission] || permission
}

/**
 * 检查积分交易是否需要审核
 */
export function isTransactionPending(status: TransactionStatus): boolean {
  return status === TransactionStatus.Pending
}

/**
 * 检查积分交易是否已通过
 */
export function isTransactionApproved(status: TransactionStatus): boolean {
  return status === TransactionStatus.Approved
}

/**
 * 检查积分交易是否被拒绝
 */
export function isTransactionRejected(status: TransactionStatus): boolean {
  return status === TransactionStatus.Rejected
}
