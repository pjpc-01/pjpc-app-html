"use client"

import { useState, useEffect } from 'react'

export default function TestNFCAttendancePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  // 测试学生数据
  const testStudents = [
    {
      id: '1',
      student_id: 'B6',
      student_name: 'Kalkin Parthipan 卡信',
      cardNumber: '0000000000',
      center: 'WX 01'
    },
    {
      id: '2', 
      student_id: 'G4',
      student_name: 'Chan Ying Shuang 陈萤霜',
      cardNumber: '1111111111',
      center: 'WX 01'
    }
  ]

  // 模拟HID读卡
  const simulateCardRead = (cardNumber: string) => {
    addLog(`模拟读卡: ${cardNumber}`)
    
    // 查找学生
    const student = testStudents.find(s => s.cardNumber === cardNumber)
    if (student) {
      addLog(`✅ 找到学生: ${student.student_name} (${student.student_id})`)
      
      // 模拟考勤记录
      const attendanceData = {
        student_id: student.student_id,
        student_name: student.student_name,
        center: student.center,
        attendance_time: new Date().toISOString(),
        status: 'present'
      }
      
      addLog(`📝 记录考勤: ${JSON.stringify(attendanceData)}`)
      addLog(`🎉 考勤成功!`)
    } else {
      addLog(`❌ 未找到匹配的学生`)
    }
  }

  // 键盘监听
  useEffect(() => {
    let inputBuffer = ""
    let lastInputTime = 0

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const currentTime = Date.now()
      
      if (currentTime - lastInputTime > 1000) {
        inputBuffer = ""
      }
      
      lastInputTime = currentTime
      
      if (/[0-9a-zA-Z]/.test(event.key)) {
        inputBuffer += event.key
        addLog(`HID输入: ${event.key} (缓冲区: ${inputBuffer})`)
        
        if (inputBuffer.length >= 10) {
          const cardNumber = inputBuffer.slice(-10)
          addLog(`提取卡号: ${cardNumber}`)
          simulateCardRead(cardNumber)
          inputBuffer = ""
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    setLoading(false)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">NFC考勤测试页面</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 测试学生数据 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">测试学生数据</h2>
            <div className="space-y-2">
              {testStudents.map(student => (
                <div key={student.id} className="bg-gray-700 p-3 rounded">
                  <div className="font-medium">{student.student_name}</div>
                  <div className="text-sm text-gray-300">ID: {student.student_id}</div>
                  <div className="text-sm text-gray-300">卡号: {student.cardNumber}</div>
                  <div className="text-sm text-gray-300">中心: {student.center}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 测试说明 */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">测试说明</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                <span>在页面上快速输入10位数字来模拟HID读卡</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <span>测试卡号: <code className="bg-gray-700 px-2 py-1 rounded">0000000000</code></span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <span>测试卡号: <code className="bg-gray-700 px-2 py-1 rounded">1111111111</code></span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                <span>输入其他10位数字会显示"未找到匹配的学生"</span>
              </div>
            </div>
          </div>
        </div>

        {/* 日志显示 */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">实时日志</h2>
          <div className="bg-black p-4 rounded h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">等待输入...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
