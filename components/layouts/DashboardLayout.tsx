"use client"

import React from "react"
import { Toaster } from "sonner"
import AppShell from "./AppShell"

// Dev mode hardcoded user
const DEV_USER = {
  id: "dev-admin",
  name: "Dev Admin",
  role: "admin",
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // TODO: Replace with actual auth context when auth is implemented
  // const { user, userProfile } = useAuth()
  const user = DEV_USER
  const userProfile = {
    name: DEV_USER.name,
    role: DEV_USER.role as string,
  }

  return (
    <>
      <AppShell
        userRole={userProfile.role}
        userName={userProfile.name}
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
