import PocketBase from 'pocketbase'
import { getPocketBase } from './pocketbase'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// 统一的学生数据接口 - 所有数据来自 students 集合
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
  
  // 考勤相关字段（新增到students集合）
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
}

export interface StudentUpdateData extends Partial<StudentCreateData> {
  id: string
}

// 获取所有学生 - 通过API路由获取，避免客户端认证问题
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    console.log('开始获取学生数据...')
    
    // 使用API路由获取学生数据，避免客户端认证问题
    console.log('通过API路由获取学生数据...')
    const response = await fetch('/api/students/list', {
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
    console.log(`获取到 ${students.length} 个学生数据`)
    
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
      student_name: student.student_name,
      dob: student.dob,
      father_phone: student.father_phone,
      mother_phone: student.mother_phone,
      home_address: student.home_address,
      gender: student.gender,
      serviceType: student.serviceType,
      register_form_url: student.register_form_url,
      standard: student.standard,
      level: student.level,
      center: student.center,
      
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
      avatar: student.photo || student.avatar,
      
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
    
    // 准备要保存的数据
    const dataToSave = {
      ...studentData,
      // 确保必填字段存在
      student_name: studentData.student_name || '未命名学生',
      status: studentData.status || 'active',
    }
    
    console.log('保存学生数据:', dataToSave)
    
    // 使用API路由添加学生
    const response = await fetch('/api/students/list', {
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
      student_name: data.student.student_name,
      center: data.student.center,
      status: data.student.status,
      standard: data.student.standard,
      studentUrl: data.student.studentUrl,
      created: data.student.created,
      updated: data.student.updated,
      // 添加其他默认字段
      dob: studentData.dob,
      father_phone: studentData.father_phone,
      mother_phone: studentData.mother_phone,
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

// 更新学生 - 暂时禁用，需要创建相应的API端点
export const updateStudent = async (id: string, studentData: StudentUpdateData): Promise<Student> => {
  throw new Error('更新学生功能暂时不可用，需要创建相应的API端点')
}

// 删除学生 - 暂时禁用，需要创建相应的API端点
export const deleteStudent = async (id: string): Promise<void> => {
  throw new Error('删除学生功能暂时不可用，需要创建相应的API端点')
}

// 根据ID获取学生
export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    console.log(`获取学生 ${id}...`)
    
    // 使用API路由获取所有学生数据，然后过滤出指定ID的学生
    const response = await fetch('/api/students/list', {
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
      student_name: student.student_name,
      dob: student.dob,
      father_phone: student.father_phone,
      mother_phone: student.mother_phone,
      home_address: student.home_address,
      gender: student.gender,
      serviceType: student.serviceType,
      register_form_url: student.register_form_url,
      standard: student.standard,
      level: student.level,
      center: student.center,
      
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
      avatar: student.photo || student.avatar,
      
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
    
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      throw new Error('用户未认证')
    }
    
    // 使用PocketBase的搜索功能
    const records = await pb.collection('students').getList(1, 50, {
      filter: `student_name ~ "${query}" || student_id ~ "${query}" || school ~ "${query}"`,
      sort: 'student_name',
      $autoCancel: false
    })
    
    const students = records.items || []
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
      avatar: record.photo || record.avatar,
      
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
    
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      throw new Error('用户未认证')
    }
    
    const records = await pb.collection('students').getList(1, 500, {
      filter: `center = "${center}"`,
      sort: 'student_name',
      $autoCancel: false
    })
    
    const students = records.items || []
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
      avatar: record.photo || record.avatar,
      
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
    
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      throw new Error('用户未认证')
    }
    
    const records = await pb.collection('students').getList(1, 500, {
      filter: `status = "${status}"`,
      sort: 'student_name',
      $autoCancel: false
    })
    
    const students = records.items || []
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
      avatar: record.photo || record.avatar,
      
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
