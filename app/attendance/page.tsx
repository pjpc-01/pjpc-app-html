"use client"

import { useSearchParams, useRouter } from "next/navigation"
import PageLayout from "@/components/layouts/PageLayout"
import UnifiedAttendanceHub from "@/components/attendance/UnifiedAttendanceHub"

export default function AttendancePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = searchParams.get("tab") || "records"

  const tabLabels: Record<string, string> = {
    records: "打卡记录",
    nfc: "NFC打卡",
    reports: "考勤报表",
  }

  return (
    <PageLayout
      title="考勤管理"
      description={`${tabLabels[tab] || "打卡记录"} — 统一考勤打卡与记录`}
      backUrl="/"
      userRole="admin"
      background="from-slate-50 to-blue-50"
    >
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 mb-4 w-fit">
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => router.replace(`/attendance?tab=${key}`, { scroll: false })}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <UnifiedAttendanceHub activeTab={tab} />
    </PageLayout>
  )
}
