import PocketBase from 'pocketbase'
import { getPocketBase } from './pocketbase'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// Helper: convert avatar filename to full PB file URL (via proxy)
const getAvatarUrl = (record: any): string | undefined => {
  const avatar = record.photo || record.avatar
  if (!avatar) return undefined
  if (avatar.startsWith('http')) return avatar
  const url = `/api/pocketbase-proxy/api/files/${record.collectionName || record.collectionId || 'students'}/${record.id}/${avatar}`
  console.log(`[getAvatarUrl] ${record.id?.slice(0,10)}... => ${url}`)
  return url
}

// 统一的学生数据接口 - 所有数据来自 students 集合
export interface Student {
  id: string
  
  // 基本信息
  student_id?: string
  student_name?: string
  dob?: string
  father_name?: string
  mother_name?: string
  father_phone?: string
  mother_phone?: string
  home_address?: string
  gender?: string
  serviceType?: 'afterschool' | 'tuition'
  services?: 'Daycare' | 'Tuition'
  register_form_url?: string
  standard?: string
  level?: 'primary' | 'secondary'
  
  // 🔄 中心关联 — 新系统使用 centerId (relation)，旧版兼容用 center (text)
  centerId?: string
  center?: string
  
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
  
  // 考勤相关字段（新增到students集合）
  cardNumber?: string
  cardType?: 'NFC' | 'RFID'
  studentUrl?: string
  balance?: number
  status?: 'active' | 'inactive' | 'lost' | 'graduated' | 'withdrawn' | 'transferred'
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

export interface StudentCreateData {
  // 基本信息
  student_id?: string
  student_name?: string
  dob?: string
  father_phone?: string
  mother_phone?: string
  home_address?: string
  gender?: string
  serviceType?: 'afterschool' | 'tuition'
  services?: 'Daycare' | 'Tuition'
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
  
  // 考勤相关字段
  cardNumber?: string
  cardType?: 'NFC' | 'RFID'
  studentUrl?: string
  balance?: number
  status?: 'active' | 'inactive' | 'lost' | 'graduated' | 'withdrawn' | 'transferred'
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
}

export interface StudentUpdateData extends Partial<StudentCreateData> {
  // 不包含id字段，id通过参数传递
}

// 获取所有学生 - 通过API路由获取，避免客户端认证问题
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    console.log('开始获取学生数据...')
    
    // 使用API路由获取学生数据，避免客户端认证问题
    console.log('通过API路由获取学生数据...')
    const response = await fetch('/api/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || '获取学生数据失败')
    }
    
    const students = data.students || []
    console.log(`✅ getAllStudents: 获取到 ${students.length} 个学生数据`)
    
    // 调试中心分布
    if (students.length > 0) {
      const centerCounts = students.reduce((acc: Record<string, number>, student: any) => {
        const center = student.center || 'WX 01'
        acc[center] = (acc[center] || 0) + 1
        return acc
      }, {})
      console.log('📊 getAllStudents: 中心分布:', centerCounts)
      console.log('🔍 getAllStudents: 前3个学生:', students.slice(0, 3))
    }
    
    // 数据验证
    if (students.length === 0) {
      console.warn('⚠️ 警告: students 集合为空')
      return []
    }
    
