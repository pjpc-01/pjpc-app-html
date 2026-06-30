"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, CheckCircle, XCircle, Trash2, ArrowLeft, Users, Shield, ShieldOff, Ban } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  admin: "管理员",
  teacher: "老师",
  parent: "家长",
  accountant: "会计",
}

const STATUS_BADGE: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  suspended: { label: "已停用", variant: "destructive" },
}

export default function UserManagementPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const isAdmin = userProfile?.role === "admin"

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {
      console.error("获取用户失败:", e)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  const updateUserStatus = async (userId: string, status: string) => {
    setUpdating(userId)
    try {
      await fetch(`/api/pocketbase-proxy/api/collections/users/records/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      await fetchUsers()
    } catch (e) {
      console.error("更新用户状态失败:", e)
    } finally {
      setUpdating(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("确定要删除此用户？此操作不可撤销。")) return
    setUpdating(userId)
    try {
      await fetch(`/api/pocketbase-proxy/api/collections/users/records/${userId}`, {
        method: "DELETE",
      })
      await fetchUsers()
    } catch (e) {
      console.error("删除用户失败:", e)
    } finally {
      setUpdating(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">访问被拒绝</h2>
          <p className="text-muted-foreground mb-4">只有管理员可以管理用户</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
          <p className="text-sm text-muted-foreground">管理系统用户账号，审核新注册和停用用户</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>

      {/* User list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            所有用户
            {!loading && <span className="text-sm font-normal text-muted-foreground">（{users.length} 人）</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无用户</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ROLE_LABELS[user.role] || user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[user.status]?.variant || "outline"}>
                          {STATUS_BADGE[user.status]?.label || user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => updateUserStatus(user.id, "approved")}
                                disabled={updating === user.id}
                                title="批准"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => updateUserStatus(user.id, "suspended")}
                                disabled={updating === user.id}
                                title="拒绝"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {user.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => updateUserStatus(user.id, "suspended")}
                              disabled={updating === user.id}
                              title="停用"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {user.status === "suspended" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateUserStatus(user.id, "approved")}
                              disabled={updating === user.id}
                              title="恢复"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                            onClick={() => deleteUser(user.id)}
                            disabled={updating === user.id}
                            title="删除"
                          >
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
    </div>
  )
}
