"use client"

/**
 * /account —— 我的账号（老师 / 学生 / 员工都能进）
 *
 * 为什么不放导航：老板要求点左下角自己的名字/头像进来，不占菜单位置。
 * 后端沿用 /api/auth/update-profile（只改自己，靠请求里的 token 认人）。
 */

import { useState } from "react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useLanguage } from "@/contexts/language-context"
import PageLayout from "@/components/layouts/PageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2, Mail, UserRound, Building2, ShieldCheck, KeyRound } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  admin: "管理员",
  office_admin: "行政",
  teacher: "教师",
  student: "学生",
  parent: "家长",
}

export default function AccountPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const zh = language !== "en"

  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const role = String(user?.role || "")
  const roleLabel = ROLE_LABEL[role] || role || "—"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (form.newPassword.length < 8) {
      setMsg({ ok: false, text: zh ? "新密码至少 8 位" : "New password must be at least 8 characters" })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ ok: false, text: zh ? "两次输入的新密码不一样" : "Passwords do not match" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          password: form.newPassword,
          passwordConfirm: form.confirmPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setMsg({ ok: true, text: zh ? "密码已更新，下次登录用新密码" : "Password updated" })
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMsg({ ok: false, text: data.error || (zh ? "更新失败" : "Update failed") })
      }
    } catch (err: any) {
      setMsg({ ok: false, text: String(err?.message || err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title={zh ? "我的账号" : "My account"} description={zh ? "查看自己的资料，改自己的登录密码" : "Your profile and password"}>
      <div className="max-w-2xl space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              {zh ? "基本资料" : "Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-lg font-bold text-white">
                {String(user?.name || user?.email || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name || "—"}</p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
            </div>

            <div className="grid gap-2 pt-1">
              <Row icon={<Mail className="h-3.5 w-3.5" />} label={zh ? "登录账号" : "Account"} value={user?.username || user?.email || "—"} />
              {user?.email && !String(user.email).endsWith("@student.pjpc.local") ? (
                <Row icon={<Mail className="h-3.5 w-3.5" />} label={zh ? "邮箱" : "Email"} value={user.email} />
              ) : null}
              <Row icon={<Building2 className="h-3.5 w-3.5" />} label={zh ? "中心" : "Center"} value={user?.center || "—"} />
              <Row icon={<ShieldCheck className="h-3.5 w-3.5" />} label={zh ? "角色" : "Role"} value={roleLabel} />
            </div>

            <p className="text-[11px] text-gray-400 pt-1">
              {zh ? "姓名、中心、角色这些要改，找管理员或行政。" : "Name, center and role are changed by an admin."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {zh ? "修改密码" : "Change password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">{zh ? "当前密码" : "Current password"}</Label>
                <Input
                  type="password"
                  value={form.oldPassword}
                  onChange={(e) => setForm((p) => ({ ...p, oldPassword: e.target.value }))}
                  placeholder={zh ? "现在用的密码" : "Current password"}
                  className="h-9 text-sm"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{zh ? "新密码" : "New password"}</Label>
                <Input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder={zh ? "至少 8 位" : "At least 8 characters"}
                  className="h-9 text-sm"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{zh ? "再输一次新密码" : "Confirm new password"}</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder={zh ? "再输一次" : "Repeat new password"}
                  className="h-9 text-sm"
                  autoComplete="new-password"
                />
              </div>

              {msg ? (
                <Alert className={msg.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={msg.ok ? "text-green-700 text-xs" : "text-red-700 text-xs"}>{msg.text}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex items-center gap-2 pt-1">
                <Button type="submit" size="sm" className="h-8" disabled={loading}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Lock className="h-3.5 w-3.5 mr-1" />}
                  {zh ? "更新密码" : "Update password"}
                </Button>
                <span className="text-[11px] text-gray-400">
                  {zh ? "忘了密码就找管理员重设" : "Forgot it? Ask an admin to reset"}
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-1.5 last:border-0">
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </span>
      <span className="text-xs text-gray-900 font-medium truncate max-w-[60%] text-right">{value}</span>
    </div>
  )
}
