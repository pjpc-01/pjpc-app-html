"use client"

import React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/pocketbase-auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, GraduationCap, AlertTriangle, CheckCircle, Loader2, Shield, SmartphoneNfc, XCircle } from "lucide-react"
import { useNfcAuth } from "@/contexts/nfc-auth-context"

export default function SecureLoginForm() {
  const { signIn, signUp, resetPassword } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [activeTab, setActiveTab] = useState("login")
  console.log('[SecureLoginForm] RENDER, activeTab:', activeTab)

  // 登录表单状态
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // 注册表单状态
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "" as "teacher" | "parent" | "",
  })

  // 密码重置状态
  const [resetEmail, setResetEmail] = useState("")

  // NFC 登入状态
  const { loginWithCard } = useNfcAuth()
  const [nfcScanning, setNfcScanning] = useState(false)
  const [nfcStatus, setNfcStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleNfcLogin = async () => {
    if (typeof window === "undefined" || !("NDEFReader" in window)) {
      setNfcStatus({ ok: false, msg: "此设备不支持 NFC（仅 Android Chrome 支持）" })
      return
    }

    setNfcScanning(true)
    setNfcStatus({ ok: true, msg: "请将教师卡片贴近手机背面..." })
    setError("")

    try {
      const ndef = new (window as any).NDEFReader()
      await ndef.scan()

      ndef.onreading = async (event: any) => {
        const { message, serialNumber } = event

        // Extract UID: try NDEF text record first, fall back to serialNumber
        let cardId: string | null = null
        if (message?.records) {
          for (const record of message.records) {
            try {
              if (record.recordType === "text") {
                const decoder = new TextDecoder(record.encoding || "utf-8")
                const text = decoder.decode(record.data).trim()
                if (text.length >= 8 && text.length <= 20 && /^[0-9A-Fa-f]+$/.test(text)) {
                  cardId = text
                  break
                }
              }
            } catch {}
          }
        }
        if (!cardId) cardId = serialNumber || null

        // Normalize & convert: hex serialNumber → decimal (to match DB format)
        // e.g., "2B:28:86:04" → "2B288604" → decimal "0724076036"
        let lookupIds: string[] = []
        if (cardId) {
          const clean = cardId.replace(/:/g, "")
          lookupIds.push(clean) // always try raw hex
          // If looks like hex, also try decimal conversion
          if (/^[0-9A-Fa-f]+$/.test(clean) && clean.length <= 8) {
            const decimal = parseInt(clean, 16).toString().padStart(10, "0")
            lookupIds.push(decimal)
          }
        }

        if (lookupIds.length === 0) {
          setNfcStatus({ ok: false, msg: "无法读取卡号，请重试" })
          setNfcScanning(false)
          return
        }

        console.log("📱 [NFC 登入] 检测到 UID:", lookupIds)
        setNfcStatus({ ok: true, msg: `读取卡号: ${lookupIds[0]}，验证中...` })

        // Try each format until one works
        let result = { success: false, error: "" }
        for (const id of lookupIds) {
          result = await loginWithCard(id)
          if (result.success) break
        }

        if (!result.success) {
          setNfcStatus({ ok: false, msg: result.error || "登入失败" })
          setNfcScanning(false)
          return
        }

        setNfcStatus({ ok: true, msg: "✅ 登入成功，跳转中..." })
        setNfcScanning(false)
        
        setTimeout(() => {
          router.push("/")
        }, 500)
      }

      ndef.onreadingerror = () => {
        setNfcStatus({ ok: false, msg: "读取失败，请重试" })
        setNfcScanning(false)
      }
    } catch (err: any) {
      setNfcStatus({ ok: false, msg: `NFC 错误: ${err.message}` })
      setNfcScanning(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 防止重复提交
    if (isLoading) {
      return
    }
    
    setIsLoading(true)
    setError("")

    try {
      await signIn(loginData.email, loginData.password)

      // 保存"记住我"偏好
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.removeItem('pb_session_only')
        } else {
          localStorage.setItem('pb_session_only', '1')
        }
      }

      // 登录成功后跳转到首页
      router.push('/')

    } catch (error: any) {
      console.error('Login failed:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // 验证表单
    if (registerData.password !== registerData.confirmPassword) {
      setError("密码确认不匹配")
      setIsLoading(false)
      return
    }

    if (!registerData.role) {
      setError("请选择用户角色")
      setIsLoading(false)
      return
    }

    try {
      await signUp(registerData.email, registerData.password, registerData.name, registerData.role)
      setSuccess("注册成功！请检查邮箱验证邮件，并等待管理员审核。")
      setRegisterData({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        role: "",
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await resetPassword(resetEmail)
      setSuccess("密码重置邮件已发送，请检查您的邮箱。")
      setResetEmail("")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-yellow-200">
              <img 
                src="/logo.png" 
                alt="温馨小屋 - 安亲补习中心" 
                className="h-16 w-auto"
                onError={(e) => {
                  // 如果logo文件不存在，显示备用图标
                  e.currentTarget.style.display = 'none'
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                  if (nextElement) {
                    nextElement.style.display = 'block'
                  }
                }}
              />
              <div className="bg-blue-600 p-3 rounded-full hidden">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">温馨小屋</h1>
          <p className="text-gray-600">安亲补习中心管理系统</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              安全登录
            </CardTitle>
            <CardDescription className="text-center">请选择登录、注册或重置密码</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 错误和成功提示 */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" onValueChange={(v) => { console.log('[Tab Debug] onValueChange:', v); setActiveTab(v); }} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
                <TabsTrigger value="reset">重置密码</TabsTrigger>
              </TabsList>

              {/* 登录表单 */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">邮箱地址</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="请输入邮箱地址"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入密码"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {/* 记住我 checkbox */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-600">记住我（保持登录状态）</span>
                    </label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    onClick={(e) => {
                      if (isLoading) {
                        e.preventDefault()
                    
                        return
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      "安全登录"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* 注册表单 */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">真实姓名</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="请输入您的真实姓名"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">邮箱地址</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="请输入有效的邮箱地址"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-role">用户角色</Label>
                    <Select
                      value={registerData.role}
                      onValueChange={(value: "teacher" | "parent") => setRegisterData({ ...registerData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择您的角色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">老师</SelectItem>
                        <SelectItem value="parent">家长</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">注：管理员账户需要特殊申请</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">密码</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入强密码"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">确认密码</Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="请再次输入密码"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        注册中...
                      </>
                    ) : (
                      "提交注册申请"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* 重置密码表单 */}
              <TabsContent value="reset">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">邮箱地址</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="请输入您的邮箱地址"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        发送中...
                      </>
                    ) : (
                      "发送重置邮件"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 📱 NFC 教师登入 */}
        <Card className="mt-4 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
              <SmartphoneNfc className="h-4 w-4" />
              NFC 快速登入
            </CardTitle>
            <CardDescription className="text-xs text-blue-600">
              教师可使用手机 NFC 刷卡快速登入（仅 Android Chrome 支持）
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nfcStatus && (
              <div className={`mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                nfcStatus.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {nfcScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                 : nfcStatus.ok ? <CheckCircle className="h-3.5 w-3.5" />
                 : <XCircle className="h-3.5 w-3.5" />}
                {nfcStatus.msg}
              </div>
            )}
            <Button
              onClick={handleNfcLogin}
              disabled={nfcScanning}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <SmartphoneNfc className="h-4 w-4 mr-2" />
              {nfcScanning ? "扫描中..." : "📱 手机 NFC 刷卡登入"}
            </Button>
          </CardContent>
        </Card>

        {/* 安全提示 */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              安全提示
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-yellow-700">
              <div>• 新用户注册需要管理员审核</div>
              <div>• 请使用真实邮箱，系统会发送验证邮件</div>
              <div>• 密码将被安全加密存储</div>
              <div>• 多次登录失败将临时锁定账户</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
