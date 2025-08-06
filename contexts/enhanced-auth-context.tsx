"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db, checkFirebaseConnection } from "@/lib/firebase"

interface UserProfile {
  uid: string
  email: string
  role: "admin" | "teacher" | "parent" | "accountant"
  name: string
  status: "pending" | "approved" | "suspended"
  emailVerified: boolean
  createdAt: any
  lastLogin: any
  loginAttempts: number
  lockedUntil?: any
  approvedBy?: string
  approvedAt?: any
}

interface AuthContextType {
  user: User | null
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
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  // 检查Firebase连接状态
  const checkConnection = useCallback(async () => {
    try {
      // 如果已经在检查中，避免重复检查
      if (connectionStatus === 'checking') {
        return
      }
      
      setConnectionStatus('checking')
      console.log('Starting Firebase connection check...')
      
      // 添加超时保护 - 设置为10秒
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection check timeout')), 10000) // 10秒超时
      })
      
      const connectionPromise = checkFirebaseConnection()
      const { connected, error: connError } = await Promise.race([connectionPromise, timeoutPromise]) as any
      
      console.log('Connection check result:', { connected, error: connError })
      
      // 只有在状态真正改变时才更新
      if (connectionStatus !== (connected ? 'connected' : 'disconnected')) {
        setConnectionStatus(connected ? 'connected' : 'disconnected')
      }
      
      if (!connected && connError) {
        setError(`连接失败: ${connError}`)
      }
    } catch (err) {
      console.warn('Connection check failed:', err)
      // 只有在状态真正改变时才更新
      if (connectionStatus !== 'disconnected') {
        setConnectionStatus('disconnected')
      }
      setError('无法连接到Firebase服务')
    }
  }, [connectionStatus])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 获取用户资料的优化版本
  const fetchUserProfile = useCallback(async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile

        // 检查账户状态
        if (profile.status === "suspended") {
          await signOut(auth)
          throw new Error("账户已被暂停，请联系管理员")
        }

        // 更新最后登录时间（使用防抖）
        const updateLoginTime = async () => {
          try {
            await updateDoc(doc(db, "users", user.uid), {
              lastLogin: serverTimestamp(),
              emailVerified: user.emailVerified,
            })
          } catch (updateError) {
            console.warn("更新登录时间失败:", updateError)
          }
        }
        
        // 延迟更新，避免频繁写入
        setTimeout(updateLoginTime, 1000)

        setUserProfile({ ...profile, emailVerified: user.emailVerified })
      }
    } catch (error) {
      console.error("获取用户资料失败:", error)
      throw error
    }
  }, [])

  useEffect(() => {
    console.log('AuthProvider useEffect - starting initialization')
    
    // 初始化时检查连接
    checkConnection()

    // 添加备用机制：如果10秒后仍在检查状态，自动设为已连接
    const fallbackTimer = setTimeout(() => {
      if (connectionStatus === 'checking') {
        console.warn('Connection check taking too long, assuming connected')
        setConnectionStatus('connected')
      }
    }, 10000)

    // 添加额外的备用机制：如果5秒后仍在loading，强制设置为false
    const loadingFallbackTimer = setTimeout(() => {
      if (loading) {
        console.warn('Loading taking too long, forcing loading to false')
        setLoading(false)
      }
    }, 5000)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user')
      if (user) {
        setUser(user)
        try {
          await fetchUserProfile(user)
        } catch (error) {
          console.error("获取用户资料失败:", error)
          setError(error instanceof Error ? error.message : "获取用户资料失败")
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      
      // 确保无论是否有用户，都设置loading为false
      console.log('Setting loading to false')
      setLoading(false)
    })

    return () => {
      clearTimeout(fallbackTimer)
      clearTimeout(loadingFallbackTimer)
      unsubscribe()
    }
  }, []) // 移除依赖项，避免循环依赖

  // 添加额外的useEffect来处理连接状态变化
  useEffect(() => {
    console.log('Connection status changed:', connectionStatus)
    
    // 如果连接成功且没有用户，确保loading为false
    if (connectionStatus === 'connected' && !user && !loading) {
      console.log('Connection successful, no user, ensuring loading is false')
      setLoading(false)
    }
  }, [connectionStatus, user, loading])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      const result = await signInWithEmailAndPassword(auth, email, password)

      // 重置登录尝试次数
      if (result.user) {
        try {
          await updateDoc(doc(db, "users", result.user.uid), {
            loginAttempts: 0,
            lockedUntil: null,
          })
        } catch (updateError) {
          console.warn("重置登录尝试次数失败:", updateError)
        }
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code)
      setError(errorMessage)
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

      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // 发送邮箱验证
      await sendEmailVerification(user)

      // 创建用户资料（待审核状态）
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role,
        name,
        status: "pending", // 需要管理员审核
        emailVerified: false,
        createdAt: serverTimestamp(),
        lastLogin: null,
        loginAttempts: 0,
      }

      await setDoc(doc(db, "users", user.uid), userProfile)

      // 通知管理员有新用户注册
      await notifyAdminNewUser(userProfile)

      setUserProfile(userProfile)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setError(null)
      await signOut(auth)
    } catch (error: any) {
      const errorMessage = "登出失败，请重试"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null)
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const resendVerification = useCallback(async () => {
    if (user) {
      try {
        setError(null)
        await sendEmailVerification(user)
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
      await signInWithEmailAndPassword(auth, user.email!, currentPassword)

      // 验证新密码强度
      if (!isPasswordStrong(newPassword)) {
        const errorMsg = "新密码必须包含至少8位字符，包括大小写字母、数字和特殊字符"
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      await updatePassword(user, newPassword)
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code)
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
      await setDoc(doc(db, "notifications", `new_user_${userProfile.uid}`), {
        type: "new_user_registration",
        userId: userProfile.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        userRole: userProfile.role,
        createdAt: serverTimestamp(),
        read: false,
      })
    } catch (error) {
      console.error("通知管理员失败:", error)
    }
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "用户不存在"
      case "auth/wrong-password":
        return "密码错误"
      case "auth/email-already-in-use":
        return "邮箱已被使用"
      case "auth/weak-password":
        return "密码强度不够"
      case "auth/invalid-email":
        return "邮箱格式不正确"
      case "auth/too-many-requests":
        return "请求过于频繁，请稍后再试"
      case "auth/network-request-failed":
        return "网络连接失败，请检查网络"
      case "auth/user-disabled":
        return "账户已被禁用"
      case "auth/requires-recent-login":
        return "需要重新登录以执行此操作"
      case "auth/operation-not-allowed":
        return "此操作不被允许"
      default:
        return `操作失败: ${errorCode}`
    }
  }

  // 使用useMemo优化context value
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
