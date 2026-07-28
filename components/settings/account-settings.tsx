"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Loader2, CheckCircle2, XCircle, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/pocketbase-auth-context"

export default function AccountSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [emailForm, setEmailForm] = useState({ newEmail: "" })
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [cardUidInput, setCardUidInput] = useState("")
  const [cardLinkMsg, setCardLinkMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForm.newEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg({ ok: true, text: "邮箱已更新" })
        setEmailForm({ newEmail: "" })
      } else {
        setMsg({ ok: false, text: data.error || "更新失败" })
      }
    } catch (err: any) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg({ ok: false, text: "两次密码不匹配" })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setMsg({ ok: false, text: "密码至少8位" })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          password: passwordForm.newPassword,
          passwordConfirm: passwordForm.confirmPassword,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg({ ok: true, text: "密码已更新" })
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMsg({ ok: false, text: data.error || "更新失败" })
      }
    } catch (err: any) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-4">
      {/* Current Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">当前账户</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">姓名</span><span className="font-medium">{user.name || user.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">邮箱</span><span className="font-medium">{user.email}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" />修改邮箱</CardTitle>
          <CardDescription className="text-xs">更改登录邮箱地址</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">新邮箱</Label>
              <Input type="email" placeholder="new@email.com" value={emailForm.newEmail} onChange={e => setEmailForm({ newEmail: e.target.value })} required className="h-8 text-sm" />
            </div>
            <Button type="submit" disabled={loading} size="sm" className="h-8">
              {loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              更新邮箱
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" />修改密码</CardTitle>
          <CardDescription className="text-xs">至少8位字符</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">旧密码</Label>
              <Input type="password" placeholder="留空如果未设置过" value={passwordForm.oldPassword} onChange={e => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">新密码</Label>
              <Input type="password" placeholder="至少8位" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">确认密码</Label>
              <Input type="password" placeholder="再次输入" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} required className="h-8 text-sm" />
            </div>
            <Button type="submit" disabled={loading} size="sm" className="h-8">
              {loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              更新密码
            </Button>
          </form>
        </CardContent>
      </Card>

      {msg && (
        <Alert className={msg.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
          <AlertDescription className={msg.ok ? "text-green-800" : "text-red-800"}>{msg.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
