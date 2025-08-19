import PocketBase from 'pocketbase'
import { getPocketBase } from './pocketbase'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// 融合的学生数据接口 - 包含基本信息和打卡信息
export interface Student {
  id: string // students_card 的 ID
  studentRecordId?: string // students 的 ID，用于更新操作
  
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
  Center?: 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04'
  
  // 打卡信息 (来自 students_card 集合)
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
  parentPhone?: string
  address?: string
  emergencyContact?: string
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
  Center?: 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04'
  
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
  parentPhone?: string
  address?: string
  emergencyContact?: string
  medicalInfo?: string
  notes?: string
}

export interface StudentUpdateData extends Partial<StudentCreateData> {
  id: string
}

// 获取所有学生 - 融合 students 和 students_card 数据
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    console.log('开始获取融合的学生数据...')
    
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
    console.log('从 students 集合获取基本数据...')
    const studentsResponse = await pb.collection('students').getList(1, 500, {
      sort: 'student_name',
      $autoCancel: false
    })
    
    // 获取 students_card 集合数据
    console.log('从 students_card 集合获取打卡数据...')
    const cardsResponse = await pb.collection('students_card').getList(1, 500, {
      sort: 'studentName',
      $autoCancel: false
    })
    
    const students = studentsResponse.items || []
    const cards = cardsResponse.items || []
    
    console.log(`获取到 ${students.length} 个学生基本数据`)
    console.log(`获取到 ${cards.length} 个学生打卡数据`)
    
    // 融合数据：以 students_card 为基础，合并 students 数据
    const mergedStudents: Student[] = cards.map((card: any) => {
      // 查找对应的学生基本数据（通过姓名匹配）
      const student = students.find((s: any) => 
        s.student_name === card.studentName
      )
      
      console.log(`匹配学生: ${card.studentName} - 找到基本数据: ${!!student}`)
      if (student) {
        console.log(`学生 ${card.studentName} 的serviceType:`, student.serviceType)
      }
      
      // 融合数据
      return {
        id: card.id, // 这是 students_card 的 ID
        studentRecordId: student?.id, // 这是 students 的 ID，用于更新操作
        // 基本信息（优先使用 students 集合的数据，如果没有则使用 students_card 的数据）
        student_id: card.studentId,
        student_name: card.studentName,
        dob: student?.dob,
        father_phone: student?.father_phone,
        mother_phone: student?.mother_phone,
        home_address: student?.home_address,
        gender: student?.gender,
        serviceType: student?.serviceType,
        register_form_url: student?.register_form_url,
        standard: student?.standard,
        level: student?.level,
        Center: card.center || student?.center,
        // 打卡信息（来自 students_card）
        cardNumber: card.cardNumber,
        cardType: card.cardType,
        studentUrl: card.studentUrl,
        balance: card.balance,
        status: card.status,
        issuedDate: card.issuedDate,
        expiryDate: card.expiryDate,
        enrollmentDate: card.enrollmentDate,
        phone: card.phone,
        email: card.email,
        parentName: card.parentName,
        parentPhone: card.parentPhone,
        address: card.address,
        emergencyContact: card.emergencyContact,
        medicalInfo: card.medicalInfo,
        notes: card.notes,
        usageCount: card.usageCount,
        lastUsed: card.lastUsed,
        // 系统字段
        created: card.created,
        updated: card.updated
      }
    })
    
    console.log(`成功融合 ${mergedStudents.length} 个学生数据`)
    return mergedStudents
  } catch (error: any) {
    console.error('获取融合学生数据失败:', error)
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
      // 确保有默认的Center值
      Center: studentData.Center || 'WX 01',
      // 根据年级自动设置level
      level: studentData.level || (parseInt(studentData.standard || '0') <= 6 ? 'primary' : 'secondary')
    }
    
    console.log(`添加到students集合`)
    
    // 首先在students集合中创建记录
    const studentRecord = await pb.collection('students').create(completeStudentData)
    console.log('在students集合中添加学生成功:', studentRecord)
    
    // 然后在students_card集合中创建对应的记录
    const cardData = {
      studentName: studentRecord.student_name,
      studentId: studentRecord.student_id,
      center: studentRecord.Center,
      cardNumber: studentRecord.student_id, // 使用学号作为卡号
      cardType: 'NFC',
      status: 'active',
      balance: 0,
      enrollmentDate: new Date().toISOString().split('T')[0],
      phone: studentRecord.father_phone || studentRecord.mother_phone,
      email: studentRecord.email,
      parentName: studentRecord.parentName,
      parentPhone: studentRecord.father_phone || studentRecord.mother_phone,
      address: studentRecord.home_address
    }
    
    console.log(`添加到students_card集合`)
    const cardRecord = await pb.collection('students_card').create(cardData)
    console.log('在students_card集合中添加学生成功:', cardRecord)
    
    // 返回融合后的数据
    return {
      ...studentRecord,
      id: cardRecord.id, // 使用card的ID作为主ID
      studentRecordId: studentRecord.id // 保存student的ID
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
    
    // 确定要更新的集合和ID
    // 如果这是融合数据中的ID（来自students_card），我们需要找到对应的students记录
    let targetId = id
    let targetCollection = 'students'
    
    // 检查这个ID是否存在于students_card集合中
    try {
      const cardRecord = await pb.collection('students_card').getOne(id)
      console.log('找到students_card记录:', cardRecord)
      
      // 通过姓名查找对应的students记录
      const studentsResponse = await pb.collection('students').getList(1, 1, {
        filter: `student_name = "${cardRecord.studentName}"`,
        $autoCancel: false
      })
      
      if (studentsResponse.items.length > 0) {
        targetId = studentsResponse.items[0].id
        console.log('找到对应的students记录ID:', targetId)
      } else {
        throw new Error(`找不到对应的students记录 (姓名: ${cardRecord.studentName})`)
      }
    } catch (cardError: any) {
      // 如果ID不在students_card中，假设它在students中
      console.log('ID不在students_card中，假设在students中:', id)
    }
    
    // 首先检查学生是否存在
    try {
      const existingRecord = await pb.collection(targetCollection).getOne(targetId)
      console.log('找到现有学生记录:', existingRecord)
    } catch (getError: any) {
      console.error('学生记录不存在:', getError)
      throw new Error(`学生记录不存在 (ID: ${targetId})`)
    }
    
    // 更新学生记录
    const record = await pb.collection(targetCollection).update(targetId, updateData)
    
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
      if (data.Center?.message) errorMessages.push(`中心: ${data.Center.message}`)
      if (data.serviceType?.message) errorMessages.push(`服务类型: ${data.serviceType.message}`)
      if (data.gender?.message) errorMessages.push(`性别: ${data.gender.message}`)
      if (data.dob?.message) errorMessages.push(`出生日期: ${data.dob.message}`)
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
