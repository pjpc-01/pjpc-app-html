import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://pjpc.tplinkdns.com:8090')

// NFC数据分析和处理
function analyzeNFCData(data: string) {
  const result: any = {
    original: data.trim(),
    length: data.trim().length,
    type: '',
    formats: {},
    variants: [],
    cardType: '',
    databaseFormats: [],
    byteOrderVariants: []
  }

  const cleanData = data.trim()

  // 判断数据类型
  if (/^\d+$/.test(cleanData)) {
    result.type = 'decimal'
    
    try {
      // 十进制转十六进制
      const hex = BigInt(cleanData).toString(16).toUpperCase()
      result.formats.hex = hex
      
      // 格式化为常见的UID格式（带分隔符）
      const hexFormatted = hex.match(/.{1,2}/g)?.join(':') || hex
      result.formats.hexFormatted = hexFormatted
      
      // 处理字节序问题 - 生成反向字节序变体
      let reverseHexFormatted = ''
      let reverseHex = ''
      let reverseDecimal = ''
      
      if (hex.length === 8) { // 4字节UID
        // 反向字节序: A0:23:72:04 -> 04:72:23:A0
        const bytes = hex.match(/.{1,2}/g) || []
        const reversedBytes = bytes.reverse()
        reverseHexFormatted = reversedBytes.join(':')
        reverseHex = reversedBytes.join('')
        reverseDecimal = BigInt('0x' + reverseHex).toString()
        
        result.formats.reverseHexFormatted = reverseHexFormatted
        result.formats.reverseHex = reverseHex
        result.formats.reverseDecimal = reverseDecimal
      }
      
      // 生成变体（用于数据库查询）
      result.variants = [
        cleanData,                    // 原始十进制
        hex,                         // 十六进制
        hexFormatted,                // 格式化十六进制
        hex.replace(/:/g, ''),       // 无冒号十六进制
        hex.toLowerCase(),           // 小写十六进制
        hexFormatted.toLowerCase(), // 小写格式化十六进制
        cleanData.padStart(20, '0'), // 左补零
        cleanData.padEnd(20, '0')    // 右补零
      ]
      
      // 添加字节序变体
      if (reverseHexFormatted) {
        result.variants.push(
          reverseHexFormatted,        // 反向格式化十六进制
          reverseHex,                 // 反向十六进制
          reverseDecimal,              // 反向十进制
          reverseHexFormatted.toLowerCase(), // 反向小写格式化
          reverseHex.toLowerCase()     // 反向小写
        )
      }
      
      // 生成数据库查询格式（优先使用十六进制格式，因为数据库存储的是十六进制）
      result.databaseFormats = [
        hexFormatted,                // 格式化十六进制 (04:ae:7e:a6:68:26:81)
        hexFormatted.toLowerCase(),  // 小写格式化十六进制
        hex,                         // 无分隔符十六进制
        hex.toLowerCase(),           // 小写无分隔符十六进制
        cleanData,                   // 原始十进制
        hexFormatted.replace(/:/g, ''), // 无分隔符大写
        hexFormatted.replace(/:/g, '').toLowerCase() // 无分隔符小写
      ]
      
      // 添加字节序数据库格式
      if (reverseHexFormatted) {
        result.databaseFormats.unshift(
          reverseHexFormatted,        // 反向格式化十六进制 (优先)
          reverseHexFormatted.toLowerCase(), // 反向小写格式化
          reverseHex,                 // 反向十六进制
          reverseHex.toLowerCase(),   // 反向小写十六进制
          reverseDecimal              // 反向十进制
        )
      }
      
      // 判断可能的卡片类型
      if (cleanData.length === 10) {
        result.cardType = 'MIFARE Classic (4字节UID)'
      } else if (cleanData.length === 18) {
        result.cardType = 'MIFARE Classic (7字节UID) 或 长UID标签'
      } else if (cleanData.length === 8) {
        result.cardType = 'MIFARE Ultralight'
      } else if (cleanData.length > 18) {
        result.cardType = '长UID RFID标签'
      } else {
        result.cardType = '未知类型RFID标签'
      }
      
    } catch (error) {
      result.error = '数据转换失败'
    }
  } else if (/^[0-9A-Fa-f:]+$/.test(cleanData)) {
    result.type = 'hex'
    try {
      // 处理带分隔符的十六进制
      const cleanHex = cleanData.replace(/[:-\s]/g, '')
      result.formats.decimal = BigInt('0x' + cleanHex).toString()
      
      // 格式化为标准格式
      const formattedHex = cleanHex.match(/.{1,2}/g)?.join(':') || cleanHex
      result.formats.hexFormatted = formattedHex
      
      result.variants = [
        cleanData,                   // 原始输入
        formattedHex,                // 格式化十六进制
        cleanHex,                    // 无分隔符十六进制
        result.formats.decimal,      // 十进制
        formattedHex.toLowerCase(),  // 小写格式化
        cleanHex.toLowerCase()      // 小写无分隔符
      ]
      
      // 数据库查询格式
      result.databaseFormats = [
        formattedHex,                // 格式化十六进制
        formattedHex.toLowerCase(),  // 小写格式化
        cleanHex,                    // 无分隔符大写
        cleanHex.toLowerCase(),      // 无分隔符小写
        result.formats.decimal       // 十进制
      ]
      
    } catch (error) {
      result.error = '十六进制转换失败'
    }
  } else {
    result.type = 'text'
    result.variants = [cleanData]
    result.databaseFormats = [cleanData]
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 NFC数据分析API请求开始')
    
    const body = await request.json()
    const { nfcData, deviceInfo, centerId, timestamp } = body
    
    if (!nfcData) {
      return NextResponse.json({ 
        success: false, 
        message: 'NFC数据不能为空' 
      }, { status: 400 })
    }

    console.log('📋 接收到的NFC数据:', nfcData)

    // 分析NFC数据
    const analysis = analyzeNFCData(nfcData)
    console.log('📊 数据分析结果:', analysis)

    // 使用数据库格式优先查找用户
    let user = null
    let userType = 'student'
    let matchedField = ''
    let matchedVariant = ''

    try {
      console.log('🔍 开始查找用户，使用数据库格式:', analysis.databaseFormats)
      
      // 方法1: 优先通过cardNumber查找（使用数据库格式，因为数据库存储的是十六进制）
      for (const variant of analysis.databaseFormats) {
        try {
          const studentsByCardNumber = await pb.collection('students').getList(1, 1, {
            filter: `cardNumber = "${variant}"`
          })
          
          if (studentsByCardNumber.items.length > 0) {
            user = studentsByCardNumber.items[0]
            matchedField = 'cardNumber'
            matchedVariant = variant
            console.log('✅ 通过cardNumber找到学生:', user.student_name, '(格式:', variant, ')')
            break
          }
        } catch (error: any) {
          console.log('⚠️ cardNumber字段查询失败:', error.message)
        }
      }
      
      // 方法2: 如果数据库格式没找到，尝试所有变体
      if (!user) {
        console.log('🔍 数据库格式未找到，尝试所有变体:', analysis.variants)
        for (const variant of analysis.variants) {
          try {
            const studentsByCardNumber = await pb.collection('students').getList(1, 1, {
              filter: `cardNumber = "${variant}"`
            })
            
            if (studentsByCardNumber.items.length > 0) {
              user = studentsByCardNumber.items[0]
              matchedField = 'cardNumber'
              matchedVariant = variant
              console.log('✅ 通过cardNumber找到学生:', user.student_name, '(格式:', variant, ')')
              break
            }
          } catch (error: any) {
            console.log('⚠️ cardNumber字段查询失败:', error.message)
          }
        }
      }
      
      // 方法2: 通过student_id查找
      if (!user) {
        for (const variant of analysis.variants) {
          try {
            const studentsByStudentId = await pb.collection('students').getList(1, 1, {
              filter: `student_id = "${variant}"`
            })
            
            if (studentsByStudentId.items.length > 0) {
              user = studentsByStudentId.items[0]
              matchedField = 'student_id'
              matchedVariant = variant
              console.log('✅ 通过student_id找到学生:', user.student_name, '(格式:', variant, ')')
              break
            }
          } catch (error: any) {
            console.log('⚠️ student_id字段查询失败:', error.message)
          }
        }
      }

      // 方法3: 查找教师
      if (!user) {
        for (const variant of analysis.variants) {
          try {
            const teachersByCardNumber = await pb.collection('teachers').getList(1, 1, {
              filter: `cardNumber = "${variant}"`
            })
            
            if (teachersByCardNumber.items.length > 0) {
              user = teachersByCardNumber.items[0]
              userType = 'teacher'
              matchedField = 'cardNumber'
              matchedVariant = variant
              console.log('✅ 通过cardNumber找到教师:', user.name || user.teacher_name, '(格式:', variant, ')')
              break
            }
          } catch (error: any) {
            console.log('⚠️ 教师cardNumber字段查询失败:', error.message)
          }
        }
      }

      if (!user) {
        return NextResponse.json({
          success: false,
          message: '未找到匹配的用户',
          analysis: analysis,
          searchedVariants: analysis.variants
        }, { status: 404 })
      }

      // 创建考勤记录
      const checkinTimestamp = new Date()
      let attendanceRecord = null

      if (userType === 'student') {
        // 学生考勤记录
        const studentAttendanceData = {
          studentId: user.id,
          studentName: user.student_name,
          centerId: centerId || 'unknown',
          centerName: centerId || 'unknown',
          branchId: centerId || 'unknown',
          branchName: centerId || 'unknown',
          type: 'check-in',
          timestamp: checkinTimestamp,
          method: 'nfc_card_number',
          status: 'success',
          deviceName: deviceInfo?.deviceName || 'NFC自动考勤',
          nfcType: analysis.type,
          nfcData: analysis.original,
          rawNfcData: nfcData,
          matchedField: matchedField,
          matchedVariant: matchedVariant,
          cardType: analysis.cardType
        }
        
        attendanceRecord = await pb.collection('student_attendance').create(studentAttendanceData)
        console.log('✅ 学生考勤记录创建成功:', user.student_name)
      } else {
        // 教师考勤记录 - 使用teacher_attendance集合的字段结构
        const teacherAttendanceData = {
          teacher_id: user.id,
          teacher_name: user.name || user.teacher_name,
          branch_code: centerId || 'unknown',
          branch_name: centerId || 'unknown',
          date: new Date(checkinTimestamp).toISOString().split('T')[0],
          check_in: checkinTimestamp,
          check_out: null,
          status: 'present',
          method: 'nfc_card_number',
          device_info: JSON.stringify({
            deviceId: deviceInfo?.deviceId || 'unknown',
            deviceName: deviceInfo?.deviceName || 'NFC自动考勤',
            nfcType: analysis.type,
            nfcData: analysis.original,
            rawNfcData: nfcData,
            matchedField: matchedField,
            matchedVariant: matchedVariant,
            cardType: analysis.cardType
          }),
          notes: `教师NFC自动考勤 - ${analysis.type}`
        }
        
        attendanceRecord = await pb.collection('teacher_attendance').create(teacherAttendanceData)
        console.log('✅ 教师考勤记录创建成功:', user.name || user.teacher_name)
      }
      
      return NextResponse.json({
        success: true,
        message: `${userType === 'student' ? '学生' : '教师'}考勤记录成功`,
        user: {
          id: user.id,
          name: user.student_name || user.name || user.teacher_name,
          type: userType,
          center: user.center,
          status: user.status
        },
        attendance: attendanceRecord,
        nfcInfo: {
          analysis: analysis,
          matchedField: matchedField,
          matchedVariant: matchedVariant,
          searchedVariants: analysis.variants,
          databaseFormats: analysis.databaseFormats,
          conversion: {
            original: analysis.original,
            type: analysis.type,
            hexFormatted: analysis.formats.hexFormatted,
            decimal: analysis.formats.decimal || analysis.original
          }
        }
      })
    } catch (error: any) {
      console.error('创建考勤记录失败:', error)
      return NextResponse.json({ 
        success: false, 
        message: '创建考勤记录失败',
        error: error.message || '未知错误',
        analysis: analysis
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('NFC数据分析API错误:', error)
    return NextResponse.json({ 
      success: false, 
      message: '服务器内部错误',
      error: error.message || '未知错误'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'NFC数据分析API',
    status: 'active',
    methods: ['POST'],
    description: '用于分析NFC卡片数据并记录考勤，支持多种数据格式'
  })
}
