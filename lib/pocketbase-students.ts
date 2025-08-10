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
    console.log('开始获取学生列表...')
    console.log('PocketBase认证状态:', pb.authStore.isValid)
    console.log('当前用户:', pb.authStore.model)
    
    // 检查认证状态 - 如果未认证，尝试匿名访问
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试匿名访问...')
    }
    
    // 添加重试机制
    let retries = 3
    let lastError = null
    
    while (retries > 0) {
      try {
        console.log(`尝试获取学生列表 (重试 ${4-retries}/3)...`)
        
        const records = await pb.collection('students').getList(1, 1000, {
          sort: 'student_name'
        })
        
        console.log('PocketBase返回的完整记录:', records)
        console.log('records.items:', records.items)
        console.log('records.items.length:', records.items.length)
        console.log('records.data:', records.data)
        console.log('records.data.items:', records.data?.items)
        console.log('records.data.items.length:', records.data?.items?.length)
        
        // 根据控制台日志，数据在 records.data.items 中
        const items = records.data?.items || records.items || []
        console.log('最终使用的items:', items)
        console.log('最终items长度:', items.length)
        console.log('成功获取学生列表:', items.length, '个学生')
        console.log('第一个学生示例:', items[0])
        
        return items as Student[]
      } catch (error: any) {
        lastError = error
        console.error(`获取学生列表失败 (重试 ${4-retries}/3):`, error)
        console.error('错误详情:', {
          status: error.status,
          message: error.message,
          data: error.data,
          name: error.name
        })
        retries--
        
        if (retries > 0) {
          console.log(`等待1秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    // 所有重试都失败了
    console.error('获取学生列表失败，所有重试都失败:', lastError)
    console.error('错误详情:', {
      status: lastError?.status,
      message: lastError?.message,
      data: lastError?.data,
      name: lastError?.name
    })
    
    let errorMessage = '获取学生列表失败'
    
    if (lastError?.status === 0) {
      errorMessage = '网络连接失败，请检查网络连接'
    } else if (lastError?.status === 403) {
      errorMessage = '权限不足，无法访问学生列表'
    } else if (lastError?.status === 401) {
      errorMessage = '认证失败，请重新登录'
    } else if (lastError?.status === 404) {
      errorMessage = 'students集合不存在，请检查PocketBase设置'
    } else if (lastError?.data) {
      errorMessage = `获取失败: ${lastError.data.message || lastError.message}`
    }
    
    throw new Error(errorMessage)
  } catch (error: any) {
    console.error('获取学生列表失败:', error)
    throw error
  }
}

// 根据年级获取学生
export const getStudentsByGrade = async (standard: string): Promise<Student[]> => {
  try {
    const records = await pb.collection('students').getList(1, 1000, {
      filter: `standard = "${standard}"`,
      sort: 'student_name'
    })
    return records.items as Student[]
  } catch (error) {
    console.error('根据年级获取学生失败:', error)
    throw new Error('根据年级获取学生失败')
  }
}

// 添加学生
export const addStudent = async (studentData: StudentCreateData): Promise<Student> => {
  try {
    console.log('准备添加学生数据:', studentData)
    const record = await pb.collection('students').create(studentData)
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
    const record = await pb.collection('students').update(id, updateData)
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
    await pb.collection('students').delete(studentId)
  } catch (error) {
    console.error('删除学生失败:', error)
    throw new Error('删除学生失败')
  }
}

// 搜索学生
export const searchStudents = async (query: string): Promise<Student[]> => {
  try {
    const records = await pb.collection('students').getList(1, 100, {
      filter: `student_name ~ "${query}" || student_id ~ "${query}"`,
      sort: 'student_name'
    })
    return records.items as Student[]
  } catch (error) {
    console.error('搜索学生失败:', error)
    throw new Error('搜索学生失败')
  }
}

// 获取学生统计信息
export const getStudentStats = async () => {
  try {
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
