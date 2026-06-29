// 积分相关类型定义

export interface StudentPoints {
  id: string
  studentId: string
  total_points: number
  weekly_points: number
  monthly_points: number
  current_points: number  // alias for total_points
  expand?: {
    studentId?: {
      id: string
      name: string
      grade: string
      centerId?: string
    }
  }
}

export interface PointTransaction {
  id: string
  studentId: string
  points: number
  reason: string
  category: 'academic' | 'behavior' | 'attendance' | 'other'
  operatorId: string
  nfc_card_uid: string
  date: string
  created: string
  expand?: {
    studentId?: {
      id: string
      name: string
      grade: string
    }
    operatorId?: {
      id: string
      name: string
    }
  }
}

export interface PointTransactionCreateData {
  studentId: string
  points: number
  reason: string
  category: string
  operatorId?: string
  nfc_card_uid?: string
}

export interface NfcCard {
  id: string
  card_uid: string
  studentId: string
  status: 'active' | 'inactive' | 'lost'
  type: 'student' | 'teacher' | 'admin'
  issued_date: string
  notes: string
  expand?: {
    studentId?: {
      id: string
      name: string
      grade: string
    }
  }
}

export interface PointsStats {
  totalStudents: number
  totalPoints: number
  averagePoints: number
  maxPoints: number
  activeStudents: number
}

// 兼容旧代码的类型别名
// 运行时值（用于API调用）
export const TransactionType = {
  Add: 'add_points',
  Deduct: 'deduct_points',
  Redeem: 'redeem_gift',
} as const

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export const TransactionStatus = {
  Pending: 'pending',
  Completed: 'completed',
  Approved: 'approved',
  Cancelled: 'cancelled',
} as const

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]

export const PointSeason = {
  Weekly: 'weekly',
  Monthly: 'monthly',
  Semester: 'semester',
  Yearly: 'yearly',
} as const

export type PointSeason = (typeof PointSeason)[keyof typeof PointSeason]
export interface TeacherWithNFC {
  id: string
  name: string
  nfc_card_uid?: string
}
