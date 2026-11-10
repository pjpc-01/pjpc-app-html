"use client"

import PageLayout from "@/components/layouts/PageLayout"
import ManualAttendanceView from "@/components/attendance/ManualAttendanceView"
import { useLanguage } from "@/contexts/language-context";

export default function ManualAttendancePage() {
  const { t } = useLanguage();
  return (
    <PageLayout
      title={t("手动点名")}
      description={t("一格一天，看整月出席")}
      backUrl="/attendance"
      userRole="admin"
      background="from-slate-50 to-blue-50"
    >
      <ManualAttendanceView />
    </PageLayout>
  )
}
