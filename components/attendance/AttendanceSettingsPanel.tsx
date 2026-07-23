"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Settings2, Save, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface GradeOverride {
  grade: string
  checkin_deadline: string
  checkout_minimum: string
}

interface TeacherOverride {
  teacher_id: string
  teacher_name: string
  checkin_deadline: string
  checkout_minimum: string
}

interface AttendanceConfig {
  checkin_deadline: string
  checkout_minimum: string
  points_full_attendance: number
  points_late: number
  points_early: number
  absent_alert_days: number
  enable_points: boolean
  grade_overrides: GradeOverride[]
  teacher_overrides: TeacherOverride[]
}

export default function AttendanceSettingsPanel() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [config, setConfig] = useState<AttendanceConfig | null>(null)
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [newGrade, setNewGrade] = useState("")
  const [newGradeDeadline, setNewGradeDeadline] = useState("14:00")
  const [newGradeMinimum, setNewGradeMinimum] = useState("17:00")
  const [newTeacherId, setNewTeacherId] = useState("")
  const [newTeacherDeadline, setNewTeacherDeadline] = useState("14:00")
  const [newTeacherMinimum, setNewTeacherMinimum] = useState("17:00")

  // Load settings + teachers
  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      fetch("/api/attendance/settings").then(r => r.json()),
      fetch("/api/pocketbase-proxy/api/collections/teachers/records?perPage=200&fields=id,teacher_name").then(r => r.json()),
    ]).then(([settingsData, teachersData]) => {
      if (settingsData.success) setConfig(settingsData.settings)
      setTeachers((teachersData?.items || []).map((t: any) => ({
        id: t.id,
        name: t.teacher_name || t.name || t.id,
      })))
    }).catch(console.error).finally(() => setLoading(false))
  }, [open])

  const update = (key: string, value: any) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  const addGrade = () => {
    if (!newGrade.trim() || !config) return
    const exists = config.grade_overrides.find(g => g.grade === newGrade.trim())
    if (exists) return
    setConfig({
      ...config,
      grade_overrides: [...config.grade_overrides, {
        grade: newGrade.trim(),
        checkin_deadline: newGradeDeadline,
        checkout_minimum: newGradeMinimum,
      }],
    })
    setNewGrade("")
  }

  const removeGrade = (grade: string) => {
    if (!config) return
    setConfig({
      ...config,
      grade_overrides: config.grade_overrides.filter(g => g.grade !== grade),
    })
  }

  const addTeacher = () => {
    if (!newTeacherId || !config) return
    const teacher = teachers.find(t => t.id === newTeacherId)
    if (!teacher) return
    const exists = config.teacher_overrides.find(t => t.teacher_id === newTeacherId)
    if (exists) return
    setConfig({
      ...config,
      teacher_overrides: [...config.teacher_overrides, {
        teacher_id: newTeacherId,
        teacher_name: teacher.name,
        checkin_deadline: newTeacherDeadline,
        checkout_minimum: newTeacherMinimum,
      }],
    })
    setNewTeacherId("")
  }

  const removeTeacher = (teacherId: string) => {
    if (!config) return
    setConfig({
      ...config,
      teacher_overrides: config.teacher_overrides.filter(t => t.teacher_id !== teacherId),
    })
  }

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch("/api/attendance/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error("保存失败:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Settings2 className="h-4 w-4" />
        考勤设置
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <Card className="mt-2 border-dashed">
          <CardContent className="p-4 space-y-4">
            {loading ? (
              <div className="text-center py-4"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>
            ) : config ? (
              <>
                {/* ─── Global Settings ─── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">全局默认</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-gray-400">签到截止（迟到线）</Label>
                      <Input
                        type="time"
                        value={config.checkin_deadline}
                        onChange={e => update("checkin_deadline", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-400">签退最早（早退线）</Label>
                      <Input
                        type="time"
                        value={config.checkout_minimum}
                        onChange={e => update("checkout_minimum", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── Grade Overrides ─── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">按年级</p>
                  {config.grade_overrides.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {config.grade_overrides.map(g => (
                        <div key={g.grade} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <Badge variant="secondary" className="text-[10px]">{g.grade}</Badge>
                          <span className="text-[10px] text-gray-500">签到 ≤{g.checkin_deadline}</span>
                          <span className="text-[10px] text-gray-500">签退 ≥{g.checkout_minimum}</span>
                          <button onClick={() => removeGrade(g.grade)} className="ml-auto text-red-400 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="年级（如：一年级）"
                      value={newGrade}
                      onChange={e => setNewGrade(e.target.value)}
                      className="h-7 text-xs w-28"
                    />
                    <Input
                      type="time"
                      value={newGradeDeadline}
                      onChange={e => setNewGradeDeadline(e.target.value)}
                      className="h-7 text-xs w-24"
                    />
                    <Input
                      type="time"
                      value={newGradeMinimum}
                      onChange={e => setNewGradeMinimum(e.target.value)}
                      className="h-7 text-xs w-24"
                    />
                    <Button size="sm" variant="outline" onClick={addGrade} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> 添加
                    </Button>
                  </div>
                </div>

                {/* ─── Teacher Overrides ─── */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">按老师</p>
                  {config.teacher_overrides.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {config.teacher_overrides.map(t => (
                        <div key={t.teacher_id} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1">
                          <Badge variant="secondary" className="text-[10px]">{t.teacher_name}</Badge>
                          <span className="text-[10px] text-gray-500">签到 ≤{t.checkin_deadline}</span>
                          <span className="text-[10px] text-gray-500">签退 ≥{t.checkout_minimum}</span>
                          <button onClick={() => removeTeacher(t.teacher_id)} className="ml-auto text-red-400 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <select
                      value={newTeacherId}
                      onChange={e => setNewTeacherId(e.target.value)}
                      className="h-7 text-xs border rounded px-2 bg-white w-36"
                    >
                      <option value="">选择老师</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <Input
                      type="time"
                      value={newTeacherDeadline}
                      onChange={e => setNewTeacherDeadline(e.target.value)}
                      className="h-7 text-xs w-24"
                    />
                    <Input
                      type="time"
                      value={newTeacherMinimum}
                      onChange={e => setNewTeacherMinimum(e.target.value)}
                      className="h-7 text-xs w-24"
                    />
                    <Button size="sm" variant="outline" onClick={addTeacher} className="h-7 text-xs" disabled={!newTeacherId}>
                      <Plus className="h-3 w-3 mr-1" /> 添加
                    </Button>
                  </div>
                </div>

                {/* ─── Points Settings ─── */}
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">积分联动</p>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-gray-600">启用积分联动</Label>
                    <Switch
                      checked={config.enable_points}
                      onCheckedChange={v => update("enable_points", v)}
                    />
                  </div>
                  {config.enable_points && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-gray-400">全勤 +分</Label>
                        <Input
                          type="number"
                          value={config.points_full_attendance}
                          onChange={e => update("points_full_attendance", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-400">迟到扣分</Label>
                        <Input
                          type="number"
                          value={config.points_late}
                          onChange={e => update("points_late", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-400">早退扣分</Label>
                        <Input
                          type="number"
                          value={config.points_early}
                          onChange={e => update("points_early", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Save ─── */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 text-xs">
                    {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    保存设置
                  </Button>
                  {saved && <Badge className="bg-green-100 text-green-700 text-[10px]">✓ 已保存</Badge>}
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-400 text-xs">{t('course.load_failed')}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
