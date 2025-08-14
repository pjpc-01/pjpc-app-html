import { pb } from './pocketbase'

export interface Student {
  id: string
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
  created: string
  updated: string
}

export interface StudentCreateData {
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
}

export interface StudentUpdateData extends Partial<StudentCreateData> {
  id: string
}

// 获取所有学生
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    console.log('开始获取所有学生...')
    console.log('当前认证状态:', pb.authStore.isValid)
    console.log('当前认证用户:', pb.authStore.model)
    console.log('PocketBase URL:', pb.baseUrl)
    
    // 检查认证状态 - 如果未认证，尝试用户认证
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试用户认证...')
      try {
        const authResult = await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('用户认证成功:', authResult)
        console.log('认证后状态:', pb.authStore.isValid)
      } catch (authError) {
        console.error('用户认证失败:', authError)
        throw new Error('无法认证访问学生数据')
      }
    } else {
      console.log('用户已认证，跳过认证步骤')
    }
    
    console.log('从students集合获取数据...')
    // 从统一的students集合获取所有学生
    const response = await pb.collection('students').getList(1, 500, {
      sort: 'student_name',
      $autoCancel: false
    })
    
    console.log('PocketBase响应详情:', response)
    console.log('PocketBase响应items:', response.items)
    console.log('PocketBase响应items长度:', response.items.length)
    console.log('PocketBase响应data:', (response as any).data)
    
    // 从response.data中获取items数组
    const students = (response as any).data?.items || response.items || []
    
    console.log('获取到的学生数据:', students)
    
    // 确保返回的是数组
    if (!Array.isArray(students)) {
      console.log('返回的数据不是数组，返回空数组')
      return []
    }
    
    console.log(`成功获取到 ${students.length} 个学生`)
    return students as unknown as Student[]
  } catch (error: any) {
    console.error('获取所有学生失败:', error)
    throw error
  }
}

// 根据年级获取学生
export const getStudentsByGrade = async (standard: string): Promise<Student[]> => {
  try {
    // 检查认证状态
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
