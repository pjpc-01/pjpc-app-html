"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Search,
  Users,
  Activity,
  Wifi,
  ShieldCheck,
  Radio,
  Link as LinkIcon,
  Smartphone,
} from "lucide-react"

interface Student {
  id: string
  student_id: string
  student_name: string
  center: string
  status: string
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  center: string
  date: string
  time: string
  status: 'present' | 'late' | 'absent'
  timestamp: string
}

type AttendanceStatus = 'present' | 'late' | 'absent'

export default function MobileCheckinPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const centerId = params.centerId as string

  // ---------- 核心状态 ----------
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('present')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [centerInfo, setCenterInfo] = useState({
    name: centerId,
    totalStudents: 0,
    checkedInToday: 0,
    attendanceRate: 0
  })

  // ---------- 系统/设备状态 ----------
  const [isHttps, setIsHttps] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [nfcSupported, setNfcSupported] = useState<boolean>(false)
  const [nfcActive, setNfcActive] = useState<boolean>(false)
  const [pbHealthy, setPbHealthy] = useState<"ok" | "unknown" | "down">("unknown")
  const nfcControllerRef = useRef<AbortController | null>(null)

  // ---------- URL参数（用于自动打卡） ----------
  const studentIdFromUrl = searchParams.get("student_id") || ""
  const nameFromUrl = searchParams.get("name") || ""
  const centerFromUrl = searchParams.get("center") || ""

  // 时钟
  useEffect(() => {
    setIsHttps(typeof window !== "undefined" ? window.location.protocol === "https:" : false)
    setIsOnline(navigator.onLine)
    setNfcSupported(typeof window !== "undefined" && "NDEFReader" in window)

    const tick = setInterval(() => setCurrentTime(new Date()), 1000)
    const onlineHandler = () => setIsOnline(true)
    const offlineHandler = () => setIsOnline(false)

    window.addEventListener("online", onlineHandler)
    window.addEventListener("offline", offlineHandler)

    return () => {
      clearInterval(tick)
      window.removeEventListener("online", onlineHandler)
      window.removeEventListener("offline", offlineHandler)
    }
  }, [])

  // PocketBase健康探测（可选：/api/health 不存在则保持 unknown）
  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch("/api/health", { method: "GET", cache: "no-store" })
        if (res.ok) setPbHealthy("ok")
        else setPbHealthy("down")
      } catch {
        setPbHealthy("unknown")
      }
    }
    // 不阻塞页面
    ping()
  }, [])

  // 学生数据
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      try {
        // 直接请求特定中心的学生数据
        const response = await fetch(`/api/students?center=${encodeURIComponent(centerId)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStudents(data.students || [])
            setCenterInfo(prev => ({ ...prev, totalStudents: data.students?.length || 0 }))
            console.log(`✅ 成功加载 ${data.students?.length || 0} 个学生，中心: ${centerId}`)
          } else {
            console.error('获取学生数据失败:', data.error)
            setStudents([])
            setCenterInfo(prev => ({ ...prev, totalStudents: 0 }))
          }
        } else {
          console.error('获取学生数据失败:', response.status, response.statusText)
          setStudents([])
          setCenterInfo(prev => ({ ...prev, totalStudents: 0 }))
        }
      } catch (error) {
        console.error('获取学生数据失败:', error)
        setStudents([])
        setCenterInfo(prev => ({ ...prev, totalStudents: 0 }))
      } finally {
        setLoading(false)
      }
    }
    if (centerId) fetchStudents()
  }, [centerId])

  // 今日考勤
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/student-attendance?date=${today}&center=${centerId}`)
        if (response.ok) {
          const data = await response.json()
          setAttendanceRecords(data.data || [])
          const checkedInToday = data.data?.filter((r: AttendanceRecord) => r.status === 'present').length || 0
          const totalStudents = students.length
          const attendanceRate = totalStudents > 0 ? Math.round((checkedInToday / totalStudents) * 100) : 0
          setCenterInfo(prev => ({ ...prev, checkedInToday, attendanceRate }))
        }
      } catch (error) {
        console.error('获取考勤记录失败:', error)
      }
    }
    if (centerId && students.length > 0) fetchAttendance()
  }, [centerId, students])

  // 工具函数
  const todayISO = () => new Date().toISOString().split('T')[0]
  const nowISO = () => new Date().toISOString()

  const isStudentCheckedIn = (studentId: string) => {
    const today = todayISO()
    return attendanceRecords.some(r => r.student_id === studentId && r.date === today)
  }

  const getStudentAttendanceStatus = (studentId: string) => {
    const today = todayISO()
    const record = attendanceRecords.find(r => r.student_id === studentId && r.date === today)
    return record?.status || null
  }

  // ---------- 核心：统一处理考勤 ----------
  const processAttendance = async ({
    student,
    status = 'present' as AttendanceStatus,
    source = "manual" as "manual" | "nfc" | "url",
  }) => {
    if (!student) return
    setIsSubmitting(true)
    try {
      // 设备信息用于审计
      const deviceInfo = {
        ua: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        platform: typeof navigator !== "undefined" ? (navigator as any).platform : "unknown",
        source,
        https: isHttps,
        online: isOnline,
      }

      const payload = {
        student_id: student.student_id,
        student_name: student.student_name,
        center: centerId,
        date: todayISO(),
        time: nowISO(),
        status,
        timestamp: nowISO(),
        device_info: deviceInfo,
      }

      const res = await fetch('/api/student-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const msg = await safeText(res)
        throw new Error(msg || "提交考勤失败")
      }

      // 本地更新
      setAttendanceRecords(prev => [...prev, payload as any])
      // 重新统计
      const updatedRes = await fetch(`/api/student-attendance?date=${todayISO()}&center=${centerId}`)
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json()
        setAttendanceRecords(updatedData.data || [])
        const checkedInToday = updatedData.data?.filter((r: AttendanceRecord) => r.status === 'present').length || 0
        const totalStudents = students.length
        const attendanceRate = totalStudents > 0 ? Math.round((checkedInToday / totalStudents) * 100) : 0
        setCenterInfo(prev => ({ ...prev, checkedInToday, attendanceRate }))
      }

      toastSuccess(`✅ ${student.student_name} 打卡成功`)
      setSelectedStudent(null)
      setAttendanceStatus('present')
    } catch (err: any) {
      console.error(err)
      toastError(`❌ 打卡失败：${err?.message || "请重试"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------- URL 自动打卡 ----------
  useEffect(() => {
    if (!students.length) return
    // 优先用 URL 的 center 覆盖（允许跨中心链接）
    const effectiveCenter = centerFromUrl || centerId
    if (effectiveCenter !== centerId) {
      // 如果你希望自动跳转到 URL 指定中心，可在此处理
      // router.replace(`/checkin/${effectiveCenter}?${searchParams.toString()}`)
    }
    if (studentIdFromUrl) {
      const s = students.find(st => st.student_id === studentIdFromUrl)
      if (s) {
        processAttendance({ student: s, status: 'present', source: 'url' })
      } else if (nameFromUrl) {
        // 兜底：通过名字模糊匹配
        const s2 = students.find(st => st.student_name === nameFromUrl)
        if (s2) processAttendance({ student: s2, status: 'present', source: 'url' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]) // 仅在学生加载完成后执行一次

  // ---------- NFC 打卡 ----------
  const startNfcScan = async () => {
    if (!isHttps) {
      toastError("NFC 需要 HTTPS 环境")
      return
    }
    if (!nfcSupported) {
      toastError("此设备或浏览器不支持 NFC")
      return
    }
    try {
      // 终止上一次扫描
      if (nfcControllerRef.current) nfcControllerRef.current.abort()
      const controller = new AbortController()
      nfcControllerRef.current = controller

      // @ts-ignore
      const reader = new NDEFReader()
      setNfcActive(true)
      await reader.scan({ signal: controller.signal })

      reader.onreadingerror = () => toastError("NFC 读取失败，请重试")
      reader.onreading = (event: any) => {
        try {
          const { message } = event
          // 解析 NDEF 记录：优先拿 URL
          let urlFromTag = ""
          for (const record of message.records) {
            if (record.recordType === "url") {
              urlFromTag = decodeNfcText(record.data)
              break
            }
            if (record.recordType === "text") {
              const txt = decodeNfcText(record.data)
              // 允许把 URL 写在 TEXT 里
              if (txt?.startsWith("http")) urlFromTag = txt
            }
          }
          if (!urlFromTag) {
            toastError("未读到URL，请确认卡片已写入专属链接")
            return
          }
          // 解析 URL 参数
          const u = new URL(urlFromTag)
          const sid = u.searchParams.get("student_id") || ""
          const sname = u.searchParams.get("name") || ""
          const scenter = u.searchParams.get("center") || centerId
          const s = students.find(st => st.student_id === sid) || students.find(st => sname && st.student_name === sname)
          if (!s) {
            toastError("找不到该学生，请检查卡片信息或学生名单")
            return
          }
          processAttendance({ student: s, status: 'present', source: 'nfc' })
        } catch (e) {
          console.error(e)
          toastError("解析NFC数据出错")
        } finally {
          stopNfcScan()
        }
      }
      toastInfo("请将 NFC 卡片贴近设备…")
    } catch (err: any) {
      console.error(err)
      toastError(err?.message || "启动NFC失败")
      setNfcActive(false)
    }
  }

  const stopNfcScan = () => {
    if (nfcControllerRef.current) {
      nfcControllerRef.current.abort()
      nfcControllerRef.current = null
    }
    setNfcActive(false)
  }

  const decodeNfcText = (data: any) => {
    try {
      // data 为 DataView
      // 按NDEF文本记录规范解析，或直接尝试UTF-8解码
      const dec = new TextDecoder("utf-8")
      // 一些浏览器直接给 ArrayBuffer
      // @ts-ignore
      const buf = data?.buffer ? data.buffer : data
      return dec.decode(buf)
    } catch {
      return ""
    }
  }

  // ---------- 手动输入打卡 ----------
  const [manualId, setManualId] = useState("")
  const manualCheckIn = () => {
    const trimmedId = manualId.trim()
    if (!trimmedId) {
      toastError("请输入学号")
      return
    }
    
    if (students.length === 0) {
      toastError("学生数据未加载，请刷新页面重试")
      return
    }
    
    const s = students.find(st => st.student_id === trimmedId)
    if (!s) {
      console.log('🔍 手动打卡查找失败:', {
        inputId: trimmedId,
        availableStudents: students.length,
        availableIds: students.map(st => st.student_id),
        center: centerId
      })
      toastError(`未找到学号 "${trimmedId}" 的学生。当前中心: ${centerId}，可用学生: ${students.length} 人`)
      return
    }
    
    console.log('✅ 找到学生:', s)
    processAttendance({ student: s, status: attendanceStatus, source: "manual" })
    setManualId("")
  }

  // 列表过滤 + “未打卡优先”
  const filteredStudents = useMemo(() => {
    const key = searchTerm.toLowerCase()
    const list = students.filter(st =>
      st.student_name?.toLowerCase().includes(key) || st.student_id?.toLowerCase().includes(key)
    )
    const today = todayISO()
    // 未打卡优先显示
    return list.sort((a, b) => {
      const aIn = attendanceRecords.some(r => r.student_id === a.student_id && r.date === today)
      const bIn = attendanceRecords.some(r => r.student_id === b.student_id && r.date === today)
      if (aIn === bIn) return 0
      return aIn ? 1 : -1
    })
  }, [students, searchTerm, attendanceRecords])

  // ---------- 轻量Toast ----------
  const toastSuccess = (msg: string) => alert(msg)
  const toastError = (msg: string) => alert(msg)
  const toastInfo = (msg: string) => console.info(msg)

  // ---------- 渲染 ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">移动端考勤</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 中心信息卡片 */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <MapPin className="h-5 w-5" />
              {centerInfo.name} 中心
            </CardTitle>
            <CardDescription className="text-blue-700">NFC + URL + 手动输入的考勤系统</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-800">{centerInfo.totalStudents}</div>
                <div className="text-xs text-blue-600">总学生</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{centerInfo.checkedInToday}</div>
                <div className="text-xs text-green-600">今日已打卡</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{centerInfo.attendanceRate}%</div>
                <div className="text-xs text-purple-600">出勤率</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 系统状态面板 */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> 系统状态
            </CardTitle>
            <CardDescription>实时检测环境与服务健康</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className={`h-4 w-4 ${isHttps ? "text-green-600" : "text-red-600"}`} />
              协议：{isHttps ? "HTTPS（可用NFC）" : "HTTP（NFC不可用）"}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wifi className={`h-4 w-4 ${isOnline ? "text-green-600" : "text-red-600"}`} />
              网络：{isOnline ? "在线" : "离线"}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Radio className={`h-4 w-4 ${nfcSupported ? "text-green-600" : "text-red-600"}`} />
              NFC：{nfcSupported ? "支持" : "不支持"}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-gray-600" />
              设备：{typeof navigator !== "undefined" ? (navigator as any).platform : "unknown"}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon className={`h-4 w-4 ${pbHealthy === "ok" ? "text-green-600" : pbHealthy === "down" ? "text-red-600" : "text-gray-400"}`} />
              数据库：{pbHealthy === "ok" ? "连接正常" : pbHealthy === "down" ? "异常" : "未知"}
            </div>
          </CardContent>
        </Card>

        {/* 当前时间 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NFC 打卡区域 */}
        <Card className="mb-6 border-2 border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-emerald-800 flex items-center gap-2">
              <Radio className="h-5 w-5" /> NFC 卡片打卡
            </CardTitle>
            <CardDescription className="text-emerald-700">
              需要 HTTPS 与支持NFC的设备。点击按钮后将学生卡片贴近设备，卡片内需写入专属URL（含 student_id）。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={startNfcScan}
              disabled={!isHttps || !nfcSupported || nfcActive}
            >
              {nfcActive ? "正在等待卡片…" : "将NFC卡片贴近设备"}
            </Button>
            {nfcActive && (
              <Button variant="outline" onClick={stopNfcScan} className="flex-none">
                取消
              </Button>
            )}
          </CardContent>
        </Card>

        {/* URL 自动识别提示（当URL带参时） */}
        {studentIdFromUrl && (
          <Card className="mb-6 border border-indigo-200 bg-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-indigo-800 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" /> URL 自动打卡
              </CardTitle>
              <CardDescription className="text-indigo-700">
                已识别链接参数：student_id = {studentIdFromUrl}{nameFromUrl ? `，name = ${nameFromUrl}` : ""}{centerFromUrl ? `，center = ${centerFromUrl}` : ""}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* 手动输入打卡 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">手动输入打卡（备用）</CardTitle>
            <CardDescription>设备不支持NFC或卡片损坏时使用</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 调试信息 */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">数据状态:</span>
                <Badge variant={loading ? "secondary" : students.length > 0 ? "default" : "destructive"}>
                  {loading ? "加载中..." : students.length > 0 ? `${students.length} 个学生` : "无数据"}
                </Badge>
              </div>
              <div className="text-gray-600">
                中心: <span className="font-mono">{centerId}</span> | 
                学号示例: {students.length > 0 ? students.slice(0, 3).map(s => s.student_id).join(', ') : '无'}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="输入学号后回车"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") manualCheckIn() }}
                  className="pl-10"
                />
              </div>
              <Select value={attendanceStatus} onValueChange={(v: AttendanceStatus) => setAttendanceStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" />出勤</div></SelectItem>
                  <SelectItem value="late"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-600" />迟到</div></SelectItem>
                  <SelectItem value="absent"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" />缺席</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={manualCheckIn} disabled={!manualId || isSubmitting} className="w-full">
              确认打卡
            </Button>
          </CardContent>
        </Card>

        {/* 选择学生（手动点选） */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">选择学生</CardTitle>
            <CardDescription>搜索并选择要考勤的学生（未打卡优先显示）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名或学号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStudents.map((student) => {
                const checked = isStudentCheckedIn(student.student_id)
                const st = getStudentAttendanceStatus(student.student_id)
                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      checked
                        ? st === 'present'
                          ? 'border-green-200 bg-green-50'
                          : st === 'late'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => !checked && processAttendance({ student, status: 'present', source: "manual" })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${
                            checked
                              ? st === 'present'
                                ? 'bg-green-100 text-green-600'
                                : st === 'late'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {student.student_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{student.student_name}</p>
                          <p className="text-sm text-gray-500">{student.student_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {checked ? (
                          <Badge variant={st === 'present' ? 'default' : st === 'late' ? 'secondary' : 'destructive'}>
                            {st === 'present' ? '已打卡' : st === 'late' ? '迟到' : '缺席'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">待打卡</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>没有找到匹配的学生</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 今日考勤记录 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">今日考勤记录</CardTitle>
            <CardDescription>查看今日的考勤情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <div key={`${record.student_id}-${record.timestamp}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`${
                          record.status === 'present' ? 'bg-green-100 text-green-600' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {record.student_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{record.student_name}</p>
                        <p className="text-xs text-gray-500">{new Date(record.time).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <Badge variant={
                      record.status === 'present' ? 'default' :
                      record.status === 'late' ? 'secondary' :
                      'destructive'
                    }>
                      {record.status === 'present' ? '出勤' : record.status === 'late' ? '迟到' : '缺席'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>暂无考勤记录</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 防御：读取失败时的文本
async function safeText(res: Response) {
  try { return await res.text() } catch { return "" }
}
