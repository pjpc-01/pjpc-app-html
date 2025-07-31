"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
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
import { auth, db } from "@/lib/firebase"

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
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: "teacher" | "parent" | "accountant") => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile

            // 检查账户状态
            if (profile.status === "suspended") {
              await signOut(auth)
              throw new Error("账户已被暂停，请联系管理员")
            }

            // 更新最后登录时间
            await updateDoc(doc(db, "users", user.uid), {
              lastLogin: serverTimestamp(),
              emailVerified: user.emailVerified,
            })

            setUserProfile({ ...profile, emailVerified: user.emailVerified })
          }
        } catch (error) {
          console.error("获取用户资料失败:", error)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)

      // 重置登录尝试次数
      if (result.user) {
        await updateDoc(doc(db, "users", result.user.uid), {
          loginAttempts: 0,
          lockedUntil: null,
        })
      }
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code))
    }
  }

  const signUp = async (email: string, password: string, name: string, role: "teacher" | "parent" | "accountant") => {
    try {
      // 验证密码强度
      if (!isPasswordStrong(password)) {
        throw new Error("密码必须包含至少8位字符，包括大小写字母、数字和特殊字符")
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
      throw new Error(getErrorMessage(error.code))
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error("登出失败，请重试")
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code))
    }
  }

  const resendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user)
      } catch (error: any) {
        throw new Error("发送验证邮件失败")
      }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error("用户未登录")

    try {
      // 验证当前密码
      await signInWithEmailAndPassword(auth, user.email!, currentPassword)

      // 验证新密码强度
      if (!isPasswordStrong(newPassword)) {
        throw new Error("新密码必须包含至少8位字符，包括大小写字母、数字和特殊字符")
      }

      await updatePassword(user, newPassword)
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code))
    }
  }

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
      default:
        return `操作失败: ${errorCode}`
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    resendVerification,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
