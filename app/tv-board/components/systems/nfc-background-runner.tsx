"use client"

import { useEffect, useRef, useState } from 'react'
import { tvLog } from '../../utils/logger'
import { unifiedNFCManager, NFCReaderType } from '@/lib/usb-nfc-reader'
import { useLanguage } from "@/contexts/language-context";

interface NFCBackgroundRunnerProps {
  center: string
  onCardRead?: (cardData: string) => void
  enabled?: boolean
  students?: any[]
  teachers?: any[]
}

// 独立的考勤处理函数
async function processAttendance(
  cardNumber: string,
  students: any[],
  teachers: any[],
  center: string,
  deviceInfo: { deviceId: string; deviceName: string },
  onSuccess?: (name: string, type: 'student' | 'teacher') => void,
  onError?: (message: string) => void
): Promise<{
  success: boolean
  user?: { id: string; name: string; type: 'student' | 'teacher' }
  error?: string
}> {
  try {
    // 标准化center字段格式
    const normalizedCenter = center.trim().toUpperCase()
    
    tvLog('🚀 开始考勤处理', { 
      cardNumber, 
      originalCenter: center, 
      normalizedCenter,
      studentsCount: students.length, 
      teachersCount: teachers.length 
    })

        // 直接获取学生和教师数据
        tvLog('开始获取学生和教师数据', { 
          center, 
          centerType: typeof center,
          centerLength: center?.length,
          centerEncoded: encodeURIComponent(center)
        })
        
        let allStudents = []
        let allTeachers = []
        
        // 获取学生数据
        try {
          const studentResponse = await fetch(`/api/students?center=${encodeURIComponent(center)}&limit=500`)
          const studentData = await studentResponse.json()
          
          if (studentData.success && studentData.data && studentData.data.length > 0) {
            allStudents = studentData.data
            tvLog('获取到真实学生数据', { 
              count: allStudents.length,
              center,
              sampleStudents: allStudents.slice(0, 2).map((s: any) => ({
                student_id: s.student_id,
                student_name: s.student_name,
                cardNumber: s.cardNumber,
                center: s.center
              }))
            })
          } else {
            tvLog('未获取到学生数据', { 
              success: studentData.success,
              error: studentData.error,
              dataLength: studentData.data?.length || 0
            })
          }
        } catch (error) {
          tvLog('获取学生数据失败', { 
            error: error instanceof Error ? error.message : String(error)
          })
        }
        
        // 获取教师数据
        try {
          const teacherResponse = await fetch(`/api/teachers?center=${encodeURIComponent(center)}&limit=100`)
          const teacherData = await teacherResponse.json()
          
          if (teacherData.success && teacherData.data && teacherData.data.length > 0) {
            allTeachers = teacherData.data
            tvLog('获取到真实教师数据', { 
              count: allTeachers.length,
              sampleTeachers: allTeachers.slice(0, 2).map((t: any) => ({
                teacher_id: t.teacher_id || t.id,
                teacher_name: t.teacher_name || t.name,
                cardNumber: t.cardNumber,
                center: t.center
              }))
            })
          } else {
            tvLog('未获取到教师数据', { 
              success: teacherData.success,
              error: teacherData.error,
              dataLength: teacherData.data?.length || 0
            })
          }
        } catch (error) {
          tvLog('获取教师数据失败', { 
            error: error instanceof Error ? error.message : String(error)
          })
        }
    
    tvLog('数据准备完成', { 
      studentsCount: allStudents.length,
      teachersCount: allTeachers.length
    })
    
    tvLog('学生数据检查', { 
      originalStudentsCount: students.length,
      totalStudentsCount: allStudents.length
    })

    // 查找学生 - 支持多种center字段格式
    const student = allStudents.find((s: any) => {
      if (s.cardNumber !== cardNumber) return false
      
      const studentCenter = s.center || s.Center || s.centre || s.branch || ''
      const normalizedStudentCenter = studentCenter.trim().toUpperCase()
      
      tvLog('学生center匹配检查', {
        cardNumber,
        studentId: s.student_id,
        studentName: s.student_name,
        studentCenter,
        normalizedStudentCenter,
        targetCenter: center,
        normalizedTargetCenter: normalizedCenter,
        match1: normalizedStudentCenter === normalizedCenter,
        match2: normalizedStudentCenter === center.trim(),
        match3: studentCenter === center
      })
      
      return normalizedStudentCenter === normalizedCenter || 
             normalizedStudentCenter === center.trim() ||
             studentCenter === center
    })
    
    if (student) {
      tvLog('找到匹配学生', { 
        studentId: student.student_id, 
        studentName: student.student_name, 
        cardNumber,
        center 
      })

      // 记录学生考勤
      const attendanceResult = await recordStudentAttendance(student, center, deviceInfo)
      if (attendanceResult.success) {
        // 显示成功提示
        if (onSuccess) {
          onSuccess(student.student_name, 'student')
        }
        return {
          success: true,
          user: {
            id: student.student_id || student.id,
            name: student.student_name,
            type: 'student'
          }
        }
      } else {
        const errorMsg = `学生考勤记录失败: ${attendanceResult.error}`
        if (onError) {
          onError(errorMsg)
        }
        return {
          success: false,
          error: errorMsg
        }
      }
    }

    // 查找教师 - 暂时忽略center匹配，因为教师center字段是ID
    const teacher = allTeachers.find((t: any) => {
      if (t.cardNumber !== cardNumber) return false
      
      tvLog('教师匹配检查', {
        cardNumber,
        teacherId: t.teacher_id,
        teacherName: t.teacher_name || t.name,
        teacherCenter: t.center,
        targetCenter: center
      })
      
      // 暂时只匹配卡号，忽略center字段
      return true
    })
    
    if (teacher) {
      tvLog('找到匹配教师', { 
        teacherId: teacher.teacher_id, 
        teacherName: teacher.teacher_name || teacher.name, 
        cardNumber,
        center 
      })

      // 记录教师考勤
      const attendanceResult = await recordTeacherAttendance(teacher, center, deviceInfo)
      if (attendanceResult.success) {
        // 显示成功提示
        if (onSuccess) {
          onSuccess(teacher.teacher_name || teacher.name, 'teacher')
        }
        return {
          success: true,
          user: {
            id: teacher.teacher_id,
            name: teacher.teacher_name || teacher.name,
            type: 'teacher'
          }
        }
      } else {
        const errorMsg = `教师考勤记录失败: ${attendanceResult.error}`
        if (onError) {
          onError(errorMsg)
        }
        return {
          success: false,
          error: errorMsg
        }
      }
    }

    const errorMsg = '未找到匹配的学生或教师'
    if (onError) {
      onError(errorMsg)
    }
    return {
      success: false,
      error: errorMsg
    }

  } catch (error) {
    const errorMsg = `考勤处理失败: ${error instanceof Error ? error.message : String(error)}`
    tvLog('考勤处理错误', { error: error instanceof Error ? error.message : String(error), center })
    if (onError) {
      onError(errorMsg)
    }
    return {
      success: false,
      error: errorMsg
    }
  }
}

