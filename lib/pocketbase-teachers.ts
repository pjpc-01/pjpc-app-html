import PocketBase from 'pocketbase'
import { getPocketBase } from './pocketbase'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// 教师数据接口
export interface Teacher {
  id: string
  teacher_id?: string
  teacher_name?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  subjects?: string[]
  experience?: number
  status?: 'active' | 'inactive' | 'on_leave'
  joinDate?: string
  lastActive?: string
  courses?: number
  students?: number
  address?: string
  emergencyContact?: string
  notes?: string
  
  // 系统字段
  created: string
  updated: string
}

export interface TeacherCreateData {
  teacher_id?: string
  teacher_name?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  subjects?: string[]
  experience?: number
  status?: 'active' | 'inactive' | 'on_leave'
  joinDate?: string
  lastActive?: string
  courses?: number
  students?: number
  address?: string
  emergencyContact?: string
  notes?: string
}

export interface TeacherUpdateData extends Partial<TeacherCreateData> {
  id: string
}

// 获取所有教师
export const getAllTeachers = async (): Promise<Teacher[]> => {
  try {
    const pb = await getPb()
    
    // 检查认证状态
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试用户认证...')
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('用户认证成功')
      } catch (authError) {
        console.error('用户认证失败:', authError)
        throw new Error('无法认证访问教师数据')
      }
    }
    
    // 获取教师数据
    const response = await pb.collection('teachers').getList(1, 1000, {
      sort: 'teacher_name',
      $autoCancel: false
    })
    
    console.log(`✅ 获取到 ${response.items.length} 个教师数据`)
    return response.items as unknown as Teacher[]
  } catch (error: any) {
    console.error('❌ 获取教师数据失败:', error)
    throw new Error('获取教师数据失败')
  }
}

// 添加教师
export const addTeacher = async (teacherData: TeacherCreateData): Promise<Teacher> => {
  try {
    const pb = await getPb()
    
    // 检查认证状态
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试用户认证...')
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('用户认证成功')
      } catch (authError) {
        console.error('用户认证失败:', authError)
        throw new Error('无法认证访问教师数据')
      }
    }
    
    console.log('准备添加教师:', teacherData)
    
    // 创建教师记录
    const record = await pb.collection('teachers').create(teacherData)
    
    console.log('✅ 教师添加成功:', record)
    return record as unknown as Teacher
  } catch (error: any) {
    console.error('❌ 添加教师失败:', error)
    throw new Error(error.message || '添加教师失败')
  }
}

// 更新教师
export const updateTeacher = async (teacherData: TeacherUpdateData): Promise<Teacher> => {
  const { id, ...updateData } = teacherData
  try {
    const pb = await getPb()
    
    // 检查认证状态
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试用户认证...')
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('用户认证成功')
      } catch (authError) {
        console.error('用户认证失败:', authError)
        throw new Error('无法认证访问教师数据')
      }
    }
    
    console.log('准备更新教师:', { id, updateData })
    
    const record = await pb.collection('teachers').update(id, updateData)
    
    console.log('✅ 教师更新成功:', record)
    return record as unknown as Teacher
  } catch (error: any) {
    console.error('❌ 更新教师失败:', error)
    throw new Error(error.message || '更新教师失败')
  }
}

// 删除教师
export const deleteTeacher = async (teacherId: string): Promise<void> => {
  try {
    const pb = await getPb()
    
    // 检查认证状态
    if (!pb.authStore.isValid) {
      console.log('用户未认证，尝试用户认证...')
      try {
        await pb.collection('users').authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
        console.log('用户认证成功')
      } catch (authError) {
        console.error('用户认证失败:', authError)
        throw new Error('无法认证访问教师数据')
      }
    }
    
    console.log('准备删除教师:', teacherId)
    
    await pb.collection('teachers').delete(teacherId)
    
    console.log('✅ 教师删除成功')
  } catch (error: any) {
    console.error('❌ 删除教师失败:', error)
    throw new Error(error.message || '删除教师失败')
  }
}
