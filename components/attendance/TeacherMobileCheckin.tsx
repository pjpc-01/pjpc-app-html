"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Fingerprint,
  LogIn,
  LogOut,
  Search,
  CheckCircle2,
  Clock,
  User,
  Smartphone,
  Loader2,
} from "lucide-react"

interface Teacher {
  id: string
  name: string
  position?: string
  department?: string
}

interface AttendanceStatus {
  canCheckIn: boolean
  canCheckOut: boolean
  status: string
  checkInTime?: string
}

export default function TeacherMobileCheckin() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [todayRecords, setTodayRecords] = useState<Record<string, any[]>>({})

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/teachers")
        const data = await res.json()
        // API returns: { success: true, data: [...teachers], total: N }
        if (data.success && Array.isArray(data.data)) {
          setTeachers(data.data)
        }
      } catch (err) {
        console.error("获取教师列表失败", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTeachers()
  }, [])

  // Fetch today's records for selected teacher
  const fetchTodayStatus = useCallback(async (teacherId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/teacher-attendance-only?teacherId=${teacherId}&date=${today}`)
      const data = await res.json()
      
      if (data.success && data.records?.length > 0) {
        const record = data.records[0]
        setAttendanceStatus({
          canCheckIn: !!record.check_out,
          canCheckOut: !record.check_out && !!record.check_in,
          status: record.check_out ? "completed" : record.check_in ? "checked_in" : "none",
          checkInTime: record.check_in,
        })
      } else {
        setAttendanceStatus({ canCheckIn: true, canCheckOut: false, status: "none" })
      }
    } catch {
      setAttendanceStatus({ canCheckIn: true, canCheckOut: false, status: "none" })
    }
  }, [])

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setSearchQuery("")
    fetchTodayStatus(teacher.id)
  }

  const handleCheckin = async (action: "check-in" | "check-out") => {
    if (!selectedTeacher) return
    setIsProcessing(true)
    setMessage(null)

    try {
      const res = await fetch("/api/teacher-attendance-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          teacherName: selectedTeacher.name,
          type: action,
          method: "mobile",
          timestamp: new Date().toISOString(),
        }),
      })
      const data = await res.json()

      if (data.success) {
        const actionText = action === "check-in" ? "签到成功！" : "签退成功！"
        setMessage({ type: "success", text: `✅ ${selectedTeacher.name} ${actionText}` })
        await fetchTodayStatus(selectedTeacher.id)
      } else {
        setMessage({ type: "error", text: data.message || "操作失败" })
      }
    } catch {
      setMessage({ type: "error", text: "网络错误，请重试" })
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-2">
          <Smartphone className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">教师签到</h1>
        <p className="text-sm text-gray-500">手机一键签到 / 签退</p>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Teacher Selector */}
      {!selectedTeacher ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              选择教师
            </CardTitle>
            <CardDescription>搜索或从列表中选择你的名字</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 h-12 text-base rounded-xl"
                placeholder="输入姓名搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredTeachers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">未找到匹配的教师</p>
              ) : (
                filteredTeachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => handleSelectTeacher(teacher)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      {teacher.position && (
                        <p className="text-xs text-gray-500">{teacher.position}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Check-in UI — Big Buttons */
        <div className="space-y-6">
          {/* Selected Teacher */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900">{selectedTeacher.name}</p>
                    {selectedTeacher.position && (
                      <p className="text-sm text-gray-500">{selectedTeacher.position}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTeacher(null)
                    setAttendanceStatus(null)
                    setMessage(null)
                  }}
                  className="text-blue-600"
                >
                  换人
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Display */}
          {attendanceStatus && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {attendanceStatus.status === "checked_in" || attendanceStatus.status === "completed" ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">今日已签到</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-5 w-5 text-amber-600" />
                        <span className="text-amber-700 font-medium">今日未签到</span>
                      </>
                    )}
                  </div>
                  {attendanceStatus.checkInTime && (
                    <span className="text-xs text-gray-500">
                      签到时间: {new Date(attendanceStatus.checkInTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Big Action Buttons */}
          <div className="space-y-4">
            {/* Check-in Button */}
            <Button
              onClick={() => handleCheckin("check-in")}
              disabled={isProcessing || !attendanceStatus?.canCheckIn}
              className={`
                w-full h-28 text-2xl font-bold rounded-2xl shadow-lg
                transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                ${attendanceStatus?.canCheckIn
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-green-200"
                  : "bg-gray-100 text-gray-400"
                }
              `}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <LogIn className="h-8 w-8" />
                  <span>签 到</span>
                </div>
              )}
            </Button>

            {/* Check-out Button */}
            <Button
              onClick={() => handleCheckin("check-out")}
              disabled={isProcessing || !attendanceStatus?.canCheckOut}
              className={`
                w-full h-28 text-2xl font-bold rounded-2xl shadow-lg
                transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                ${attendanceStatus?.canCheckOut
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200"
                  : "bg-gray-100 text-gray-400"
                }
              `}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <LogOut className="h-8 w-8" />
                  <span>签 退</span>
                </div>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Fingerprint className="h-3 w-3" />
              签到时请确保已到达中心
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
