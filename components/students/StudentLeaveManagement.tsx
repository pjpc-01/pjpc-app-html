"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { formatGrade } from "@/lib/utils"
import { toast } from "sonner"

export interface StudentLeaveRecord {
  id: string
  student_id: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  reason?: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  applied_date?: string
  approved_by?: string
  approved_date?: string
  rejection_reason?: string
  notes?: string
  expand?: { student_id?: { id: string; name: string; grade?: string; center?: string } }
}

interface StudentLite { id: string; name: string; grade?: string; center?: string }

const LEAVE_TYPES: { value: string; label: string }[] = [
  { value: "sick", label: "病假" },
  { value: "personal", label: "事假" },
  { value: "emergency", label: "急事假" },
  { value: "other", label: "其他" },
]

export default function StudentLeaveManagement() {
  const { t } = useLanguage()
  const [students, setStudents] = useState<StudentLite[]>([])
  const [records, setRecords] = useState<StudentLeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StudentLeaveRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({ studentId: "all", status: "all", month: "" })
  const [form, setForm] = useState({
    student_id: "", leave_type: "sick", start_date: "", end_date: "",
    status: "approved" as StudentLeaveRecord["status"], reason: "", notes: "",
  })

  const typeLabel = (v: string) => LEAVE_TYPES.find(x => x.value === v)?.label || v
  const statusLabel = (s: string) =>
    s === "approved" ? t("已批准") : s === "rejected" ? t("已拒绝") : s === "cancelled" ? t("已取消") : t("待处理")
  const statusClass = (s: string) =>
    s === "approved" ? "bg-green-100 text-green-800" : s === "rejected" ? "bg-red-100 text-red-800"
    : s === "cancelled" ? "bg-gray-100 text-gray-600" : "bg-yellow-100 text-yellow-800"
  const dstr = (v?: string) => (v ? String(v).slice(0, 10) : "")
  const studentName = (r: StudentLeaveRecord) =>
    r.expand?.student_id?.name || students.find(s => s.id === r.student_id)?.name || r.student_id
  const studentGrade = (r: StudentLeaveRecord) => {
    const g = r.expand?.student_id?.grade || students.find(s => s.id === r.student_id)?.grade
    return g ? formatGrade(g) : ""
  }

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students")
      const d = await res.json()
      const raw = Array.isArray(d) ? d : (d.items || d.data?.items || d.data || d.records || [])
      setStudents(raw.map((s: any) => ({ id: s.id, name: s.name, grade: s.grade, center: s.center })))
    } catch { /* 学生列表失败不阻塞请假列表 */ }
  }, [])

  const loadRecords = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.studentId !== "all") params.append("student_id", filters.studentId)
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.month) { params.append("year", filters.month.slice(0, 4)); params.append("month", filters.month.slice(5, 7)) }
      params.append("limit", "200")
      const res = await fetch(`/api/student-leave?${params}`)
      const d = await res.json()
      if (!res.ok || d.success === false) throw new Error(d.error || "请求失败")
      setRecords(d.data || [])
    } catch (e: any) {
      setError(t("获取学生请假记录失败")); console.error(e)
    } finally { setLoading(false) }
  }, [filters, t])

  useEffect(() => { loadStudents() }, [loadStudents])
  useEffect(() => { loadRecords() }, [loadRecords])

  const stats = useMemo(() => {
    const pick = (s: string) => records.filter(r => r.status === s).length
    return {
      total: records.length,
      approved: pick("approved"), pending: pick("pending"), rejected: pick("rejected"),
      days: records.filter(r => r.status === "approved").reduce((a, r) => a + (r.total_days || 0), 0),
    }
  }, [records])

  const openCreate = () => {
    setEditing(null)
    setForm({ student_id: "", leave_type: "sick", start_date: "", end_date: "", status: "approved", reason: "", notes: "" })
    setDialogOpen(true)
  }
  const openEdit = (r: StudentLeaveRecord) => {
    setEditing(r)
    setForm({
      student_id: r.student_id, leave_type: r.leave_type, start_date: dstr(r.start_date), end_date: dstr(r.end_date),
      status: r.status, reason: r.reason || "", notes: r.notes || "",
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.student_id) return toast.error(t("请选择学生"))
    if (!form.start_date || !form.end_date) return toast.error(t("请选择起止日期"))
    if (form.end_date < form.start_date) return toast.error(t("结束日期不能早于开始日期"))
    setSaving(true)
    try {
      const res = await fetch("/api/student-leave", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { ...form, id: editing.id } : form),
      })
      const d = await res.json()
      if (!res.ok || d.success === false) throw new Error(d.error || "保存失败")
      toast.success(editing ? t("已更新") : t("已保存"))
      setDialogOpen(false); loadRecords()
    } catch (e: any) { toast.error(e.message || t("保存失败")) } finally { setSaving(false) }
  }

  const setStatus = async (r: StudentLeaveRecord, status: string) => {
    try {
      const res = await fetch("/api/student-leave", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, status }),
      })
      const d = await res.json()
      if (!res.ok || d.success === false) throw new Error(d.error || "更新失败")
      toast.success(t("已更新")); loadRecords()
    } catch (e: any) { toast.error(e.message || t("更新失败")) }
  }

  const remove = async (r: StudentLeaveRecord) => {
    if (!confirm(t("确定要删除这条请假记录吗？此操作不可恢复。"))) return
    try {
      const res = await fetch(`/api/student-leave?id=${r.id}`, { method: "DELETE" })
      const d = await res.json()
      if (!res.ok || d.success === false) throw new Error(d.error || "删除失败")
      toast.success(t("已删除")); loadRecords()
    } catch (e: any) { toast.error(e.message || t("删除失败")) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: t("记录数"), value: stats.total },
          { label: t("已批准"), value: stats.approved },
          { label: t("待处理"), value: stats.pending },
          { label: t("已拒绝"), value: stats.rejected },
          { label: t("批准天数"), value: stats.days },
        ].map(x => (
          <Card key={x.label}>
            <CardContent className="pt-4">
              <div className="text-xs text-gray-500">{x.label}</div>
              <div className="text-2xl font-semibold">{x.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("学生请假记录")}</CardTitle>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />{t("新增请假")}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={filters.studentId} onValueChange={(v) => setFilters(f => ({ ...f, studentId: v }))}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder={t("全部学生")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部学生")}</SelectItem>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.grade ? ` (${formatGrade(s.grade)})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部状态")}</SelectItem>
                <SelectItem value="approved">{t("已批准")}</SelectItem>
                <SelectItem value="pending">{t("待处理")}</SelectItem>
                <SelectItem value="rejected">{t("已拒绝")}</SelectItem>
                <SelectItem value="cancelled">{t("已取消")}</SelectItem>
              </SelectContent>
            </Select>
            <Input type="month" className="w-[170px]" value={filters.month}
              onChange={(e) => setFilters(f => ({ ...f, month: e.target.value }))} />
            {(filters.studentId !== "all" || filters.status !== "all" || filters.month) && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ studentId: "all", status: "all", month: "" })}>{t("清除")}</Button>
            )}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {loading ? <div className="py-8 text-center text-sm text-gray-500">{t("加载中…")}</div> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t("学生")}</TableHead><TableHead>{t("年级")}</TableHead><TableHead>{t("类型")}</TableHead>
                <TableHead>{t("起止")}</TableHead><TableHead>{t("天数")}</TableHead><TableHead>{t("状态")}</TableHead>
                <TableHead>{t("原因")}</TableHead><TableHead className="text-right">{t("操作")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-gray-500 py-8">{t("暂无请假记录")}</TableCell></TableRow>
                ) : records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{studentName(r)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{studentGrade(r) || "-"}</TableCell>
                    <TableCell><Badge variant="secondary">{t(typeLabel(r.leave_type))}</Badge></TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{dstr(r.start_date)} → {dstr(r.end_date)}</TableCell>
                    <TableCell>{r.total_days ?? "-"}</TableCell>
                    <TableCell><Badge className={statusClass(r.status)}>{statusLabel(r.status)}</Badge></TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[220px] truncate" title={r.reason || ""}>{r.reason || "-"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {r.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setStatus(r, "approved")} title={t("批准")}><CheckCircle className="w-4 h-4 text-green-600" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setStatus(r, "rejected")} title={t("拒绝")}><XCircle className="w-4 h-4 text-red-600" /></Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(r)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("编辑请假记录") : t("新增学生请假")}</DialogTitle>
            <DialogDescription>{t("录入即生效：状态为「已批准」的学生当天不会被算缺勤")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("学生")} *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t("请选择学生")} /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.grade ? ` (${formatGrade(s.grade)})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("请假类型")}</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm(f => ({ ...f, leave_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map(x => <SelectItem key={x.value} value={x.value}>{t(x.label)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("状态")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as StudentLeaveRecord["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">{t("已批准")}</SelectItem>
                    <SelectItem value="pending">{t("待处理")}</SelectItem>
                    <SelectItem value="rejected">{t("已拒绝")}</SelectItem>
                    <SelectItem value="cancelled">{t("已取消")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("开始日期")} *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>{t("结束日期")} *</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{t("原因")}</Label>
              <Textarea rows={2} value={t(form)} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div>
              <Label>{t("备注")}</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("取消")}</Button>
              <Button onClick={save} disabled={saving}>{saving ? t("保存中…") : t("保存")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