    // 转换数据格式，确保所有字段都正确映射
    const formattedStudents: Student[] = students.map((student: any) => ({
      id: student.id,
      
      // 基本信息
      student_id: student.student_id,
      student_name: student.name,
      dob: student.dob,
      father_name: student.fatherName,
      mother_name: student.motherName,
      father_phone: student.fatherPhone,
      mother_phone: student.motherPhone,
      home_address: student.address,
      gender: student.gender,
      serviceType: student.serviceType,
      register_form_url: student.registrationLink,
      standard: student.grade,
      level: student.level,
      center: student.expand?.centerId?.code || student.center || '',
      centerId: student.centerId || '',

      // 扩展信息
      nric: student.nric,
      school: student.school,
      parentPhone: student.parentPhone,
      emergencyContact: student.emergencyContact,
      emergencyPhone: student.emergencyPhone,
      healthInfo: student.healthInfo,
      pickupMethod: student.pickupMethod,
      
      // 接送安排
      authorizedPickup1Name: student.authorizedPickup1Name,
      authorizedPickup1Phone: student.authorizedPickup1Phone,
      authorizedPickup1Relation: student.authorizedPickup1Relation,
      authorizedPickup2Name: student.authorizedPickup2Name,
      authorizedPickup2Phone: student.authorizedPickup2Phone,
      authorizedPickup2Relation: student.authorizedPickup2Relation,
      authorizedPickup3Name: student.authorizedPickup3Name,
      authorizedPickup3Phone: student.authorizedPickup3Phone,
      authorizedPickup3Relation: student.authorizedPickup3Relation,
      
      // 注册和费用信息
      registrationDate: student.registrationDate,
      tuitionStatus: student.tuitionStatus,
      birthCertificate: student.birthCert || student.birthCertificate,
      avatar: getAvatarUrl(student),
      
      // 考勤相关字段
      cardNumber: student.cardNumber,
      cardType: student.cardType,
      studentUrl: student.studentUrl,
      balance: student.balance,
      status: student.status || 'active',
      issuedDate: student.issuedDate,
      expiryDate: student.expiryDate,
      enrollmentDate: student.enrollmentDate,
      phone: student.phone,
      email: student.email,
      parentName: student.parentName,
      address: student.address,
      medicalInfo: student.medicalInfo,
      notes: student.notes,
      usageCount: student.usageCount || 0,
      lastUsed: student.lastUsed,
      
      // 系统字段
      created: student.created,
      updated: student.updated,
    }))
    
    console.log('学生数据格式化完成')
    return formattedStudents
    
  } catch (error: any) {
    console.error('获取学生数据失败:', error)
    throw new Error(`获取学生数据失败: ${error.message}`)
  }
}

// 添加学生
export const addStudent = async (studentData: StudentCreateData): Promise<Student> => {
  try {
    console.log('开始添加学生...')
    
    // 准备要保存的数据（映射到 PB 的字段名）
    const dataToSave: Record<string, any> = {
      name: studentData.student_name || '未命名学生',
      student_id: studentData.student_id || '',
      grade: studentData.standard || '',
      fatherName: studentData.father_name || '',
      motherName: studentData.mother_name || '',
      fatherPhone: studentData.father_phone || '',
      motherPhone: studentData.mother_phone || '',
      center: studentData.center || '',
      centerId: studentData.centerId || '',
      status: studentData.status || 'active',
      address: studentData.home_address || studentData.address,
      gender: studentData.gender,
      nric: studentData.nric,
      school: studentData.school,
      dob: studentData.dob,
      email: studentData.email,
      phone: studentData.phone,
    }
    
    console.log('保存学生数据:', dataToSave)
    
    // 使用API路由添加学生
    const response = await fetch('/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || '添加学生失败')
    }
    
    console.log('学生添加成功:', data.student.id)
    
    // 返回添加后的学生数据
    const newStudent: Student = {
      id: data.student.id,
      student_id: data.student.student_id,
      student_name: data.student.name,
      center: data.student.expand?.centerId?.code || data.student.center || '',
      centerId: data.student.centerId || '',
      status: data.student.status,
      standard: data.student.grade,
      father_name: data.student.fatherName,
      mother_name: data.student.motherName,
      studentUrl: data.student.studentUrl,
      created: data.student.created,
      updated: data.student.updated,
      // 添加其他默认字段
      dob: studentData.dob,
      father_phone: data.student.fatherPhone || studentData.father_phone,
      mother_phone: data.student.motherPhone || studentData.mother_phone,
      home_address: studentData.home_address,
      gender: studentData.gender,
      serviceType: studentData.serviceType,
      register_form_url: studentData.register_form_url,
      level: studentData.level,
      nric: studentData.nric,
      school: studentData.school,
      parentPhone: studentData.parentPhone,
      emergencyContact: studentData.emergencyContact,
      emergencyPhone: studentData.emergencyPhone,
      healthInfo: studentData.healthInfo,
      pickupMethod: studentData.pickupMethod,
      authorizedPickup1Name: studentData.authorizedPickup1Name,
      authorizedPickup1Phone: studentData.authorizedPickup1Phone,
      authorizedPickup1Relation: studentData.authorizedPickup1Relation,
      authorizedPickup2Name: studentData.authorizedPickup2Name,
      authorizedPickup2Phone: studentData.authorizedPickup2Phone,
      authorizedPickup2Relation: studentData.authorizedPickup2Relation,
      authorizedPickup3Name: studentData.authorizedPickup3Name,
      authorizedPickup3Phone: studentData.authorizedPickup3Phone,
      authorizedPickup3Relation: studentData.authorizedPickup3Relation,
      registrationDate: studentData.registrationDate,
      tuitionStatus: studentData.tuitionStatus,
      birthCertificate: studentData.birthCertificate,
      avatar: studentData.avatar,
      cardNumber: studentData.cardNumber,
      cardType: studentData.cardType,
      balance: studentData.balance,
      issuedDate: studentData.issuedDate,
      expiryDate: studentData.expiryDate,
      enrollmentDate: studentData.enrollmentDate,
      phone: studentData.phone,
      email: studentData.email,
      parentName: studentData.parentName,
      address: studentData.address,
      medicalInfo: studentData.medicalInfo,
      notes: studentData.notes,
      usageCount: studentData.usageCount || 0,
      lastUsed: studentData.lastUsed,
    }
    
    return newStudent
    
  } catch (error: any) {
    console.error('添加学生失败:', error)
    throw new Error(`添加学生失败: ${error.message}`)
  }
}

