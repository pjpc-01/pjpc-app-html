'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, AlertTriangle, UserPlus, Users, Key } from 'lucide-react'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { useLanguage } from "@/contexts/language-context"

export default function AdminDashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('teacher')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string; tempPassword?: string } | null>(null)

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setResult(null)

    try {
      // 从 PocketBase authStore 获取当前 token
      const pb = (await import('pocketbase')).default
      const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
      const pbInstance = new pb(pbUrl)
      
      // 使用当前用户的 token
      // 由于 authStore 在客户端已经保存了 token，我们可以读取 localStorage
      let token = ''
      if (typeof window !== 'undefined') {
        const authData = localStorage.getItem('pocketbase_auth')
        if (authData) {
          try {
            token = JSON.parse(authData).token || ''
          } catch {}
        }
      }

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, name: name || undefined, role, password: undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || '创建失败' })
      } else {
        setResult({
          type: 'success',
          message: data.message,
          tempPassword: data.tempPassword,
        })
        setEmail('')
        setName('')
      }
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : '网络错误' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-900">管理中心</h1>
        <p className="text-amber-700/70">系统管理 · 用户管理 · 配置</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="学生总数" value="—" description="全中心统计" color="bg-amber-500" />
        <StatCard title="待缴费用" value="—" description="本月待收" color="bg-rose-500" />
        <StatCard title="教师人数" value="—" description="今日在岗" color="bg-emerald-500" />
      </div>

      {/* 用户管理 */}
      <Card className="border-amber-200/60 shadow-md">
        <CardHeader className="pb-3 border-b border-amber-100/50">
          <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
            <UserPlus className="h-5 w-5" />
            添加用户
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {result && (
            <Alert variant={result.type === 'error' ? 'destructive' : 'default'} className={result.type === 'success' ? 'border-green-200 bg-green-50 mb-4' : 'mb-4'}>
              {result.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
              <AlertDescription className={result.type === 'success' ? 'text-green-800' : ''}>
                <div>{result.message}</div>
                {result.tempPassword && (
                  <div className="mt-2 flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded p-2">
                    <Key className="h-4 w-4 text-amber-600" />
                    <span>临时密码：<code className="font-mono font-bold bg-white px-1 rounded">{result.tempPassword}</code></span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">姓名（可选）</Label>
                <Input
                  id="user-name"
                  type="text"
                  placeholder="输入姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">{t('admin.role')}</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">{t('teacher.teacher')}</SelectItem>
                    <SelectItem value="parent">{t('admin.parent')}</SelectItem>
                    <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                    <SelectItem value="accountant">{t('admin.accountant')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">邮箱地址 <span className="text-red-500">*</span></Label>
              <Input
                id="user-email"
                type="email"
                placeholder="输入邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded p-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>创建后用户状态为<strong>{t('attendance.approved')}</strong>，可直接登录。系统会自动生成临时密码。</span>
            </div>

            <Button type="submit" disabled={isLoading || !email} className="bg-amber-600 hover:bg-amber-700">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 创建中...</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> 创建用户</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, description, color }: { title: string; value: string; description: string; color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2 relative overflow-hidden">
      <div className={`w-1.5 h-12 ${color} rounded-full absolute left-0 top-6`} />
      <p className="text-sm font-medium text-slate-500 ml-3">{title}</p>
      <p className="text-3xl font-bold text-slate-900 ml-3">{value}</p>
      <p className="text-xs text-slate-400 ml-3">{description}</p>
    </div>
  )
}
