import PocketBase from 'pocketbase'

// 创建PocketBase实例
const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')

// 导出PocketBase实例
export { pb }

// 导出用户资料接口
export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'teacher' | 'parent' | 'accountant'
  status: 'pending' | 'active' | 'suspended'
  center?: string
  created: string
  updated: string
}

// 导出学生接口（与pocketbase-students.ts保持一致）
export interface Student {
  id: string
  
  // 基本信息
  student_id?: string
  student_name?: string
  dob?: string
  father_phone?: string
  mother_phone?: string
  home_address?: string
  gender?: string
  serviceType?: 'afterschool' | 'tuition'
  register_form_url?: string
  standard?: string
  level?: 'primary' | 'secondary'
  center?: 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04'
  
  // 扩展信息
  nric?: string
  school?: string
  parentPhone?: string
  emergencyContact?: string
  emergencyPhone?: string
  healthInfo?: string
  pickupMethod?: 'parent' | 'guardian' | 'authorized' | 'public' | 'walking'
  
  // 接送安排
  authorizedPickup1Name?: string
  authorizedPickup1Phone?: string
  authorizedPickup1Relation?: string
  authorizedPickup2Name?: string
  authorizedPickup2Phone?: string
  authorizedPickup2Relation?: string
  authorizedPickup3Name?: string
  authorizedPickup3Phone?: string
  authorizedPickup3Relation?: string
  
  // 注册和费用信息
  registrationDate?: string
  tuitionStatus?: 'pending' | 'paid' | 'partial' | 'overdue'
  birthCertificate?: string | null
  avatar?: string | null
  
  // 考勤相关字段（合并后的字段）
  cardNumber?: string
  cardType?: 'NFC' | 'RFID'
  studentUrl?: string
  balance?: number
  status?: 'active' | 'inactive' | 'lost' | 'graduated'
  issuedDate?: string
  expiryDate?: string
  enrollmentDate?: string
  phone?: string
  email?: string
  parentName?: string
  address?: string
  medicalInfo?: string
  notes?: string
  usageCount?: number
  lastUsed?: string
  
  // 系统字段
  created: string
  updated: string
}
