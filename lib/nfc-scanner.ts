// NFC扫描工具函数
// 提供标准化的NFC扫描和用户查找功能

import { generateIdentifierVariants } from '@/lib/uid-normalizer'

// NFC扫描结果接口
export interface NFCScanResult {
  success: boolean
  data?: string
  tagId?: string
  error?: string
}

// 用户查找结果接口
export interface UserMatchResult {
  id: string
  name: string
  type: 'student' | 'teacher'
  center?: string
  status?: string
  matchedField: string
}

// 检查NFC支持
export function checkNFCSupport(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window
}

// 检查HTTPS环境
export function checkHttpsEnvironment(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
}

// 标准化NFC扫描函数
export async function scanNfcTag(): Promise<NFCScanResult> {
  try {
    // 检查环境支持
    if (!checkHttpsEnvironment()) {
      return {
        success: false,
        error: 'NFC需要HTTPS环境'
      }
    }

    if (!checkNFCSupport()) {
      return {
        success: false,
        error: '此设备或浏览器不支持NFC'
      }
    }

    // 创建NDEFReader实例
    const reader = new (window as any).NDEFReader()
    
    // 启动扫描
    await reader.scan()
    
    // 返回Promise，等待NFC标签读取
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reader.abort()
        resolve({
          success: false,
          error: 'NFC扫描超时，请重试'
        })
      }, 10000) // 10秒超时

      reader.addEventListener('reading', (event: any) => {
        clearTimeout(timeout)
        
        try {
          const { message } = event
          let nfcData = ""
          let tagId = ""
          
          // 提取标签ID
          if (event.serialNumber) {
            tagId = event.serialNumber
          }
          
          // 解析NDEF记录
          for (const record of message.records) {
            if (record.recordType === "url") {
              nfcData = record.data ? new TextDecoder().decode(record.data) : ""
            } else if (record.recordType === "text") {
              nfcData = record.data ? new TextDecoder().decode(record.data) : ""
            } else if (record.recordType === "empty") {
              // 空记录，尝试从标签ID获取数据
              nfcData = tagId
            }
          }
          
          // 如果没有从记录中获取到数据，使用标签ID
          if (!nfcData && tagId) {
            nfcData = tagId
          }
          
          resolve({
            success: true,
            data: nfcData,
            tagId: tagId
          })
        } catch (error) {
          resolve({
            success: false,
            error: `NFC数据解析失败: ${error}`
          })
        }
      })

      reader.addEventListener('readingerror', (event: any) => {
        clearTimeout(timeout)
        resolve({
          success: false,
          error: `NFC读取错误: ${event.error}`
        })
      })
    })
    
  } catch (error) {
    return {
      success: false,
      error: `NFC扫描启动失败: ${error}`
    }
  }
}

// 通过NFC数据查找学生
export function findStudentByNfcData(
  nfcData: string, 
  students: any[], 
  centerId?: string
): UserMatchResult | null {
  if (!nfcData || !students || students.length === 0) {
    return null
  }

  const identifier = nfcData.trim()
  
  // 生成NFC数据格式变体
  const nfcVariants = generateIdentifierVariants(identifier).all
  
  console.log('🔍 查找学生，NFC数据:', identifier)
  console.log('🔍 数据格式变体:', nfcVariants)
  console.log('🔍 学生总数:', students.length)
  
  // 方法1: 通过cardNumber匹配（学生的主要身份识别方式）
  for (const variant of nfcVariants) {
    const foundStudent = students.find(s => s.cardNumber === variant)
    if (foundStudent) {
      console.log('✅ 通过cardNumber找到学生:', foundStudent.student_name, '(格式:', variant, ')')
      return {
        id: foundStudent.student_id || foundStudent.id,
        name: foundStudent.student_name,
        type: 'student',
        center: foundStudent.center,
        status: foundStudent.status,
        matchedField: 'cardNumber'
      }
    }
  }

  // 方法2: 通过cardNumber匹配（备用方式）
  for (const variant of nfcVariants) {
    const foundStudent = students.find(s => s.cardNumber === variant)
    if (foundStudent) {
      console.log('✅ 通过cardNumber找到学生:', foundStudent.student_name, '(格式:', variant, ')')
      return {
        id: foundStudent.student_id || foundStudent.id,
        name: foundStudent.student_name,
        type: 'student',
        center: foundStudent.center,
        status: foundStudent.status,
        matchedField: 'cardNumber'
      }
    }
  }
  
  // 方法3: 通过student_id匹配（备用方式）
  for (const variant of nfcVariants) {
    const foundStudent = students.find(s => s.student_id === variant)
    if (foundStudent) {
      console.log('✅ 通过student_id找到学生:', foundStudent.student_name, '(格式:', variant, ')')
      return {
        id: foundStudent.student_id || foundStudent.id,
        name: foundStudent.student_name,
        type: 'student',
        center: foundStudent.center,
        status: foundStudent.status,
        matchedField: 'student_id'
      }
    }
  }

  console.log('❌ 未找到匹配的学生')
  return null
}

