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

// 获取所有学生 - 直接从 students 集合获取
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    console.log('开始获取学生数据...')
    
        // 确保认证
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试用户认证...')
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('用户认证成功')
      } catch (authError) {
        console.error('用户认证失败:', authError)
        throw new Error('无法认证访问学生数据')
      }
    }
    
    // 直接从 students 集合获取所有数据
    console.log('从 students 集合获取学生数据...')
    const studentsResponse = await pb.collection('students').getList(1, 500, {
      sort: 'student_name',
      $autoCancel: false
    })
    
    const students = studentsResponse.items || []
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
    
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      throw new Error('用户未认证')
    }
    
    // 准备要保存的数据
    const dataToSave = {
       ...studentData,
      // 确保必填字段存在
      student_name: studentData.student_name || '未命名学生',
      status: studentData.status || 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    
    console.log('保存学生数据:', dataToSave)
    
    const record = await pb.collection('students').create(dataToSave)
    console.log('学生添加成功:', record.id)
    
    // 返回添加后的学生数据
    const newStudent = await getStudentById(record.id)
    if (!newStudent) {
      throw new Error('无法获取新添加的学生数据')
    }
    return newStudent
    
  } catch (error: any) {
    console.error('添加学生失败:', error)
    throw new Error(`添加学生失败: ${error.message}`)
  }
}

// 更新学生
export const updateStudent = async (id: string, studentData: StudentUpdateData): Promise<Student> => {
  try {
    console.log(`开始更新学生 ${id}...`)
    
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      throw new Error('用户未认证')
    }
    
    // 准备更新数据
    const updateData = {
      ...studentData,
      updated: new Date().toISOString(),
    }
    
    console.log('更新学生数据:', updateData)
    
    await pb.collection('students').update(id, updateData)
    console.log('学生更新成功')
    
    // 返回更新后的学生数据
    const updatedStudent = await getStudentById(id)
    if (!updatedStudent) {
      throw new Error('无法获取更新后的学生数据')
    }
    return updatedStudent
    
  } catch (error: any) {
    console.error('更新学生失败:', error)
    throw new Error(`更新学生失败: ${error.message}`)
  }
}

// 删除学生
export const deleteStudent = async (id: string): Promise<void> => {
  try {
    console.log(`开始删除学生 ${id}...`)
    
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      throw new Error('用户未认证')
    }
    
    await pb.collection('students').delete(id)
    console.log('学生删除成功')
    
  } catch (error: any) {
    console.error('删除学生失败:', error)
    throw new Error(`删除学生失败: ${error.message}`)
  }
}

// 根据ID获取学生
export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    console.log(`获取学生 ${id}...`)
    
    const pb = await getPb()
    if (!pb.authStore.isValid) {
      throw new Error('用户未认证')
    }
    
    const record = await pb.collection('students').getOne(id)
    
    if (!record) {
      console.log('学生不存在')
      return null
    }
    
    // 转换数据格式
    const student: Student = {
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
    }
    
    console.log('学生数据获取成功')
    return student
    
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
