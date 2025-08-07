"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Edit, Trash2, UserPlus } from "lucide-react"

interface User {
  uid: string
  name: string
  email: string
  role: "admin" | "teacher" | "parent"
  status: "pending" | "approved" | "suspended"
  createdAt: any
  lastLogin: any
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[]
      setUsers(usersData)
      setFilteredUsers(usersData)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let filtered = users

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 角色过滤
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // 状态过滤
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const handleUpdateUser = async (uid: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, "users", uid), updates)
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("更新用户失败:", error)
    }
  }

  const handleDeleteUser = async (uid: string) => {
    if (confirm("确定要删除此用户吗？此操作不可撤销。")) {
      try {
        await deleteDoc(doc(db, "users", uid))
      } catch (error) {
        console.error("删除用户失败:", error)
      }
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="destructive">管理员</Badge>
      case "teacher":
        return <Badge variant="default">老师</Badge>
      case "parent":
        return <Badge variant="secondary">家长</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            已批准
          </Badge>
        )
      case "pending":
        return <Badge variant="secondary">待审核</Badge>
      case "suspended":
        return <Badge variant="destructive">已暂停</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
          <p className="text-gray-600">管理系统中的所有用户账户</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          添加用户
        </Button>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜索和筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索用户姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="按角色筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="teacher">老师</SelectItem>
                <SelectItem value="parent">家长</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="按状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="suspended">已暂停</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            用户列表 ({filteredUsers.length})
          </CardTitle>
          <CardDescription>系统中的所有用户账户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{user.createdAt?.toDate?.()?.toLocaleDateString() || "未知"}</TableCell>
                  <TableCell>{user.lastLogin?.toDate?.()?.toLocaleDateString() || "从未登录"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            编辑
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>编辑用户</DialogTitle>
                            <DialogDescription>修改用户的基本信息和权限</DialogDescription>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">姓名</label>
                                <Input
                                  value={selectedUser.name}
                                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">角色</label>
                                <Select
                                  value={selectedUser.role}
                                  onValueChange={(value: "admin" | "teacher" | "parent") =>
                                    setSelectedUser({ ...selectedUser, role: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">管理员</SelectItem>
                                    <SelectItem value="teacher">老师</SelectItem>
                                    <SelectItem value="parent">家长</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">状态</label>
                                <Select
                                  value={selectedUser.status}
                                  onValueChange={(value: "pending" | "approved" | "suspended") =>
                                    setSelectedUser({ ...selectedUser, status: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="approved">已批准</SelectItem>
                                    <SelectItem value="pending">待审核</SelectItem>
                                    <SelectItem value="suspended">已暂停</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    handleUpdateUser(selectedUser.uid, {
                                      name: selectedUser.name,
                                      role: selectedUser.role,
                                      status: selectedUser.status,
                                    })
                                  }
                                  className="flex-1"
                                >
                                  保存更改
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsEditDialogOpen(false)
                                    setSelectedUser(null)
                                  }}
                                  className="flex-1"
                                >
                                  取消
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.uid)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
