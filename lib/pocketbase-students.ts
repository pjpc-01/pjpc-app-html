import { pb } from './pocketbase'

export interface Student {
  id: string
  student_id: string
  student_name: string
  dob?: string
  father_phone?: string
  mother_phone?: string
  home_address?: string
  gender?: string
  register_form_url?: string
  standard: string
  created: string
  updated: string
}

export interface StudentCreateData {
  student_id: string
  student_name: string
  dob?: string
  father_phone?: string
  mother_phone?: string
  home_address?: string
  gender?: string
  register_form_url?: string
  standard: string
}

export interface StudentUpdateData extends Partial<StudentCreateData> {
  id: string
}

// 获取所有学生
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    // 检查认证状态 - 如果未认证，尝试管理员认证
    if (!pb.authStore.isValid) {
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      } catch (authError) {
        // 尝试使用用户认证
        try {
          await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        } catch (userAuthError) {
          throw new Error('无法认证访问学生数据')
        }
      }
    }
    
    // 分别获取两个集合
    let primaryList: any[] = []
    try {
      primaryList = await pb.collection('primary_students').getFullList({
        sort: 'student_name',
        $autoCancel: false
      })
    } catch (primaryError) {
      primaryList = []
    }

    let secondaryList: any[] = []
    try {
      secondaryList = await pb.collection('secondary_students').getFullList({
        sort: 'student_name',
        $autoCancel: false
      })
    } catch (secondaryError) {
      secondaryList = []
    }

    const allStudents = [...primaryList, ...secondaryList]
    
    // 确保返回的是数组
    if (!Array.isArray(allStudents)) {
      return []
    }
    
    return allStudents as Student[]
  } catch (error: any) {
    throw error
  }
}

// 根据年级获取学生
export const getStudentsByGrade = async (standard: string): Promise<Student[]> => {
  try {
    // 检查认证状态
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试管理员认证...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('管理员认证成功')
      } catch (authError) {
        console.error('管理员认证失败:', authError)
        throw new Error('无法认证访问学生数据')
      }
    }
    
    // 从两个集合中查找学生，使用Promise.all并行获取
    const [primaryRecords, secondaryRecords] = await Promise.all([
      pb.collection('primary_students').getList(1, 1000, {
        filter: `standard = "${standard}"`,
        sort: 'student_name',
        $autoCancel: false
      }),
      pb.collection('secondary_students').getList(1, 1000, {
        filter: `standard = "${standard}"`,
        sort: 'student_name',
        $autoCancel: false
      })
    ])
    
    // 合并结果
    const allStudents = [
      ...(primaryRecords.items || []),
      ...(secondaryRecords.items || [])
    ]
    
    console.log(`✅ 根据年级 "${standard}" 获取到 ${allStudents.length} 个学生`)
    return allStudents as Student[]
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
      console.log('用户未认证，尝试管理员认证...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('管理员认证成功')
      } catch (authError) {
        console.error('管理员认证失败:', authError)
        throw new Error('无法认证访问学生数据')
      }
    }
    
    // 根据年级决定添加到哪个集合
    const standard = studentData.standard
    const isPrimary = standard.includes('小学') || parseInt(standard) <= 6
    
    const collectionName = isPrimary ? 'primary_students' : 'secondary_students'
    console.log(`添加到集合: ${collectionName}`)
    
    const record = await pb.collection(collectionName).create(studentData)
    console.log('添加学生成功:', record)
    return record as Student
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
      console.log('用户未认证，尝试管理员认证...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('管理员认证成功')
      } catch (authError) {
        console.error('管理员认证失败:', authError)
        throw new Error('无法认证访问学生数据')
      }
    }
    
    // 需要先找到学生在哪个集合中
    let record = null
    
    try {
      // 先尝试在小学集合中查找
      record = await pb.collection('primary_students').getOne(id)
      record = await pb.collection('primary_students').update(id, updateData)
    } catch (error) {
      // 如果不在小学集合中，尝试中学集合
      try {
        record = await pb.collection('secondary_students').getOne(id)
        record = await pb.collection('secondary_students').update(id, updateData)
      } catch (secondaryError) {
        throw new Error('找不到指定的学生记录')
      }
    }
    
    return record as Student
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
      console.log('用户未认证，尝试管理员认证...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('管理员认证成功')
      } catch (authError) {
        console.error('管理员认证失败:', authError)
        throw new Error('无法认证访问学生数据')
      }
    }
    
    // 需要先找到学生在哪个集合中
    try {
      // 先尝试在小学集合中查找
      await pb.collection('primary_students').getOne(studentId)
      await pb.collection('primary_students').delete(studentId)
    } catch (error) {
      // 如果不在小学集合中，尝试中学集合
      try {
        await pb.collection('secondary_students').getOne(studentId)
        await pb.collection('secondary_students').delete(studentId)
      } catch (secondaryError) {
        throw new Error('找不到指定的学生记录')
      }
    }
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
      console.log('用户未认证，尝试管理员认证...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('管理员认证成功')
      } catch (authError) {
        console.error('管理员认证失败:', authError)
        throw new Error('无法认证访问学生数据')
      }
    }
    
    // 从两个集合中搜索学生，使用Promise.all并行获取
    const [primaryRecords, secondaryRecords] = await Promise.all([
      pb.collection('primary_students').getList(1, 100, {
        filter: `student_name ~ "${query}" || student_id ~ "${query}"`,
        sort: 'student_name',
        $autoCancel: false
      }),
      pb.collection('secondary_students').getList(1, 100, {
        filter: `student_name ~ "${query}" || student_id ~ "${query}"`,
        sort: 'student_name',
        $autoCancel: false
      })
    ])
    
    // 合并结果
    const allStudents = [
      ...(primaryRecords.items || []),
      ...(secondaryRecords.items || [])
    ]
    
    console.log(`✅ 搜索 "${query}" 找到 ${allStudents.length} 个学生`)
    return allStudents as Student[]
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
      console.log('用户未认证，尝试管理员认证...')
      try {
        await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('管理员认证成功')
      } catch (authError) {
        console.error('管理员认证失败:', authError)
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
      if (stats.byStandard[student.standard]) {
        stats.byStandard[student.standard]++
      } else {
        stats.byStandard[student.standard] = 1
      }
    })
    
    return stats
  } catch (error) {
    console.error('获取学生统计失败:', error)
    throw new Error('获取学生统计失败')
  }
}
