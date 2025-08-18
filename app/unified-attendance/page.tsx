"use client"

import UnifiedAttendanceSystem from "@/app/components/systems/unified-attendance-system"

export default function UnifiedAttendancePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">统一打卡系统</h1>
          <p className="text-gray-600">NFC/RFID 统一管理平台 - 支持卡片读写、设备管理和打卡记录</p>
        </div>
        
        <UnifiedAttendanceSystem />
      </div>
    </div>
  )
}

