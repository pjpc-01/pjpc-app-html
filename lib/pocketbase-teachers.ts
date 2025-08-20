import PocketBase from 'pocketbase'
import { getPocketBase } from './pocketbase'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// 教师数据接口 - 匹配 PocketBase 实际字段
export interface Teacher {
  id: string
  name?: string
  email?: string
  phone?: string
  department?: string
  status?: 'active' | 'inactive'
  epfNo?: number
  socsoNo?: number
  bankName?: string
  bankAccountNo?: number
  bankAccountName?: string
  hireDate?: string
  idNumber?: number
  
  // 系统字段
  created: string
  updated: string
}

export interface TeacherCreateData {
  // 基本表单字段
  teacher_name?: string
  teacher_id?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  epfNo?: string
  socsoNo?: string
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
  
  // 新增字段
  taxNo?: string
  isCitizen?: boolean
  marriedStatus?: boolean
  totalChild?: number
  accountNo?: string
  // 银行信息
  bankName?: string
  bankAccountName?: string
  bankAccountNo?: string
}

export interface TeacherUpdateData extends Partial<TeacherCreateData> {
  id: string
}

// 获取所有教师
export const getAllTeachers = async (): Promise<Teacher[]> => {
  try {
    const pb = await getPb()
    
    // 使用管理员认证
    try {
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('getAllTeachers - 管理员认证成功')
    } catch (adminAuthError) {
      console.error('getAllTeachers - 管理员认证失败:', adminAuthError)
      throw new Error('无法认证访问教师数据')
    }
    
    // 获取教师数据
    const response = await pb.collection('teachers').getList(1, 1000, {
      sort: 'name',
      $autoCancel: false
    })
    
    console.log(`✅ 获取到 ${response.items.length} 个教师数据`)
    console.log('原始数据示例:', response.items[0])
    
    // 将 PocketBase 数据映射回应用格式
    const mappedTeachers = response.items.map((item: any) => {
      // 解析 notes 字段中的额外信息
      let isCitizen = undefined
      let marriedStatus = undefined
      let totalChild = undefined
      
      if (item.notes) {
        const notesParts = item.notes.split(',')
        notesParts.forEach(part => {
          const trimmed = part.trim()
          if (trimmed.startsWith('Citizen:')) {
            isCitizen = trimmed.includes('Yes')
          } else if (trimmed.startsWith('Married:')) {
            marriedStatus = trimmed.includes('Yes')
          } else if (trimmed.startsWith('Children:')) {
            totalChild = parseInt(trimmed.replace('Children:', '').trim()) || 0
          }
        })
      }
      
      return {
        id: item.id,
        teacher_name: item.name,
        teacher_id: item.epfNo?.toString(),
        email: item.email,
        phone: item.phone,
        department: item.department,
        position: item.position || '',
        subjects: item.department ? [item.department] : [],
        experience: item.socsoNo,
        status: item.status,
        joinDate: item.hireDate || item.joinDate || '',
        epfNo: item.epfNo?.toString() || '',
        socsoNo: item.socsoNo?.toString() || '',
        lastActive: '',
        courses: 0,
        students: 0,
        address: item.address || '',
        emergencyContact: item.emergencyContact || '',
        notes: item.notes || '',
        // 新增字段 - 从对应的 PocketBase 字段读取
        taxNo: item.taxNo || '',
        isCitizen: item.isCitizen !== undefined ? item.isCitizen : isCitizen,
        marriedStatus: item.marriedStatus !== undefined ? item.marriedStatus : marriedStatus,
        totalChild: item.totalChild !== undefined ? item.totalChild : totalChild,
        accountNo: item.accountNo || '',
        // 银行信息
        bankName: item.bankName || '',
        bankAccountName: item.bankAccountName || '',
        bankAccountNo: item.bankAccountNo || '',
        created: item.created,
        updated: item.updated
      }
    })
    
    return mappedTeachers as unknown as Teacher[]
  } catch (error: any) {
    console.error('❌ 获取教师数据失败:', error)
    console.error('错误详情:', {
      message: error.message,
      data: error.data,
      status: error.status,
      response: error.response,
      url: error.url
    })
    
    // 如果是 PocketBase 错误，尝试获取更详细的信息
    if (error.data && error.data.message) {
      console.error('PocketBase 错误消息:', error.data.message)
    }
    if (error.data && error.data.data) {
      console.error('PocketBase 错误数据:', error.data.data)
    }
    
    throw new Error('获取教师数据失败')
  }
}

