"use client"

import { useState, useEffect, useCallback } from "react"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { usePickup, PickupRecord } from "@/hooks/usePickup"
import { useStudents } from "@/hooks/useStudents"
import { Truck, User, Phone, Car, Clock, CheckCircle, AlertCircle, Plus, Search, Users } from "lucide-react"
import { formatGrade } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

const RELATIONSHIPS = [
  { value: "father", label: "父亲" },
  { value: "mother", label: "母亲" },
  { value: "grandparent", label: "爷爷/奶奶" },
  { value: "sibling", label: "兄弟姐妹" },
  { value: "relative", label: "亲戚" },
  { value: "guardian", label: "监护人" },
  { value: "driver", label: "司机" },
  { value: "other", label: "其他" },
]

const statusBadge = (status: string) => {
  const { t } = useLanguage()
  switch (status) {
    case "picked_up": return <Badge className="bg-emerald-100 text-emerald-700">已接走</Badge>
    case "scheduled": return <Badge className="bg-blue-100 text-blue-700">{t('exam.scheduled')}</Badge>
    case "delayed": return <Badge className="bg-amber-100 text-amber-700">延迟</Badge>
    case "cancelled": return <Badge className="bg-slate-100 text-slate-500">{t('report.cancel')}</Badge>
    default: return <Badge>{status}</Badge>
  }
}

const relationLabel = (r: string) => RELATIONSHIPS.find(x => x.value === r)?.label || r

export default function PickupManagementPage() {
  const { t } = useLanguage()
  const { loading, getTodayPickups, recordPickup, updatePickup } = usePickup()
  const { students, loading: studentsLoading, fetchStudents } = useStudents()

  const [pickups, setPickups] = useState<PickupRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  // New pickup form
  const [selectedStudent, setSelectedStudent] = useState("")
  const [pickupBy, setPickupBy] = useState("")
  const [relationship, setRelationship] = useState("other")
  const [phone, setPhone] = useState("")
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => { fetchStudents() }, [])
  
  const loadPickups = useCallback(async () => {
    const data = await getTodayPickups()
    setPickups(data)
  }, [getTodayPickups])

  useEffect(() => { loadPickups() }, [loadPickups])

  const handleRecord = async () => {
    if (!selectedStudent || !pickupBy) return
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    await recordPickup({
      studentId: selectedStudent,
      pickup_date: now.toISOString().split('T')[0],
      pickup_time: time,
      pickup_by: pickupBy,
      relationship,
      phone,
      vehicle_plate: vehiclePlate,
      notes,
    })
    setDialogOpen(false)
    setPickupBy("")
    setVehiclePlate("")
    setPhone("")
    setNotes("")
    loadPickups()
  }

  const handleConfirm = async (id: string) => {
    await updatePickup(id, { parent_confirmed: true })
    loadPickups()
  }

  const stats = {
    total: pickups.length,
    pickedUp: pickups.filter(p => p.status === "picked_up").length,
    scheduled: pickups.filter(p => p.status === "scheduled").length,
    confirmed: pickups.filter(p => p.parent_confirmed).length,
  }

  return (
    <PageLayout title={t('pickup.pickup_management')} description="登记和追踪学生接送情况">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-slate-500">今日接送</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-slate-500">已接走</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.pickedUp}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-slate-500">待接</p>
          <p className="text-2xl font-bold text-amber-600">{stats.scheduled}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-slate-500">家长确认</p>
          <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="搜索学生..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />登记接送</Button>
      </div>

      {/* Pickup List */}
      {loading || studentsLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : pickups.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-slate-400">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>今日暂无接送记录</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />登记第一条接送</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.student')}</TableHead>
                  <TableHead>{t('student.grade')}</TableHead>
                  <TableHead>{t('announcement.time')}</TableHead>
                  <TableHead>接人者</TableHead>
                  <TableHead>{t('student.relationship')}</TableHead>
                  <TableHead>{t('report.phone')}</TableHead>
                  <TableHead>车牌</TableHead>
                  <TableHead>{t('teacher.status')}</TableHead>
                  <TableHead>{t('pickup.confirm')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pickups.filter(p => {
                  const name = p.expand?.studentId?.name || ""
                  return name.toLowerCase().includes(searchTerm.toLowerCase())
                }).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.expand?.studentId?.name || p.studentId}</TableCell>
                    <TableCell className="text-xs text-slate-500">{p.expand?.studentId?.grade || "-"}</TableCell>
                    <TableCell className="text-sm">{p.pickup_time || "-"}</TableCell>
                    <TableCell><span className="font-medium">{p.pickup_by}</span></TableCell>
                    <TableCell className="text-xs text-slate-500">{relationLabel(p.relationship)}</TableCell>
                    <TableCell className="text-xs">{p.phone || "-"}</TableCell>
                    <TableCell className="text-xs font-mono">{p.vehicle_plate || "-"}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>
                      {p.parent_confirmed
                        ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                        : <Button size="sm" variant="outline" onClick={() => handleConfirm(p.id)}>{t('pickup.confirm')}</Button>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>登记接送</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>选择学生 *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="选择学生..." /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.grade})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>接人者姓名 *</Label>
              <Input value={pickupBy} onChange={e => setPickupBy(e.target.value)} placeholder="接人者姓名" />
            </div>
            <div>
              <Label>{t('student.relationship')}</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RELATIONSHIPS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('report.phone')}</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="接人者电话" />
            </div>
            <div>
              <Label>车牌号</Label>
              <Input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="接人车辆车牌" />
            </div>
            <div>
              <Label>{t('teacher.notes')}</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="备注信息" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('report.cancel')}</Button>
            <Button onClick={handleRecord} disabled={!selectedStudent || !pickupBy}>确认登记</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
