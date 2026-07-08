"use client"

import React, { Suspense } from "react"
import { Toaster } from "sonner"
import AppShell from "./AppShell"
import { useAuth } from "@/contexts/pocketbase-auth-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

function LoadingShell() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}

function AppShellWrapper({ children, role, name }: { children: React.ReactNode; role: string; name: string }) {
  return (
    <AppShell
      userRole={role}
      userName={name}
    >
      {children}
    </AppShell>
  )
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
      <Suspense fallback={<LoadingShell />}>
        <AppShellWrapper role={role} name={name}>
          {children}
        </AppShellWrapper>
      </Suspense>
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
