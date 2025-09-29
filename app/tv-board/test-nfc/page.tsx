"use client"

import { useState, useEffect } from 'react'
import { unifiedNFCManager, NFCReaderType } from '@/lib/usb-nfc-reader'
import { processNFCAttendance } from '@/lib/nfc-scanner'

export default function TestNFCPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [connectedReaders, setConnectedReaders] = useState<string[]>([])
  const [lastCardData, setLastCardData] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [students] = useState([
    { id: '1', student_id: 'STU001', student_name: '张三', cardNumber: '1234567890', center: 'test' },
    { id: '2', student_id: 'STU002', student_name: '李四', cardNumber: '0987654321', center: 'test' }
  ])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]) // 保留最近20条日志
  }

  const handleCardDetected = async (data: string, readerType: NFCReaderType) => {
    addLog(`检测到卡片 (${readerType}): ${data}`)
    setLastCardData(data)

    try {
      // 解析卡片数据
      let cardData: any
      try {
        cardData = JSON.parse(data)
      } catch {
        cardData = { uid: data, type: 'Raw Data' }
      }

      // 处理考勤
      const attendanceResult = await processNFCAttendance(
        cardData.uid || data,
        students,
        [],
        'test',
        {
          deviceId: `nfc-${readerType}`,
          deviceName: `${readerType.toUpperCase()} Reader`
        }
      )

      if (attendanceResult.success && attendanceResult.user) {
        addLog(`✅ 考勤成功: ${attendanceResult.user.name} (${attendanceResult.user.type})`)
      } else {
        addLog(`❌ 考勤失败: ${attendanceResult.error}`)
      }
    } catch (error) {
      addLog(`❌ 处理错误: ${error}`)
    }
  }

  const handleNFCError = (error: string, readerType: NFCReaderType) => {
    addLog(`❌ ${readerType} 错误: ${error}`)
  }

  const startScanning = async () => {
    try {
      addLog('启动NFC扫描...')
      
      // 设置回调函数
      unifiedNFCManager.setCallbacks(handleCardDetected, handleNFCError)
      
      // 刷新设备检测
      await unifiedNFCManager.refreshDevices()
      
      // 获取可用读取器状态
      const readersStatus = unifiedNFCManager.getAllReadersStatus()
      const connected = readersStatus.filter(r => r.connected).map(r => r.name)
      setConnectedReaders(connected)
      
      if (connected.length === 0) {
        addLog('⚠️ 未检测到可用的NFC读取器')
        return
      }

      // 启动扫描
      await unifiedNFCManager.startScanning()
      setIsScanning(true)
      addLog(`✅ 扫描已启动，检测到 ${connected.length} 个读取器: ${connected.join(', ')}`)

    } catch (error) {
      addLog(`❌ 启动失败: ${error}`)
    }
  }

  const stopScanning = () => {
    try {
      unifiedNFCManager.stopScanning()
      setIsScanning(false)
      addLog('⏹️ 扫描已停止')
    } catch (error) {
      addLog(`❌ 停止失败: ${error}`)
    }
  }

  const requestUSBDeviceAccess = async () => {
    try {
      addLog('请求USB设备权限...')
      await unifiedNFCManager.requestUSBDeviceAccess()
      addLog('✅ USB设备权限已获取')
      // 重新启动扫描
      await startScanning()
    } catch (error) {
      addLog(`❌ USB设备权限请求失败: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">NFC 实时监听测试</h1>
        
        {/* 控制面板 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">控制面板</h2>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={startScanning}
              disabled={isScanning}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
            >
              {isScanning ? '扫描中...' : '开始扫描'}
            </button>
            
            <button
              onClick={stopScanning}
              disabled={!isScanning}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded"
            >
              停止扫描
            </button>
            
            <button
              onClick={requestUSBDeviceAccess}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              请求USB设备权限
            </button>
            
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
            >
              清除日志
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">状态信息</h3>
              <div className="space-y-1 text-sm">
                <div>扫描状态: {isScanning ? '✅ 运行中' : '❌ 已停止'}</div>
                <div>连接读取器: {connectedReaders.length > 0 ? connectedReaders.join(', ') : '无'}</div>
                <div>最后读卡: {lastCardData ? lastCardData.slice(-20) : '无'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">测试说明</h3>
              <div className="text-sm space-y-1">
                <div>• HID键盘读卡器: 直接输入卡片号码并按Enter</div>
                <div>• Web NFC: 需要HTTPS环境，支持NFC的设备</div>
                <div>• USB读卡器: 需要USB权限，连接读卡器设备</div>
                <div>• 串口读卡器: 需要串口权限，连接串口设备</div>
              </div>
            </div>
          </div>
        </div>

        {/* 日志显示 */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">实时日志</h2>
          <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">暂无日志...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
