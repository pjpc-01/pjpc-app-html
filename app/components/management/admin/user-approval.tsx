"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/enhanced-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Clock, User, Mail, AlertTriangle } from "lucide-react"

interface PendingUser {
  uid: string
  email: string
  name: string
  role: "teacher" | "parent"
  status: string
  createdAt: any
}

export default function UserApproval() {
  const { userProfile } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processingUser, setProcessingUser] = useState<string | null>(null)

  useEffect(() => {
    if (userProfile?.role !== "admin") return

    const q = query(collection(db, "users"), where("status", "==", "pending"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as PendingUser[]

      setPendingUsers(users)
      setLoading(false)
    })

    return unsubscribe
  }, [userProfile])

  const handleApproval = async (uid: string, approved: boolean) => {
    setProcessingUser(uid)
    try {
      const userRef = doc(db, "users", uid)
      await updateDoc(userRef, {
        status: approved ? "approved" : "suspended",
        approvedBy: userProfile?.uid,
        approvedAt: serverTimestamp(),
      })

      // 发送通知给用户
      await updateDoc(doc(db, "notifications", `approval_${uid}`), {
        type: "account_status",
        userId: uid,
        status: approved ? "approved" : "rejected",
        message: approved ? "您的账户已通过审核，现在可以正常使用系统功能" : "很抱歉，您的账户申请未通过审核",
        createdAt: serverTimestamp(),
        read: false,
      })
    } catch (error) {
      console.error("处理审核失败:", error)
    } finally {
      setProcessingUser(null)
    }
  }

  if (userProfile?.role !== "admin") {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>您没有权限访问此功能</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>加载待审核用户...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">用户审核</h2>
        <p className="text-gray-600">审核新注册的老师和家长账户</p>
      </div>

      {pendingUsers.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>暂无待审核的用户</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              待审核用户 ({pendingUsers.length})
            </CardTitle>
            <CardDescription>以下用户正在等待您的审核</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "teacher" ? "default" : "secondary"}>
                        {user.role === "teacher" ? "老师" : "家长"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt?.toDate?.()?.toLocaleDateString() || "未知"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(user.uid, true)}
                          disabled={processingUser === user.uid}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          批准
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(user.uid, false)}
                          disabled={processingUser === user.uid}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          拒绝
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
