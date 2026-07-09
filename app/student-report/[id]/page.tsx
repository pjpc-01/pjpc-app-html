"use client"

import { Suspense } from "react"
import StudentReportContent from "./StudentReportContent"

export default function StudentReportPage() {
  return (
    <Suspense fallback={
      <div className="glass-body min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full" />
      </div>
    }>
      <StudentReportContent />
    </Suspense>
  )
}