// 添加教师
export const addTeacher = async (teacherData: TeacherCreateData): Promise<Teacher> => {
  try {
    const pb = await getPb()
    
    // 使用管理员认证
    try {
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('addTeacher - 管理员认证成功')
    } catch (adminAuthError) {
      console.error('addTeacher - 管理员认证失败:', adminAuthError)
      throw new Error('无法认证访问教师数据')
    }
    
    console.log('准备添加教师:', teacherData)
    console.log('教师数据类型:', typeof teacherData)
    console.log('教师数据字段:', Object.keys(teacherData))
    
    // 数据映射和清理 - 将表单字段映射到 PocketBase 字段
    const cleanData: any = {}
    
    // 映射字段名称
    if (teacherData.teacher_name) cleanData.name = teacherData.teacher_name
    if (teacherData.email) cleanData.email = teacherData.email
    if (teacherData.phone) cleanData.phone = teacherData.phone
    if (teacherData.department) cleanData.department = teacherData.department
    if (teacherData.position) cleanData.position = teacherData.position
    if (teacherData.teacher_id) cleanData.epfNo = parseInt(teacherData.teacher_id) || 0
    if (teacherData.address) cleanData.address = teacherData.address
    if (teacherData.emergencyContact) cleanData.emergencyContact = teacherData.emergencyContact
    if (teacherData.notes) cleanData.notes = teacherData.notes
    
    // 映射新增字段到对应的 PocketBase 字段
    if (teacherData.taxNo) cleanData.taxNo = teacherData.taxNo
    if (teacherData.accountNo) cleanData.accountNo = teacherData.accountNo
    if (teacherData.joinDate) cleanData.hireDate = teacherData.joinDate
    if (teacherData.isCitizen !== undefined) cleanData.isCitizen = teacherData.isCitizen
    if (teacherData.marriedStatus !== undefined) cleanData.marriedStatus = teacherData.marriedStatus
    if (teacherData.totalChild !== undefined) cleanData.totalChild = teacherData.totalChild
    // 银行信息
    if (teacherData.bankName) cleanData.bankName = teacherData.bankName
    if (teacherData.bankAccountName) cleanData.bankAccountName = teacherData.bankAccountName
    if (teacherData.bankAccountNo) cleanData.bankAccountNo = teacherData.bankAccountNo
    // EPF 和 SOCSO 号码
    if (teacherData.epfNo) cleanData.epfNo = parseInt(teacherData.epfNo) || 0
    if (teacherData.socsoNo) cleanData.socsoNo = parseInt(teacherData.socsoNo) || 0
    
    // 将其他信息存储到 notes 字段
    const additionalInfo = []
    if (teacherData.isCitizen !== undefined) {
      additionalInfo.push(`Citizen: ${teacherData.isCitizen ? 'Yes' : 'No'}`)
    }
    if (teacherData.marriedStatus !== undefined) {
      additionalInfo.push(`Married: ${teacherData.marriedStatus ? 'Yes' : 'No'}`)
    }
    if (teacherData.totalChild !== undefined) {
      additionalInfo.push(`Children: ${teacherData.totalChild}`)
    }
    
    if (additionalInfo.length > 0) {
      cleanData.notes = additionalInfo.join(', ')
    }
    
    // 设置默认值
    if (!cleanData.status) cleanData.status = 'active'
    
    // 移除 undefined 和 null 值
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined || cleanData[key] === null) {
        delete cleanData[key]
      }
    })
    
    console.log('清理后的数据:', cleanData)
    
    // 检查集合是否存在和权限
    try {
      const collections = await pb.collections.getList()
      const teachersCollection = collections.items.find(col => col.name === 'teachers')
      if (!teachersCollection) {
        throw new Error('teachers 集合不存在')
      }
      console.log('找到 teachers 集合:', teachersCollection.name)
      console.log('集合字段:', teachersCollection.schema)
      console.log('集合规则:', {
        createRule: teachersCollection.createRule,
        updateRule: teachersCollection.updateRule,
        deleteRule: teachersCollection.deleteRule,
        listRule: teachersCollection.listRule,
        viewRule: teachersCollection.viewRule
      })
    } catch (collectionError) {
      console.error('检查集合时出错:', collectionError)
    }
    
    // 创建教师记录
    const record = await pb.collection('teachers').create(cleanData)
    
    console.log('✅ 教师添加成功:', record)
    return record as unknown as Teacher
  } catch (error: any) {
    console.error('❌ 添加教师失败:', error)
    console.error('错误详情:', {
      message: error.message,
      data: error.data,
      status: error.status,
      response: error.response,
      url: error.url,
      isAborted: error.isAborted,
      originalError: error.originalError
    })
    
    // 如果是 PocketBase 错误，尝试获取更详细的信息
    if (error.data && error.data.message) {
      console.error('PocketBase 错误消息:', error.data.message)
    }
    if (error.data && error.data.data) {
      console.error('PocketBase 错误数据:', error.data.data)
    }
    
    throw new Error(error.message || '添加教师失败')
  }
}

