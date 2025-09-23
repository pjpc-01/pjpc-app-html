"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { XCircle } from "lucide-react"
import UnifiedAttendanceSystem from "../components/attendance/UnifiedAttendanceSystem"

export default function TeacherCheckinPage() {
  const searchParams = useSearchParams()
  const centerId = searchParams.get('center')
  const teacherId = searchParams.get('teacherId')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 返回链接 */}
      <div className="p-4">
        <Link href="/teacher-workspace" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <XCircle className="h-4 w-4 mr-2 rotate-45" />
          返回教师工作台
        </Link>
      </div>

      {/* 统一考勤系统 - 教师视图 */}
      <UnifiedAttendanceSystem 
        userRole="teacher" 
        centerId={centerId || undefined}
        teacherId={teacherId || undefined}
      />
    </div>
  )
}
