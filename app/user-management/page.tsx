"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2, Trash2, ArrowLeft, Users, ShieldOff, Shield,
  CheckCircle2, MailCheck, MailX, UserCog, UserPlus,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import PermissionEditor from "@/components/admin/PermissionEditor"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UserManagementPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", role: "teacher", student_id: "" })

  const isAdmin = userProfile?.role === "admin"

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/pocketbase-proxy/api/collections/role_permissions/records?perPage=50&sort=role")
      const data = await res.json()
      const opts = (data?.items || []).map((item: any) => ({ value: item.role, label: item.label || item.role }))
      if (!opts.some((o: any) => o.value === 'pending')) opts.unshift({ value: 'pending', label: t('待审核') })
      setRoleOptions(opts)
    } catch { setRoleOptions([{ value: "admin", label: "管理员" }]) }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users || [])
    } finally { setLoading(false) }
  }

  const fetchProfiles = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/pocketbase-proxy/api/collections/teachers/records?perPage=500"),
        fetch("/api/pocketbase-proxy/api/collections/students/records?perPage=500&filter=status='active'"),
      ])
      setTeachers(((await tRes.json()).items || []))
      setStudents(((await sRes.json()).items || []))
    } catch {}
  }

  useEffect(() => {
    if (isAdmin) { fetchUsers(); fetchRoles(); fetchProfiles() }
  }, [isAdmin])

  const handleTabChange = (tab: string) => { if (tab === "users") fetchRoles() }

  const changeRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    try {
      await fetch(`/api/pocketbase-proxy/api/collections/users/records/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      fetchUsers()
    } finally { setUpdating(null) }
  }

  const toggleVerified = async (userId: string, current: boolean) => {
    setUpdating(userId)
    try {
      await fetch(`/api/pocketbase-proxy/api/collections/users/records/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !current }),
      })
      fetchUsers()
    } finally { setUpdating(null) }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm(t("确定要删除此用户？"))) return
    setUpdating(userId)
    try { await fetch(`/api/pocketbase-proxy/api/collections/users/records/${userId}`, { method: "DELETE" }); fetchUsers() }
    finally { setUpdating(null) }
  }

  // 管理员重设密码（不依赖邮件/ SMTP）
  const resetUserPassword = async (user: any) => {
    const who = user.name || user.email || user.id
    const pwd = window.prompt(who + " — " + t("设一个临时密码(至少 6 位)，请线下告知本人："))
    if (!pwd) return
    if (pwd.length < 6) { window.alert(t("密码至少 6 位")); return }
    setUpdating(user.id)
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newPassword: pwd }),
      })
      const d = await res.json()
      if (d?.success) window.alert(t("密码已重设，请线下告知本人：") + pwd)
      else window.alert(t("重设失败：") + (d?.error || String(res.status)))
    } catch (e) {
      window.alert(t("重设失败：") + (e instanceof Error ? e.message : ""))
    } finally { setUpdating(null) }
  }

  const createUser = async () => {
    const email = newUser.email.trim()
    const name = newUser.name.trim()
    if (!email || !newUser.password) { window.alert(t("账号和密码都要填")); return }
    if (newUser.password.length < 8) { window.alert(t("密码至少 8 位")); return }
    if (newUser.role === "student" && !newUser.student_id) { window.alert(t("学生账号要选一位学生绑定")); return }
    setCreating(true)
    try {
      const body: any = {
        email,
        password: newUser.password,
        passwordConfirm: newUser.password,
        name: name || email,
        role: newUser.role,
        emailVisibility: false,
      }
      if (newUser.role === "student") body.student_id = newUser.student_id
      const res = await fetch("/api/pocketbase-proxy/api/collections/users/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => null)
      if (!res.ok) {
        const detail = d?.data ? Object.values(d.data).map((v: any) => v?.message).filter(Boolean).join(" / ") : ""
        window.alert(t("建账号失败：") + (detail || d?.message || String(res.status)))
        return
      }
      setCreateOpen(false)
      setNewUser({ email: "", password: "", name: "", role: "teacher", student_id: "" })
      window.alert(t("账号已建好，请把账号和密码告知本人：") + email)
      fetchUsers()
    } catch (e) {
      window.alert(t("建账号失败：") + (e instanceof Error ? e.message : ""))
    } finally { setCreating(false) }
  }

  const linkProfile = async (userId: string, profileId: string) => {
    setUpdating(userId)
    try {
      const isTeacher = teachers.some(t => t.id === profileId)
      const body = isTeacher ? { teacher_id: profileId, student_id: "" } : { student_id: profileId, teacher_id: "" }
      await fetch(`/api/pocketbase-proxy/api/collections/users/records/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      fetchUsers()
    } finally { setUpdating(null) }
  }

  const getLinkedName = (user: any) => {
    if (user.teacher_id) {
      const t = teachers.find(t => t.id === user.teacher_id)
      return t ? `👨‍🏫 ${t.name || t.teacher_name}` : null
    }
    if (user.student_id) {
      const s = students.find(s => s.id === user.student_id)
      return s ? `🎓 ${s.name || s.student_name}` : null
    }
    return null
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">{t("访问被拒绝")}</h2>
          <Button onClick={() => router.push("/")}>{t('system.back_to_home')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("用户与权限管理")}</h1>
          <p className="text-sm text-muted-foreground">{t("管理用户账号、角色权限和档案绑定")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />{t("新增用户")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />{t("返回")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" />{t("用户列表")}</TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2"><Shield className="h-4 w-4" />{t("角色权限")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />{t("所有用户")}
                {!loading && <span className="text-sm font-normal text-muted-foreground">{t("（")}{users.length} {t("人）")}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">{t('admin.no_users')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('student.name')}</TableHead>
                        <TableHead>{t('report.email')}</TableHead>
                        <TableHead>{t('admin.role')}</TableHead>
                        <TableHead>{t("绑定档案")}</TableHead>
                        <TableHead>{t('user.verify')}</TableHead>
                        <TableHead>{t('admin.registration_time')}</TableHead>
                        <TableHead className="text-right">{t('teacher.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <select
                              value={user.role || "teacher"}
                              onChange={(e) => changeRole(user.id, e.target.value)}
                              disabled={updating === user.id || user.id === userProfile?.id}
                              className="text-sm rounded-md border border-amber-200 bg-white px-2 py-1 font-medium hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50 cursor-pointer"
                            >
                              {roleOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                            {user.id === userProfile?.id && <span className="text-xs text-muted-foreground ml-1">{t("（你）")}</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {updating === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                                <select
                                  value={user.teacher_id || user.student_id || ""}
                                  onChange={(e) => { if (e.target.value) linkProfile(user.id, e.target.value) }}
                                  className="text-xs rounded border border-gray-200 bg-white px-1 py-0.5 max-w-[160px] truncate"
                                >
                                  <option value="">{t("— 未绑定 —")}</option>
                                  <optgroup label={t("👨‍🏫 教师")}>
                                    {teachers.map(t => (<option key={t.id} value={t.id}>{t.name || t.teacher_name || t.id}</option>))}
                                  </optgroup>
                                  <optgroup label={t("🎓 学生")}>
                                    {students.map(s => (<option key={s.id} value={s.id}>{s.name || s.student_name || s.id}</option>))}
                                  </optgroup>
                                </select>
                              )}
                              {getLinkedName(user) && <span className="text-xs text-green-700 ml-1">{getLinkedName(user)}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <button onClick={() => toggleVerified(user.id, user.verified)} disabled={updating === user.id}
                              className="inline-flex items-center gap-1 hover:opacity-80 disabled:opacity-50">
                              {user.verified ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200"><MailCheck className="h-3 w-3 mr-1" />{t("已验证")}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground"><MailX className="h-3 w-3 mr-1" />{t("未验证")}</Badge>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created).toLocaleDateString("zh-CN")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {updating === user.id && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100/60"
                                title={t("重设密码")}
                                onClick={() => resetUserPassword(user)} disabled={updating === user.id}>
                                {t("重设密码")}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                                onClick={() => deleteUser(user.id)} disabled={updating === user.id || user.id === userProfile?.id}>
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
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionEditor />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("新增用户账号")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>{t("账号（邮箱）")}</Label>
              <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="name@pjpc.com" />
            </div>
            <div>
              <Label>{t("姓名")}</Label>
              <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div>
              <Label>{t("初始密码")}</Label>
              <Input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder={t("至少 8 位")} />
            </div>
            <div>
              <Label>{t("角色")}</Label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full text-sm rounded-md border border-gray-200 bg-white px-3 py-2"
              >
                <option value="teacher">{t("教师")}</option>
                <option value="office_admin">{t("办公室")}</option>
                <option value="student">{t("学生")}</option>
                <option value="admin">{t("管理员")}</option>
              </select>
            </div>
            {newUser.role === "student" && (
              <div>
                <Label>{t("绑定学生")}</Label>
                <select
                  value={newUser.student_id}
                  onChange={(e) => setNewUser({ ...newUser, student_id: e.target.value })}
                  className="w-full text-sm rounded-md border border-gray-200 bg-white px-3 py-2"
                >
                  <option value="">{t("— 请选择 —")}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name || s.student_name} {s.grade ? `(${s.grade})` : ""}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>{t("取消")}</Button>
            <Button onClick={createUser} disabled={creating} className="gap-2">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}{t("建账号")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
