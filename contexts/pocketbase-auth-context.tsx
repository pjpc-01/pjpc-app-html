"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import PocketBase from 'pocketbase'
import { UserProfile, checkPocketBaseConnection, getPocketBase } from "@/lib/pocketbase"

// 使用智能网络检测获取PocketBase实例
let pb: PocketBase | null = null

const getPocketBaseInstance = async (): Promise<PocketBase> => {
  if (!pb) {
    pb = await getPocketBase()
  }
  return pb
}

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

    // 获取用户资料 - 简化版本
  const fetchUserProfile = useCallback(async (user: any) => {
    try {
      if (!user?.id) {
        throw new Error("用户ID无效")
      }

      console.log('🔍 Fetching user profile for:', user.id)
      
      // 直接使用认证时的用户数据，避免额外的数据库查询
      const profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'admin',
        status: user.status || 'approved',
        emailVerified: true,
        createdAt: user.created,
        updatedAt: user.updated,
        loginAttempts: 0
      } as UserProfile

      console.log('✅ User profile created from auth data:', profile)
      setUserProfile(profile)
      return profile
    } catch (error) {
      console.error("❌ Failed to create user profile:", error)
      throw error
    }
  }, [])

  useEffect(() => {
    // 检查连接
    checkConnection()

    // 设置认证监听器
    const setupAuth = async () => {
      try {
        const pbInstance = await getPocketBaseInstance()
        
        // 监听认证状态变化
        const unsubscribe = pbInstance.authStore.onChange((token, model) => {
          console.log('Auth state changed:', model ? 'User logged in' : 'No user')
        
          // 只有在有有效模型时才设置用户
          if (model && model.id && token) {
            console.log('Setting user and fetching profile for user ID:', model.id)
            setUser(model)
            fetchUserProfile(model).then(profile => {
              console.log('Profile fetched successfully:', profile)
              setLoading(false)
            }).catch(error => {
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
          if (pbInstance.authStore.model && pbInstance.authStore.model.id) {
            setUser(pbInstance.authStore.model)
            try {
              const profile = await fetchUserProfile(pbInstance.authStore.model)
              console.log('Initialization profile fetched:', profile)
              setLoading(false) // 只有在成功获取用户资料后才设置loading为false
            } catch (error) {
              console.error("初始化时获取用户资料失败:", error)
              setError(error instanceof Error ? error.message : "获取用户资料失败")
              setLoading(false)
            }
          } else if (pbInstance.authStore.model && !pbInstance.authStore.model.id) {
            // 清除无效的认证状态
            pbInstance.authStore.clear()
            setUser(null)
            setUserProfile(null)
            setLoading(false)
          } else {
            // 没有认证状态，设置loading为false
            setLoading(false)
          }
        }

        // 立即执行初始化检查，不延迟
        await initializeAuth()

        return unsubscribe
      } catch (error) {
        console.error('Failed to setup auth:', error)
        setLoading(false)
        return () => {}
      }
    }

    let unsubscribe: (() => void) | undefined
    setupAuth().then(unsub => {
      unsubscribe = unsub
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
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
      
      console.log('Attempting to authenticate with:', { email, password: '***' })
      
      // 获取智能PocketBase实例
      const pbInstance = await getPocketBaseInstance()
      console.log('PocketBase URL:', pbInstance.baseUrl)
      
      // Try to authenticate with the users collection first
      let authData
      try {
        console.log('🔍 Attempting authentication with users collection...')
        console.log('PocketBase URL:', pbInstance.baseUrl)
        console.log('Email:', email)
        
        authData = await pbInstance.collection('users').authWithPassword(email, password)
        console.log('✅ Authentication successful with users collection')
      } catch (authError: any) {
        console.log('❌ Authentication failed with users collection:', authError.message)
        console.log('Error details:', {
          status: authError.status,
          response: authError.response,
          data: authError.data,
          originalError: authError.originalError
        })
        
        // 检查是否是404错误（集合不存在）
        if (authError.status === 404) {
          throw new Error('用户认证服务不可用，请检查服务器配置')
        }
        
        // 检查是否是400错误（认证失败）
        if (authError.status === 400) {
          throw new Error('用户名或密码错误')
        }
        
        // 检查是否是网络错误
        if (authError.status === 0 || authError.message.includes('Failed to fetch')) {
          throw new Error('网络连接失败，请检查网络连接')
        }
        
        // 检查是否是CORS错误
        if (authError.message.includes('CORS') || authError.message.includes('cross-origin')) {
          throw new Error('跨域访问被阻止，请检查服务器CORS配置')
        }
        
        // 检查是否是超时错误
        if (authError.message.includes('timeout') || authError.message.includes('TIMEOUT')) {
          throw new Error('请求超时，请检查网络连接')
        }
        
        // 其他错误
        throw new Error(`认证失败: ${authError.message}`)
      }

      // 处理PocketBase SDK返回的数据结构
      // 根据测试结果，authData可能包含嵌套的data对象
      const userRecord = (authData as any).data?.record || authData.record
      const authToken = (authData as any).data?.token || authData.token

      // 手动设置认证状态，确保authStore正确设置
      if (userRecord && authToken) {
        pbInstance.authStore.save(authToken, userRecord)
        console.log('Context signIn: 手动设置认证状态完成')
      }

      // 检查用户状态
      if (userRecord) {
        const userStatus = userRecord.status
        console.log('User status:', userStatus)
        
        if (userStatus === "suspended") {
          await pbInstance.authStore.clear()
          throw new Error("账户已被暂停，请联系管理员")
        } else if (userStatus === "pending") {
          await pbInstance.authStore.clear()
          throw new Error("账户正在审核中，请等待管理员审核。审核通过后即可登录。")
        }

        // 重置登录尝试次数
        try {
          const collectionName = userRecord.collectionName || 'users'
          await pbInstance.collection(collectionName).update(userRecord.id, {
            loginAttempts: 0,
            lockedUntil: null,
          })
        } catch (updateError) {
          console.warn("重置登录尝试次数失败:", updateError)
        }
      }
      
      // 设置用户状态 - 简化流程
      if (userRecord && authToken) {
        console.log('✅ Setting user state with authenticated data')
        setUser(userRecord)
        
        // 直接使用认证时的用户数据作为用户资料
        const profile = {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role || 'admin',
          status: userRecord.status || 'approved',
          emailVerified: true,
          createdAt: userRecord.created,
          updatedAt: userRecord.updated,
          loginAttempts: 0
        } as UserProfile
        
        setUserProfile(profile)
        setLoading(false)
        console.log('✅ Authentication flow completed successfully')
      } else {
        console.error("❌ No user record or token found")
        setError("认证成功但未获取到用户信息")
        setLoading(false)
      }
    } catch (error: any) {
      console.error('SignIn error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response,
        originalError: error.originalError
      })
      
      // 特殊处理ClientResponseError 0
      if (error.status === 0) {
        const errorMessage = "网络连接失败，请检查网络连接或稍后重试"
        setError(errorMessage)
        setLoading(false)
        throw new Error(errorMessage)
      }
      
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

      const pbInstance = await getPocketBaseInstance()
      const record = await pbInstance.collection('users').create(userData)
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
      const pbInstance = await getPocketBaseInstance()
      pbInstance.authStore.clear()
    } catch (error: any) {
      const errorMessage = "登出失败，请重试"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null)
      const pbInstance = await getPocketBaseInstance()
      await pbInstance.collection('users').requestPasswordReset(email)
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
        const pbInstance = await getPocketBaseInstance()
        await pbInstance.collection('users').requestVerification(user.email)
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
      
      const pbInstance = await getPocketBaseInstance()
      
      // 验证当前密码
      await pbInstance.collection('users').authWithPassword(user.email, currentPassword)

      // 验证新密码强度
      if (!isPasswordStrong(newPassword)) {
        const errorMsg = "新密码必须包含至少8位字符，包括大小写字母、数字和特殊字符"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      await pbInstance.collection('users').update(user.id, {
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
    console.log('Processing error code:', errorCode)
    
    // Handle specific error patterns
    if (errorCode.includes('ClientResponseError 0')) {
      return "网络连接失败，请检查网络连接或稍后重试"
    }
    if (errorCode.includes('ClientResponseError 400')) {
      return "认证失败：请检查用户名和密码是否正确"
    }
    if (errorCode.includes('ClientResponseError 404')) {
      return "用户不存在或密码错误"
    }
    if (errorCode.includes('ClientResponseError 500')) {
      return "服务器内部错误，请稍后重试"
    }
    if (errorCode.includes('Failed to authenticate')) {
      return "用户不存在或密码错误"
    }
    if (errorCode.includes('Users collection does not exist')) {
      return "数据库配置错误：用户表不存在"
    }
    if (errorCode.includes('无法连接到PocketBase数据库')) {
      return "无法连接到数据库服务器，请检查网络连接"
    }
    if (errorCode.includes('Something went wrong')) {
      return "服务器错误，请检查网络连接或稍后重试"
    }
    if (errorCode.includes('Failed to fetch')) {
      return "网络连接失败，请检查网络连接"
    }
    
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
      case "Something went wrong.":
        return "服务器错误，请检查网络连接或稍后重试"
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
