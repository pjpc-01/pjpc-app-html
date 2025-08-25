import PocketBase from 'pocketbase'
import { getPocketBase } from './pocketbase'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// 融合的学生数据接口 - 包含基本信息和打卡信息
export interface Student {
  id: string // students 的 ID
  
  // 基本信息 (来自 students 集合)
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
  // 新增字段
  nric?: string
  school?: string
  parentPhone?: string
  emergencyContact?: string
  emergencyPhone?: string
  healthInfo?: string
  pickupMethod?: 'parent' | 'guardian' | 'authorized' | 'public' | 'walking'
  // 接送安排 - 方式A：固定字段（最多3个授权接送人）
  authorizedPickup1Name?: string
  authorizedPickup1Phone?: string
  authorizedPickup1Relation?: string
  authorizedPickup2Name?: string
  authorizedPickup2Phone?: string
  authorizedPickup2Relation?: string
  authorizedPickup3Name?: string
  authorizedPickup3Phone?: string
  authorizedPickup3Relation?: string
  registrationDate?: string
  tuitionStatus?: 'pending' | 'paid' | 'partial' | 'overdue'
  birthCertificate?: string | null // 对应PocketBase的birthCert字段
  avatar?: string | null // 对应PocketBase的photo字段
  
  // 打卡信息 (来自 students 集合)
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
  // 新增字段
  nric?: string
  school?: string
  parentPhone?: string
  emergencyContact?: string
  emergencyPhone?: string
  healthInfo?: string
  pickupMethod?: 'parent' | 'guardian' | 'authorized' | 'public' | 'walking'
  // 接送安排 - 方式A：固定字段（最多3个授权接送人）
  authorizedPickup1Name?: string
  authorizedPickup1Phone?: string
  authorizedPickup1Relation?: string
  authorizedPickup2Name?: string
  authorizedPickup2Phone?: string
  authorizedPickup2Relation?: string
  authorizedPickup3Name?: string
  authorizedPickup3Phone?: string
  authorizedPickup3Relation?: string
  registrationDate?: string
  tuitionStatus?: 'pending' | 'paid' | 'partial' | 'overdue'
  birthCertificate?: string | null // 对应PocketBase的birthCert字段
  avatar?: string | null // 对应PocketBase的photo字段
  
  // 打卡信息
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
}

export interface StudentUpdateData extends Partial<StudentCreateData> {
  id: string
}

// 获取所有学生 - 从统一的 students 集合获取数据
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
    
    // 获取 students 集合数据
    console.log('从 students 集合获取数据...')
    const studentsResponse = await pb.collection('students').getList(1, 500, {
      sort: 'student_name',
      $autoCancel: false
    })
    
    const students = studentsResponse.items || []
    
    console.log(`获取到 ${students.length} 个学生数据`)
    
    // 转换为 Student 接口格式
    const formattedStudents: Student[] = students.map((student: any) => ({
      id: student.id,
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
      nric: student.nric,
      school: student.school,
      parentPhone: student.parents_phone,
      emergencyContact: student.emergencyContact,
      emergencyPhone: student.emergencyPhone,
      healthInfo: student.healthInfo,
      pickupMethod: student.pickupMethod,
      authorizedPickup1Name: student.authorizedPickup1Name,
      authorizedPickup1Phone: student.authorizedPickup1Phone,
      authorizedPickup1Relation: student.authorizedPickup1Relation,
      authorizedPickup2Name: student.authorizedPickup2Name,
      authorizedPickup2Phone: student.authorizedPickup2Phone,
      authorizedPickup2Relation: student.authorizedPickup2Relation,
      authorizedPickup3Name: student.authorizedPickup3Name,
      authorizedPickup3Phone: student.authorizedPickup3Phone,
      authorizedPickup3Relation: student.authorizedPickup3Relation,
      registrationDate: student.registrationDate,
      tuitionStatus: student.tuitionStatus,
      birthCertificate: student.birthCert,
      avatar: student.photo,
      cardNumber: student.cardNumber,
      cardType: student.cardType,
      studentUrl: student.studentUrl,
      balance: student.balance,
      status: student.status,
      issuedDate: student.issuedDate,
      expiryDate: student.expiryDate,
      enrollmentDate: student.enrollmentDate,
      phone: student.phone,
      email: student.email,
      parentName: student.parents_name,
      address: student.address,
      medicalInfo: student.medicalInfo,
      notes: student.notes,
      usageCount: student.usageCount,
      lastUsed: student.lastUsed,
      created: student.created,
      updated: student.updated
    }))
    
    console.log(`成功获取 ${formattedStudents.length} 个学生数据`)
    return formattedStudents
  } catch (error: any) {
    console.error('获取学生数据失败:', error)
    throw error
  }
}

