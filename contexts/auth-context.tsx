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
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserProfile {
  uid: string
  email: string
  role: "admin" | "teacher" | "parent" | "accountant"
  name: string
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: "admin" | "teacher" | "parent" | "accountant") => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
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
    console.log("设置 Firebase 认证监听器")
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("认证状态变化:", user ? "已登录" : "未登录")
      if (user) {
        setUser(user)
        try {
          // 获取用户资料
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            console.log("用户资料已找到")
            setUserProfile(userDoc.data() as UserProfile)
          } else {
            console.log("用户资料不存在")
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
      console.log("尝试登录:", email)
      await signInWithEmailAndPassword(auth, email, password)
      console.log("登录成功")
    } catch (error: any) {
      console.error("登录失败:", error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  const signUp = async (email: string, password: string, name: string, role: "admin" | "teacher" | "parent" | "accountant") => {
    try {
      console.log("尝试注册:", email, "角色:", role)
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      console.log("用户创建成功:", user.uid)

      // 创建用户资料
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role,
        name,
        createdAt: new Date(),
      }

      console.log("保存用户资料到 Firestore")
      await setDoc(doc(db, "users", user.uid), userProfile)
      console.log("用户资料保存成功")
      setUserProfile(userProfile)
    } catch (error: any) {
      console.error("注册失败:", error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  const logout = async () => {
    try {
      console.log("尝试登出")
      await signOut(auth)
      console.log("登出成功")
    } catch (error: any) {
      console.error("登出失败:", error)
      throw new Error("登出失败，请重试")
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log("发送重置密码邮件:", email)
      await sendPasswordResetEmail(auth, email)
      console.log("重置密码邮件发送成功")
    } catch (error: any) {
      console.error("发送重置密码邮件失败:", error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  const getErrorMessage = (errorCode: string) => {
    console.log("错误代码:", errorCode)
    switch (errorCode) {
      case "auth/user-not-found":
        return "用户不存在"
      case "auth/wrong-password":
        return "密码错误"
      case "auth/email-already-in-use":
        return "邮箱已被使用"
      case "auth/weak-password":
        return "密码强度不够，至少需要6位字符"
      case "auth/invalid-email":
        return "邮箱格式不正确"
      case "auth/too-many-requests":
        return "请求过于频繁，请稍后再试"
      case "auth/network-request-failed":
        return "网络连接失败，请检查网络"
      case "auth/invalid-api-key":
        return "Firebase 配置错误，请检查 API 密钥"
      case "auth/app-not-authorized":
        return "应用未授权，请检查 Firebase 配置"
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
