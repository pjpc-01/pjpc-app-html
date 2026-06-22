"use client"

import React, { useState } from "react"
import Link from "next/link"
import PageLayout from "@/components/layouts/PageLayout"
import { useParents, Parent } from "@/hooks/useParents"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  User,
  Phone,
  Mail,
  GraduationCap,
  Eye,
} from "lucide-react"

export default function ParentManagementPage() {
  const { parents, loading, refetch } = useParents()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Parent | null>(null)
  const [saving, setSaving] = useState(false)
  const [showStudents, setShowStudents] = useState<Parent | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: "",
    nric: "",
    phone: "",
    email: "",
    address: "",
    relationship: "父亲",
    occupation: "",
    notes: "",
    status: "active",
  })

  const filtered = parents.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.nric?.toLowerCase().includes(q)
    )
  })

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", nric: "", phone: "", email: "", address: "", relationship: "父亲", occupation: "", notes: "", status: "active" })
    setShowForm(true)
  }

  const openEdit = (p: Parent) => {
    setEditing(p)
    setForm({
      name: p.name,
      nric: p.nric || "",
      phone: p.phone,
      email: p.email || "",
      address: p.address || "",
      relationship: p.relationship,
      occupation: p.occupation || "",
      notes: p.notes || "",
      status: p.status,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      toast.error("姓名和电话是必填项")
      return
    }
    setSaving(true)
    try {
      const url = editing
        ? `/api/pocketbase-proxy/api/collections/parents/records/${editing.id}`
        : "/api/pocketbase-proxy/api/collections/parents/records"
      const method = editing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Save failed")
      toast.success(editing ? "家长信息已更新" : "家长已添加")
      setShowForm(false)
      refetch()
    } catch {
      toast.error("保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此家长记录？")) return
    try {
      await fetch(`/api/pocketbase-proxy/api/collections/parents/records/${id}`, { method: "DELETE" })
      toast.success("家长已删除")
      refetch()
    } catch {
      toast.error("删除失败")
    }
  }

  return (
    <PageLayout title="家长管理" description="管理家长信息和关联学生" backUrl="/" userRole="admin">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索家长姓名、电话、NRIC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          添加家长
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            家长列表 ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>暂无家长数据{search ? "（匹配搜索条件）" : ""}</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>关系</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>职业</TableHead>
                    <TableHead>学生数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.relationship}</TableCell>
                      <TableCell className="font-mono text-sm">{p.phone}</TableCell>
                      <TableCell className="text-sm">{p.email || "-"}</TableCell>
                      <TableCell className="text-sm">{p.occupation || "-"}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => setShowStudents(p)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          {p.studentCount || 0}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "secondary"}>
                          {p.status === "active" ? "活跃" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑家长" : "添加家长"}</DialogTitle>
            <DialogDescription>填写家长基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>姓名 *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} placeholder="家长姓名" />
              </div>
              <div>
                <Label>关系 *</Label>
                <Select value={form.relationship} onValueChange={(v) => setForm(f => ({...f, relationship: v}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="父亲">父亲</SelectItem>
                    <SelectItem value="母亲">母亲</SelectItem>
                    <SelectItem value="监护人">监护人</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>状态</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">活跃</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>电话 *</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} placeholder="012-3456789" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" />
              </div>
              <div>
                <Label>NRIC</Label>
                <Input value={form.nric} onChange={(e) => setForm(f => ({...f, nric: e.target.value}))} placeholder="身份证号码" />
              </div>
              <div>
                <Label>职业</Label>
                <Input value={form.occupation} onChange={(e) => setForm(f => ({...f, occupation: e.target.value}))} placeholder="职业" />
              </div>
              <div className="col-span-2">
                <Label>地址</Label>
                <Input value={form.address} onChange={(e) => setForm(f => ({...f, address: e.target.value}))} placeholder="家庭地址" />
              </div>
              <div className="col-span-2">
                <Label>备注</Label>
                <Input value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} placeholder="备注信息" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : editing ? "更新" : "添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 关联学生弹窗 */}
      <Dialog open={!!showStudents} onOpenChange={(o) => !o && setShowStudents(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {showStudents?.name} 的关联学生
            </DialogTitle>
          </DialogHeader>
          {showStudents?.expand?.students && showStudents.expand.students.length > 0 ? (
            <div className="space-y-2">
              {showStudents.expand.students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {s.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.grade || "未设置年级"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">暂未关联学生</p>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