// 记录学生考勤
  async function recordStudentAttendance(
    student: any,
    center: string,
    deviceInfo: { deviceId: string; deviceName: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const attendanceData = {
        student_id: student.student_id || student.id,
        student_name: student.student_name,
        center: center,
        attendance_time: new Date().toISOString(),
        device_id: deviceInfo.deviceId,
        device_name: deviceInfo.deviceName,
        status: 'present',
        type: 'student'
      }

      tvLog('记录学生考勤', { attendanceData })

      // 调用API记录到student_attendance集合
      const response = await fetch('/api/attendance/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData)
      })

      const result = await response.json()
      
      if (result.success) {
        tvLog('学生考勤记录成功', { 
          attendanceId: result.data?.id,
          studentName: student.student_name 
        })
        return { success: true }
      } else {
        tvLog('学生考勤记录失败', { error: result.error })
        return { 
          success: false, 
          error: result.error || '考勤记录失败' 
        }
      }

    } catch (error) {
      tvLog('学生考勤记录异常', { error: error instanceof Error ? error.message : String(error) })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

// 记录教师考勤
async function recordTeacherAttendance(
  teacher: any,
  center: string,
  deviceInfo: { deviceId: string; deviceName: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const attendanceData = {
      teacher_id: teacher.teacher_id,
      teacher_name: teacher.teacher_name || teacher.name,
      center: center,
      attendance_time: new Date().toISOString(),
      device_id: deviceInfo.deviceId,
      device_name: deviceInfo.deviceName,
      status: 'present',
      type: 'teacher'
    }

    tvLog('记录教师考勤', { attendanceData })

    // 调用API记录到teacher_attendance集合
    const response = await fetch('/api/attendance/teacher', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendanceData)
    })

    const result = await response.json()
    
    if (result.success) {
      tvLog('教师考勤记录成功', { 
        attendanceId: result.data?.id,
        teacherName: teacher.teacher_name || teacher.name 
      })
      return { success: true }
    } else {
      tvLog('教师考勤记录失败', { error: result.error })
      return { 
        success: false, 
        error: result.error || '考勤记录失败' 
      }
    }

  } catch (error) {
    tvLog('教师考勤记录异常', { error: error instanceof Error ? error.message : String(error) })
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export default function NFCBackgroundRunner({ 
  center, 
  onCardRead,
  enabled = true,
  students = [],
  teachers = []
}: NFCBackgroundRunnerProps) {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false)
  const [lastCardData, setLastCardData] = useState<string | null>(null)
  const [connectedReaders, setConnectedReaders] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState<{name: string, type: 'student' | 'teacher'} | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)
  
  // 重置处理状态
  const resetProcessingState = () => {
    isProcessingRef.current = false
    tvLog('处理状态已重置', { center })
  }

  // 处理NFC卡片检测
  const handleCardDetected = async (data: string, readerType: NFCReaderType) => {
    tvLog('NFC卡片检测开始', { cardData: data, readerType, center, isProcessing: isProcessingRef.current })
    
    if (isProcessingRef.current) {
      tvLog('跳过处理：正在处理中', { cardData: data, center })
      return
    }
    
    isProcessingRef.current = true
    setLastCardData(data)
    
    tvLog('检测到NFC卡片', { cardData: data, readerType, center })
    
    try {
      // 解析卡片数据
      let cardData: any
      try {
        cardData = JSON.parse(data)
      } catch {
        cardData = { uid: data, type: 'Raw Data' }
      }

      tvLog('开始处理考勤', { 
        nfcData: cardData.uid || data, 
        studentsCount: students.length, 
        teachersCount: teachers.length,
        center
      })

      // 使用独立的考勤处理
      const attendanceResult = await processAttendance(
        cardData.uid || data,
        students,
        teachers,
        center,
        {
          deviceId: `nfc-${readerType}`,
          deviceName: `${readerType.toUpperCase()} Reader`
        },
        (name, type) => {
          // 显示成功提示
          setSuccessMessage({ name, type })
          // 3秒后自动隐藏
          setTimeout(() => {
            setSuccessMessage(null)
          }, 3000)
        },
        (errorMsg) => {
          // 显示错误提示
          setErrorMessage(errorMsg)
          // 5秒后自动隐藏
          setTimeout(() => {
            setErrorMessage(null)
          }, 5000)
        }
      )

      if (attendanceResult.success && attendanceResult.user) {
        tvLog('考勤成功', { 
          user: attendanceResult.user.name, 
          type: attendanceResult.user.type,
          center 
        })
        
        // 调用外部回调
        if (onCardRead) {
          onCardRead(data)
        }
      } else {
        tvLog('考勤失败', { error: attendanceResult.error, center })
      }
    } catch (error) {
      tvLog('处理NFC卡片失败', { error: error, center })
    } finally {
      // 立即重置处理状态，不延迟
      resetProcessingState()
    }
  }

  // 处理NFC错误
  const handleNFCError = (error: string, readerType: NFCReaderType) => {
    tvLog('NFC错误', { error, readerType, center })
  }

  // 启动NFC扫描
  const startNFCScanning = async () => {
    try {
      // 检查HTTPS环境（手机NFC必需）
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
        tvLog('手机NFC需要HTTPS环境', { 
          currentProtocol: window.location.protocol,
          center 
        })
        return false
      }

      // 检查Web NFC支持
      if (typeof window !== 'undefined' && !('NDEFReader' in window)) {
        tvLog('此浏览器不支持Web NFC', { 
          userAgent: navigator.userAgent,
          center 
        })
        return false
      }

      // 设置回调函数
      unifiedNFCManager.setCallbacks(handleCardDetected, handleNFCError)
      
      // 刷新设备检测
      await unifiedNFCManager.refreshDevices()
      
      // 获取可用读取器状态
      const readersStatus = unifiedNFCManager.getAllReadersStatus()
      const connected = readersStatus.filter(r => r.connected).map(r => r.name)
      setConnectedReaders(connected)
      
      if (connected.length === 0) {
        tvLog('未检测到NFC读取器', { 
          readersStatus,
          center 
        })
        return false
      }

      // 启动扫描
      await unifiedNFCManager.startScanning()
      tvLog('NFC扫描已启动', { 
        connectedReaders: connected, 
        center,
        protocol: window.location.protocol
      })
      return true
    } catch (error) {
      tvLog('启动NFC扫描失败', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        center 
      })
      return false
    }
  }

  // 停止NFC扫描
  const stopNFCScanning = () => {
    try {
      unifiedNFCManager.stopScanning()
      tvLog('NFC扫描已停止', { center })
    } catch (error) {
      tvLog('停止NFC扫描失败', { error, center })
    }
  }

  useEffect(() => {
    if (!enabled) {
      setIsRunning(false)
      stopNFCScanning()
      return
    }

    tvLog('NFC后台运行器启动', { center, enabled })
    setIsRunning(true)
    
    // 重置处理状态
    resetProcessingState()

    // 启动NFC扫描
    startNFCScanning().then(success => {
      if (!success) {
        // 如果NFC扫描失败，回退到键盘模拟模式
        tvLog('回退到键盘模拟模式', { center })
        
        const handleKeyDown = (event: KeyboardEvent) => {
          // 忽略在输入框中的输入
          if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
            return
          }

          // 处理Enter键（模拟读卡完成）
          if (event.key === 'Enter') {
            event.preventDefault()
            
            if (!isProcessingRef.current) {
              isProcessingRef.current = true
              
              // 模拟NFC读卡数据
              const mockCardData = `NFC_${center}_${Date.now()}`
              setLastCardData(mockCardData)
              
              tvLog('模拟NFC读卡', { cardData: mockCardData, center })
              
              if (onCardRead) {
                onCardRead(mockCardData)
              }
              
              // 防止重复处理
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
              
              timeoutRef.current = setTimeout(() => {
                isProcessingRef.current = false
              }, 1000)
            }
          }
        }

        // 添加键盘监听器
        document.addEventListener('keydown', handleKeyDown)
        
        // 返回清理函数
        return () => {
          document.removeEventListener('keydown', handleKeyDown)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
        }
      }
    })

    // 清理函数
    return () => {
      stopNFCScanning()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsRunning(false)
      tvLog('NFC后台运行器停止', { center })
    }
  }, [center, onCardRead, enabled, students, teachers])

  // HID 虚拟键盘监听（独立于NFC扫描，24小时持续运行）
  useEffect(() => {
    if (!enabled) return
    
    let inputBuffer = ""
    let lastInputTime = 0
    let isHIDProcessing = false
    
    const handleHIDKeyPress = (event: KeyboardEvent) => {
      // 忽略在输入框中的输入
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const currentTime = Date.now()
      
      // 如果输入间隔超过1秒，清空缓冲区
      if (currentTime - lastInputTime > 1000) {
        inputBuffer = ""
      }
      
      lastInputTime = currentTime
      
      // 只处理数字和字母
      if (/[0-9a-zA-Z]/.test(event.key)) {
        inputBuffer += event.key
        tvLog('HID输入', { key: event.key, buffer: inputBuffer, center })
        
        // 如果缓冲区长度达到10位，尝试处理
        if (inputBuffer.length >= 10 && !isHIDProcessing) {
          isHIDProcessing = true
          const cardNumber = inputBuffer.slice(-10)
          tvLog('HID提取卡号', { cardNumber, center })
          
          // 处理HID读卡
          handleCardDetected(JSON.stringify({ uid: cardNumber, type: 'HID Card' }), 'usb')
          inputBuffer = ""
          
          // 立即重置HID处理状态
          setTimeout(() => {
            isHIDProcessing = false
            tvLog('HID处理完成，重置状态', { cardNumber, center })
          }, 1000)
        }
      }
    }
    
    // 添加全局键盘监听器（即使窗口失去焦点也能工作）
    document.addEventListener('keydown', handleHIDKeyPress)
    tvLog('HID键盘监听器已添加', { center, enabled })
    
    // 添加窗口焦点监听器，确保在窗口重新获得焦点时重置状态
    const handleWindowFocus = () => {
      tvLog('窗口重新获得焦点，重置HID状态', { center })
      inputBuffer = ""
      isHIDProcessing = false
      resetProcessingState()
    }
    
    const handleWindowBlur = () => {
      tvLog('窗口失去焦点，但HID监听继续运行', { center })
    }
    
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('blur', handleWindowBlur)
    
    tvLog('HID键盘监听已启动（全局模式）', { center, enabled })
    
    // 重置处理状态
    resetProcessingState()
    
    // 心跳检测，每30秒输出一次状态
    const heartbeatInterval = setInterval(() => {
      tvLog('HID监听器心跳检测', { 
        center, 
        enabled, 
        bufferLength: inputBuffer.length,
        isProcessing: isHIDProcessing,
        windowFocused: document.hasFocus(),
        timestamp: new Date().toISOString()
      })
    }, 30000)
    
    return () => {
      document.removeEventListener('keydown', handleHIDKeyPress)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('blur', handleWindowBlur)
      clearInterval(heartbeatInterval)
      tvLog('HID键盘监听已停止', { center })
    }
  }, [enabled, center, resetProcessingState])

  // 成功提示组件
  const SuccessNotification = () => {
  const { t } = useLanguage();
    if (!successMessage) return null
    
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <div>
            <div className="font-bold text-lg">{successMessage.name}</div>
            <div className="text-sm opacity-90">
              {successMessage.type === 'student' ? '学生' : '教师'} {t("打卡成功")}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 错误提示组件
  const ErrorNotification = () => {
  const { t } = useLanguage();
    if (!errorMessage) return null
    
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-red-600 text-white p-4 rounded-lg shadow-lg animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <div>
            <div className="font-bold text-lg">{t("打卡失败")}</div>
            <div className="text-sm opacity-90">{errorMessage}</div>
          </div>
        </div>
      </div>
    )
  }

  // 在开发环境下显示状态
  if (process.env.NODE_ENV === 'development') {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const hasWebNFC = typeof window !== 'undefined' && 'NDEFReader' in window
    
    return (
      <>
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
          <div>NFC: {isRunning ? '运行中' : '已停止'}</div>
          <div>{t("中心:")} {center}</div>
          <div>{t("协议:")} {typeof window !== 'undefined' ? window.location.protocol : 'unknown'}</div>
          <div className={isHttps ? 'text-green-400' : 'text-red-400'}>
            HTTPS: {isHttps ? '✅' : '❌'}
          </div>
          <div className={hasWebNFC ? 'text-green-400' : 'text-red-400'}>
            Web NFC: {hasWebNFC ? '✅' : '❌'}
          </div>
          <div>{t("读取器:")} {connectedReaders.length > 0 ? connectedReaders.join(', ') : '无'}</div>
          <div className="text-green-400">{t("HID键盘: ✅ 已启用（全局模式）")}</div>
          <div className={document.hasFocus() ? 'text-green-400' : 'text-yellow-400'}>
            {t("窗口焦点:")} {document.hasFocus() ? '✅ 有焦点' : '⚠️ 无焦点'}
          </div>
          {lastCardData && <div>{t("最后读卡:")} {lastCardData.slice(-8)}</div>}
          <div>{t("学生数:")} {students.length}</div>
          <div>{t("教师数:")} {teachers.length}</div>
          {!isHttps && (
            <div className="text-yellow-400 text-xs mt-1">
              {t("⚠️ 手机NFC需要HTTPS")}
            </div>
          )}
          {!hasWebNFC && (
            <div className="text-yellow-400 text-xs mt-1">
              {t("⚠️ 浏览器不支持Web NFC")}
            </div>
          )}
        </div>
        <SuccessNotification />
        <ErrorNotification />
      </>
    )
  }

  // 生产环境下显示成功和错误提示
  return (
    <>
      <SuccessNotification />
      <ErrorNotification />
    </>
  )
}