// 根据年级获取学生
export const getStudentsByGrade = async (standard: string): Promise<Student[]> => {
  try {
    // 检查认证状态
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
    
    // 从统一的students集合中查找学生
    const records = await pb.collection('students').getList(1, 1000, {
      filter: `standard = "${standard}"`,
      sort: 'student_name',
      $autoCancel: false
    })
    
    console.log(`✅ 根据年级 "${standard}" 获取到 ${records.items.length} 个学生`)
    return records.items as unknown as Student[]
  } catch (error) {
    console.error('❌ 根据年级获取学生失败:', error)
    throw new Error('根据年级获取学生失败')
  }
}

// 添加学生
export const addStudent = async (studentData: StudentCreateData): Promise<Student> => {
  try {
    console.log('准备添加学生数据:', studentData)
    
    // 检查认证状态
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
    
    // 准备完整的学生数据
    const completeStudentData = {
      ...studentData,
      // 确保有默认的center值
      center: studentData.center || 'WX 01',
      // 根据年级自动设置level
      level: studentData.level || (parseInt(studentData.standard || '0') <= 6 ? 'primary' : 'secondary'),
      // 确保有默认的注册日期
      registrationDate: studentData.registrationDate || new Date().toISOString().split('T')[0],
      // 确保有默认的学费状态
      tuitionStatus: studentData.tuitionStatus || 'pending',
      // 字段映射：将前端字段映射到PocketBase字段
      birthCert: studentData.birthCertificate, // birthCertificate -> birthCert
      photo: studentData.avatar, // avatar -> photo
      // 家长信息字段映射
      parents_name: studentData.parentName, // parentName -> parents_name
      parents_phone: studentData.parentPhone, // parentPhone -> parents_phone
      // 其他字段映射
      school: studentData.school, // school -> school
      gender: studentData.gender, // gender -> gender
      nric: studentData.nric, // nric -> nric
      pickupMethod: studentData.pickupMethod // pickupMethod -> pickupMethod
    } as any
    
    // 移除前端字段，避免PocketBase错误
    delete completeStudentData.birthCertificate
    delete completeStudentData.avatar
    delete completeStudentData.parentName
    delete completeStudentData.parentPhone
    
    console.log(`添加到students集合`)
    
    // 在students集合中创建记录
    const studentRecord = await pb.collection('students').create(completeStudentData)
    console.log('在students集合中添加学生成功:', studentRecord)
    
    // 返回学生数据
    return {
      ...studentRecord,
      id: studentRecord.id
    } as unknown as Student
  } catch (error: any) {
    console.error('添加学生失败:', error)
    console.error('错误详情:', {
      status: error?.status,
      message: error?.message,
      data: error?.data,
      name: error?.name
    })
    
    if (error.data) {
      const data = error.data
      console.error('验证错误详情:', data)
      
      if (data.student_name) {
        throw new Error(`姓名错误: ${data.student_name.message}`)
      } else if (data.student_id) {
        throw new Error(`学号错误: ${data.student_id.message}`)
      } else if (data.standard) {
        throw new Error(`年级错误: ${data.standard.message}`)
      } else if (data.message) {
        throw new Error(`添加失败: ${data.message}`)
      }
    }
    
    throw new Error(`添加学生失败: ${error.message || '未知错误'}`)
  }
}

