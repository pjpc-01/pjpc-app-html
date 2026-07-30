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
  CheckCircle2, MailCheck, MailX, UserCog,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import PermissionEditor from "@/components/admin/PermissionEditor"

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

  const isAdmin = userProfile?.role === "admin"

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/pocketbase-proxy/api/collections/role_permissions/records?perPage=50&sort=role")
      const data = await res.json()
      setRoleOptions((data?.items || []).map((item: any) => ({ value: item.role, label: item.label || item.role })))
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
    if (!confirm("确定要删除此用户？")) return
    setUpdating(userId)
    try { await fetch(`/api/pocketbase-proxy/api/collections/users/records/${userId}`, { method: "DELETE" }); fetchUsers() }
    finally { setUpdating(null) }
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
          <h2 className="text-xl font-bold text-red-600 mb-2">访问被拒绝</h2>
          <Button onClick={() => router.push("/")}>{t('system.back_to_home')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户与权限管理</h1>
          <p className="text-sm text-muted-foreground">管理用户账号、角色权限和档案绑定</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />返回
        </Button>
      </div>

      <Tabs defaultValue="users" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="users" className="flex items-center gap-2"><Users className="h-4 w-4" />用户列表</TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2"><Shield className="h-4 w-4" />角色权限</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />所有用户
                {!loading && <span className="text-sm font-normal text-muted-foreground">（{users.length} 人）</span>}
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
                        <TableHead>绑定档案</TableHead>
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
                            {user.id === userProfile?.id && <span className="text-xs text-muted-foreground ml-1">（你）</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {updating === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                                <select
                                  value={user.teacher_id || user.student_id || ""}
                                  onChange={(e) => { if (e.target.value) linkProfile(user.id, e.target.value) }}
                                  className="text-xs rounded border border-gray-200 bg-white px-1 py-0.5 max-w-[160px] truncate"
                                >
                                  <option value="">— 未绑定 —</option>
                                  <optgroup label="👨‍🏫 教师">
                                    {teachers.map(t => (<option key={t.id} value={t.id}>{t.name || t.teacher_name || t.id}</option>))}
                                  </optgroup>
                                  <optgroup label="🎓 学生">
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
                                <Badge className="bg-green-50 text-green-700 border-green-200"><MailCheck className="h-3 w-3 mr-1" />已验证</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground"><MailX className="h-3 w-3 mr-1" />未验证</Badge>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created).toLocaleDateString("zh-CN")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {updating === user.id && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
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
    </div>
  )
}
