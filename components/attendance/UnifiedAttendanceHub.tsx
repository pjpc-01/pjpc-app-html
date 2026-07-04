"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  SmartphoneNfc,
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  GraduationCap,
  User,
} from "lucide-react"
import NfcTapReader from "./NfcTapReader"

// ─── Types ─────────────────────────────────────────────

interface AttendanceRecord {
  id: string
  person_id: string
  person_name: string
  person_type: "student" | "teacher"
  center: string
  date: string
  check_in: string
  check_out: string
  status: "checked_in" | "completed" | "absent"
  method: string
  notes: string
  collection: string
}

interface TodayStats {
  total: number
  checkedIn: number
  checkedOut: number
  notYet: number
}

// ─── Main Component ───────────────────────────────────

export default function UnifiedAttendanceHub() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<TodayStats>({ total: 0, checkedIn: 0, checkedOut: 0, notYet: 0 })
  const [loading, setLoading] = useState(true)
  const [showNfc, setShowNfc] = useState(false)

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0])
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchFilter, setSearchFilter] = useState("")
  const [centerFilter, setCenterFilter] = useState<string>("all")

  // ─── Fetch Records ─────────────────────────────────

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.set("date", dateFilter)
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (searchFilter) params.set("search", searchFilter)
      if (centerFilter !== "all") params.set("center", centerFilter)
      params.set("pageSize", "200")

      const res = await fetch(`/api/student-attendance?${params}`)
      const data = await res.json()

      if (data.success) {
        setRecords(data.records || [])
        // Compute stats
        const recs: AttendanceRecord[] = data.records || []
        const todayRecs = recs.filter((r) => {
          const d = r.date?.split(" ")[0] || r.date?.split("T")[0] || ""
          return d === dateFilter
        })
        setStats({
          total: todayRecs.length,
          checkedIn: todayRecs.filter((r) => r.status === "checked_in").length,
          checkedOut: todayRecs.filter((r) => r.status === "completed").length,
          notYet: 0, // Can't know without full roster
        })
      }
    } catch (err) {
      console.error("获取考勤记录失败:", err)
    } finally {
      setLoading(false)
    }
  }, [dateFilter, typeFilter, searchFilter, centerFilter])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(fetchRecords, 30000)
    return () => clearInterval(interval)
  }, [fetchRecords])

  // ─── Format Helpers ────────────────────────────────

  const fmtTime = (iso: string) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    } catch {
      return iso.slice(11, 16)
    }
  }

  const fmtStatus = (status: string, type: string) => {
    if (status === "checked_in") return { label: "已签到", color: "bg-green-100 text-green-700", icon: LogIn }
    if (status === "completed") return { label: "已完成", color: "bg-blue-100 text-blue-700", icon: LogOut }
    return { label: "未签到", color: "bg-red-100 text-red-700", icon: UserX }
  }

  // ─── Render ────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ===== Stats Row ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">今日打卡</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">已签到</p>
                <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">已签退</p>
                <p className="text-2xl font-bold text-blue-600">{stats.checkedOut}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">今日记录</p>
                <p className="text-2xl font-bold text-amber-600">{records.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== NFC + Live Feed Row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* NFC Scan Area */}
        <div className="lg:col-span-2">
          {showNfc ? (
            <NfcTapReader />
          ) : (
            <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
                  <SmartphoneNfc className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">NFC 感应打卡</h3>
                <p className="text-sm text-gray-500 mb-6">学生和教师统一刷卡签到/签退</p>
                <Button
                  onClick={() => setShowNfc(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-blue-200"
                >
                  <SmartphoneNfc className="h-6 w-6 mr-2" />
                  开始打卡
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                最近打卡记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无记录</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {records.slice(0, 10).map((rec) => {
                    const statusInfo = fmtStatus(rec.status, rec.person_type)
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {rec.person_type === "teacher" ? (
                            <User className="h-4 w-4 text-purple-500" />
                          ) : (
                            <GraduationCap className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {rec.person_name}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {rec.person_type === "teacher" ? "教师" : "学生"}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400">
                            {fmtTime(rec.check_in)}
                            {rec.check_out && ` → ${fmtTime(rec.check_out)}`}
                          </div>
                        </div>
                        <Badge className={`text-[10px] ${statusInfo.color}`}>
                          {rec.status === "checked_in" ? "签到" : rec.status === "completed" ? "签退" : "未签"}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== Records Table ===== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              考勤记录
              <Badge variant="secondary" className="ml-1">{records.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date */}
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-36 h-9 text-sm"
              />
              {/* Type filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-28 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="teacher">教师</SelectItem>
                </SelectContent>
              </Select>
              {/* Center filter */}
              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger className="w-28 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部中心</SelectItem>
                  <SelectItem value="BATU14">BATU14</SelectItem>
                  <SelectItem value="PU1">PU1</SelectItem>
                </SelectContent>
              </Select>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="搜索姓名..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 w-36 h-9 text-sm"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={fetchRecords}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
              <p className="text-sm text-gray-400 mt-2">加载中...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserX className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>没有找到考勤记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold">姓名</TableHead>
                    <TableHead className="text-xs font-semibold">身份</TableHead>
                    <TableHead className="text-xs font-semibold">中心</TableHead>
                    <TableHead className="text-xs font-semibold">签到</TableHead>
                    <TableHead className="text-xs font-semibold">签退</TableHead>
                    <TableHead className="text-xs font-semibold">状态</TableHead>
                    <TableHead className="text-xs font-semibold">方式</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((rec) => {
                    const statusInfo = fmtStatus(rec.status, rec.person_type)
                    const StatusIcon = statusInfo.icon
                    return (
                      <TableRow key={rec.id} className="hover:bg-blue-50/50">
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              {rec.person_type === "teacher" ? (
                                <User className="h-3.5 w-3.5 text-purple-500" />
                              ) : (
                                <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                              )}
                            </div>
                            {rec.person_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {rec.person_type === "teacher" ? "教师" : "学生"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{rec.center || "—"}</TableCell>
                        <TableCell className="text-sm font-mono">{fmtTime(rec.check_in)}</TableCell>
                        <TableCell className="text-sm font-mono">{fmtTime(rec.check_out)}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">{rec.method || "—"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
