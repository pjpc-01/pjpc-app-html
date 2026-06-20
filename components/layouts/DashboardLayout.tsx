"use client"

import React from "react"
import { Toaster } from "sonner"
import AppShell from "./AppShell"
import { useAuth } from "@/contexts/pocketbase-auth-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // 使用真实 auth context 替代硬编码 dev admin
  // parent 角色登录时自动切换到家长门户侧边栏
  const { userProfile, user, loading } = useAuth()

  // 开发环境 fallback — auth 未就绪或未登录时显示 admin 侧边栏
  const role = userProfile?.role || ""
  const name = userProfile?.name || user?.name || ""

  return (
    <>
      <AppShell
        userRole={role}
        userName={name}
      >
        {children}
      </AppShell>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 3000,
        }}
      />
    </>
  )
}
