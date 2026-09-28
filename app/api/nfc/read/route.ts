import { NextRequest, NextResponse } from 'next/server'
import { generateIdentifierVariants } from '@/lib/uid-normalizer'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')

// 解码NFC文本数据
function decodeNfcText(data: Uint8Array): string {
  try {
    const dec = new TextDecoder("utf-8")
    return dec.decode(data)
  } catch {
    return ""
  }
}

// 从URL中提取学生ID
function extractStudentId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('student_id')
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 NFC读取API请求开始')
    
    const body = await request.json()
    const { nfcData, deviceInfo, centerId, timestamp } = body
    
    if (!nfcData) {
      return NextResponse.json({ 
        success: false, 
        message: 'NFC数据不能为空' 
      }, { status: 400 })
    }

    console.log('📋 接收到的NFC数据:', {
      nfcData: nfcData.substring(0, 100) + '...',
      deviceInfo,
      centerId,
      timestamp
    })

    // 处理NFC数据 - 支持多种格式
    let identifier = nfcData.trim()
    let nfcType = 'raw'
    let rawNfcData = nfcData

    // 尝试从URL中提取ID（兼容旧系统）
    if (identifier.startsWith('http')) {
      const extractedId = extractStudentId(identifier)
      if (extractedId) {
        identifier = extractedId
        nfcType = 'url'
        console.log('🔗 从URL中提取ID:', extractedId)
      }
    }

    // 处理十进制NFC标签ID转换为十六进制格式
    if (/^\d+$/.test(identifier) && identifier.length >= 10) {
      try {
        // 将十进制转换为十六进制，然后格式化为标签ID格式
        const hex = BigInt(identifier).toString(16).toUpperCase()
        const formattedHex = hex.match(/.{1,2}/g)?.join(':') || hex
        console.log('🔄 十进制转十六进制:', identifier, '→', formattedHex)
        identifier = formattedHex
        nfcType = 'converted'
      } catch (error) {
        console.log('⚠️ 十进制转换失败，使用原始数据')
      }
    }

    console.log('🔍 处理后的标识符:', {
      identifier,
      type: nfcType,
      length: identifier.length
    })

    // 生成NFC数据格式变体（含大小端与补零）
    const nfcVariants = generateIdentifierVariants(identifier).all
    
    console.log('🔍 NFC数据格式变体:', nfcVariants)

    // 先尝试查找学生
    let user = null
    let userType = 'student'
    let matchedField = ''

    try {
      console.log('🔍 开始查找学生，使用标识符:', identifier)
      
      // 方法1: 优先通过cardNumber查找（学生的NFC卡片号）
      for (const variant of nfcVariants) {
        try {
          const studentsByCardNumber = await pb.collection('students').getList(1, 1, {
            filter: `cardNumber = "${variant}"`
          })
          
          if (studentsByCardNumber.items.length > 0) {
            user = studentsByCardNumber.items[0]
            matchedField = 'cardNumber'
            console.log('✅ 通过cardNumber找到学生:', user.student_name, '(格式:', variant, ')')
            break
          }
        } catch (error: any) {
          console.log('⚠️ cardNumber字段查询失败:', error.message)
        }
      }
      
      // 方法2: 通过student_id查找（备用方式）
      if (!user) {
        for (const variant of nfcVariants) {
          try {
            const studentsById = await pb.collection('students').getList(1, 1, {
              filter: `student_id = "${variant}"`
            })
            
            if (studentsById.items.length > 0) {
              user = studentsById.items[0]
              matchedField = 'student_id'
              console.log('✅ 通过student_id找到学生:', user.student_name, '(格式:', variant, ')')
              break
            }
          } catch (error: any) {
            console.log('⚠️ student_id字段查询失败:', error.message)
          }
        }
      }

    } catch (error: any) {
      console.error('查找学生失败:', error)
      // 如果是400错误，可能是字段不存在，尝试其他字段
      if (error.status === 400) {
        console.log('⚠️ 字段可能不存在，尝试其他查询方式')
        try {
          // 尝试通过student_id查找
          for (const variant of nfcVariants) {
            const studentsById = await pb.collection('students').getList(1, 1, {
              filter: `student_id = "${variant}"`
            })
            
            if (studentsById.items.length > 0) {
              user = studentsById.items[0]
              matchedField = 'student_id'
              console.log('✅ 通过student_id找到学生:', user.student_name, '(格式:', variant, ')')
              break
            }
          }
        } catch (fallbackError) {
          console.log('备用查询也失败:', fallbackError)
        }
      }
    }

    // 如果没找到学生，尝试查找教师
    if (!user) {
      try {
        console.log('🔍 开始查找教师，使用标识符:', identifier)
        
        // 教师查找 - 通过cardNumber字段（教师的NFC卡片号）
        for (const variant of nfcVariants) {
          const teachersByCardNumber = await pb.collection('teachers').getList(1, 1, {
            filter: `cardNumber = "${variant}"`
          })
          
          if (teachersByCardNumber.items.length > 0) {
            user = teachersByCardNumber.items[0]
            userType = 'teacher'
            matchedField = 'cardNumber'
            console.log('✅ 通过cardNumber找到教师:', user.name || user.teacher_name, '(格式:', variant, ')')
            break
          }
        }
        
        // 教师查找 - 通过teacher_id字段（备用方式）
        if (!user) {
          for (const variant of nfcVariants) {
            const teachersById = await pb.collection('teachers').getList(1, 1, {
              filter: `teacher_id = "${variant}"`
            })
            
            if (teachersById.items.length > 0) {
              user = teachersById.items[0]
              userType = 'teacher'
              matchedField = 'teacher_id'
              console.log('✅ 通过teacher_id找到教师:', user.name || user.teacher_name, '(格式:', variant, ')')
              break
            }
          }
        }

      } catch (error: any) {
        console.error('查找教师失败:', error)
      }
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: '未找到对应的学生或教师信息',
        nfcData: identifier,
        nfcType
      }, { status: 404 })
    }

    // 验证用户状态
    if (user.status && user.status !== 'active') {
      return NextResponse.json({ 
        success: false, 
        message: `${userType === 'student' ? '学生' : '教师'}状态异常: ${user.status}`,
        user: {
          id: user.id,
          name: user.student_name || user.name || user.teacher_name,
          status: user.status,
          type: userType
        }
      }, { status: 400 })
    }

    // 根据用户类型创建相应的考勤记录
    let attendanceRecord = null
    let action = ''
    const checkinTimestamp = timestamp || new Date().toISOString()

    try {
      if (userType === 'student') {
        // 学生智能签到/签退逻辑
        const studentId = user.student_id || user.id
        const today = new Date(checkinTimestamp).toISOString().split('T')[0]
        
        // 检查今天是否已有考勤记录
        const existingRecords = await pb.collection('student_attendance').getList(1, 1, {
          filter: `student_id = "${studentId}" && center = "${centerId || 'unknown'}" && date >= "${today} 00:00:00" && date <= "${today} 23:59:59"`,
          sort: '-created'
        })
        
        console.log('🔍 检查现有记录:', {
          studentId,
          centerId,
          today,
          existingCount: existingRecords.items.length,
          existingRecord: existingRecords.items[0] || null
        })
        
        let attendanceRecord = null
        
        if (existingRecords.items.length === 0) {
          // 第一次扫卡 - 签到
          const attendanceData = {
            student_id: studentId,
            student_name: user.student_name || user.name,
            center: centerId || 'unknown',
            branch_name: centerId || 'unknown',
            date: today,
            check_in: checkinTimestamp,
            check_out: null,
            status: 'present',
            notes: `NFC自动签到 - ${nfcType}`,
            teacher_id: 'system',
            teacher_name: '系统',
            device_info: JSON.stringify({
              deviceId: deviceInfo?.deviceId || 'unknown',
              deviceName: deviceInfo?.deviceName || 'NFC自动考勤',
              nfcType: nfcType,
              nfcData: identifier,
              rawNfcData: rawNfcData,
              matchedField: matchedField
            }),
            method: 'nfc_card_number'
          }
          
          attendanceRecord = await pb.collection('student_attendance').create(attendanceData)
          action = '签到'
          console.log('✅ 学生签到成功:', user.student_name)
          
        } else {
          // 已有记录，检查是否可以签退
          const existingRecord = existingRecords.items[0]
          
          console.log('🔍 检查现有记录状态:', {
            hasCheckIn: !!existingRecord.check_in,
            hasCheckOut: !!existingRecord.check_out,
            checkIn: existingRecord.check_in,
            checkOut: existingRecord.check_out
          })
          
          if (existingRecord.check_out) {
            // 已经完成签到签退，创建新的记录（允许多次签到签退）
            console.log('🔄 已有完整记录，创建新的签到记录...')
            
            const attendanceData = {
              student_id: studentId,
              student_name: user.student_name || user.name,
              center: centerId || 'unknown',
              branch_name: centerId || 'unknown',
              date: today,
              check_in: checkinTimestamp,
              check_out: null,
              status: 'present',
              notes: `NFC自动考勤 - ${nfcType} (第${existingRecords.items.length + 1}次)`,
              teacher_id: 'system',
              teacher_name: '系统',
              device_info: JSON.stringify({
                checkIn: {
                  deviceId: deviceInfo?.deviceId || 'unknown',
                  deviceName: deviceInfo?.deviceName || 'NFC自动考勤',
                  nfcType: nfcType,
                  nfcData: identifier,
                  rawNfcData: rawNfcData,
                  matchedField: matchedField,
                  timestamp: checkinTimestamp
                }
              }),
              method: 'nfc_card_number'
            }
            
            attendanceRecord = await pb.collection('student_attendance').create(attendanceData)
            action = '签到'
            console.log('✅ 学生新签到成功:', user.student_name || user.name)
            
          } else {
            // 可以签退
            console.log('🔄 开始执行签退更新...')
            
            const updateData = {
              check_out: checkinTimestamp,
              notes: existingRecord.notes + ` | NFC自动签退 - ${nfcType}`,
              device_info: JSON.stringify({
                ...JSON.parse(existingRecord.device_info || '{}'),
                checkOut: {
                  deviceId: deviceInfo?.deviceId || 'unknown',
                  deviceName: deviceInfo?.deviceName || 'NFC自动考勤',
                  nfcType: nfcType,
                  nfcData: identifier,
                  rawNfcData: rawNfcData,
                  matchedField: matchedField,
                  timestamp: checkinTimestamp
                }
              })
            }
            
            console.log('🔍 签退更新数据:', updateData)
            
            const updatedRecord = await pb.collection('student_attendance').update(existingRecord.id, updateData)
            
            console.log('✅ 签退更新结果:', updatedRecord)
            
            attendanceRecord = updatedRecord
            action = '签退'
            console.log('✅ 学生签退成功:', user.student_name)
          }
        }
        
      } else {
        // 教师智能签到/签退逻辑
        const teacherId = user.id
        const today = new Date(checkinTimestamp).toISOString().split('T')[0]
        
        // 检查今天是否已有考勤记录
        const existingRecords = await pb.collection('teacher_attendance').getList(1, 1, {
          filter: `teacher_id = "${teacherId}" && branch_code = "${centerId || 'unknown'}" && date >= "${today} 00:00:00" && date <= "${today} 23:59:59"`,
          sort: '-created'
        })
        
        let action = ''
        
        if (existingRecords.items.length === 0) {
          // 第一次扫卡 - 签到
          const teacherAttendanceData = {
            teacher_id: teacherId,
            teacher_name: user.name || user.teacher_name,
            branch_code: centerId || 'unknown',
            branch_name: centerId || 'unknown',
            date: today,
            check_in: checkinTimestamp,
            check_out: null,
            status: 'present',
            method: 'nfc_card_number',
            device_info: JSON.stringify({
              deviceId: deviceInfo?.deviceId || 'unknown',
              deviceName: deviceInfo?.deviceName || 'NFC自动考勤',
              nfcType: nfcType,
              nfcData: identifier,
              rawNfcData: rawNfcData,
              matchedField: matchedField
            }),
            notes: `教师NFC自动签到 - ${nfcType}`
          }
          
          attendanceRecord = await pb.collection('teacher_attendance').create(teacherAttendanceData)
          action = '签到'
          console.log('✅ 教师签到成功:', user.name || user.teacher_name)
          
        } else {
          // 已有记录，检查是否可以签退
          const existingRecord = existingRecords.items[0]
          
          if (existingRecord.check_out) {
            // 已经签退，不允许重复操作
            return NextResponse.json({
              success: false,
              message: '今天已经完成签到和签退，无法重复操作',
              teacher: {
                id: teacherId,
                name: user.name || user.teacher_name,
                center: centerId || 'unknown'
              },
              attendance: {
                check_in: existingRecord.check_in,
                check_out: existingRecord.check_out,
                status: 'completed'
              }
            }, { status: 400 })
          } else {
            // 可以签退
            const updatedRecord = await pb.collection('teacher_attendance').update(existingRecord.id, {
              check_out: checkinTimestamp,
              notes: existingRecord.notes + ` | 教师NFC自动签退 - ${nfcType}`,
              device_info: JSON.stringify({
                ...JSON.parse(existingRecord.device_info || '{}'),
                checkOut: {
                  deviceId: deviceInfo?.deviceId || 'unknown',
                  deviceName: deviceInfo?.deviceName || 'NFC自动考勤',
                  nfcType: nfcType,
                  nfcData: identifier,
                  rawNfcData: rawNfcData,
                  matchedField: matchedField,
                  timestamp: checkinTimestamp
                }
              })
            })
            
            attendanceRecord = updatedRecord
            action = '签退'
            console.log('✅ 教师签退成功:', user.name || user.teacher_name)
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `${userType === 'student' ? '学生' : '教师'}${action || '考勤'}记录成功`,
        action: action || '考勤',
        user: {
          id: user.id,
          name: user.student_name || user.name || user.teacher_name,
          type: userType,
          center: user.center,
          status: user.status
        },
        attendance: attendanceRecord,
        nfcInfo: {
          type: nfcType,
          data: identifier,
          rawData: rawNfcData,
          matchedField: matchedField
        }
      })
    } catch (error: any) {
      console.error('创建考勤记录失败:', error)
      return NextResponse.json({ 
        success: false, 
        message: '创建考勤记录失败',
        error: error.message || '未知错误'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('NFC读取API错误:', error)
    return NextResponse.json({ 
      success: false, 
      message: '服务器内部错误',
      error: error.message || '未知错误'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'NFC读取API',
    status: 'active',
    methods: ['POST'],
    description: '用于读取NFC卡片数据并记录考勤'
  })
}