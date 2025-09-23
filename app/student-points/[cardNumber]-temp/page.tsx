"use client"

import { useParams } from 'next/navigation'
import UnifiedAttendanceSystem from "../../../components/attendance/UnifiedAttendanceSystem"

export default function StudentPointsPage() {
  const params = useParams()
  const cardNumber = params.cardNumber as string

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 统一考勤系统 - 学生视图 */}
      <UnifiedAttendanceSystem 
        userRole="student" 
        studentId={cardNumber}
      />
    </div>
  )
}