// 更新学生
export const updateStudent = async (id: string, studentData: any): Promise<Student> => {
  try {
    console.log('🔍 开始更新学生:', id)

    // If a new avatar file was attached, upload it directly via multipart PATCH
    if (studentData._avatarFile instanceof File) {
      const fd = new FormData()
      fd.append('avatar', studentData._avatarFile)
      const avatarRes = await fetch(`/api/pocketbase-proxy/api/collections/students/records/${id}`, {
        method: 'PATCH', body: fd,
      })
      if (!avatarRes.ok) {
        const err = await avatarRes.json().catch(() => ({}))
        throw new Error(err?.message || '头像上传失败')
      }
      delete studentData._avatarFile
    }
    // Don't pass avatar as string — only upload via file
    delete studentData.avatar
    
    // 映射到 PB 字段名（兼容 camelCase + snake_case）
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const v = (studentData as any)[k]
        if (v !== undefined) return v
      }
      return undefined
    }
    const pbData: Record<string, any> = {}
    
    // Core fields with known PB mapping
    if (get('student_name', 'name') !== undefined) pbData.name = get('student_name', 'name')
    if (get('student_id') !== undefined) pbData.student_id = get('student_id')
    if (get('standard', 'grade') !== undefined) pbData.grade = get('standard', 'grade')
    
    // Parent fields — form sends camelCase, but also support snake_case
    if (get('fatherName', 'father_name') !== undefined) pbData.fatherName = get('fatherName', 'father_name')
    if (get('motherName', 'mother_name') !== undefined) pbData.motherName = get('motherName', 'mother_name')
    if (get('fatherPhone', 'father_phone') !== undefined) pbData.fatherPhone = get('fatherPhone', 'father_phone')
    if (get('motherPhone', 'mother_phone') !== undefined) pbData.motherPhone = get('motherPhone', 'mother_phone')
    
    // Contact / personal
    if (get('email') !== undefined) pbData.email = get('email')
    if (get('phone') !== undefined) pbData.phone = get('phone')
    if (get('nric') !== undefined) pbData.nric = get('nric')
    if (get('school') !== undefined) pbData.school = get('school')
    if (get('dob') !== undefined) pbData.dob = get('dob')
    if (get('gender') !== undefined) pbData.gender = get('gender')
    if (get('status') !== undefined) pbData.status = get('status')
    
    // Center / enrollment
    if (get('center') !== undefined) pbData.center = get('center')
    if (get('centerId') !== undefined) pbData.centerId = get('centerId')
    if (get('serviceType') !== undefined) pbData.serviceType = get('serviceType')
    if (get('registrationDate') !== undefined) pbData.registrationDate = get('registrationDate')
    if (get('tuitionStatus') !== undefined) pbData.tuitionStatus = get('tuitionStatus')
    
    // Emergency / health
    if (get('emergencyContact') !== undefined) pbData.emergencyContact = get('emergencyContact')
    if (get('emergencyPhone') !== undefined) pbData.emergencyPhone = get('emergencyPhone')
    if (get('healthInfo') !== undefined) pbData.healthInfo = get('healthInfo')
    if (get('pickupMethod') !== undefined) pbData.pickupMethod = get('pickupMethod')
    
    // Address
    if (get('address', 'home_address') !== undefined) pbData.address = get('address', 'home_address')
    
    // Authorized pickup persons (1-3)
    for (const n of [1, 2, 3]) {
      if (get(`authorizedPickup${n}Name`) !== undefined) pbData[`authorizedPickup${n}Name`] = get(`authorizedPickup${n}Name`)
      if (get(`authorizedPickup${n}Phone`) !== undefined) pbData[`authorizedPickup${n}Phone`] = get(`authorizedPickup${n}Phone`)
      if (get(`authorizedPickup${n}Relation`) !== undefined) pbData[`authorizedPickup${n}Relation`] = get(`authorizedPickup${n}Relation`)
    }
    
    console.log('📤 映射后的 PB 数据:', pbData)
    
    const response = await fetch('/api/students', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        ...pbData
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '更新学生失败')
    }
    
    const result = await response.json()
    console.log('✅ 学生更新成功:', result.student)
    
    return result.student
  } catch (error) {
    console.error('❌ 更新学生失败:', error)
    throw new Error(`更新学生失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 删除学生 - 通过 proxy API 调用 PocketBase DELETE
export const deleteStudent = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ 软删除学生:', id)
    const response = await fetch(`/api/pocketbase-proxy/api/collections/students/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'deleted' })
    })
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData?.message || `HTTP ${response.status}`)
    }
    console.log('✅ 学生已标记删除:', id)
  } catch (error) {
    console.error('❌ 删除学生失败:', error)
    throw new Error(`删除学生失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 根据ID获取学生
export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    console.log(`获取学生 ${id}...`)
    
    // 使用API路由获取所有学生数据，然后过滤出指定ID的学生
    const response = await fetch('/api/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || '获取学生失败')
    }
    
    const students = data.students || []
    
    // 查找指定ID的学生
    const student = students.find((s: any) => s.id === id)
    
    if (!student) {
      console.log('学生不存在')
      return null
    }
    
    // 转换数据格式
    const formattedStudent: Student = {
      id: student.id,
      
      // 基本信息
      student_id: student.student_id,
      student_name: student.name,
      dob: student.dob,
      father_name: student.fatherName,
      mother_name: student.motherName,
      father_phone: student.fatherPhone,
      mother_phone: student.motherPhone,
      home_address: student.address,
      gender: student.gender,
      serviceType: student.serviceType,
      register_form_url: student.register_form_url,
      standard: student.standard,
      level: student.level,
      center: student.expand?.centerId?.code || student.center || '',
      centerId: student.centerId || '',

      // 扩展信息
      nric: student.nric,
      school: student.school,
      parentPhone: student.parentPhone,
      emergencyContact: student.emergencyContact,
      emergencyPhone: student.emergencyPhone,
      healthInfo: student.healthInfo,
      pickupMethod: student.pickupMethod,
      
      // 接送安排
      authorizedPickup1Name: student.authorizedPickup1Name,
      authorizedPickup1Phone: student.authorizedPickup1Phone,
      authorizedPickup1Relation: student.authorizedPickup1Relation,
      authorizedPickup2Name: student.authorizedPickup2Name,
      authorizedPickup2Phone: student.authorizedPickup2Phone,
      authorizedPickup2Relation: student.authorizedPickup2Relation,
      authorizedPickup3Name: student.authorizedPickup3Name,
      authorizedPickup3Phone: student.authorizedPickup3Phone,
      authorizedPickup3Relation: student.authorizedPickup3Relation,
      
      // 注册和费用信息
      registrationDate: student.registrationDate,
      tuitionStatus: student.tuitionStatus,
      birthCertificate: student.birthCert || student.birthCertificate,
      avatar: getAvatarUrl(student),
      
      // 考勤相关字段
      cardNumber: student.cardNumber,
      cardType: student.cardType,
      studentUrl: student.studentUrl,
      balance: student.balance,
      status: student.status || 'active',
      issuedDate: student.issuedDate,
      expiryDate: student.expiryDate,
      enrollmentDate: student.enrollmentDate,
      phone: student.phone,
      email: student.email,
      parentName: student.parentName,
      address: student.address,
      medicalInfo: student.medicalInfo,
      notes: student.notes,
      usageCount: student.usageCount || 0,
      lastUsed: student.lastUsed,
      
      // 系统字段
      created: student.created,
      updated: student.updated,
    }
    
    console.log('学生数据获取成功')
    return formattedStudent
    
  } catch (error: any) {
    console.error('获取学生失败:', error)
    throw new Error(`获取学生失败: ${error.message}`)
  }
}

// 搜索学生
export const searchStudents = async (query: string): Promise<Student[]> => {
  try {
    console.log(`搜索学生: ${query}`)
    
    // 使用API路由搜索学生，确保数据一致性
    const response = await fetch(`/api/students?search=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || '搜索学生失败')
    }
    
    const students = data.students || []
    console.log(`搜索到 ${students.length} 个学生`)
    
    // 转换数据格式
    const formattedStudents: Student[] = students.map((record: any) => ({
      id: record.id,
      
      // 基本信息
      student_id: record.student_id,
      student_name: record.student_name,
      dob: record.dob,
      father_phone: record.father_phone,
      mother_phone: record.mother_phone,
      home_address: record.home_address,
      gender: record.gender,
      serviceType: record.serviceType,
      register_form_url: record.register_form_url,
      standard: record.standard,
      level: record.level,
      center: record.center,
      
      // 扩展信息
      nric: record.nric,
      school: record.school,
      parentPhone: record.parentPhone,
      emergencyContact: record.emergencyContact,
      emergencyPhone: record.emergencyPhone,
      healthInfo: record.healthInfo,
      pickupMethod: record.pickupMethod,
      
      // 接送安排
      authorizedPickup1Name: record.authorizedPickup1Name,
      authorizedPickup1Phone: record.authorizedPickup1Phone,
      authorizedPickup1Relation: record.authorizedPickup1Relation,
      authorizedPickup2Name: record.authorizedPickup2Name,
      authorizedPickup2Phone: record.authorizedPickup2Phone,
      authorizedPickup2Relation: record.authorizedPickup2Relation,
      authorizedPickup3Name: record.authorizedPickup3Name,
      authorizedPickup3Phone: record.authorizedPickup3Phone,
      authorizedPickup3Relation: record.authorizedPickup3Relation,
      
      // 注册和费用信息
      registrationDate: record.registrationDate,
      tuitionStatus: record.tuitionStatus,
      birthCertificate: record.birthCert || record.birthCertificate,
      avatar: getAvatarUrl(record),
      
      // 考勤相关字段
      cardNumber: record.cardNumber,
      cardType: record.cardType,
      studentUrl: record.studentUrl,
      balance: record.balance,
      status: record.status || 'active',
      issuedDate: record.issuedDate,
      expiryDate: record.expiryDate,
      enrollmentDate: record.enrollmentDate,
      phone: record.phone,
      email: record.email,
      parentName: record.parentName,
      address: record.address,
      medicalInfo: record.medicalInfo,
      notes: record.notes,
      usageCount: record.usageCount || 0,
      lastUsed: record.lastUsed,
      
      // 系统字段
      created: record.created,
      updated: record.updated,
    }))
    
    return formattedStudents
    
  } catch (error: any) {
    console.error('搜索学生失败:', error)
    throw new Error(`搜索学生失败: ${error.message}`)
  }
}

