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
  date: string
  check_in?: string
  check_out?: string
  status?: string
}

// API请求封装
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const data = await res.json()
    return data
  } catch (err) {
    console.error(`[TV-NFC] API请求失败: ${url}`, err)
    return null
  }
}

// 卡号解析函数
function extractCardNumber(nfcData: string): string | null {
  console.log('[TV-NFC] 原始NFC数据:', nfcData)
  console.log('[TV-NFC] NFC数据长度:', nfcData.length)
  console.log('[TV-NFC] NFC数据类型:', typeof nfcData)
  console.log('[TV-NFC] NFC数据字符码:', nfcData.split('').map(c => c.charCodeAt(0)))
  
  // 方法1: 直接10位数字
  const match10 = nfcData.match(/\d{10}/)
  if (match10) {
    console.log('[TV-NFC] 方法1匹配到10位数字:', match10[0])
    return match10[0]
  }

  // 方法2: 取所有数字最后10位
  const digits = nfcData.replace(/\D/g, "")
  if (digits.length >= 10) {
    const result = digits.slice(-10)
    console.log('[TV-NFC] 方法2提取数字:', result)
    return result
  }

  // 方法3: 原始就是10位数字
  if (/^\d{10}$/.test(nfcData)) {
    console.log('[TV-NFC] 方法3直接匹配:', nfcData)
    return nfcData
  }

  // 方法4/5: hex转十进制
  const hex = nfcData.match(/[0-9a-fA-F]{8,}/)?.[0]
  if (hex) {
    try {
      const result = parseInt(hex, 16).toString().padStart(10, "0").slice(-10)
      console.log('[TV-NFC] 方法4/5 hex转换:', result)
      return result
    } catch (err) {
      console.log('[TV-NFC] hex转换失败:', err)
    }
  }

  console.log('[TV-NFC] 所有方法都无法提取卡号')
  return null
}