// 更新教师
export const updateTeacher = async (teacherData: TeacherUpdateData): Promise<Teacher> => {
  const { id, ...updateData } = teacherData
  try {
    const pb = await getPb()
    
    // 使用管理员认证
    try {
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('updateTeacher - 管理员认证成功')
    } catch (adminAuthError) {
      console.error('updateTeacher - 管理员认证失败:', adminAuthError)
      throw new Error('无法认证访问教师数据')
    }
    
    console.log('准备更新教师:', { id, updateData })
    console.log('原始更新数据字段:', Object.keys(updateData))
    
    // 映射更新数据到 PocketBase 字段
    const mappedUpdateData: any = {}
    
    if (updateData.teacher_name) mappedUpdateData.name = updateData.teacher_name
    if (updateData.email) mappedUpdateData.email = updateData.email
    if (updateData.phone) mappedUpdateData.phone = updateData.phone
    if (updateData.department) mappedUpdateData.department = updateData.department
    if (updateData.position) mappedUpdateData.position = updateData.position
    if (updateData.teacher_id) mappedUpdateData.epfNo = parseInt(updateData.teacher_id) || 0
    if (updateData.address) mappedUpdateData.address = updateData.address
    if (updateData.emergencyContact) mappedUpdateData.emergencyContact = updateData.emergencyContact
    if (updateData.notes) mappedUpdateData.notes = updateData.notes
    
    // 映射新增字段到对应的 PocketBase 字段
    if (updateData.taxNo) mappedUpdateData.taxNo = updateData.taxNo
    if (updateData.accountNo) mappedUpdateData.accountNo = updateData.accountNo
    if (updateData.joinDate) mappedUpdateData.hireDate = updateData.joinDate
    if (updateData.isCitizen !== undefined) mappedUpdateData.isCitizen = updateData.isCitizen
    if (updateData.marriedStatus !== undefined) mappedUpdateData.marriedStatus = updateData.marriedStatus
    if (updateData.totalChild !== undefined) mappedUpdateData.totalChild = updateData.totalChild
    // 银行信息
    if (updateData.bankName) mappedUpdateData.bankName = updateData.bankName
    if (updateData.bankAccountName) mappedUpdateData.bankAccountName = updateData.bankAccountName
    if (updateData.bankAccountNo) mappedUpdateData.bankAccountNo = updateData.bankAccountNo
    // EPF 和 SOCSO 号码
    if (updateData.epfNo) mappedUpdateData.epfNo = parseInt(updateData.epfNo) || 0
    if (updateData.socsoNo) mappedUpdateData.socsoNo = parseInt(updateData.socsoNo) || 0
    
    // 将其他信息存储到 notes 字段
    const additionalInfo = []
    if (updateData.isCitizen !== undefined) {
      additionalInfo.push(`Citizen: ${updateData.isCitizen ? 'Yes' : 'No'}`)
    }
    if (updateData.marriedStatus !== undefined) {
      additionalInfo.push(`Married: ${updateData.marriedStatus ? 'Yes' : 'No'}`)
    }
    if (updateData.totalChild !== undefined) {
      additionalInfo.push(`Children: ${updateData.totalChild}`)
    }
    
    if (additionalInfo.length > 0) {
      mappedUpdateData.notes = additionalInfo.join(', ')
    }
    
    // 移除 undefined 和 null 值
    Object.keys(mappedUpdateData).forEach(key => {
      if (mappedUpdateData[key] === undefined || mappedUpdateData[key] === null) {
        delete mappedUpdateData[key]
      }
    })
    
    console.log('映射后的更新数据:', mappedUpdateData)
    console.log('更新数据字段:', Object.keys(mappedUpdateData))
    
    // 检查记录是否存在并获取更新前的数据
    let existingRecord
    try {
      existingRecord = await pb.collection('teachers').getOne(id)
      console.log('找到现有记录:', existingRecord)
      console.log('更新前的department:', existingRecord.department)
      console.log('更新前的position:', existingRecord.position)
    } catch (getError) {
      console.error('获取现有记录失败:', getError)
      throw new Error('要更新的教师记录不存在')
    }
    
    // 更新教师记录
    console.log('尝试更新记录，ID:', id)
    console.log('更新数据:', JSON.stringify(mappedUpdateData, null, 2))
    
    const record = await pb.collection('teachers').update(id, mappedUpdateData)
    
    console.log('✅ 教师更新成功:', record)
    console.log('更新后的department:', record.department)
    console.log('更新后的position:', record.position)
    
    // 验证更新是否真的生效
    try {
      const verifyRecord = await pb.collection('teachers').getOne(id)
      console.log('验证更新后的记录:', verifyRecord)
      console.log('验证 - department:', verifyRecord.department)
      console.log('验证 - position:', verifyRecord.position)
    } catch (verifyError) {
      console.error('验证更新失败:', verifyError)
    }
    
    return record as unknown as Teacher
  } catch (error: any) {
    console.error('❌ 更新教师失败:', error)
    console.error('错误详情:', {
      message: error.message,
      data: error.data,
      status: error.status,
      response: error.response,
      url: error.url
    })
    
    // 如果是 PocketBase 错误，尝试获取更详细的信息
    if (error.data && error.data.message) {
      console.error('PocketBase 错误消息:', error.data.message)
    }
    if (error.data && error.data.data) {
      console.error('PocketBase 错误数据:', error.data.data)
      // 详细打印每个字段的错误
      Object.keys(error.data.data).forEach(field => {
        console.error(`字段 "${field}" 错误:`, error.data.data[field])
      })
    }
    
    throw new Error(error.message || '更新教师失败')
  }
}

// 删除教师
export const deleteTeacher = async (teacherId: string): Promise<void> => {
  try {
    const pb = await getPb()
    
    // 使用管理员认证
    try {
      await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!')
      console.log('deleteTeacher - 管理员认证成功')
    } catch (adminAuthError) {
      console.error('deleteTeacher - 管理员认证失败:', adminAuthError)
      throw new Error('无法认证访问教师数据')
    }
    
    console.log('准备删除教师:', teacherId)
    
    await pb.collection('teachers').delete(teacherId)
    
    console.log('✅ 教师删除成功')
  } catch (error: any) {
    console.error('❌ 删除教师失败:', error)
    throw new Error(error.message || '删除教师失败')
  }
}