// 根据中心获取学生
export const getStudentsByCenter = async (center: string): Promise<Student[]> => {
  try {
    console.log(`获取中心 ${center} 的学生...`)
    
    // 使用API路由获取学生数据，确保数据一致性
    const response = await fetch(`/api/students?center=${encodeURIComponent(center)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || '获取学生数据失败')
    }
    
    const students = data.students || []
    console.log(`中心 ${center} 有 ${students.length} 个学生`)
    
    // 转换数据格式
    const formattedStudents: Student[] = students.map((record: any) => ({
      id: record.id,
      
      // 基本信息
      student_id: record.student_id,
      student_name: record.student_name,
      dob: record.dob,
      father_phone: record.father_phone,
      mother_phone: record.mother_phone,
      home_address: record.home_address,
      gender: record.gender,
      serviceType: record.serviceType,
      register_form_url: record.register_form_url,
      standard: record.standard,
      level: record.level,
      center: record.center,
      
      // 扩展信息
      nric: record.nric,
      school: record.school,
      parentPhone: record.parentPhone,
      emergencyContact: record.emergencyContact,
      emergencyPhone: record.emergencyPhone,
      healthInfo: record.healthInfo,
      pickupMethod: record.pickupMethod,
      
      // 接送安排
      authorizedPickup1Name: record.authorizedPickup1Name,
      authorizedPickup1Phone: record.authorizedPickup1Phone,
      authorizedPickup1Relation: record.authorizedPickup1Relation,
      authorizedPickup2Name: record.authorizedPickup2Name,
      authorizedPickup2Phone: record.authorizedPickup2Phone,
      authorizedPickup2Relation: record.authorizedPickup2Relation,
      authorizedPickup3Name: record.authorizedPickup3Name,
      authorizedPickup3Phone: record.authorizedPickup3Phone,
      authorizedPickup3Relation: record.authorizedPickup3Relation,
      
      // 注册和费用信息
      registrationDate: record.registrationDate,
      tuitionStatus: record.tuitionStatus,
      birthCertificate: record.birthCert || record.birthCertificate,
      avatar: getAvatarUrl(record),
      
      // 考勤相关字段
      cardNumber: record.cardNumber,
      cardType: record.cardType,
      studentUrl: record.studentUrl,
      balance: record.balance,
      status: record.status || 'active',
      issuedDate: record.issuedDate,
      expiryDate: record.expiryDate,
      enrollmentDate: record.enrollmentDate,
      phone: record.phone,
      email: record.email,
      parentName: record.parentName,
      address: record.address,
      medicalInfo: record.medicalInfo,
      notes: record.notes,
      usageCount: record.usageCount || 0,
      lastUsed: record.lastUsed,
      
      // 系统字段
      created: record.created,
      updated: record.updated,
    }))
    
    return formattedStudents
    
  } catch (error: any) {
    console.error('获取中心学生失败:', error)
    throw new Error(`获取中心学生失败: ${error.message}`)
  }
}

// 根据状态获取学生
export const getStudentsByStatus = async (status: string): Promise<Student[]> => {
  try {
    console.log(`获取状态为 ${status} 的学生...`)
    
    // 使用API路由获取学生数据，确保数据一致性
    const response = await fetch(`/api/students?status=${encodeURIComponent(status)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || '获取学生数据失败')
    }
    
    const students = data.students || []
    console.log(`状态为 ${status} 的学生有 ${students.length} 个`)
    
    // 转换数据格式
    const formattedStudents: Student[] = students.map((record: any) => ({
      id: record.id,
      
      // 基本信息
      student_id: record.student_id,
      student_name: record.student_name,
      dob: record.dob,
      father_phone: record.father_phone,
      mother_phone: record.mother_phone,
      home_address: record.home_address,
      gender: record.gender,
      serviceType: record.serviceType,
      register_form_url: record.register_form_url,
      standard: record.standard,
      level: record.level,
      center: record.center,
      
      // 扩展信息
      nric: record.nric,
      school: record.school,
      parentPhone: record.parentPhone,
      emergencyContact: record.emergencyContact,
      emergencyPhone: record.emergencyPhone,
      healthInfo: record.healthInfo,
      pickupMethod: record.pickupMethod,
      
      // 接送安排
      authorizedPickup1Name: record.authorizedPickup1Name,
      authorizedPickup1Phone: record.authorizedPickup1Phone,
      authorizedPickup1Relation: record.authorizedPickup1Relation,
      authorizedPickup2Name: record.authorizedPickup2Name,
      authorizedPickup2Phone: record.authorizedPickup2Phone,
      authorizedPickup2Relation: record.authorizedPickup2Relation,
      authorizedPickup3Name: record.authorizedPickup3Name,
      authorizedPickup3Phone: record.authorizedPickup3Phone,
      authorizedPickup3Relation: record.authorizedPickup3Relation,
      
      // 注册和费用信息
      registrationDate: record.registrationDate,
      tuitionStatus: record.tuitionStatus,
      birthCertificate: record.birthCert || record.birthCertificate,
      avatar: getAvatarUrl(record),
      
      // 考勤相关字段
      cardNumber: record.cardNumber,
      cardType: record.cardType,
      studentUrl: record.studentUrl,
      balance: record.balance,
      status: record.status || 'active',
      issuedDate: record.issuedDate,
      expiryDate: record.expiryDate,
      enrollmentDate: record.enrollmentDate,
      phone: record.phone,
      email: record.email,
      parentName: record.parentName,
      address: record.address,
      medicalInfo: record.medicalInfo,
      notes: record.notes,
      usageCount: record.usageCount || 0,
      lastUsed: record.lastUsed,
      
      // 系统字段
      created: record.created,
      updated: record.updated,
    }))
    
    return formattedStudents
    
  } catch (error: any) {
    console.error('获取状态学生失败:', error)
    throw new Error(`获取状态学生失败: ${error.message}`)
  }
}