// Web NFC兼容性检查
function checkNFCCompatibility(): boolean {
  if (!("NDEFReader" in window)) {
    console.warn("[TV-NFC] 当前浏览器不支持 Web NFC，将使用HID模式")
    return false
  }
  
  // 检查是否在HTTPS环境
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn("[TV-NFC] Web NFC 需要 HTTPS 环境，当前为:", location.protocol)
    return false
  }
  
  return true
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
    const data = await apiFetch<{ success: boolean; students: Student[] }>("/api/students")
    if (data?.success) {
      setStudents(data.students || [])
      console.log(`[TV-NFC] 获取到 ${data.students?.length || 0} 个学生`)
    }
  }, [])

  // 获取教师数据
  const fetchTeachers = useCallback(async () => {
    const data = await apiFetch<{ success: boolean; teachers: Teacher[] }>("/api/teachers")
    if (data?.success) {
      setTeachers(data.teachers || [])
      console.log(`[TV-NFC] 获取到 ${data.teachers?.length || 0} 个教师`)
    }
  }, [])

  // 获取考勤记录
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // 并行获取学生和教师考勤
      const [studentData, teacherData] = await Promise.all([
        apiFetch<{ success: boolean; records: AttendanceRecord[] }>(`/api/student-attendance?date=${today}`),
        apiFetch<{ success: boolean; data: AttendanceRecord[] }>(`/api/teacher-attendance?date=${today}&type=teacher`)
      ])
      
      const allRecords = [
        ...(studentData?.success ? studentData.records || [] : []),
        ...(teacherData?.success ? teacherData.data || [] : [])
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
      return { user: student, type: 'student' as const }
    }
    
    // 查找教师
    const teacher = teachers.find(t => t.cardNumber === trimmed)
    if (teacher) {
      return { user: teacher, type: 'teacher' as const }
    }
    
    console.log('[TV-NFC] 未找到用户，卡号:', trimmed)
    return null
  }, [students, teachers])

  // 获取用户今日考勤状态 - 优化后的逻辑
  const getUserTodayStatus = useCallback((userId: string, type: 'student' | 'teacher') => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceRecords.filter(record => {
      const isMatch = type === 'student' 
        ? record.student_id === userId
        : record.teacher_id === userId
      return isMatch && record.date === today
    })
    
    // 无记录 - 可以签到
    if (!todayRecords.length) {
      return { status: "none", canCheckIn: true, canCheckOut: false }
    }
    
    // 获取最新记录
    const latest = todayRecords[0]
    
    // 已签退 - 可以重新签到
    if (latest.check_out) {
      return { status: "completed", canCheckIn: true, canCheckOut: false }
    }
    
    // 已签到未签退 - 可以签退
    if (latest.check_in) {
      return { status: "checked_in", canCheckIn: false, canCheckOut: true }
    }
    
    // 默认状态
    return { status: "none", canCheckIn: true, canCheckOut: false }
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
          check_in_time: action === 'check-in' ? timestamp : undefined,
          check_out_time: action === 'check-out' ? timestamp : undefined,
          status: action === 'check-in' ? 'present' : 'completed'
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
          date: today,
          checkInTime: action === 'check-in' ? timestamp : undefined,
          checkOutTime: action === 'check-out' ? timestamp : undefined,
          status: action === 'check-in' ? 'present' : 'completed'
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
      
      if (response.ok && data.success) {
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

  // 处理NFC扫描 - 优化后的逻辑
  const handleNFCScan = useCallback((nfcData: string) => {
    // 防重复扫描
    if (nfcData === lastProcessedCard.current && Date.now() - lastProcessTime.current < 1000) {
      console.log('[TV-NFC] 重复扫描，忽略')
      return
    }
    
    lastProcessedCard.current = nfcData
    lastProcessTime.current = Date.now()
    
    // 提取卡号
    const cardNumber = extractCardNumber(nfcData)
    if (!cardNumber) {
      console.log("[TV-NFC] 无法提取卡号")
      return
    }
    
    console.log('[TV-NFC] 提取到卡号:', cardNumber)
    
    // 查找用户
    const userResult = findUserByCard(cardNumber)
    if (!userResult) {
      console.log('[TV-NFC] 未找到用户，卡号:', cardNumber)
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
      console.log('[TV-NFC] 用户状态异常，无法执行考勤操作')
      return
    }
    
    console.log('[TV-NFC] 准备执行考勤操作:', { action, type })
    
    // 执行考勤操作
    performAttendance(user, type, action)
  }, [findUserByCard, getUserTodayStatus, performAttendance])

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

  // 定期刷新数据
  useEffect(() => {
    if (!enabled) return
    
    const interval = setInterval(() => {
      console.log('[TV-NFC] 定期刷新数据...')
      fetchAttendanceRecords()
    }, 30000) // 30秒刷新一次
    
    return () => clearInterval(interval)
  }, [enabled, fetchAttendanceRecords])

  // Web NFC 扫描
  useEffect(() => {
    if (!enabled) return
    
    // 检查NFC兼容性
    if (!checkNFCCompatibility()) {
      console.log('[TV-NFC] Web NFC不可用，跳过NFC扫描初始化')
      return
    }
    
    const startNFCScan = async () => {
      try {
        console.log("[TV-NFC] 启动Web NFC扫描...")
        const reader = new window.NDEFReader()
        
        await reader.scan()
        console.log("[TV-NFC] NFC扫描已启动")
        
        reader.onreading = (event: any) => {
          try {
            console.log("[TV-NFC] 检测到NFC标签")
            
            // 读取NFC数据
            const decoder = new TextDecoder()
            let nfcData = ""
            
            for (const record of event.message.records) {
              if (record.recordType === "text") {
                nfcData += decoder.decode(record.data)
              } else if (record.recordType === "url") {
                nfcData += decoder.decode(record.data)
              } else if (record.recordType === "mime" && record.mediaType === "text/plain") {
                nfcData += decoder.decode(record.data)
              }
            }
            
            console.log("[TV-NFC] NFC数据长度:", nfcData.length)
            
            // 使用优化后的处理逻辑
            handleNFCScan(nfcData)
          } catch (err) {
            console.error("[TV-NFC] 处理标签失败:", err)
          }
        }
        
        reader.onerror = (event: any) => {
          console.error("[TV-NFC] NFC读取错误:", event)
        }
        
      } catch (err) {
        console.error("[TV-NFC] 启动扫描失败:", err)
      }
    }
    
    startNFCScan()
  }, [enabled, handleNFCScan])

  // HID 键盘监听（备用方案）
  useEffect(() => {
    if (!enabled) return
    
    let inputBuffer = ""
    let lastInputTime = 0
    
    const handleKeyPress = (event: KeyboardEvent) => {
      const currentTime = Date.now()
      
      // 如果输入间隔超过1秒，清空缓冲区
      if (currentTime - lastInputTime > 1000) {
        inputBuffer = ""
      }
      
      lastInputTime = currentTime
      
      // 只处理数字和字母
      if (/[0-9a-zA-Z]/.test(event.key)) {
        inputBuffer += event.key
        console.log('[TV-NFC] HID输入:', event.key, '缓冲区:', inputBuffer)
        
        // 如果缓冲区长度达到10位，尝试处理
        if (inputBuffer.length >= 10) {
          const cardNumber = inputBuffer.slice(-10)
          console.log('[TV-NFC] HID提取卡号:', cardNumber)
          handleNFCScan(cardNumber)
          inputBuffer = ""
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [enabled, handleNFCScan])

  // 组件不渲染任何UI，只作为后台服务
  return null
}