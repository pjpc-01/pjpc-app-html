export interface StudentPoints {
  id: string
  student_id: string
  current_points: number
  total_earned: number
  total_spent: number
  season_start_date: string
  season_end_date: string
  season_number: number
  created: string
  updated: string
  expand?: {
    student_id?: {
      id: string
      student_name: string
      student_id: string
      cardNumber?: string
      center?: string
      standard?: string
    }
  }
}

export interface PointTransaction {
  id: string
  student_id: string
  teacher_id: string
  points_change: number
  transaction_type: 'add_points' | 'deduct_points' | 'redeem_gift'
  reason: string
  proof_image?: string
  status: 'pending' | 'approved' | 'rejected'
  season_number: number
  gift_name?: string
  gift_points?: number
  created: string
  updated: string
  expand?: {
    student_id?: {
      id: string
      student_name: string
      student_id: string
    }
    teacher_id?: {
      id: string
      teacher_name?: string
      name?: string
      email?: string
      nfc_card_number?: string
    }
  }
}

export interface PointTransactionCreateData {
  student_id: string
  teacher_id: string
  points_change: number
  transaction_type: 'add_points' | 'deduct_points' | 'redeem_gift'
  reason: string
  proof_image?: File
  gift_name?: string
  gift_points?: number
  status?: 'pending' | 'approved'
}

export interface TeacherWithNFC {
  id: string
  teacher_name?: string
  name?: string
  email?: string
  nfc_card_number?: string
  permissions?: 'normal_teacher' | 'senior_teacher' | 'admin'
  nfc_card_issued_date?: string
  nfc_card_expiry_date?: string
  created: string
  updated: string
}

export interface PointSeason {
  id: string
  season_name: string
  start_date: string
  end_date: string
  is_active: boolean
  clear_date?: string
  created: string
  updated: string
}
