"use client"

import { useState } from 'react'
import NFCBackgroundRunner from '../tv-board/components/systems/nfc-background-runner'

export default function TestNFCPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">NFC刷卡测试页面</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">测试说明：</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>在页面上按任意数字键10次来模拟刷卡</li>
          <li>测试卡号：3680715012 (学生G4 - Chan Ying Shuang)</li>
          <li>测试卡号：2732884228 (学生B1 - Chew Xu Xue)</li>
          <li>测试卡号：2222222222 (教师ADM02 - Cheng Mun Poo)</li>
        </ul>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">实时日志：</h2>
        <div className="bg-black p-4 rounded h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-green-400 text-sm font-mono">
              {log}
            </div>
          ))}
        </div>
      </div>

      <NFCBackgroundRunner 
        center="WX 01" 
        enabled={true}
        students={[]}
        teachers={[]}
        onCardRead={(cardData) => {
          addLog(`NFC读卡成功: ${cardData}`)
        }}
      />
    </div>
  )
}
