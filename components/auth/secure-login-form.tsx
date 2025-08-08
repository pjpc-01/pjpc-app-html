"use client"

import type React from "react"
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
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, GraduationCap, AlertTriangle, CheckCircle, Loader2, Shield } from "lucide-react"

export default function SecureLoginForm() {
  const { signIn, signUp, resetPassword } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    agreeToTerms: false,
  })

  // 密码重置状态
  const [resetEmail, setResetEmail] = useState("")

  // 密码强度计算
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    Object.values(checks).forEach((check) => {
      if (check) strength += 20
    })

    return { strength, checks }
  }

  const passwordStrength = calculatePasswordStrength(registerData.password)

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
      
      // 登录成功后不跳转，让主页自动检测到用户状态变化

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

    if (!registerData.agreeToTerms) {
      setError("请同意服务条款")
      setIsLoading(false)
      return
    }

    if (passwordStrength.strength < 80) {
      setError("密码强度不够，请使用更强的密码")
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
        agreeToTerms: false,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">安亲班管理系统</h1>
          <p className="text-gray-600">安全的教育管理平台</p>
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

            <Tabs defaultValue="login" className="w-full">
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
                    {registerData.password && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>密码强度</span>
                          <span
                            className={
                              passwordStrength.strength >= 80
                                ? "text-green-600"
                                : passwordStrength.strength >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {passwordStrength.strength >= 80 ? "强" : passwordStrength.strength >= 60 ? "中" : "弱"}
                          </span>
                        </div>
                        <Progress value={passwordStrength.strength} className="h-2" />
                        <div className="text-xs space-y-1">
                          <div className={passwordStrength.checks.length ? "text-green-600" : "text-red-600"}>
                            ✓ 至少8位字符
                          </div>
                          <div className={passwordStrength.checks.uppercase ? "text-green-600" : "text-red-600"}>
                            ✓ 包含大写字母
                          </div>
                          <div className={passwordStrength.checks.lowercase ? "text-green-600" : "text-red-600"}>
                            ✓ 包含小写字母
                          </div>
                          <div className={passwordStrength.checks.numbers ? "text-green-600" : "text-red-600"}>
                            ✓ 包含数字
                          </div>
                          <div className={passwordStrength.checks.special ? "text-green-600" : "text-red-600"}>
                            ✓ 包含特殊字符
                          </div>
                        </div>
                      </div>
                    )}
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

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={registerData.agreeToTerms}
                      onChange={(e) => setRegisterData({ ...registerData, agreeToTerms: e.target.checked })}
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      我同意{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        服务条款
                      </a>{" "}
                      和{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        隐私政策
                      </a>
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || passwordStrength.strength < 80}>
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
