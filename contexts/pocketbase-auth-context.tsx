"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { pb, UserProfile, checkPocketBaseConnection } from "@/lib/pocketbase"

interface AuthContextType {
  user: any | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'checking'
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: "teacher" | "parent" | "accountant") => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  // 检查PocketBase连接状态
  const checkConnection = useCallback(async () => {
    try {
      setConnectionStatus('checking')
      const result = await checkPocketBaseConnection()
      
      const { connected, error: connError } = result
      
      if (connected) {

        setConnectionStatus('connected')
        setError(null)
        setLoading(false) // 连接成功后立即设置loading为false
      } else {
        console.error('PocketBase connection failed:', connError)
        setConnectionStatus('disconnected')
        setError(`连接失败: ${connError}`)
        setLoading(false) // 连接失败也设置loading为false
      }
    } catch (err) {
      console.error('Connection check failed:', err)
      setConnectionStatus('disconnected')
      setError('无法连接到PocketBase服务')
      setLoading(false) // 异常时也设置loading为false
    }
  }, [])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 获取用户资料
  const fetchUserProfile = useCallback(async (user: any) => {
    try {
      if (!user?.id) {

        throw new Error("用户ID无效")
      }

      console.log('Fetching user profile for:', user.id)
      
      // 首先检查认证状态
      if (!pb.authStore.isValid) {
        console.log('Auth store is not valid')
        throw new Error("认证状态无效，请重新登录")
      }

      const record = await pb.collection('users').getOne(user.id)
      const profile = record as unknown as UserProfile

      console.log('User profile fetched:', profile)

      // 检查账户状态
      if (profile.status === "suspended") {
        await pb.authStore.clear()
        throw new Error("账户已被暂停，请联系管理员")
      }

      // 更新最后登录时间（可选，如果权限不足则跳过）
      const updateLoginTime = async () => {
        try {
          await pb.collection('users').update(user.id, {
            lastLogin: new Date().toISOString(),
            emailVerified: true, // 暂时禁用邮箱验证
          })
          console.log('Login time updated successfully')
        } catch (updateError) {
          console.warn("更新登录时间失败:", updateError)
          // 不抛出错误，因为这不是关键操作
        }
      }
      
      setTimeout(updateLoginTime, 1000)

      // 暂时禁用邮箱验证，自动设置为已验证
      setUserProfile({ ...profile, emailVerified: true })
    } catch (error) {
      console.error("获取用户资料失败:", error)
      
      // 如果是权限错误，提供更友好的错误信息
      if (error instanceof Error && (error.message?.includes('403') || error.message?.includes('permission'))) {
        throw new Error("权限不足，请检查用户状态或联系管理员")
      }
      
      throw error
    }
  }, [])

  useEffect(() => {
          // 检查连接
      checkConnection()

      // 监听认证状态变化
      const unsubscribe = pb.authStore.onChange((token, model) => {
        console.log('Auth state changed:', model ? 'User logged in' : 'No user')
      
      // 只有在有有效模型时才设置用户
      if (model && model.id && token) {
        console.log('Setting user and fetching profile for user ID:', model.id)
        setUser(model)
        fetchUserProfile(model).catch(error => {
          console.error("获取用户资料失败:", error)
          setError(error instanceof Error ? error.message : "获取用户资料失败")
          // 不要清除认证状态，只设置错误信息
          setLoading(false)
        })
      } else if (!model || !model.id || !token) {
        console.log('No user, no user ID, or no token, clearing state...')
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      }
      
              // 只有在没有用户时才设置loading为false，避免在登录过程中过早清除loading状态
        if (!model || !model.id || !token) {
          setLoading(false)
        }
    })

    // 初始化时检查是否已有认证状态
    const initializeAuth = async () => {
      // 检查AuthStore是否有有效的认证数据
      if (pb.authStore.model && pb.authStore.model.id) {
        setUser(pb.authStore.model)
        try {
          await fetchUserProfile(pb.authStore.model)
          setLoading(false) // 只有在成功获取用户资料后才设置loading为false
        } catch (error) {
          console.error("初始化时获取用户资料失败:", error)
          setError(error instanceof Error ? error.message : "获取用户资料失败")
          setLoading(false)
        }
      } else if (pb.authStore.model && !pb.authStore.model.id) {
        // 清除无效的认证状态
        pb.authStore.clear()
        setUser(null)
        setUserProfile(null)
        setLoading(false)
      } else {
        // 没有认证状态，设置loading为false
        setLoading(false)
      }
    }

    // 立即执行初始化检查，不延迟
    initializeAuth()

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    console.log('Connection status changed:', connectionStatus)
    
    if (connectionStatus === 'connected' && !user && loading) {
      console.log('Connection successful and no user, setting loading to false')
      setLoading(false)
    } else if (connectionStatus === 'disconnected') {
      console.log('Connection failed, setting loading to false')
      setLoading(false)
    }
  }, [connectionStatus, user, loading])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true) // 确保登录过程中loading为true
      
      const authData = await pb.collection('users').authWithPassword(email, password)

      // 处理PocketBase SDK返回的数据结构
      // 根据测试结果，authData可能包含嵌套的data对象
      const userRecord = (authData as any).data?.record || authData.record
      const authToken = (authData as any).data?.token || authData.token

      // 手动设置认证状态，确保authStore正确设置
      if (userRecord && authToken) {
        pb.authStore.save(authToken, userRecord)
        console.log('Context signIn: 手动设置认证状态完成')
      }

      // 检查用户状态
      if (userRecord) {
        const userStatus = userRecord.status
        console.log('User status:', userStatus)
        
        if (userStatus === "suspended") {
          await pb.authStore.clear()
          throw new Error("账户已被暂停，请联系管理员")
        } else if (userStatus === "pending") {
          await pb.authStore.clear()
          throw new Error("账户正在审核中，请等待管理员审核。审核通过后即可登录。")
        }

        // 重置登录尝试次数
        try {
          await pb.collection('users').update(userRecord.id, {
            loginAttempts: 0,
            lockedUntil: null,
          })
        } catch (updateError) {
          console.warn("重置登录尝试次数失败:", updateError)
        }
      }
      
      // 手动触发状态更新，确保React上下文同步
      // 根据测试结果，数据在嵌套的data.record中
      if (userRecord && authToken) {
        // 手动设置 authStore，确保认证状态正确
        pb.authStore.save(authToken, userRecord)
        console.log('手动设置认证状态完成')
        
        setUser(userRecord)
        
        // 直接获取用户资料，不依赖fetchUserProfile函数
        try {
          // 添加重试机制
          let record = null
          let retryCount = 0
          const maxRetries = 3
          
          while (retryCount < maxRetries) {
            try {
              record = await pb.collection('users').getOne(userRecord.id)
              break
            } catch (error: any) {
              retryCount++
              console.log(`获取用户资料重试 ${retryCount}/${maxRetries}:`, error.message)
              
              if (retryCount >= maxRetries) {
                throw error
              }
              
              // 等待一段时间后重试
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
          
          const profile = record as unknown as UserProfile
          setUserProfile({ ...profile, emailVerified: true })
          
          // 强制更新loading状态
          setLoading(false)
        } catch (error) {
          console.error("手动获取用户资料失败:", error)
          // 如果是网络错误，使用认证时的用户数据作为备选方案
          if (error instanceof Error && error.message?.includes('ClientResponseError 0')) {
            console.log("网络错误，使用认证时的用户数据")
            setUserProfile({ ...userRecord, emailVerified: true })
            setLoading(false)
          } else {
            setError(error instanceof Error ? error.message : "获取用户资料失败")
            setLoading(false)
          }
        }
      } else {
        console.error("没有找到用户记录或token")
        setError("认证成功但未获取到用户信息")
        setLoading(false)
      }
    } catch (error: any) {
      console.error('SignIn error:', error)
      const errorMessage = getErrorMessage(error.message)
      setError(errorMessage)
      setLoading(false) // 确保错误时也设置loading为false
      throw new Error(errorMessage)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string, role: "teacher" | "parent" | "accountant") => {
    try {
      setError(null)
      
      // 验证密码强度
      if (!isPasswordStrong(password)) {
        const errorMsg = "密码必须包含至少8位字符，包括大小写字母、数字和特殊字符"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      // 创建用户
      const userData = {
        email,
        password,
        passwordConfirm: password,
        name,
        role,
        status: "pending", // 设置为待审核状态，需要管理员审核
        emailVerified: true, // 暂时禁用邮箱验证
        loginAttempts: 0,
      }

      console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' })

      const record = await pb.collection('users').create(userData)
      console.log('User created successfully:', record)

             // 通知管理员新用户注册
       await notifyAdminNewUser(record as unknown as UserProfile)

       setUserProfile(record as unknown as UserProfile)
    } catch (error: any) {
      console.error('User creation failed:', error)
      console.error('Error details:', {
        message: error.message,
        data: error.data,
        status: error.status,
        response: error.response
      })
      
      let errorMessage = "注册失败"
      
      if (error.data) {
        // PocketBase错误详情
        const data = error.data
        if (data.email) {
          errorMessage = `邮箱错误: ${data.email.message}`
        } else if (data.password) {
          errorMessage = `密码错误: ${data.password.message}`
        } else if (data.passwordConfirm) {
          errorMessage = `密码确认错误: ${data.passwordConfirm.message}`
        } else if (data.name) {
          errorMessage = `姓名错误: ${data.name.message}`
        } else if (data.role) {
          errorMessage = `角色错误: ${data.role.message}`
        } else {
          errorMessage = `注册失败: ${error.message}`
        }
      } else {
        errorMessage = getErrorMessage(error.message)
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setError(null)
      pb.authStore.clear()
    } catch (error: any) {
      const errorMessage = "登出失败，请重试"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null)
      await pb.collection('users').requestPasswordReset(email)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.message)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const resendVerification = useCallback(async () => {
    if (user) {
      try {
        setError(null)
        await pb.collection('users').requestVerification(user.email)
      } catch (error: any) {
        const errorMessage = "发送验证邮件失败"
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    }
  }, [user])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) {
      const errorMessage = "用户未登录"
      setError(errorMessage)
      throw new Error(errorMessage)
    }

    try {
      setError(null)
      
      // 验证当前密码
      await pb.collection('users').authWithPassword(user.email, currentPassword)

      // 验证新密码强度
      if (!isPasswordStrong(newPassword)) {
        const errorMsg = "新密码必须包含至少8位字符，包括大小写字母、数字和特殊字符"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      await pb.collection('users').update(user.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      })
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.message)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [user])

  // 密码强度验证
  const isPasswordStrong = (password: string): boolean => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  }

  // 通知管理员新用户注册
  const notifyAdminNewUser = async (userProfile: UserProfile) => {
    try {
      // 暂时禁用通知功能，因为notifications集合可能不存在
      console.log('通知功能已禁用，notifications集合可能不存在')
      console.log('新用户注册:', {
        type: "new_user_registration",
        userId: userProfile.id,
        userName: userProfile.name,
        userEmail: userProfile.email,
        userRole: userProfile.role,
      })
    } catch (error) {
      console.error("通知管理员失败:", error)
    }
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "Failed to authenticate.":
        return "用户不存在或密码错误"
      case "Invalid email.":
        return "邮箱格式不正确"
      case "The email is invalid or already in use.":
        return "邮箱已被使用"
      case "The password is invalid.":
        return "密码强度不够"
      case "Too many requests.":
        return "请求过于频繁，请稍后再试"
      case "Network request failed.":
        return "网络连接失败，请检查网络"
      default:
        return `操作失败: ${errorCode}`
    }
  }

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    error,
    connectionStatus,
    signIn,
    signUp,
    logout,
    resetPassword,
    resendVerification,
    changePassword,
    clearError,
  }), [
    user,
    userProfile,
    loading,
    error,
    connectionStatus,
    signIn,
    signUp,
    logout,
    resetPassword,
    resendVerification,
    changePassword,
    clearError,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
