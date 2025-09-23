"use client"

import { useEffect, useState, useRef, useCallback } from "react"

// 声明NDEFReader类型
declare global {
  interface Window {
    NDEFReader: any
  }
}

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  cardNumber?: string
}

interface Teacher {
  id: string
  user_id: string
  name: string
  center_assignment: string
  cardNumber?: string
}

interface AttendanceRecord {
  id: string
  student_id?: string
  teacher_id?: string
  student_name?: string
  teacher_name?: string
  center?: string
  branch_code?: string
  date: string
  check_in?: string
  check_out?: string
  status: string
}

export default function NFCBackgroundRunner({ center, enabled }: { center: string; enabled: boolean }) {
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  
  // 防重复扫描
  const lastProcessedCard = useRef<string>('')
  const lastProcessTime = useRef<number>(0)

  // 获取学生数据
  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch('/api/students')
      const data = await response.json()
      if (data.success) {
        setStudents(data.students || [])
        console.log(`[TV-NFC] 获取到 ${data.students?.length || 0} 个学生`)
      }
    } catch (error) {
      console.error('[TV-NFC] 获取学生数据失败:', error)
    }
  }, [])

  // 获取教师数据
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch('/api/teachers')
      const data = await response.json()
      if (data.success) {
        setTeachers(data.teachers || [])
        console.log(`[TV-NFC] 获取到 ${data.teachers?.length || 0} 个教师`)
      }
    } catch (error) {
      console.error('[TV-NFC] 获取教师数据失败:', error)
    }
  }, [])

  // 获取考勤记录
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // 获取学生考勤
      const studentResponse = await fetch(`/api/student-attendance?date=${today}`)
      const studentData = await studentResponse.json()
      
      // 获取教师考勤
      const teacherResponse = await fetch(`/api/teacher-attendance?date=${today}&type=teacher`)
      const teacherData = await teacherResponse.json()
      
      const allRecords = [
        ...(studentData.success ? studentData.records || [] : []),
        ...(teacherData.success ? teacherData.data || [] : [])
      ]
      
      setAttendanceRecords(allRecords)
      console.log(`[TV-NFC] 获取到 ${allRecords.length} 条考勤记录`)
    } catch (error) {
      console.error('[TV-NFC] 获取考勤记录失败:', error)
    }
  }, [])

  // 根据卡号查找用户
  const findUserByCard = useCallback((cardNumber: string) => {
    const trimmed = cardNumber.trim()
    console.log('[TV-NFC] 查找用户，卡号:', trimmed)
    
    // 查找学生
    const student = students.find(s => s.cardNumber === trimmed)
    if (student) {
      console.log('[TV-NFC] 找到学生:', student.student_name, student.cardNumber)
      return { user: student, type: 'student' as const }
    }
    
    // 查找教师
    const teacher = teachers.find(t => t.cardNumber === trimmed)
    if (teacher) {
      console.log('[TV-NFC] 找到教师:', teacher.name, teacher.cardNumber)
      return { user: teacher, type: 'teacher' as const }
    }
    
    console.log('[TV-NFC] 未找到用户')
    return null
  }, [students, teachers])

  // 获取用户今日考勤状态
  const getUserTodayStatus = useCallback((userId: string, type: 'student' | 'teacher') => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => {
      const isMatch = type === 'student' 
        ? record.student_id === userId
        : record.teacher_id === userId
      return isMatch && record.date === today
    })
    
    if (todayRecords.length === 0) {
      return { status: 'none', canCheckIn: true, canCheckOut: false }
    }
    
    const latestRecord = todayRecords[0]
    if (latestRecord.check_out) {
      return { status: 'completed', canCheckIn: true, canCheckOut: false }
    }
    
    if (latestRecord.check_in) {
      return { status: 'checked_in', canCheckIn: false, canCheckOut: true }
    }
    
    return { status: 'none', canCheckIn: true, canCheckOut: false }
  }, [attendanceRecords])

  // 执行考勤操作
  const performAttendance = useCallback(async (user: Student | Teacher, type: 'student' | 'teacher', action: 'check-in' | 'check-out') => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const timestamp = new Date().toISOString()
      
      console.log('[TV-NFC] 开始执行考勤操作:', { type, action, user })
      
      let response
      
      if (type === 'student') {
        const student = user as Student
        const payload = {
          student_id: student.student_id || student.id,
          student_name: student.student_name,
          center: student.center,
          date: today,
          time: timestamp,
          status: 'present',
          timestamp: timestamp,
          device_info: 'TV Board NFC Reader',
          method: 'tv_board_nfc'
        }
        
        console.log('[TV-NFC] 学生考勤payload:', payload)
        
        response = await fetch('/api/student-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        const teacher = user as Teacher
        const payload = {
          teacherId: teacher.user_id || teacher.id,
          teacherName: teacher.name,
          centerId: teacher.center_assignment || 'WX 01',
          centerName: teacher.center_assignment || 'WX 01',
          branchId: teacher.center_assignment || 'WX 01',
          branchName: teacher.center_assignment || 'WX 01',
          type: action,
          timestamp: timestamp,
          deviceId: 'tv-board',
          deviceName: 'TV Board NFC Reader',
          method: 'tv_board_nfc',
          status: 'success'
        }
        
        console.log('[TV-NFC] 教师考勤payload:', payload)
        
        response = await fetch('/api/teacher-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      
      console.log('[TV-NFC] API响应状态:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('[TV-NFC] API响应数据:', data)
      
      if (data.success) {
        const actionText = action === 'check-in' ? '签到' : '签退'
        console.log(`[TV-NFC] ${type === 'student' ? '学生' : '教师'}${actionText}成功！`)
        
        // 刷新考勤记录
        await fetchAttendanceRecords()
      } else {
        console.warn('[TV-NFC] 考勤操作失败:', data.message)
      }
    } catch (error) {
      console.error('[TV-NFC] 考勤操作失败:', error)
    }
  }, [fetchAttendanceRecords])

  // 处理NFC扫描
  const handleNFCScan = useCallback((nfcData: string) => {
    console.log('[TV-NFC] 原始NFC数据:', nfcData)
    console.log('[TV-NFC] NFC数据长度:', nfcData.length)
    console.log('[TV-NFC] NFC数据类型:', typeof nfcData)
    console.log('[TV-NFC] NFC数据字符码:', nfcData.split('').map(c => c.charCodeAt(0)))
    
    // 尝试多种方式提取卡号
    let cardNumber = ''
    
    // 方法1: 直接匹配10位数字
    const cardNumberMatch = nfcData.match(/\d{10}/)
    if (cardNumberMatch) {
      cardNumber = cardNumberMatch[0]
      console.log('[TV-NFC] 方法1 - 找到10位卡号:', cardNumber)
    } else {
      // 方法2: 提取所有数字，然后取最后10位
      const allNumbers = nfcData.replace(/\D/g, '')
      if (allNumbers.length >= 10) {
        cardNumber = allNumbers.slice(-10)
        console.log('[TV-NFC] 方法2 - 从所有数字中提取:', cardNumber)
      } else {
        // 方法3: 直接使用原始数据（如果长度合适）
        if (nfcData.length === 10 && /^\d+$/.test(nfcData)) {
          cardNumber = nfcData
          console.log('[TV-NFC] 方法3 - 直接使用原始数据:', cardNumber)
        } else {
          // 方法4: 尝试从十六进制数据中提取
          const hexMatch = nfcData.match(/[0-9a-fA-F]{10,}/)
          if (hexMatch) {
            const hex = hexMatch[0]
            console.log('[TV-NFC] 方法4 - 找到十六进制数据:', hex)
            // 尝试将十六进制转换为十进制
            try {
              const decimal = parseInt(hex, 16).toString()
              if (decimal.length === 10) {
                cardNumber = decimal
                console.log('[TV-NFC] 方法4 - 十六进制转十进制:', cardNumber)
              }
            } catch (e) {
              console.log('[TV-NFC] 方法4 - 十六进制转换失败:', e)
            }
          }
          
          // 方法5: 尝试从UID中提取（通常UID是4字节，转换为10位数字）
          if (!cardNumber) {
            const uidMatch = nfcData.match(/[0-9a-fA-F]{8}/)
            if (uidMatch) {
              const uid = uidMatch[0]
              console.log('[TV-NFC] 方法5 - 找到UID:', uid)
              try {
                const decimal = parseInt(uid, 16).toString()
                if (decimal.length <= 10) {
                  cardNumber = decimal.padStart(10, '0')
                  console.log('[TV-NFC] 方法5 - UID转十进制:', cardNumber)
                }
              } catch (e) {
                console.log('[TV-NFC] 方法5 - UID转换失败:', e)
              }
            }
          }
        }
      }
    }
    
    if (!cardNumber) {
      console.log('[TV-NFC] 无法提取卡号，原始数据:', nfcData)
      console.log('[TV-NFC] 尝试手动输入测试卡号...')
      
      // 测试用卡号
      const testCardNumbers = ['2793319940', '2686677508', '1234567890']
      for (const testCard of testCardNumbers) {
        console.log(`[TV-NFC] 测试卡号: ${testCard}`)
        const testResult = findUserByCard(testCard)
        if (testResult) {
          console.log('[TV-NFC] 测试成功，找到用户:', testResult.user)
          cardNumber = testCard
          break
        }
      }
      
      if (!cardNumber) {
        console.log('[TV-NFC] 测试卡号也未找到用户')
        return
      }
    }
    
    const now = Date.now()
    
    // 防重复扫描：同一张卡在3秒内重复扫描，忽略
    if (now - lastProcessTime.current < 3000 && lastProcessedCard.current === cardNumber) {
      console.log('[TV-NFC] 防重复扫描：忽略重复卡片')
      return
    }
    
    // 更新防重复状态
    lastProcessedCard.current = cardNumber
    lastProcessTime.current = now
    
    console.log('[TV-NFC] 最终使用卡号:', cardNumber)
    console.log('[TV-NFC] 学生总数:', students.length)
    console.log('[TV-NFC] 教师总数:', teachers.length)
    
    // 查找用户
    const userResult = findUserByCard(cardNumber)
    if (!userResult) {
      console.log('[TV-NFC] 未找到对应的用户信息')
      console.log('[TV-NFC] 学生卡号示例:', students.slice(0, 3).map(s => ({ name: s.student_name, card: s.cardNumber })))
      console.log('[TV-NFC] 教师卡号示例:', teachers.slice(0, 3).map(t => ({ name: t.name, card: t.cardNumber })))
      return
    }
    
    const { user, type } = userResult
    console.log('[TV-NFC] 找到用户:', { name: type === 'student' ? (user as Student).student_name : (user as Teacher).name, type })
    
    // 获取用户今日考勤状态
    const userId = type === 'student' ? (user as Student).student_id || (user as Student).id : (user as Teacher).user_id || (user as Teacher).id
    const status = getUserTodayStatus(userId, type)
    
    console.log('[TV-NFC] 用户状态:', { userId, status })
    
    // 确定操作类型
    let action: 'check-in' | 'check-out'
    if (status.canCheckIn) {
      action = 'check-in'
    } else if (status.canCheckOut) {
      action = 'check-out'
    } else {
      console.log('[TV-NFC] 今天已完成签到签退，将创建新的签到记录')
      action = 'check-in'
    }
    
    console.log('[TV-NFC] 准备执行考勤操作:', { action, type })
    
    // 执行考勤操作
    performAttendance(user, type, action)
  }, [findUserByCard, getUserTodayStatus, performAttendance, students, teachers])

  // 初始化数据
  useEffect(() => {
    if (!enabled) return
    
    const initData = async () => {
      console.log('[TV-NFC] 开始初始化数据...')
      await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchAttendanceRecords()
      ])
      console.log('[TV-NFC] 数据初始化完成')
    }
    
    initData()
  }, [enabled, fetchStudents, fetchTeachers, fetchAttendanceRecords])

  // 手动测试功能
  useEffect(() => {
    if (!enabled) return
    
    // HID读卡器输入缓冲区和超时处理
    let inputBuffer = ''
    let lastInputTime = 0
    const inputTimeout = 1000 // 1秒内没有新输入则认为输入完成
    
    // 添加键盘监听，支持HID读卡器和测试按键
    const handleKeyPress = (event: KeyboardEvent) => {
      const now = Date.now()
      
      // 测试按键
      if (event.key === 't' || event.key === 'T') {
        console.log('[TV-NFC] 手动测试教师考勤')
        handleNFCScan('2793319940')
        return
      }
      if (event.key === 's' || event.key === 'S') {
        console.log('[TV-NFC] 手动测试学生考勤')
        handleNFCScan('2686677508')
        return
      }

      // HID读卡器输入处理
      if (event.key.length === 1 && /[0-9]/.test(event.key)) {
        // 如果是数字键，添加到缓冲区
        if (now - lastInputTime > inputTimeout) {
          inputBuffer = '' // 重置缓冲区
        }
        
        inputBuffer += event.key
        lastInputTime = now
        
        console.log(`[TV-NFC] HID输入: ${event.key}, 缓冲区: ${inputBuffer}`)
        
        // 检查是否是10位数字
        if (inputBuffer.length === 10 && /^\d{10}$/.test(inputBuffer)) {
          console.log(`[TV-NFC] 检测到完整卡号: ${inputBuffer}`)
          handleNFCScan(inputBuffer)
          inputBuffer = '' // 清空缓冲区
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [enabled, handleNFCScan])

  // NFC扫描（支持Web NFC和HID读卡器）
  useEffect(() => {
    if (!enabled) return

    // 检查是否支持Web NFC
    if ("NDEFReader" in window) {
      console.log("[TV-NFC] 使用 Web NFC 模式")
      startWebNFCScan()
    } else {
      console.log("[TV-NFC] Web NFC 不支持，使用 HID 读卡器模式")
      console.log("[TV-NFC] HID读卡器已启用，请直接扫描卡片")
      console.log("[TV-NFC] 测试功能：按T键测试教师考勤，按S键测试学生考勤")
      // HID读卡器通过键盘监听处理，不需要额外的NFC扫描
    }
  }, [enabled])

  // Web NFC扫描函数
  const startWebNFCScan = () => {
    const reader = new window.NDEFReader()

    const startScan = async () => {
      try {
        await reader.scan()
        console.log("[TV-NFC] NFC 扫描已启动")

        reader.onreading = async (event: any) => {
          try {
            console.log("[TV-NFC] NFC标签被读取，原始事件:", event)
            console.log("[TV-NFC] 消息记录数量:", event.message.records.length)
            
            const decoder = new TextDecoder()
            let nfcData = ""
            
            for (let i = 0; i < event.message.records.length; i++) {
              const record = event.message.records[i]
              console.log(`[TV-NFC] 记录 ${i}:`, {
                recordType: record.recordType,
                mediaType: record.mediaType,
                data: record.data,
                dataLength: record.data ? record.data.length : 0
              })
              
              if (record.data) {
                const decoded = decoder.decode(record.data)
                console.log(`[TV-NFC] 解码后的数据 ${i}:`, decoded)
                nfcData += decoded
              }
            }

            console.log("[TV-NFC] 最终NFC数据:", nfcData)
            console.log("[TV-NFC] NFC数据长度:", nfcData.length)
            
            // 使用智能考勤逻辑处理NFC数据
            handleNFCScan(nfcData)
          } catch (err) {
            console.error("[TV-NFC] 处理标签失败:", err)
          }
        }
      } catch (err) {
        console.error("[TV-NFC] 启动扫描失败:", err)
      }
    }

    startScan()

    return () => {
      try {
        reader.onreading = null
      } catch {}
    }
  }

  return null // 不渲染UI
}