// 更新学生信息
export const updateStudent = async (studentData: StudentUpdateData): Promise<Student> => {
  const { id, ...updateData } = studentData
  
  try {
    console.log('准备更新学生，ID:', id, '数据:', updateData)
    
    // 检查认证状态
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
    
    // 首先检查学生是否存在
    try {
      const existingRecord = await pb.collection('students').getOne(id)
      console.log('找到现有学生记录:', existingRecord)
    } catch (getError: any) {
      console.error('学生记录不存在:', getError)
      throw new Error(`学生记录不存在 (ID: ${id})`)
    }
    
    // 字段映射：将前端字段映射到PocketBase字段
    const mappedUpdateData = { ...updateData } as any
    if (updateData.birthCertificate !== undefined) {
      mappedUpdateData.birthCert = updateData.birthCertificate
      delete mappedUpdateData.birthCertificate
    }
    if (updateData.avatar !== undefined) {
      mappedUpdateData.photo = updateData.avatar
      delete mappedUpdateData.avatar
    }
    if (updateData.parentName !== undefined) {
      mappedUpdateData.parents_name = updateData.parentName
      delete mappedUpdateData.parentName
    }
    if (updateData.parentPhone !== undefined) {
      mappedUpdateData.parents_phone = updateData.parentPhone
      delete mappedUpdateData.parentPhone
    }
    // 其他字段映射（这些字段名称相同，但确保类型正确）
    if (updateData.school !== undefined) {
      mappedUpdateData.school = updateData.school
    }
    if (updateData.gender !== undefined) {
      mappedUpdateData.gender = updateData.gender
    }
    if (updateData.nric !== undefined) {
      mappedUpdateData.nric = updateData.nric
    }
    if (updateData.pickupMethod !== undefined) {
      mappedUpdateData.pickupMethod = updateData.pickupMethod
    }
    
    console.log('映射后的更新数据:', mappedUpdateData)
    
    // 更新学生记录
    const record = await pb.collection('students').update(id, mappedUpdateData)
    
    return record as unknown as Student
  } catch (error: any) {
    console.error('更新学生信息失败:', error)
    
    // 简化错误处理，只显示主要错误信息
    if (error.data) {
      const data = error.data
      const errorMessages = []
      
      if (data.student_name?.message) errorMessages.push(`姓名: ${data.student_name.message}`)
      if (data.student_id?.message) errorMessages.push(`学号: ${data.student_id.message}`)
      if (data.standard?.message) errorMessages.push(`年级: ${data.standard.message}`)
      if (data.center?.message) errorMessages.push(`中心: ${data.center.message}`)
      if (data.serviceType?.message) errorMessages.push(`服务类型: ${data.serviceType.message}`)
      if (data.gender?.message) errorMessages.push(`性别: ${data.gender.message}`)
      if (data.dob?.message) errorMessages.push(`出生日期: ${data.dob.message}`)
      if (data.nric?.message) errorMessages.push(`NRIC/护照: ${data.nric.message}`)
      if (data.school?.message) errorMessages.push(`学校: ${data.school.message}`)
      if (data.parentPhone?.message) errorMessages.push(`父母电话: ${data.parentPhone.message}`)
      if (data.emergencyContact?.message) errorMessages.push(`紧急联络人: ${data.emergencyContact.message}`)
      if (data.emergencyPhone?.message) errorMessages.push(`紧急联络电话: ${data.emergencyPhone.message}`)
      if (data.message) errorMessages.push(data.message)
      
      if (errorMessages.length > 0) {
        throw new Error(`更新失败: ${errorMessages.join(', ')}`)
      }
    }
    
    throw new Error(`更新学生信息失败: ${error.message || '未知错误'}`)
  }
}

// 删除学生
export const deleteStudent = async (studentId: string): Promise<void> => {
  try {
    // 检查认证状态
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
    
    // 从统一的students集合删除学生
    await pb.collection('students').delete(studentId)
  } catch (error) {
    console.error('删除学生失败:', error)
    throw new Error('删除学生失败')
  }
}

// 搜索学生
export const searchStudents = async (query: string): Promise<Student[]> => {
  try {
    // 检查认证状态
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
    
    // 从统一的students集合搜索学生
    const records = await pb.collection('students').getList(1, 100, {
      filter: `student_name ~ "${query}" || student_id ~ "${query}"`,
      sort: 'student_name',
      $autoCancel: false
    })
    
    console.log(`✅ 搜索 "${query}" 找到 ${records.items.length} 个学生`)
    return records.items as unknown as Student[]
  } catch (error) {
    console.error('❌ 搜索学生失败:', error)
    throw new Error('搜索学生失败')
  }
}

// 获取学生统计信息
export const getStudentStats = async () => {
  try {
    // 检查认证状态
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
    
    const allStudents = await getAllStudents()
    
    const stats = {
      total: allStudents.length,
      byStandard: {} as Record<string, number>
    }
    
    // 按年级统计
    allStudents.forEach(student => {
      const standard = student.standard || '未知年级'
      if (stats.byStandard[standard]) {
        stats.byStandard[standard]++
      } else {
        stats.byStandard[standard] = 1
      }
    })
    
    return stats
  } catch (error) {
    console.error('获取学生统计失败:', error)
    throw new Error('获取学生统计失败')
  }
}