// 通过NFC数据查找教师
export function findTeacherByNfcData(
  nfcData: string, 
  teachers: any[], 
  centerId?: string
): UserMatchResult | null {
  if (!nfcData || !teachers || teachers.length === 0) {
    return null
  }

  const identifier = nfcData.trim()
  
  // 生成NFC数据格式变体
  const nfcVariants = generateIdentifierVariants(identifier).all
  
  console.log('🔍 查找教师，NFC数据:', identifier)
  console.log('🔍 数据格式变体:', nfcVariants)
  console.log('🔍 教师总数:', teachers.length)
  
  // 方法1: 通过cardNumber匹配（教师的主要身份识别方式）
  for (const variant of nfcVariants) {
    const foundTeacher = teachers.find(t => t.cardNumber === variant)
    if (foundTeacher) {
      console.log('✅ 通过cardNumber找到教师:', foundTeacher.name || foundTeacher.teacher_name, '(格式:', variant, ')')
      return {
        id: foundTeacher.id,
        name: foundTeacher.name || foundTeacher.teacher_name,
        type: 'teacher',
        center: foundTeacher.center,
        status: foundTeacher.status,
        matchedField: 'cardNumber'
      }
    }
  }

  // 方法2: 通过teacher_id匹配（备用方式）
  for (const variant of nfcVariants) {
    const foundTeacher = teachers.find(t => t.teacher_id === variant)
    if (foundTeacher) {
      console.log('✅ 通过teacher_id找到教师:', foundTeacher.name || foundTeacher.teacher_name, '(格式:', variant, ')')
      return {
        id: foundTeacher.id,
        name: foundTeacher.name || foundTeacher.teacher_name,
        type: 'teacher',
        center: foundTeacher.center,
        status: foundTeacher.status,
        matchedField: 'teacher_id'
      }
    }
  }

  console.log('❌ 未找到匹配的教师')
  return null
}

// 通过NFC数据查找用户（学生或教师）
export function findUserByNfcData(
  nfcData: string, 
  students: any[], 
  teachers: any[], 
  centerId?: string
): UserMatchResult | null {
  // 先尝试查找学生
  const student = findStudentByNfcData(nfcData, students, centerId)
  if (student) {
    return student
  }

  // 再尝试查找教师
  const teacher = findTeacherByNfcData(nfcData, teachers, centerId)
  if (teacher) {
    return teacher
  }

  return null
}

// 处理NFC考勤的完整流程
export async function processNFCAttendance(
  nfcData: string,
  students: any[],
  teachers: any[],
  centerId: string,
  deviceInfo?: {
    deviceId: string
    deviceName: string
  }
): Promise<{
  success: boolean
  user?: UserMatchResult
  error?: string
}> {
  try {
    // 查找用户
    const user = findUserByNfcData(nfcData, students, teachers, centerId)
    
    if (!user) {
      return {
        success: false,
        error: '未找到对应的学生或教师信息'
      }
    }

    // 验证用户状态
    if (user.status && user.status !== 'active') {
      return {
        success: false,
        error: `${user.type === 'student' ? '学生' : '教师'}状态异常: ${user.status}`
      }
    }

    return {
      success: true,
      user: user
    }
  } catch (error) {
    return {
      success: false,
      error: `处理NFC考勤失败: ${error}`
    }
  }
}

// 导出所有函数
export default {
  checkNFCSupport,
  checkHttpsEnvironment,
  scanNfcTag,
  findStudentByNfcData,
  findTeacherByNfcData,
  findUserByNfcData,
  processNFCAttendance
}
