import PocketBase from 'pocketbase'
import { getPocketBase } from './pocketbase'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// 融合的学生数据接口 - 包含基本信息和打卡信息
export interface Student {
  id: string
  
  // 基本信息 (来自 students 集合)
  student_id?: string
  student_name?: string
  dob?: string
  father_phone?: string
  mother_phone?: string
  home_address?: string
  gender?: string
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
      
      // 融合数据
      return {
        id: card.id,
        // 基本信息（优先使用 students 集合的数据，如果没有则使用 students_card 的数据）
        student_id: card.studentId,
        student_name: card.studentName,
        dob: student?.dob,
        father_phone: student?.father_phone,
        mother_phone: student?.mother_phone,
        home_address: student?.home_address,
        gender: student?.gender,
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
    
    const record = await pb.collection('students').create(completeStudentData)
    console.log('添加学生成功:', record)
    return record as unknown as Student
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
  try {
    const { id, ...updateData } = studentData
    
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
    
    // 从统一的students集合更新学生
    const record = await pb.collection('students').update(id, updateData)
    
    return record as unknown as Student
  } catch (error: any) {
    console.error('更新学生信息失败:', error)
    
    if (error.data) {
      const data = error.data
      if (data.student_name) {
        throw new Error(`姓名错误: ${data.student_name.message}`)
      } else if (data.student_id) {
        throw new Error(`学号错误: ${data.student_id.message}`)
      }
    }
    
    throw new Error('更新学生信息失败')
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
